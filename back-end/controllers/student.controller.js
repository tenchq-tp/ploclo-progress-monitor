import pool from "../utils/db.js";

async function insertStudent(req, res) {
  const students = req.body;

  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ message: "No valid student data provided" });
  }

  try {
    let values = ``;

    students.map((student) => {
      values += `("${student.student_id}", "${student.name}"),`;
    });

    values = values.slice(0, -1) + ";";
    const query = `
      INSERT INTO studentdata (student_id, name)
      VALUES ${values}
    `;

    const conn = await pool.getConnection();
    console.log(query);
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

async function getAll(req, res) {
  try {
    const conn = await pool.getConnection();
    const result = await conn.query(`SELECT * FROM studentdata`);
    res.json(result);
    conn.release();
  } catch (err) {
    res.status(500).send(err);
  }
}

async function deleteOne(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Missing id parameter" });
  }

  try {
    const conn = await pool.getConnection();
    const result = await conn.query(
      "DELETE FROM studentdata WHERE student_id = ?",
      [id]
    );

    // ตรวจสอบว่าไม่มีการลบข้อมูล
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({ message: "Student deleted successfully" });
    conn.release();
  } catch (err) {
    console.error("Error deleting student:", err);
    res
      .status(500)
      .json({ message: "Error deleting student", error: err.message });
  }
}

async function saveScore(req, res) {
  const { assignment_id, scores } = req.body;

  console.log("ได้รับข้อมูลคะแนนจาก frontend:", {
    assignment_id,
    scoresCount: scores?.length,
  });

  // ตรวจสอบข้อมูลที่ส่งมา
  if (
    !assignment_id ||
    !scores ||
    !Array.isArray(scores) ||
    scores.length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: "ข้อมูลไม่ถูกต้อง กรุณาระบุ assignment_id และข้อมูลคะแนน",
    });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // เริ่ม transaction
    await conn.beginTransaction();

    // ตรวจสอบว่า assignment_id มีอยู่จริง
    const assignmentCheck = await conn.query(
      "SELECT assignment_id FROM assignments WHERE assignment_id = ?",
      [assignment_id]
    );

    if (!assignmentCheck || assignmentCheck.length === 0) {
      await conn.rollback();
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูล Assignment ที่ระบุ",
      });
    }

    // วนลูปบันทึกคะแนนแต่ละรายการ
    let successCount = 0;
    let errorCount = 0;

    for (const scoreItem of scores) {
      const { student_id, assignment_clo_id, score } = scoreItem;

      // ตรวจสอบว่ามีข้อมูลคะแนนนี้อยู่แล้วหรือไม่
      const existingRecord = await conn.query(
        `SELECT id FROM student_assignment_scores
                 WHERE student_id = ? AND assignment_id = ? AND assignment_clo_id = ?`,
        [student_id, assignment_id, assignment_clo_id]
      );

      try {
        if (existingRecord && existingRecord.length > 0) {
          // ถ้ามีข้อมูลอยู่แล้ว ให้อัพเดทคะแนน
          await conn.query(
            `UPDATE student_assignment_scores
                         SET score = ?, updated_at = NOW()
                         WHERE id = ?`,
            [score, existingRecord[0].id]
          );
        } else {
          // ถ้ายังไม่มี ให้เพิ่มข้อมูลใหม่
          await conn.query(
            `INSERT INTO student_assignment_scores
                         (student_id, assignment_id, assignment_clo_id, score, created_at)
                         VALUES (?, ?, ?, ?, NOW())`,
            [student_id, assignment_id, assignment_clo_id, score]
          );
        }
        successCount++;
      } catch (error) {
        console.error(
          `Error saving score for student ${student_id}, CLO ${assignment_clo_id}:`,
          error
        );
        errorCount++;
      }
    }

    // Commit transaction
    await conn.commit();

    console.log(
      `บันทึกคะแนนสำเร็จ ${successCount} รายการ, ผิดพลาด ${errorCount} รายการ`
    );

    return res.json({
      success: true,
      message: `บันทึกคะแนนสำเร็จ ${successCount} รายการ${errorCount > 0 ? `, ผิดพลาด ${errorCount} รายการ` : ""}`,
      successCount,
      errorCount,
    });
  } catch (error) {
    console.error("Error saving student scores:", error);

    // Rollback transaction ในกรณีที่เกิดข้อผิดพลาด
    if (conn) {
      await conn.rollback();
    }

    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการบันทึกคะแนน",
      error: error.message,
    });
  } finally {
    if (conn) conn.release();
  }
}

export { insertStudent, getAll, deleteOne, saveScore };
