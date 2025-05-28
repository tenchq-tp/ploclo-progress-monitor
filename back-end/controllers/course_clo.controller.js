import pool from "../utils/db.js";

async function getAll(req, res) {
  try {
    const conn = await pool.getConnection();
    const query = `select course.course_id, c.CLO_code, course.clo_id
        from clo AS c
        LEFT JOIN course_clo AS course
        ON c.CLO_id = course.clo_id WHERE course.course_id IS NOT NULL;`;
    const clos = await conn.query(query);
    conn.release();
    res.json(clos);
  } catch (err) {
    console.error("Error fetching CLOs:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
}

async function getWeightAll(req, res) {
  const { program_id, course_id, semester_id, year } = req.query;

  if (!program_id || !course_id || !semester_id || !year) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  let conn;

  try {
    conn = await pool.getConnection();

    const query = `
            SELECT 
                course_clo.course_clo_id,
                course_clo.course_id,
                course_clo.semester_id,
                course_clo.section_id,
                course_clo.year,
                course_clo.weight,
                clo.CLO_id,
                clo.CLO_code,
                clo.CLO_name,
                clo.CLO_engname,
                clo.timestamp,
                course.course_name,
                course.course_engname
            FROM 
                program_course pc
            JOIN 
                course_clo ON pc.course_id = course_clo.course_id
                AND pc.semester_id = course_clo.semester_id
                AND pc.year = course_clo.year
            JOIN 
                clo ON course_clo.clo_id = clo.CLO_id
            JOIN 
                course ON course_clo.course_id = course.course_id
            WHERE 
                pc.program_id = ?
                AND course_clo.course_id = ?
                AND course_clo.semester_id = ?
                AND course_clo.year = ?
        `;

    const rows = await conn.query(query, [
      program_id,
      course_id,
      semester_id,
      year,
    ]);

    const result = Array.isArray(rows) ? rows : [rows];

    res.json(result);
  } catch (err) {
    console.error("Error fetching course CLOs:", err);
    res.status(500).json({ message: "Database error" });
  } finally {
    if (conn) conn.release();
  }
}

async function addWeight(req, res) {
  const { program_id, semester_id, section_id, year, clo_weights } = req.body;
  if (
    !semester_id ||
    !section_id ||
    !year ||
    !Array.isArray(clo_weights) ||
    clo_weights.length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Missing required data or invalid scores array",
    });
  }

  try {
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    const results = {
      success: 0,
      errors: 0,
      details: [],
    };

    for (const entry of clo_weights) {
      try {
        const { course_id, clo_id, weight } = entry;

        if (!course_id || !clo_id || weight === undefined) {
          results.errors++;
          results.details.push({
            error: "Missing required fields",
            data: entry,
          });
          continue;
        }

        const weightValue = parseInt(weight);

        const exists = await conn.query(
          "SELECT course_clo_id FROM course_clo WHERE course_id = ? AND clo_id = ? AND semester_id = ? AND section_id = ? AND year = ?",
          [course_id, clo_id, semester_id, section_id, year]
        );

        if (exists && exists.length > 0) {
          await conn.query(
            "UPDATE course_clo SET weight = ? WHERE course_id = ? AND clo_id = ? AND semester_id = ? AND section_id = ? AND year = ?",
            [weightValue, course_id, clo_id, semester_id, section_id, year]
          );

          results.success++;
          results.details.push({
            status: "updated",
            course_id,
            clo_id,
            weight: weightValue,
          });
        } else {
          await conn.query(
            "INSERT INTO course_clo (course_id, clo_id, semester_id, section_id, year, weight) VALUES (?, ?, ?, ?, ?, ?)",
            [course_id, clo_id, semester_id, section_id, year, weightValue]
          );

          results.success++;
          results.details.push({
            status: "inserted",
            course_id,
            clo_id,
            weight: weightValue,
          });
        }
      } catch (err) {
        results.errors++;
        results.details.push({
          error: err.message,
          data: entry,
        });
        console.error("Error processing individual score:", err);
      }
    }

    await conn.commit();
    conn.release();

    console.log(
      `Processed ${clo_weights.length} records. Success: ${results.success}, Errors: ${results.errors}`
    );

    res.json({
      success: true,
      message: `Successfully processed ${results.success} out of ${clo_weights.length} scores`,
      results,
    });
  } catch (error) {
    console.error("Error processing scores:", error);

    try {
      const conn = await pool.getConnection();
      await conn.rollback();
      conn.release();
    } catch (rollbackError) {
      console.error("Error during rollback:", rollbackError);
    }

    res.status(500).json({
      success: false,
      message: "Database error",
      error: error.message,
    });
  }
}

