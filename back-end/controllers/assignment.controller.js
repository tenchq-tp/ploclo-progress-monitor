import pool from "../utils/db.js";

async function getAll(req, res) {
  let conn;
  try {
    conn = await pool.getConnection();

    const query = `
            SELECT 
                a.assignment_id,
                a.assignment_name,
                a.section_id,
                a.semester_id,
                a.year,
                a.created_at,
                a.faculty_id,
                a.university_id
            FROM 
                assignments a
            ORDER BY 
                a.created_at DESC
        `;

    const assignments = await conn.query(query);

    // ตรวจสอบว่าผลลัพธ์เป็นอาร์เรย์หรือไม่
    const result = Array.isArray(assignments) ? assignments : [assignments];

    res.json(result);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูล",
      error: error.message, // เพิ่ม error message เพื่อการ debug
    });
  } finally {
    if (conn) conn.release();
  }
}

async function getOneById(req, res) {
  const { assignment_id } = req.params;

  if (!assignment_id || isNaN(assignment_id)) {
    return res
      .status(400)
      .json({ success: false, message: "กรุณาระบุรหัส Assignment ที่ถูกต้อง" });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const assignmentQuery = `
            SELECT 
                a.assignment_id, 
                a.assignment_name,
                a.course_name, 
                a.section_id, 
                a.semester_id, 
                a.year, 
                a.program_id,
                a.created_at
            FROM 
                assignments a
            WHERE 
                a.assignment_id = ?
        `;

    const assignments = await conn.query(assignmentQuery, [assignment_id]);

    if (!assignments || assignments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูล Assignment",
      });
    }
    const assignment = assignments[0];

    const cloQuery = `
            SELECT 
                acs.id as assignment_clo_id,
                acs.clo_id,
                acs.score as max_score,
                acs.weight,
                c.CLO_code,
                c.CLO_name
            FROM 
                assignment_clo_selection acs
            JOIN 
                clo c ON acs.clo_id = c.CLO_id
            WHERE 
                acs.assignment_id = ?
            ORDER BY 
                c.CLO_code
        `;

    const clos = await conn.query(cloQuery, [assignment_id]);

    const cloList = Array.isArray(clos) ? clos : clos ? [clos] : [];
    const studentQuery = `
            SELECT DISTINCT
                astd.student_id,
                sd.name as student_name
            FROM 
                assignments_students astd
            LEFT JOIN 
                studentdata sd ON astd.student_id = sd.student_id
            WHERE 
                astd.assignment_id = ?
            ORDER BY 
                astd.student_id
        `;
    const students = await conn.query(studentQuery, [assignment_id]);

    const studentList = Array.isArray(students)
      ? students
      : students
        ? [students]
        : [];

    const scoresQuery = `
            SELECT 
                student_id, 
                assignment_clo_id, 
                score
            FROM 
                student_assignment_scores
            WHERE 
                assignment_id = ?
        `;

    const scoresResult = await conn.query(scoresQuery, [assignment_id]);
    const scoresMap = {};

    if (scoresResult && scoresResult.length > 0) {
      scoresResult.forEach((row) => {
        const { student_id, assignment_clo_id, score } = row;

        if (!scoresMap[student_id]) {
          scoresMap[student_id] = {};
        }

        scoresMap[student_id][assignment_clo_id] = parseFloat(score);
      });
    }

    res.json({
      success: true,
      assignment,
      clos: cloList,
      students: studentList,
      scores: scoresMap,
    });
  } catch (error) {
    console.error("Error fetching assignment details:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูล Assignment",
      error: error.message,
    });
  } finally {
    if (conn) conn.release();
  }
}

