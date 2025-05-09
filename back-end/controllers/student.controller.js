import pool from "../utils/db.js";

async function insertStudent(req, res) {
  const students = req.body;

  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ message: "No valid student data provided" });
  }

  try {
    let values = ``;

    students.map((student) => {
      values += `(${student.student_id}, ${student.name}, ${student.program_name}),`;
    });

    values = values.slice(0, -1) + ";";
    const query = `
      INSERT INTO studentdata (student_id, name, program_name)
      VALUES ${values}
    `;

    const conn = await pool.getConnection();
    await conn.query(query);
    conn.release();

    res.status(201).json({
      message: "Student data inserted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Database insertion failed.",
      error: error.message,
    });
  }
}

export { insertStudent };
