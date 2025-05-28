import pool from "../utils/db.js";

async function getAll(req, res) {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = "SELECT * FROM clo;";
    const clos = await conn.query(query);
    res.json(Array.isArray(clos) ? clos : [clos]);
  } catch (error) {
    console.error("Error fetching CLOs : ", err);
    res.status(500).json({ success: false, message: "Database error" });
  } finally {
    if (conn) conn.release();
  }
}

export async function updateById(req, res) {
  const { clo_id } = req.params;
  const clo = req.body;
  console.log(req.body);

  try {
    const update_query = `
      UPDATE clo
      SET CLO_code = ?, CLO_name = ?, CLO_engname = ?
      WHERE CLO_id = ?
    `;

    await pool.query(update_query, [
      clo.clo_code,
      clo.clo_name,
      clo.clo_engname,
      clo_id,
    ]);
    res.status(200).json({ message: "Update successfully", body: req.body });
  } catch (error) {
    res.status(500).json({
      message: "Error while update",
      route: "clo",
      error: error.message,
    });
  }
}

async function getMapping(req, res) {
  const { course_id, section_id, semester_id, year, program_id, clo_ids } =
    req.query;

  console.log("Received Query Params:", req.query);

  if (!course_id || !section_id || !semester_id || !year || !program_id) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    let query = `
            SELECT 
      pc.plo_clo_id,
      pc.year,
      pc.weight,  -- ดึง weight จากตาราง plo_clo
      pc.semester_id,
      pc.course_id,
      pc.section_id,
      pc.PLO_id,
      pc.CLO_id,
      p.PLO_code,
      p.PLO_name,
      p.PLO_engname,
      c.CLO_code,
      c.CLO_name,
      c.CLO_engname
  FROM 
      plo_clo pc  -- เปลี่ยนจาก course_plo เป็น plo_clo
  JOIN 
      plo p ON pc.PLO_id = p.PLO_id
  JOIN 
      clo c ON pc.CLO_id = c.CLO_id
  WHERE 
      pc.course_id = ? 
      AND pc.section_id = ? 
      AND pc.semester_id = ? 
      AND pc.year = ? 
      AND pc.PLO_id IN (
          SELECT plo_id FROM program_plo WHERE program_id = ?
      )
          `;

    // ถ้ามีการระบุ clo_ids (ตัวเลือก)
    const params = [course_id, section_id, semester_id, year, program_id];
    if (clo_ids) {
      const cloIdsArray = clo_ids.split(",");
      if (cloIdsArray.length > 0) {
        query += ` AND cc.clo_id IN (${cloIdsArray.map(() => "?").join(",")})`;
        params.push(...cloIdsArray);
      }
    }

    query += ` ORDER BY p.PLO_code, c.CLO_code`;

    console.log("SQL Query:", query);
    console.log("Parameters:", params);

    const result = await conn.query(query, params);

    // ตรวจสอบและแปลงผลลัพธ์ให้เป็น array เสมอ
    const mappings = Array.isArray(result) ? result : result ? [result] : [];

    return res.status(200).json(mappings);
  } catch (err) {
    console.error("Error fetching PLO-CLO mappings:", err);
    return res
      .status(500)
      .json({ message: "Database error", error: err.message });
  } finally {
    if (conn) conn.release();
  }
}

async function updateMapping(req, res) {
  const {
    program_id,
    course_id,
    section_id,
    semester_id,
    year,
    PLO_id,
    CLO_id,
    weight,
  } = req.body;

  // ตรวจสอบข้อมูลที่จำเป็น
  if (!course_id || !PLO_id || !CLO_id || weight === undefined) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: course_id, PLO_id, CLO_id, or weight",
    });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // 1. ค้นหาข้อมูลที่มีอยู่ใน course_plo ก่อน
    const checkQuery = `
            SELECT course_plo_id, weight 
            FROM course_plo
            WHERE course_id = ? AND plo_id = ?
        `;
    const existingData = await conn.query(checkQuery, [course_id, PLO_id]);

    // แปลง weight เป็น int
    const weightInt = parseInt(weight) || 0;

    // 2. ถ้ามีข้อมูลอยู่แล้ว ให้อัปเดต
    if (existingData && existingData.length > 0) {
      const updateQuery = `
                UPDATE course_plo
                SET weight = ?
                WHERE course_id = ? AND plo_id = ?
            `;
      await conn.query(updateQuery, [weightInt, course_id, PLO_id]);
    } else {
      // 3. ถ้ายังไม่มีข้อมูล ให้เพิ่มใหม่
      const insertQuery = `
                INSERT INTO course_plo (course_id, plo_id, weight)
                VALUES (?, ?, ?)
            `;
      await conn.query(insertQuery, [course_id, PLO_id, weightInt]);
    }

    res.json({
      success: true,
      message: "Weight updated successfully",
    });
  } catch (error) {
    console.error("Error updating PLO-CLO weight:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  } finally {
    if (conn) conn.release();
  }
}