async function importScoreFromExcel(req, res) {
  const { assignment_id, scores_data } = req.body;

  if (
    !assignment_id ||
    !scores_data ||
    !Array.isArray(scores_data) ||
    scores_data.length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Assignment ID and valid scores data are required",
    });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // 1. Get CLO mapping for validation
    const cloQuery = `
            SELECT 
                id as assignment_clo_id,
                clo_id
            FROM 
                assignment_clo_selection
            WHERE 
                assignment_id = ?
        `;

    const clos = await conn.query(cloQuery, [assignment_id]);

    if (!clos || clos.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No CLOs found for this assignment",
      });
    }

    // Create mapping of CLO codes to IDs for lookup
    const validCloIds = new Set(clos.map((clo) => clo.assignment_clo_id));

    // 2. Process and validate each record from Excel
    const operations = [];
    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // Expected format for scores_data: [{ student_id, clo_data: { assignment_clo_id: score, ... } }, ...]
    for (const record of scores_data) {
      if (!record.student_id || !record.clo_data) {
        results.failed++;
        results.errors.push({
          student_id: record.student_id || "Unknown",
          error: "Missing student ID or CLO data",
        });
        continue;
      }

      for (const assignment_clo_id in record.clo_data) {
        // Skip if not a valid CLO for this assignment
        if (!validCloIds.has(parseInt(assignment_clo_id))) {
          results.failed++;
          results.errors.push({
            student_id: record.student_id,
            error: `Invalid CLO ID: ${assignment_clo_id}`,
          });
          continue;
        }

        const score = parseFloat(record.clo_data[assignment_clo_id]) || 0;

        // Ensure score is between 0 and 100
        const validScore = Math.min(Math.max(score, 0), 100);

        // Use INSERT ... ON DUPLICATE KEY UPDATE for upsert operation
        const query = `
                    INSERT INTO student_assignment_scores 
                    (student_id, assignment_id, assignment_clo_id, score) 
                    VALUES (?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE score = ?
                `;

        operations.push(
          conn.query(query, [
            record.student_id,
            assignment_id,
            assignment_clo_id,
            validScore,
            validScore,
          ])
        );

        results.success++;
      }
    }

    // Execute all database operations
    await Promise.all(operations);

    await conn.commit();

    res.json({
      success: true,
      message: "Scores imported successfully",
      results,
    });
  } catch (error) {
    if (conn) await conn.rollback();

    console.error("Error importing scores from Excel:", error);
    res.status(500).json({
      success: false,
      message: "Error importing scores",
      error: error.message,
    });
  } finally {
    if (conn) conn.release();
  }
}

async function addStudent(req, res) {
  const { students } = req.body;

  // ตรวจสอบว่ามีข้อมูลนักศึกษาหรือไม่
  if (!students || !Array.isArray(students) || students.length === 0) {
    return res.status(400).json({
      success: false,
      message: "ไม่มีข้อมูลนักศึกษาที่จะบันทึก",
    });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const results = {
      success: [],
      errors: [],
    };

    for (const student of students) {
      try {
        // แสดงข้อมูลที่ได้รับจาก frontend เพื่อการตรวจสอบ
        console.log(`Processing student data:`, student);

        // บังคับอัพเดตข้อมูลนักศึกษาเสมอ ไม่ว่าจะมีอยู่แล้วหรือไม่
        const studentName = student.name || "Unknown";
        console.log(`Student ${student.student_id}, name: ${studentName}`);

        // ใช้ UPSERT เพื่อเพิ่มหรืออัพเดตข้อมูลนักศึกษา
        const upsertStudentQuery = `
                    INSERT INTO studentdata (student_id, name) 
                    VALUES (?, ?)
                    ON DUPLICATE KEY UPDATE name = VALUES(name)
                `;

        const upsertResult = await conn.query(upsertStudentQuery, [
          student.student_id,
          studentName,
        ]);

        console.log(`Upsert student result:`, upsertResult);

        // ขั้นตอนที่ 2: ดึง CLO IDs ทั้งหมดของ assignment นี้
        const getCloIdsQuery = `
                    SELECT id FROM assignment_clo_selection 
                    WHERE assignment_id = ?
                `;

        const cloResults = await conn.query(getCloIdsQuery, [
          student.assignment_id,
        ]);
        console.log(
          `Found ${cloResults.length} CLOs for assignment ${student.assignment_id}`
        );

        if (!cloResults || cloResults.length === 0) {
          results.errors.push({
            student_id: student.student_id,
            assignment_id: student.assignment_id,
            error: `ไม่พบข้อมูล CLO สำหรับ assignment_id: ${student.assignment_id}`,
          });
          continue;
        }

        // ขั้นตอนที่ 3: เพิ่มนักศึกษาเข้า assignment_clo แต่ละรายการ
        const insertQuery = `
                    INSERT INTO assignments_students (
                        student_id,
                        assignment_id,
                        assignment_clo_id,
                        created_at
                    ) VALUES (?, ?, ?, NOW())
                `;

        let successCount = 0;

        // วนลูปเพื่อเพิ่มข้อมูลทีละ CLO
        for (const clo of cloResults) {
          try {
            console.log(
              `Inserting student_id=${student.student_id}, assignment_id=${student.assignment_id}, clo_id=${clo.id}`
            );

            const result = await conn.query(insertQuery, [
              student.student_id,
              student.assignment_id,
              clo.id,
            ]);

            console.log(`Insert result:`, result);
            successCount++;
          } catch (insertError) {
            console.error(
              `Error inserting CLO ${clo.id} for student ${student.student_id}:`,
              insertError
            );
          }
        }

        if (successCount > 0) {
          results.success.push({
            student_id: student.student_id,
            assignment_id: student.assignment_id,
            clos_added: successCount,
          });
        } else {
          results.errors.push({
            student_id: student.student_id,
            assignment_id: student.assignment_id,
            error: "ไม่สามารถเพิ่มข้อมูล CLO ใดๆ ได้",
          });
        }
      } catch (error) {
        console.error(`Error processing student ${student.student_id}:`, error);
        results.errors.push({
          student_id: student.student_id,
          assignment_id: student.assignment_id,
          error: error.message,
        });
      }
    }

    await conn.commit();

    res.status(200).json({
      success: true,
      message: `เพิ่มนักศึกษาสำเร็จ ${results.success.length} คน, ล้มเหลว ${results.errors.length} คน`,
      results: results,
    });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error("Error adding students to assignment:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการเพิ่มนักศึกษา",
      error: error.message,
    });
  } finally {
    if (conn) conn.release();
  }
}