async function addCourseClo(req, res) {
  const { course_id, clo_id, semester_id, section_id } = req.body;
  try {
    const conn = await pool.getConnection();
    await conn.query(
      "INSERT INTO course_clo (course_id, clo_id, semester_id, section_id) VALUES (?, ?, ?, ?)",
      [course_id, clo_id, semester_id, section_id]
    );
    res.status(201).json({ message: "Course CLO added successfully" });
    conn.release();
  } catch (err) {
    console.error("Error inserting course CLO:", err);
    res.status(500).json({ message: "Database error" });
  }
}

async function getManyByFilter(req, res) {
  const { program_id, course_id, semester_id, year } = req.query;

  if (!program_id || !course_id || !semester_id || !year) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  let conn;

  try {
    conn = await pool.getConnection();

    const query = `
SELECT DISTINCT
    course_clo.course_clo_id,
    course_clo.course_id,
    course_clo.semester_id,
    course_clo.year,
    clo.CLO_id,
    clo.CLO_code,
    clo.CLO_name,
    clo.CLO_engname,
    clo.timestamp,
    course.course_name,
    course.course_engname
FROM 
    program_course pc
JOIN 
    course_clo ON pc.course_id = course_clo.course_id
    AND pc.semester_id = course_clo.semester_id
    AND pc.year = course_clo.year
JOIN 
    clo ON course_clo.clo_id = clo.CLO_id
JOIN 
    course ON course_clo.course_id = course.course_id
WHERE 
    pc.program_id = ?
    AND course_clo.course_id = ?
    AND course_clo.semester_id = ?
    AND course_clo.year = ?
ORDER BY clo.CLO_code ASC
        `;

    const rows = await conn.query(query, [
      program_id,
      course_id,
      semester_id,
      year,
    ]);

    // บังคับให้ rows เป็น array
    const result = Array.isArray(rows) ? rows : [rows];

    res.json(result);
  } catch (err) {
    console.error("Error fetching course CLOs:", err);
    res.status(500).json({ message: "Database error" });
  } finally {
    if (conn) conn.release();
  }
}

async function updateByFilter(req, res) {
  const {
    program_id,
    course_id,
    clo_id,
    semester_id,
    section_id,
    year,
    CLO_name,
    CLO_engname,
    CLO_code,
  } = req.body;

  if (
    !program_id ||
    !course_id ||
    !clo_id ||
    !semester_id ||
    !section_id ||
    !year ||
    !CLO_name ||
    !CLO_engname ||
    !CLO_code
  ) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Log query parameters
    console.log(
      "Checking program_course with parameters:",
      program_id,
      course_id,
      semester_id,
      section_id,
      year
    );

    // Check if the combination exists in program_course
    const [programCourseCheck] = await conn.query(
      `
            SELECT * FROM program_course
            WHERE program_id = ? AND course_id = ? AND semester_id = ? AND section_id = ? AND year = ?
        `,
      [program_id, course_id, semester_id, section_id, year]
    );

    console.log("Program course check result:", programCourseCheck);

    if (!programCourseCheck || programCourseCheck.length === 0) {
      return res.status(404).json({ message: "Program Course not found" });
    }

    // Log query parameters for course_clo check
    console.log(
      "Checking course_clo with parameters:",
      course_id,
      clo_id,
      semester_id,
      section_id,
      year
    );

    // Check if the given course_clo exists
    const [courseCloCheck] = await conn.query(
      `
            SELECT * FROM course_clo
            WHERE course_id = ? AND clo_id = ? AND semester_id = ? AND section_id = ? AND year = ?
        `,
      [course_id, clo_id, semester_id, section_id, year]
    );

    console.log("Course CLO check result:", courseCloCheck);

    if (!courseCloCheck || courseCloCheck.length === 0) {
      return res.status(404).json({ message: "Course CLO not found" });
    }

    // Update the course_clo table with the new details
    await conn.query(
      `
            UPDATE course_clo 
            SET clo_id = ?, semester_id = ?, section_id = ?, year = ? 
            WHERE course_id = ? AND clo_id = ? AND semester_id = ? AND section_id = ? AND year = ?
        `,
      [
        clo_id,
        semester_id,
        section_id,
        year,
        course_id,
        clo_id,
        semester_id,
        section_id,
        year,
      ]
    );

    // Update CLO_name, CLO_engname, AND CLO_code in the clo table
    await conn.query(
      `
            UPDATE clo 
            SET CLO_name = ?, CLO_engname = ?, CLO_code = ?
            WHERE CLO_id = ?
        `,
      [CLO_name, CLO_engname, CLO_code, clo_id]
    );

    await conn.commit();
    res.status(200).json({ message: "Course CLO updated successfully" });
  } catch (err) {
    await conn.rollback();
    console.error("Error updating course CLO:", err);
    res.status(500).json({ message: "Database error" });
  } finally {
    conn.release();
  }
}

