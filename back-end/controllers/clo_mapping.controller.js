import pool from "../utils/db.js";

async function addProgramCourseCLO(req, res) {
  const {
    program_id,
    course_id,
    semester_id,
    year,
    CLO_code,
    CLO_name,
    CLO_engname,
  } = req.body;

  if (
    !program_id ||
    !course_id ||
    !semester_id ||
    !year ||
    !CLO_code ||
    !CLO_name ||
    !CLO_engname
  ) {
    return res.status(400).json({
      message:
        "Missing required fields. Please select all necessary options and provide CLO details.",
    });
  }

  try {
    const conn = await pool.getConnection();

    // เพิ่ม CLO ใหม่
    const insertCLOQuery = `
            INSERT INTO clo (CLO_code, CLO_name, CLO_engname, timestamp)
            VALUES (?, ?, ?, NOW())
        `;
    const cloResult = await conn.query(insertCLOQuery, [
      CLO_code,
      CLO_name,
      CLO_engname,
    ]);

    // ดึง clo_id ที่เพิ่มมาใหม่
    const clo_id = cloResult.insertId;

    // เพิ่มข้อมูลลงในตาราง course_clo
    const insertCourseCLOQuery = `
            INSERT INTO course_clo (course_id, semester_id, section_id, year, clo_id)
            VALUES (?, ?, 1, ?, ?)
        `;
    await conn.query(insertCourseCLOQuery, [
      course_id,
      semester_id,
      year,
      clo_id,
    ]);

    res
      .status(201)
      .json({ message: "CLO added successfully!", clo_id: Number(clo_id) }); // แปลง BigInt เป็น Number
    conn.release();
  } catch (err) {
    console.error("Error adding CLO:", err);
    res.status(500).json({ message: "Database error" });
  }
} // สำหรับทีละรายการ

async function importProgramCourseCLOFromExcel(req, res) {
  const cloDataArray = req.body; // รับข้อมูลเป็น array
  if (!Array.isArray(cloDataArray) || cloDataArray.length === 0) {
    return res.status(400).json({
      message: "No CLO data provided. Please upload valid Excel data.",
    });
  }

  try {
    const conn = await pool.getConnection();

    for (const cloData of cloDataArray) {
      const { course_id, semester_id, year, CLO_code, CLO_name, CLO_engname } =
        cloData;

      // ตรวจสอบว่าข้อมูลในแต่ละรายการครบถ้วนหรือไม่
      if (
        !course_id ||
        !semester_id ||
        !year ||
        !CLO_code ||
        !CLO_name ||
        !CLO_engname
      ) {
        return res.status(400).json({
          message:
            "Missing required fields in some rows. Please ensure all fields are complete.",
        });
      }

      // เพิ่ม CLO ลงในตาราง `clo`
      const insertCLOQuery = `
                INSERT INTO clo (CLO_code, CLO_name, CLO_engname, timestamp)
                VALUES (?, ?, ?, NOW())
            `;
      const cloResult = await conn.query(insertCLOQuery, [
        CLO_code,
        CLO_name,
        CLO_engname,
      ]);

      // ดึง clo_id ที่เพิ่มใหม่
      const clo_id = cloResult.insertId;

      // เพิ่มข้อมูลใน `course_clo`
      const insertCourseCLOQuery = `
                INSERT INTO course_clo (course_id, semester_id, year, clo_id, section_id)
                VALUES (?, ?, ?, ?, 1)
            `;
      await conn.query(insertCourseCLOQuery, [
        course_id,
        semester_id,
        year,
        clo_id,
      ]);
    }

    res.status(201).json({ message: "All CLOs added successfully!" });
    conn.release();
  } catch (err) {
    console.error("Error adding CLOs from Excel:", err);
    res.status(500).json({
      message: "Database error occurred while processing Excel data.",
    });
  }
} // สำหรับหลายรายการ

async function getSectionByCourse(req, res) {
  const { course_id, semester_id, year } = req.query;
  try {
    const query =
      "SELECT section_id FROM program_course WHERE year=? AND semester_id=? AND course_id=?;";

    const response = await pool.query(query, [year, semester_id, course_id]);
    console.log(response);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: "Database error occurred while get section.",
    });
  }
}

async function getCloMappingByFilter(req, res) {
  const { course_id, semester_id, year } = req.query;
  try {
    const query = `SELECT c.CLO_code, cc.weight, cc.course_clo_id FROM course_clo AS cc
LEFT JOIN clo AS c ON cc.clo_id=c.CLO_id
WHERE cc.course_id=? AND cc.year=? AND cc.semester_id=?`;
    const response = await pool.query(query, [course_id, year, semester_id]);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: "Database error while fetch clo mapping",
    });
  }
}

async function updateWeightByCourse(req, res) {
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ message: "Invalid data" });
  }

  let caseStatements = "";
  let idPlaceholders = "";
  let values = [];

  for (let i = 0; i < updates.length; i++) {
    values.push(updates[i].id, updates[i].score);
    caseStatements += `WHEN ? THEN ? `;
    idPlaceholders += i === 0 ? "?" : ", ?";
  }
  for (let i = 0; i < updates.length; i++) {
    values.push(updates[i].id);
  }

  const query = `
    UPDATE course_clo
    SET weight = CASE course_clo_id
      ${caseStatements}
    END
    WHERE course_clo_id IN (${idPlaceholders})
  `;
  console.log(query);
  console.log(values);
  try {
    await pool.query(query, values);
    res.status(200).json({ message: "Scores updated successfully" });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

export {
  addProgramCourseCLO,
  importProgramCourseCLOFromExcel,
  getSectionByCourse,
  getCloMappingByFilter,
  updateWeightByCourse,
};