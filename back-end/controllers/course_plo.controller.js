import pool from "../utils/db.js";

async function getManyByProgram(req, res) {
  const { program_id, year } = req.query;

  if (!program_id || !year) {
    return res
      .status(400)
      .json({ success: false, message: "Program ID and year are required" });
  }

  try {
    const query = `
            SELECT cp.course_id, cp.plo_id, cp.weight, c.course_name, p.PLO_code
            FROM course_plo cp
            JOIN course c ON cp.course_id = c.course_id
            JOIN plo p ON cp.plo_id = p.plo_id
            JOIN program_plo pp ON p.plo_id = pp.plo_id
            JOIN program pr ON pp.program_id = pr.program_id
            WHERE pr.program_id = ? AND pr.year = ?
        `;

    const conn = await pool.getConnection();
    const rows = await conn.query(query, [program_id, year]);
    conn.release();

    console.log(
      `Retrieved ${rows.length} course-PLO mappings for program ${program_id} in year ${year}`
    );

    res.json({ success: true, message: rows });
  } catch (error) {
    console.error("Error fetching course-PLO mappings:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function createOne(req, res) {
  const { program_id, scores } = req.body;

  if (!program_id || !scores || !Array.isArray(scores)) {
    return res.status(400).json({
      success: false,
      message: "Missing program_id or scores array.",
    });
  }

  try {
    const conn = await pool.getConnection();

    // ดึง PLO IDs จาก scores
    const ploIds = scores.map((score) => score.plo_id);
    console.log("PLO IDs to check:", ploIds);

    // สร้าง query แบบ dynamic
    const ploIdsString = ploIds.join(",");
    const query = `
            SELECT plo_id FROM program_plo
            WHERE program_id = ${program_id} AND plo_id IN (${ploIdsString})
        `;

    // เรียก query
    const rawResult = await conn.query(query);
    console.log("Raw validPloRows:", rawResult);

    // ตรวจสอบผลลัพธ์
    const validPloRows = Array.isArray(rawResult) ? rawResult : [rawResult];
    if (validPloRows.length === 0) {
      conn.release();
      return res.status(400).json({
        success: false,
        message: "No valid PLOs found for the provided program_id.",
      });
    }

    // Map plo_id ที่ valid
    const validPloIds = validPloRows.map((row) => row.plo_id);
    console.log("Valid PLO IDs:", validPloIds);

    // กรองเฉพาะข้อมูลที่ valid
    const values = scores
      .filter((score) => validPloIds.includes(score.plo_id))
      .map((score) => `(${score.course_id}, ${score.plo_id}, ${score.weight})`);

    console.log("Values to insert:", values);

    if (values.length === 0) {
      conn.release();
      return res.status(400).json({
        success: false,
        message: "No valid scores to add.",
      });
    }

    // Insert ข้อมูลหลายแถว
    const insertQuery = `
            INSERT INTO course_plo (course_id, plo_id, weight)
            VALUES ${values.join(",")}
        `;
    console.log("Generated query:", insertQuery);

    const result = await conn.query(insertQuery);
    conn.release();

    // ใช้ safeJsonStringify
    const safeJsonStringify = (data) => {
      return JSON.stringify(data, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      );
    };

    res.send(
      safeJsonStringify({
        success: true,
        message: "New mappings added successfully.",
        result: {
          affectedRows: result.affectedRows,
          insertId: result.insertId, // BigInt จะถูกแปลง
          warningStatus: result.warningStatus,
        },
      })
    );
  } catch (error) {
    console.error("Error adding course-PLO mappings:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}

async function updateOne(req, res) {
  const { program_id, course_id, plo_id, weight } = req.body;

  // ตรวจสอบข้อมูลที่จำเป็น
  if (!program_id || !course_id || !plo_id || weight === undefined) {
    return res.status(400).json({
      success: false,
      message:
        "Missing required fields: program_id, course_id, plo_id, or weight.",
    });
  }

  try {
    const conn = await pool.getConnection();

    // ตรวจสอบข้อมูลปัจจุบัน
    const queryCheck = `
            SELECT weight 
            FROM course_plo
            WHERE course_id = ? AND plo_id = ?
        `;
    const [currentWeight] = await conn.query(queryCheck, [course_id, plo_id]);

    // หาก weight ไม่เปลี่ยนแปลงให้ส่งข้อความกลับ
    if (currentWeight.length > 0 && currentWeight[0].weight === weight) {
      conn.release();
      return res.status(400).json({
        success: false,
        message: "The weight value is already the same as the current one.",
      });
    }

    // อัปเดตเฉพาะค่า weight
    const queryUpdate = `
            UPDATE course_plo
            SET weight = ?
            WHERE course_id = ? AND plo_id = ?
        `;
    const result = await conn.query(queryUpdate, [weight, course_id, plo_id]);

    conn.release();

    // แปลงค่า BigInt ให้เป็น String ก่อนที่จะส่งค่าผ่าน JSON
    const serializedResult = JSON.parse(
      JSON.stringify(result, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    res.json({
      success: true,
      message: "Weight updated successfully.",
      result: serializedResult,
    });
  } catch (error) {
    console.error("Error updating weight:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}

export { getManyByProgram, createOne, updateOne };