async function deleteByFilter(req, res) {
  const { clo_id, course_id, semester_id, year } = req.query;

  // ตรวจสอบว่าค่าที่จำเป็นถูกส่งมาหรือไม่
  if (!clo_id || !course_id || !semester_id || !year) {
    return res.status(400).json({
      clo_id,
      course_id,
      semester_id,
      year,
    });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ลบ CLO จากตาราง course_clo
    const deleteCourseCloResult = await conn.query(
      `
            DELETE FROM course_clo
            WHERE clo_id = ? AND course_id = ? AND semester_id = ? AND year = ?
        `,
      [clo_id, course_id, semester_id, year]
    );
    // ตรวจสอบผลลัพธ์จากคำสั่ง DELETE
    if (deleteCourseCloResult.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Course CLO not found or not deleted" });
    }
    const deleteCloResult = await conn.query(
      `
              DELETE FROM clo WHERE clo_id = ?
          `,
      [clo_id]
    );
    await conn.commit();
    res.status(200).json({ message: "Course CLO deleted successfully" });
  } catch (err) {
    await conn.rollback();
    console.error("Error deleting course CLO:", err);
    res.status(500).json({ message: "Database error" });
  } finally {
    conn.release();
  }
}

async function getWeightManyWithFilter(req, res) {
  const { program_id, course_id, semester_id, section_id, year } = req.query;

  if (!program_id || !course_id || !semester_id || !section_id || !year) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const query = `
        SELECT
          course_clo.course_clo_id,
          course_clo.course_id,
          course_clo.semester_id,
          course_clo.section_id,
          course_clo.year,
          course_clo.weight,   /* เพิ่มการดึงค่า weight จากตาราง course_clo */
          clo.CLO_id,
          clo.CLO_code,
          clo.CLO_name,
          clo.CLO_engname,
          clo.timestamp,
          course.course_name,
          course.course_engname
        FROM
          program_course pc
        JOIN
          course_clo ON pc.course_id = course_clo.course_id
          AND pc.semester_id = course_clo.semester_id
          AND pc.section_id = course_clo.section_id
          AND pc.year = course_clo.year
        JOIN
          clo ON course_clo.clo_id = clo.CLO_id
        JOIN
          course ON course_clo.course_id = course.course_id
        WHERE
          pc.program_id = ?
          AND course_clo.course_id = ?
          AND course_clo.semester_id = ?
          AND course_clo.section_id = ?
          AND course_clo.year = ?
      `;

    const rows = await conn.query(query, [
      program_id,
      course_id,
      semester_id,
      section_id,
      year,
    ]);
    // บังคับให้ rows เป็น array
    const result = Array.isArray(rows) ? rows : [rows];

    res.json(result);
  } catch (err) {
    console.error("Error fetching course CLOs with weight:", err);
    res.status(500).json({ message: "Database error" });
  } finally {
    if (conn) conn.release();
  }
}

export async function getManyByCourseId(req, res) {
  const { course_id, year } = req.query;
  console.log(req.query);
  try {
    const query = `SELECT cc.course_clo_id, cc.weight, c.CLO_code, c.CLO_name
FROM course_clo AS cc
LEFT JOIN clo AS c ON c.clo_id=cc.clo_id WHERE cc.course_id=? AND cc.year=?`;

    const result = await pool.query(query, [course_id, year]);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error while fetch clo by courseId" });
  }
}

export {
  getAll,
  getWeightAll,
  addWeight,
  addCourseClo,
  getManyByFilter,
  updateByFilter,
  deleteByFilter,
  getWeightManyWithFilter,
};