async function getAssignmentClo(req, res) {
  const { program_id, course_id, semester_id, section_id, year } = req.query;

  if (!course_id || !semester_id || !section_id || !year) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  let conn;

  try {
    conn = await pool.getConnection();

    const query = `
            SELECT 
                cc.course_clo_id,
                cc.course_id,
                cc.clo_id AS CLO_id,
                cc.semester_id,
                cc.section_id,
                cc.year,
                clo.CLO_code,
                clo.CLO_name,
                clo.CLO_engname,
                IFNULL(cp.weight, 0) AS weight
            FROM 
                course_clo cc
            JOIN 
                clo ON cc.clo_id = clo.CLO_id
            LEFT JOIN
                course_plo cp ON cc.course_id = cp.course_id AND cp.plo_id = (
                    SELECT plo_id FROM program_plo WHERE program_id = ? LIMIT 1
                )
            WHERE 
                cc.course_id = ? 
                AND cc.semester_id = ? 
                AND cc.section_id = ? 
                AND cc.year = ?
            ORDER BY clo.CLO_code
        `;

    const rows = await conn.query(query, [
      program_id,
      course_id,
      semester_id,
      section_id,
      year,
    ]);

    // บังคับให้ rows เป็น array
    let result = Array.isArray(rows) ? rows : [rows];

    if (result.length === 0) {
      return res.status(404).json({
        message: "No CLOs found for the selected course",
      });
    }

    // แปลงค่า BigInt เป็น String ก่อนส่งกลับ
    result = JSON.parse(
      JSON.stringify(result, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    res.json(result);
  } catch (err) {
    console.error("Error fetching course CLOs:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  } finally {
    if (conn) conn.release();
  }
}

async function addAssignment(req, res) {
  const {
    program_id,
    course_name, // ตรงกับชื่อฟิลด์ในตาราง
    section_id,
    semester_id,
    year,
    assignment_name, // ตรงกับชื่อฟิลด์ในตาราง
    faculty_id, // จะแปลงเป็น major_id หรือไม่ใช้
    university_id,
    clo_scores, // อาจจะไม่มีในการเพิ่ม Assignment ใหม่
  } = req.body;

  // ตรวจสอบข้อมูลที่จำเป็น (ยกเว้น clo_scores)
  if (
    !program_id ||
    !course_name ||
    !section_id ||
    !semester_id ||
    !year ||
    !assignment_name
  ) {
    console.log("Missing required fields:", {
      program_id,
      course_name,
      section_id,
      semester_id,
      year,
      assignment_name,
    });
    return res.status(400).json({
      success: false,
      message: "กรุณากรอกข้อมูลให้ครบถ้วน",
    });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // บันทึกข้อมูล Assignment ตามโครงสร้างตาราง
    const assignmentQuery = `
            INSERT INTO assignments (
                program_id, 
                course_name, 
                section_id, 
                semester_id, 
                year, 
                assignment_name, 
                faculty_id,           
                university_id,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

    const assignmentResult = await conn.query(assignmentQuery, [
      program_id,
      course_name,
      section_id,
      semester_id,
      year,
      assignment_name,
      faculty_id, // ใช้ faculty_id แทน major_id (ถ้าเหมาะสม)
      university_id,
    ]);

    const assignmentId = assignmentResult.insertId;

    // บันทึกข้อมูลคะแนน CLO เฉพาะเมื่อมีข้อมูล
    if (clo_scores && clo_scores.length > 0) {
      // วนลูปสำหรับแต่ละ homework
      for (const hw of clo_scores) {
        const { homework_name, scores } = hw;

        // บันทึกข้อมูล homework
        const homeworkQuery = `
                    INSERT INTO assignment_homeworks (
                        assignment_id,
                        homework_name,
                        created_at
                    ) VALUES (?, ?, NOW())
                `;

        const homeworkResult = await conn.query(homeworkQuery, [
          assignmentId,
          homework_name,
        ]);

        const homeworkId = homeworkResult.insertId;

        // บันทึกคะแนนสำหรับแต่ละ CLO
        if (scores && scores.length > 0) {
          const scoresQuery = `
                        INSERT INTO homework_clo_scores (
                            homework_id,
                            clo_id,
                            score,
                            created_at
                        ) VALUES (?, ?, ?, NOW())
                    `;

          for (const score of scores) {
            await conn.query(scoresQuery, [
              homeworkId,
              score.clo_id,
              score.score,
            ]);
          }
        }
      }
    }

    await conn.commit();

    res.status(201).json({
      success: true,
      message: "Assignment บันทึกสำเร็จ",
      assignment_id: Number(assignmentId), // แปลง BigInt เป็น Number
    });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error("Error creating assignment:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
      error: error.message,
    });
  } finally {
    if (conn) conn.release();
  }
}

async function getAllByCourse(req, res) {
  try {
    const { course_id, section_id, semester_id, year, program_id } = req.query;

    // Query to get all assignments for this course, section, semester, and year
    const query = `
        SELECT 
          assignment_id, 
          assignment_name, 
          course_name, 
          section_id, 
          semester_id, 
          year, 
          created_at
        FROM assignments 
        WHERE course_name = ? 
        AND section_id = ? 
        AND semester_id = ? 
        AND year = ? 
        AND program_id = ?
      `;

    const [assignments] = await pool.query(query, [
      course_id,
      section_id,
      semester_id,
      year,
      program_id,
    ]);

    res.json(assignments);
  } catch (error) {
    console.error("Error fetching course assignments:", error);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
}

async function getScoreOneById(req, res) {
  const assignmentId = req.params.id;
  let conn;

  try {
    conn = await pool.getConnection();

    // ดึงข้อมูล assignment
    const assignmentQuery = `
            SELECT 
                a.*,
                c.course_name,
                p.program_name
            FROM 
                assignments a
            LEFT JOIN 
                course c ON a.course_id = c.course_id
            LEFT JOIN 
                program p ON a.program_id = p.program_id
            WHERE 
                a.assignment_id = ?
        `;

    const assignments = await conn.query(assignmentQuery, [assignmentId]);

    if (!assignments || assignments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูล Assignment",
      });
    }

    const assignment = assignments[0];

    // ดึงข้อมูล homework
    const homeworksQuery = `
            SELECT * FROM assignment_homeworks 
            WHERE assignment_id = ?
        `;

    const homeworks = await conn.query(homeworksQuery, [assignmentId]);
    const homeworksList = Array.isArray(homeworks) ? homeworks : [homeworks];

    // ดึงข้อมูลคะแนน CLO สำหรับแต่ละ homework
    const homeworksWithScores = [];

    for (const homework of homeworksList) {
      const scoresQuery = `
                SELECT 
                    hcs.*,
                    clo.CLO_code,
                    clo.CLO_name,
                    clo.CLO_engname,
                    cc.weight as clo_weight
                FROM 
                    homework_clo_scores hcs
                JOIN 
                    clo ON hcs.clo_id = clo.CLO_id
                JOIN 
                    course_clo cc ON hcs.clo_id = cc.clo_id
                WHERE 
                    hcs.homework_id = ? 
                    AND cc.course_id = ?
                    AND cc.section_id = ?
                    AND cc.semester_id = ?
                    AND cc.year = ?
            `;

      const scores = await conn.query(scoresQuery, [
        homework.homework_id,
        assignment.course_id,
        assignment.section_id,
        assignment.semester_id,
        assignment.year,
      ]);

      const scoresList = Array.isArray(scores) ? scores : [scores];

      homeworksWithScores.push({
        ...homework,
        scores: scoresList,
      });
    }

    // รวมข้อมูลทั้งหมด
    const result = {
      ...assignment,
      homeworks: homeworksWithScores,
    };

    res.json(result);
  } catch (error) {
    console.error("Error fetching assignment details:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูล",
    });
  } finally {
    if (conn) conn.release();
  }
}

async function updateScoreOne(req, res) {
  const { assignment_id, student_id, score } = req.body;
  let conn;
  if (!assignment_id || !student_id || score === undefined) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  try {
    const conn = await pool.getConnection();

    // Update score in assignments_students table
    const result = await conn.query(
      "UPDATE student_assignments SET score = ?, status = ? WHERE assignment_id = ? AND student_id = ?",
      [score, score >= 50 ? "Completed" : "Failed", assignment_id, student_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found in this assignment",
      });
    }

    res.json({
      success: true,
      message: "Score updated successfully",
    });

    conn.release();
  } catch (error) {
    console.error("Error updating student score:", error);
    res.status(500).json({
      success: false,
      message: "Error updating score",
    });
  } finally {
    if (conn) conn.release();
  }
}

async function getManyCourseByCourseId(req, res) {
  let conn;
  try {
    const {
      course_id,
      section_id,
      semester_id,
      year,
      program_id,
      assignment_name,
    } = req.query;

    const query = `
        SELECT 
          assignment_id, 
          assignment_name
        FROM assignments 
        WHERE course_name = ? 
        AND section_id = ? 
        AND semester_id = ? 
        AND year = ? 
        AND program_id = ?
        AND assignment_name = ?
      `;

    const [assignments] = await pool.query(query, [
      course_id,
      section_id,
      semester_id,
      year,
      program_id,
      assignment_name,
    ]);

    res.json(assignments);
  } catch (error) {
    console.error("Error fetching course assignments:", error);
    res.status(500).json({ error: "Failed to fetch assignments" });
  } finally {
    if (conn) conn.release();
  }
}

async function addClo(req, res) {
  const { data } = req.body; // ข้อมูลที่ส่งมาจาก frontend
  if (!data || !Array.isArray(data)) {
    return res.status(400).send({ message: "Invalid data format" });
  }
  let conn;

  try {
    const conn = await pool.getConnection();

    // เริ่มต้นการทำงานกับฐานข้อมูลโดยใช้ query batch
    const queries = data.map((item) => {
      return conn.query(
        `
                INSERT INTO Assignment_CLO_Selection (clo_id, assignment_id, score, weight) 
                VALUES (?, ?, ?, ?)`,
        [item.item.clo_id, item.assignment_id, item.score, item.weight] // เพิ่ม 'score'
      );
    });

    // รอให้คำสั่งทั้งหมดทำงานเสร็จ
    await Promise.all(queries);

    res.status(200).send({ message: "Data saved successfully" });
    conn.release();
  } catch (err) {
    console.error("Error saving CLO data:", err);
    res
      .status(500)
      .send({ message: "Error saving CLO data", error: err.message });
  } finally {
    if (conn) conn.release();
  }
}

async function deleteOneById(req, res) {
  const { id } = req.params;
  let conn;
  try {
    const conn = await pool.getConnection();
    const query = "DELETE FROM assignments WHERE assignment_id = ?";
    await conn.query(query, [id]);
    conn.release();
    res.status(200).json({ message: "Assignment deleted successfully" });
  } catch (err) {
    console.error("Error deleting assignment:", err);
    res.status(500).json({ message: "Failed to delete assignment" });
  } finally {
    if (conn) conn.release();
  }
}

async function removeStudent(req, res) {
  const { assignment_id, student_id } = req.body;
  if (!assignment_id || !student_id) {
    return res.status(400).json({
      success: false,
      message: "ข้อมูลไม่ครบถ้วน กรุณาระบุ assignment_id และ student_id",
    });
  }

  let conn;

  try {
    // สร้างการเชื่อมต่อกับฐานข้อมูล
    conn = await pool.getConnection();

    // ตรวจสอบว่ามีนักเรียนนี้ใน Assignment หรือไม่
    const assignmentStudentsCheck = await conn.query(
      `SELECT * FROM assignments_students 
         WHERE assignment_id = ? AND student_id = ?`,
      [assignment_id, student_id]
    );

    if (!assignmentStudentsCheck || assignmentStudentsCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลนักเรียนใน Assignment นี้",
      });
    }

    // เริ่ม transaction
    await conn.beginTransaction();

    // ลบข้อมูลคะแนนของนักเรียนในทุก CLO ของ Assignment นี้
    await conn.query(
      `DELETE FROM student_assignment_scores 
         WHERE assignment_id = ? AND student_id = ?`,
      [assignment_id, student_id]
    );

    // ลบข้อมูลนักเรียนออกจาก Assignment
    await conn.query(
      `DELETE FROM assignments_students 
         WHERE assignment_id = ? AND student_id = ?`,
      [assignment_id, student_id]
    );

    // ยืนยัน transaction
    await conn.commit();

    res.json({
      success: true,
      message: "ลบนักเรียนออกจาก Assignment เรียบร้อยแล้ว",
    });
  } catch (error) {
    // ถ้าเกิดข้อผิดพลาด ให้ rollback transaction
    if (conn) {
      await conn.rollback();
    }

    console.error("Error removing student:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบนักเรียน: " + error.message,
    });
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

async function updateAssignment(req, res) {
  let conn;
  try {
    const assignmentId = req.params.id;
    const {
      program_id,
      course_name,
      section_id,
      semester_id,
      year,
      assignment_name,
      faculty_id,
      university_id,
    } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    const requiredFields = {
      program_id,
      course_name,
      section_id,
      semester_id,
      year,
      assignment_name,
      faculty_id,
      university_id,
    };

    // ตรวจสอบว่าทุกฟิลด์มีค่า
    for (const [field, value] of Object.entries(requiredFields)) {
      if (value === undefined || value === null) {
        return res.status(400).json({
          error: `Missing required field: ${field}`,
        });
      }
    }

    // Update the assignment
    const updateQuery = `
        UPDATE assignments 
        SET program_id = ?, 
            course_name = ?, 
            section_id = ?, 
            semester_id = ?, 
            year = ?, 
            assignment_name = ?,
            faculty_id = ?,
            university_id = ?
        WHERE assignment_id = ?
      `;

    console.log("Executing update query with data:", [
      program_id,
      course_name,
      section_id,
      semester_id,
      year,
      assignment_name,
      faculty_id,
      university_id,
      assignmentId,
    ]);

    const result = await pool.query(updateQuery, [
      program_id,
      course_name,
      section_id,
      semester_id,
      year,
      assignment_name,
      faculty_id,
      university_id,
      assignmentId,
    ]);

    console.log("Update result:", result);

    res.json({
      message: "Assignment updated successfully",
      assignment_id: assignmentId,
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    console.error("Error updating assignment:", error);
    res.status(500).json({
      error: "Failed to update assignment",
      details: error.message,
    });
  } finally {
    if (conn) conn.release();
  }
}

export {
  getOneById,
  getAll,
  importScoreFromExcel,
  addStudent,
  getAssignmentClo,
  addAssignment,
  getAllByCourse,
  getScoreOneById,
  updateScoreOne,
  getManyCourseByCourseId,
  addClo,
  deleteOneById,
  removeStudent,
  updateAssignment,
};
