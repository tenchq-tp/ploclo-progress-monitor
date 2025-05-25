import pool from "../utils/db.js";

async function getManyByProgram(req, res) {
  const { program_id } = req.query;

  if (!program_id) {
    return res
      .status(400)
      .json({ success: false, message: "Program ID is required" });
  }

  try {
    const conn = await pool.getConnection();
    const plos = await conn.query(
      `
        SELECT p.PLO_id, p.PLO_name, p.PLO_engname,  p.PLO_code
        FROM plo p
        INNER JOIN program_plo pp ON p.PLO_id = pp.PLO_id
        WHERE pp.program_id = ?
        ORDER BY p.PLO_id ASC
    `,

      [program_id]
    );

    // console.log(`Fetched PLOs for program_id ${program_id}:`, plos);

    res.json(plos);
    conn.release();
  } catch (err) {
    console.error("Error fetching PLOs:", err);
    res.status(500).send({ success: false, message: "Database error" });
  }
}

async function createOne(req, res) {
  const { PLO_name, PLO_engname, PLO_code, program_id } = req.body;

  // ตรวจสอบว่าข้อมูลครบถ้วน
  if (!PLO_name || !PLO_engname || !PLO_code || !program_id) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    const conn = await pool.getConnection();

    // ตรวจสอบว่า program_id มีอยู่ในตาราง program
    const queryResult = await conn.query(
      "SELECT 1 FROM program WHERE program_id = ?",
      [program_id]
    );

    if (!queryResult || queryResult.length === 0) {
      conn.release();
      return res
        .status(400)
        .json({ success: false, message: "Invalid program_id" });
    }

    // เพิ่ม PLO ลงในตาราง `plo`
    const ploQuery =
      "INSERT INTO plo (PLO_name, PLO_engname, PLO_code) VALUES (?, ?, ?)";
    const ploResult = await conn.query(ploQuery, [
      PLO_name,
      PLO_engname,
      PLO_code,
    ]);
    console.log("PLO Insert Result:", ploResult);

    const newPloId = Number(ploResult.insertId); // แปลง BigInt เป็น Number

    // เพิ่มความสัมพันธ์ระหว่าง `program_id` และ `PLO_id` ในตาราง `program_plo`
    const programPloQuery =
      "INSERT INTO program_plo (program_id, PLO_id) VALUES (?, ?)";
    const programPloResult = await conn.query(programPloQuery, [
      program_id,
      newPloId,
    ]);

    conn.release();

    res.json({
      success: true,
      newPlo: {
        PLO_id: newPloId, // ส่งเป็น Number
        PLO_name,
        PLO_engname,
        PLO_code,
        program_id,
      },
    });
  } catch (err) {
    console.error("Error adding PLO:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
}

async function createFromExcel(req, res) {
  const rows = req.body;

  // ตรวจสอบว่าได้รับ array จาก client หรือไม่
  if (!Array.isArray(rows) || rows.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Data should be a non-empty array" });
  }

  try {
    const conn = await pool.getConnection();

    // วน loop เพิ่มข้อมูลทีละแถว
    for (const row of rows) {
      const { PLO_name, PLO_engname, PLO_code, program_id } = row;

      // ตรวจสอบว่าข้อมูลครบถ้วน
      if (!PLO_name || !PLO_engname || !PLO_code || !program_id) {
        conn.release();
        return res.status(400).json({
          success: false,
          message: `Missing required fields in one of the rows: ${JSON.stringify(row)}`,
        });
      }

      // ตรวจสอบว่า program_id มีอยู่
      const queryResult = await conn.query(
        "SELECT 1 FROM program WHERE program_id = ?",
        [program_id]
      );
      if (!queryResult || queryResult.length === 0) {
        conn.release();
        return res.status(400).json({
          success: false,
          message: `Invalid program_id in one of the rows: ${program_id}`,
        });
      }

      // เพิ่ม PLO ลงในตาราง `plo`
      const ploQuery =
        "INSERT INTO plo (PLO_name, PLO_engname, PLO_code) VALUES (?, ?, ?)";
      const ploResult = await conn.query(ploQuery, [
        PLO_name,
        PLO_engname,
        PLO_code,
      ]);
      const newPloId = Number(ploResult.insertId);

      // เพิ่มความสัมพันธ์ระหว่าง program_id และ PLO_id
      const programPloQuery =
        "INSERT INTO program_plo (program_id, PLO_id) VALUES (?, ?)";
      await conn.query(programPloQuery, [program_id, newPloId]);
    }

    conn.release();
    res.json({ success: true, message: "All rows inserted successfully" });
  } catch (err) {
    console.error("Error processing Excel upload:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
}

export { getManyByProgram, createOne, createFromExcel };
