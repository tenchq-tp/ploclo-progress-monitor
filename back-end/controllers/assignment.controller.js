import pool from "../utils/db.js";

export async function getAll(req, res) {
  const query = `
    SELECT ass.assignment_id, ass.assignment_name, c.course_name, c.course_id, p.program_name, p.year, pc.semester_id, pc.section_id,  u.university_name_en
    FROM assignments AS ass
    LEFT JOIN program_course AS pc ON pc.program_course_id=ass.program_course_id
    LEFT JOIN program AS p ON p.program_id=pc.program_id
    LEFT JOIN course AS c ON pc.course_id=c.course_id
    LEFT JOIN university AS u ON u.university_id=ass.university_id;
  `;

  try {
    const result = await pool.query(query);
    res.status(200).json({ data: result });
  } catch (error) {
    res.status(500).json({ message: "Error while fetching all assignments" });
  }
}

export async function createOne(req, res) {
  const {
    program_course_id,
    name,
    description,
    max_score,
    due_date,
    university_id,
    faculty_id,
    clos,
  } = req.body;
  const conn = await pool.getConnection();
  await conn.beginTransaction();

  const totalWeight = clos.reduce(
    (sum, clo) => sum + parseFloat(clo.weight),
    0
  );
  if (Math.abs(totalWeight - 1.0) > 0.001) {
    return res.status(400).json({ message: "CLO weights must sum up to 1.0" });
  }

  try {
    const assignmentQuery = `
      INSERT INTO assignments (program_course_id, assignment_name, description, total_score, due_date, faculty_id, university_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await conn.query(assignmentQuery, [
      program_course_id,
      name,
      description,
      max_score,
      due_date,
      university_id,
      faculty_id,
    ]);

    const assignmentId = Number(result.insertId);

    if (clos && clos.length > 0) {
      const cloInsertQuery = `
    INSERT INTO assignment_clo (assignment_id, clo_id, weight)
    VALUES ${clos.map(() => "(?, ?, ?)").join(", ")}
  `;

      const cloValues = clos.flatMap((clo) => [
        assignmentId,
        clo.id,
        parseFloat(clo.weight),
      ]);

      await conn.query(cloInsertQuery, cloValues);
    }

    await conn.commit();
    res
      .status(200)
      .json({ message: "Assignment created successfully", assignmentId });
  } catch (error) {
    conn.rollback();
    res
      .status(500)
      .json({ message: "Error while create assignment", error: error.message });
  } finally {
    conn.release();
  }
}

export async function getManyByProgramCourse(req, res) {
  const { program_course_id } = req.params;
  try {
    const query = `
      SELECT * FROM assignments WHERE program_course_id=?;
    `;
    const result = await pool.query(query, [program_course_id]);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error while fetch assignment" });
  }
}

export async function deleteOneById(req, res) {
  const { assignment_id } = req.params;
  try {
    const query = `DELETE FROM assignments WHERE assignment_id = ?`;
    await pool.query(query, [assignment_id]);
    res.status(200).json({ message: "delete successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error while delete assignment", error });
  }
}

export async function assignStudent(req, res) {
  const { assignment_id, students } = req.body;
  try {
    if (!assignment_id || !students || !Array.isArray(students)) {
      return res.status(400).json({ message: "Invalid input" });
    }

    for (const student of students) {
      // Ensure student exists in the student table
      const [exists] = await pool.query(
        "SELECT 1 FROM student WHERE student_id = ?",
        [student.student_id]
      );
      if (exists.length === 0) {
        await pool.query(
          "INSERT INTO student (student_id, first_name, last_name) VALUES (?, ?, ?)",
          [student.student_id, student.firstname, student.lastname]
        );
      }
    }

    const values = [];
    const params = [];

    for (const student of students) {
      // Check if student is already assigned to this assignment
      const alreadyAssigned = await pool.query(
        "SELECT 1 FROM assignment_student WHERE assignment_id = ? AND student_id = ?",
        [assignment_id, student.student_id]
      );

      if (alreadyAssigned.length === 0) {
        values.push(`(?, ?)`);
        params.push(assignment_id);
        params.push(student.student_id);
      }
    }

    if (values.length > 0) {
      const query = `
        INSERT INTO assignment_student (assignment_id, student_id)
        VALUES ${values.join(", ")}
      `;
      await pool.query(query, params);
    }

    res.status(200).json({
      message: "Students assigned successfully (skipped existing assignments)",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error while assigning students", error });
  }
}

export async function getManyWithScore(req, res) {
  const { assignment_id } = req.params;

  try {
    const query = `
      SELECT ass_st.id, a.assignment_id, a.assignment_name, s.first_name, s.last_name, ass_g.score
      FROM assignment_student AS ass_st
      LEFT JOIN student AS s ON ass_st.student_id=s.student_id
      LEFT JOIN assignments AS a ON a.assignment_id=ass_st.assignment_id
      LEFT JOIN assignment_grade AS ass_g ON ass_st.id=ass_g.assignment_student_id WHERE a.assignment_id=?`;
    const result = await pool.query(query, [assignment_id]);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error while update score" });
  }
}

export async function updateScore(req, res) {
  const { student_scores } = req.body;
  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    student_scores.map(async (student_score) => {
      const queryCheckExist = `SELECT assignment_student_id FROM assignment_grade WHERE assignment_student_id=?`;
      const exists = await conn.query(queryCheckExist, [student_score.id]);
      if (exists.length > 0) {
        const updateQuery = `UPDATE assignment_grade SET score=? WHERE assignment_student_id=?`;
        await conn.query(updateQuery, [student_score.score, student_score.id]);
      } else {
        const query = `INSERT INTO assignment_grade (assignment_student_id, score) VALUES (?, ?)`;
        await conn.query(query, [student_score.id, student_score.score || 0]);
      }
    });
    conn.commit();
    conn.release();
    res.status(200).json({ message: "test" });
  } catch (error) {
    res.status(500).json({ messsage: "Test" });
  }
}

export async function getAssignmentClos(req, res) {
  const { assignment_id } = req.params;

  try {
    const query = `
      SELECT ac.clo_id, ac.weight, clo.CLO_code, clo.CLO_name
      FROM assignment_clo AS ac
      JOIN clo ON clo.CLO_id = ac.clo_id
      WHERE ac.assignment_id = ?
    `;
    const result = await pool.query(query, [assignment_id]);
    res.status(200).json(result);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error while fetching CLOs for assignment", error });
  }
}

export async function createManyFromExcel(req, res) {
  const { assignments, program_course_id, university_id, faculty_id } =
    req.body;

  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    for (const assignment of assignments) {
      const { Ast, Description, Nickname, Score, ...cloWeightsRaw } =
        assignment;

      // Check for duplicate assignment name
      const existingRows = await conn.query(
        `
        SELECT assignment_id FROM assignments 
        WHERE assignment_name = ? AND program_course_id = ? AND faculty_id = ? AND university_id = ?
        `,
        [Nickname, program_course_id, faculty_id, university_id]
      );

      if (existingRows.length > 0) {
        console.log(`Skipped duplicate assignment "${Nickname}"`);
        continue; // Skip this assignment if it already exists
      }

      // Extract CLOs
      const clos = Object.entries(cloWeightsRaw)
        .filter(([key]) => key.startsWith("CLO"))
        .map(([key, weight]) => ({
          id: key.replace("CLO", ""),
          weight: parseFloat(weight),
        }));

      // Validate CLO weight sum
      const totalWeight = clos.reduce((sum, clo) => sum + clo.weight, 0);
      if (Math.abs(totalWeight - 1.0) > 0.001) {
        await conn.rollback();
        return res.status(400).json({
          message: `CLO weights must sum up to 1.0 for assignment "${Nickname}"`,
        });
      }

      // Insert assignment
      const assignmentQuery = `
        INSERT INTO assignments (program_course_id, assignment_name, description, total_score, due_date, faculty_id, university_id)
        VALUES (?, ?, ?, ?, NULL, ?, ?)
      `;
      const result = await conn.query(assignmentQuery, [
        program_course_id,
        Nickname,
        Description,
        Score,
        faculty_id,
        university_id,
      ]);

      const assignmentId = Number(result.insertId);

      // Insert CLOs
      if (clos.length > 0) {
        const cloInsertQuery = `
          INSERT INTO assignment_clo (assignment_id, clo_id, weight)
          VALUES ${clos.map(() => "(?, ?, ?)").join(", ")}
        `;
        const cloValues = clos.flatMap((clo) => [
          assignmentId,
          clo.id,
          clo.weight,
        ]);
        await conn.query(cloInsertQuery, cloValues);
      }
    }

    await conn.commit();
    res.status(200).json({ message: "All assignments created successfully." });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({
      message: "Error while creating assignments",
      error: error.message,
    });
  } finally {
    conn.release();
  }
}

export async function insertStudentScore(req, res) {
  const { student_id, assignment_name, score, program_course_id } = req.body;
  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    const assignmentRows = await conn.query(
      `SELECT assignment_id FROM assignments WHERE assignment_name = ? AND program_course_id = ?`,
      [assignment_name, program_course_id]
    );
    console.log("assignmentRows : ", assignmentRows);
    if (assignmentRows.length === 0) {
      throw new Error("Assignment not found");
    }
    const assignmentId = assignmentRows[0].assignment_id;

    // Step 2: Get assignment_student_id
    const studentRows = await conn.query(
      `SELECT id FROM assignment_student WHERE assignment_id = ? AND student_id = ?`,
      [assignmentId, student_id]
    );
    if (studentRows.length === 0) {
      throw new Error("Student not assigned to this assignment");
    }
    const assignmentStudentId = studentRows[0].id;

    // Step 3: Insert or update the grade
    await conn.query(
      `INSERT INTO assignment_grade (assignment_student_id, score, graded_at)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE score = VALUES(score), graded_at = NOW()`,
      [assignmentStudentId, score]
    );

    await conn.commit();
    res.status(200).json({ message: "Score recorded successfully" });
  } catch (err) {
    console.error(err);
    await conn.rollback();
    res
      .status(500)
      .json({ message: "Error recording score", error: err.message });
  } finally {
    conn.release();
  }
}

export async function insertStudentScoreExcel(req, res) {
  const { program_course_id, student_score } = req.body;
  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    for (const row of student_score) {
      const { student_id, __rowNum__, ...assignments } = row;

      for (const [assignment_name, score] of Object.entries(assignments)) {
        // Step 1: Get assignment_id
        console.log(assignment_name);
        const assignmentRows = await conn.query(
          `SELECT assignment_id FROM assignments WHERE assignment_name = ? AND program_course_id = ?`,
          [assignment_name, program_course_id]
        );

        if (assignmentRows.length === 0) {
          console.warn(`Assignment '${assignment_name}' not found`);
          continue; // Skip this assignment
        }

        const assignmentId = assignmentRows[0].assignment_id;

        // Step 2: Get assignment_student.id
        const studentRows = await conn.query(
          `SELECT id FROM assignment_student WHERE assignment_id = ? AND student_id = ?`,
          [assignmentId, student_id]
        );

        if (studentRows.length === 0) {
          console.warn(
            `Student ${student_id} not assigned to assignment '${assignment_name}'`
          );
          continue; // Skip this student-assignment combo
        }

        const assignmentStudentId = studentRows[0].id;

        // Step 3: Insert or update the grade
        await conn.query(
          `INSERT INTO assignment_grade (assignment_student_id, score, graded_at)
           VALUES (?, ?, NOW())
           ON DUPLICATE KEY UPDATE score = VALUES(score), graded_at = NOW()`,
          [assignmentStudentId, score]
        );
      }
    }

    await conn.commit();
    res
      .status(200)
      .json({ message: "All scores inserted/updated successfully" });
  } catch (err) {
    console.error(err);
    await conn.rollback();
    res
      .status(500)
      .json({ message: "Failed to insert scores", error: err.message });
  } finally {
    conn.release();
  }
}

// export async function getManyBy(req, res) {
//   const { program_course_id}

//   let query = `SELECT ass.assignment_id, ass.assignment_name, c.course_name, c.course_id, p.program_name, p.year, pc.semester_id, pc.section_id,  u.university_name_en
//     FROM assignments AS ass
//     LEFT JOIN program_course AS pc ON pc.program_course_id=ass.program_course_id
//     LEFT JOIN program AS p ON p.program_id=pc.program_id
//     LEFT JOIN course AS c ON pc.course_id=c.course_id
//     LEFT JOIN university AS u ON u.university_id=ass.university_id;`;
// }