async function createMapping(req, res) {
  const { program_id, course_id, section_id, semester_id, year, scores } =
    req.body;

  // ตรวจสอบข้อมูลที่จำเป็น
  if (
    !program_id ||
    !course_id ||
    !section_id ||
    !semester_id ||
    !year ||
    !scores ||
    !Array.isArray(scores) ||
    scores.length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields or invalid scores array",
    });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // เริ่ม transaction
    await conn.beginTransaction();

    // ประมวลผลทีละรายการ
    for (const score of scores) {
      const { plo_id, clo_id, weight } = score;

      if (!plo_id || !clo_id || weight === undefined) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Invalid score data: missing plo_id, clo_id, or weight`,
        });
      }

      // แปลง weight เป็น int
      const weightInt = parseInt(weight) || 0;

      // ตรวจสอบว่ามีข้อมูลอยู่แล้วหรือไม่
      const checkQuery = `
                SELECT course_plo_id
                FROM course_plo
                WHERE course_id = ? AND plo_id = ?
            `;
      const existingData = await conn.query(checkQuery, [course_id, plo_id]);

      if (existingData && existingData.length > 0) {
        // อัพเดตข้อมูลที่มีอยู่
        const updateQuery = `
                    UPDATE course_plo
                    SET weight = ?
                    WHERE course_id = ? AND plo_id = ?
                `;
        await conn.query(updateQuery, [weightInt, course_id, plo_id]);
      } else {
        // เพิ่มข้อมูลใหม่
        const insertQuery = `
                    INSERT INTO course_plo (course_id, plo_id, weight)
                    VALUES (?, ?, ?)
                `;
        await conn.query(insertQuery, [course_id, plo_id, weightInt]);
      }
    }

    // Commit transaction
    await conn.commit();

    res.json({
      success: true,
      message: "PLO-CLO mappings added successfully",
    });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error("Error adding PLO-CLO mappings:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  } finally {
    if (conn) conn.release();
  }
}

async function createOne(req, res) {
  const {
    program_id,
    course_id,
    section_id,
    semester_id,
    year,
    CLO_code,
    CLO_name,
    CLO_engname,
  } = req.body;

  // ตรวจสอบว่าข้อมูลทั้งหมดถูกเลือกแล้ว
  if (!program_id || !course_id || !section_id || !semester_id || !year) {
    return res.status(400).json({
      error: "Please select all required fields before inserting CLO",
    });
  }

  const conn = await pool.getConnection();
  try {
    // ตรวจสอบว่าข้อมูล program_course มีอยู่ในระบบหรือไม่
    const checkProgramCourseQuery = `
        SELECT * FROM program_course
        WHERE program_id = ? AND course_id = ? AND section_id = ? AND semester_id = ? AND year = ?
      `;

    const results = await conn.query(checkProgramCourseQuery, [
      program_id,
      course_id,
      section_id,
      semester_id,
      year,
    ]);

    if (results.length === 0) {
      return res.status(400).json({
        error: "Selected program/course/section/semester/year not found",
      });
    }

    // Insert CLO
    const insertCLOQuery = `
        INSERT INTO course_clo (program_id, course_id, section_id, semester_id, year, CLO_code, CLO_name, CLO_engname)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

    const result = await conn.query(insertCLOQuery, [
      program_id,
      course_id,
      section_id,
      semester_id,
      year,
      CLO_code,
      CLO_name,
      CLO_engname,
    ]);

    return res.status(200).json({ message: "CLO inserted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Database error", details: err });
  } finally {
    conn.release(); // Always release the connection back to the pool
  }
}

async function deleteOneById(req, res) {
  const { clo_id } = req.params;

  if (!clo_id) {
    return res.status(400).json({ error: "CLO ID is required" });
  }

  const conn = await pool.getConnection();
  try {
    const deleteCLOQuery = `
        DELETE FROM course_clo WHERE CLO_id = ?
      `;

    const result = await conn.query(deleteCLOQuery, [clo_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "CLO not found" });
    }

    return res.status(200).json({ message: "CLO deleted successfully" });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Failed to delete CLO", details: err });
  } finally {
    conn.release(); // Always release the connection back to the pool
  }
}

export {
  getAll,
  getMapping,
  updateMapping,
  createMapping,
  createOne,
  deleteOneById,
};
