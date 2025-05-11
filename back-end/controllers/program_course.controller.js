import pool from "../utils/db.js";

async function importExcel(req, res) {
  const coursesData = req.body;

  if (!Array.isArray(coursesData) || coursesData.length === 0) {
    return res.status(400).json({
      message: "No course data provided. Please upload valid Excel data.",
    });
  }

  try {
    const conn = await pool.getConnection();

    for (const course of coursesData) {
      const {
        program_id,
        course_id,
        course_name,
        course_engname,
        semester_id,
        year,
        section_id,
      } = course;

      if (!program_id || !course_id || !course_name || !semester_id || !year) {
        conn.release();
        return res.status(400).json({
          message:
            "Missing required fields in some rows. Please ensure all fields are complete.",
        });
      }

      const checkCourseQuery = `
          SELECT 1 FROM course WHERE course_id = ?
        `;

      const courseResult = await conn.query(checkCourseQuery, [course_id]);
      const existingCourse = courseResult[0];

      if (!existingCourse || existingCourse.length === 0) {
        const insertCourseQuery = `
            INSERT INTO course (course_id, course_name, course_engname, timestamp)
            VALUES (?, ?, ?, NOW())
          `;

        await conn.query(insertCourseQuery, [
          course_id,
          course_name,
          course_engname,
        ]);
      } else {
        const updateCourseQuery = `
            UPDATE course
            SET course_name = ?, course_engname = ?, timestamp = NOW()
            WHERE course_id = ?
          `;

        await conn.query(updateCourseQuery, [
          course_name,
          course_engname,
          course_id,
        ]);
      }

      const checkSectionQuery = `
          SELECT 1 FROM section WHERE section_id = ?
        `;

      const sectionResult = await conn.query(checkSectionQuery, [section_id]);
      const existingSection = sectionResult[0];

      if (!existingSection || existingSection.length === 0) {
        const insertSectionQuery = `
              INSERT INTO section (section_id) 
              VALUES (?)
            `;

        await conn.query(insertSectionQuery, [section_id]);
      }

      const checkProgramCourseQuery = `
          SELECT 1 
          FROM program_course 
          WHERE program_id = ? AND course_id = ? AND semester_id = ?
        `;

      const programCourseResult = await conn.query(checkProgramCourseQuery, [
        program_id,
        course_id,
        semester_id,
      ]);

      const existingProgramCourse = programCourseResult[0];

      if (!existingProgramCourse || existingProgramCourse.length === 0) {
        const insertProgramCourseQuery = `
            INSERT INTO program_course (
              program_id, course_id, semester_id, year, section_id
            )
            VALUES (?, ?, ?, ?, ?)
          `;

        await conn.query(insertProgramCourseQuery, [
          program_id,
          course_id,
          semester_id,
          year,
          section_id,
        ]);
      } else {
        const updateProgramCourseQuery = `
            UPDATE program_course 
            SET year = ?, section_id = ?
            WHERE program_id = ? AND course_id = ? AND semester_id = ?
          `;

        await conn.query(updateProgramCourseQuery, [
          year,
          section_id,
          program_id,
          course_id,
          semester_id,
        ]);
      }
    }

    res.status(201).json({ message: "All courses uploaded successfully!" });
    conn.release();
  } catch (err) {
    console.error("Error adding courses from Excel:", err);
    res.status(500).json({
      message: "Database error occurred while processing Excel data.",
      error: err.message,
    });
  }
}

async function getOneById(req, res) {
  const { program_id } = req.query;

  // ตรวจสอบว่า program_id ถูกส่งมาหรือไม่
  if (!program_id) {
    return res
      .status(400)
      .json({ success: false, message: "Program ID is required" });
  }

  // Query เพื่อดึงข้อมูลจากฐานข้อมูล
  const query = `
        SELECT 
            pc.course_id, 
            c.course_name, 
            cp.weight 
        FROM 
            program_course pc
        JOIN 
            course c ON pc.course_id = c.course_id
        LEFT JOIN 
            course_plo cp ON pc.course_id = cp.course_id
        WHERE 
            pc.program_id = ?
    `;

  try {
    // ใช้ pool เพื่อเชื่อมต่อและ query ข้อมูล
    const connection = await pool.getConnection();
    const results = await connection.query(query, [program_id]);

    // ส่งผลลัพธ์กลับไปยัง client
    res.json({ success: true, courses: results });

    // ปล่อย connection กลับไปยัง pool
    connection.release();
  } catch (err) {
    console.error("Error fetching program courses:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
}

async function createOne(req, res) {
  const {
    year,
    semester_id,
    course_id,
    course_name,
    course_engname,
    section_id,
    program_id,
  } = req.body;

  // ตรวจสอบข้อมูลที่จำเป็น
  if (
    !year ||
    !semester_id ||
    !course_id ||
    !course_name ||
    !course_engname ||
    !section_id ||
    !program_id
  ) {
    return res
      .status(400)
      .json({ message: "Please provide all required information." });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // ตรวจสอบว่า course_id มีอยู่ในตาราง course หรือไม่
    const [courseCheck] = await connection.query(
      "SELECT * FROM course WHERE course_id = ?",
      [course_id]
    );

    if (!courseCheck || courseCheck.length === 0) {
      // ถ้าไม่มี course_id ในตาราง course, ให้เพิ่มข้อมูลใหม่
      await connection.query(
        "INSERT INTO course (course_id, course_name, course_engname) VALUES (?, ?, ?)",
        [course_id, course_name, course_engname]
      );
    }

    // ตรวจสอบว่า semester_id มีอยู่ในตาราง semester หรือไม่
    const [semesterCheck] = await connection.query(
      "SELECT * FROM semester WHERE semester_id = ?",
      [semester_id]
    );

    if (!semesterCheck || semesterCheck.length === 0) {
      throw new Error(`Semester ID ${semester_id} does not exist.`);
    }

    // ตรวจสอบว่า section_id มีอยู่ในตาราง section หรือไม่
    const [sectionCheck] = await connection.query(
      "SELECT * FROM section WHERE section_id = ?",
      [section_id]
    );

    if (!sectionCheck || sectionCheck.length === 0) {
      // ถ้าไม่มี section_id ในตาราง section, ให้เพิ่มข้อมูลใหม่
      await connection.query(
        "INSERT INTO section (section_id) VALUES (?)",
        [section_id] // เพิ่มข้อมูล section_id ที่จำเป็น
      );
    }

    // เพิ่มข้อมูลลงในตาราง program_course
    const result = await connection.query(
      "INSERT INTO program_course (year, semester_id, course_id, section_id, program_id) VALUES (?, ?, ?, ?, ?)",
      [year, semester_id, course_id, section_id, program_id]
    );

    // Commit ข้อมูล
    await connection.commit();

    // แปลง BigInt เป็น String ก่อนส่งกลับ
    const programCourseId = result.insertId.toString();

    res.status(201).json({
      message: "Data added successfully",
      data: {
        program_course_id: programCourseId, // เปลี่ยน BigInt เป็น String
        year,
        semester_id,
        course_id,
        course_name,
        course_engname,
        section_id,
        program_id,
      },
    });
  } catch (err) {
    await connection.rollback();
    console.error("Error adding program_course:", err.message);
    res.status(500).json({
      message: "An error occurred while adding the data.",
      error: err.message,
    });
  } finally {
    connection.release();
  }
}

async function deleteOneById(req, res) {
  const { program_id, semester_id, course_id } = req.query; // รับค่าจาก query parameters

  // ตรวจสอบว่าค่าที่จำเป็นถูกส่งมาครบหรือไม่
  if (!program_id || !semester_id || !course_id) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  try {
    // สร้าง Connection จาก Pool
    const conn = await pool.getConnection();

    // SQL Query สำหรับการลบข้อมูล
    const deleteQuery = `
            DELETE FROM program_course 
            WHERE program_id = ? AND semester_id = ? AND course_id = ?
        `;

    // Execute SQL Query
    const result = await conn.query(deleteQuery, [
      program_id,
      semester_id,
      course_id,
    ]);
    conn.release(); // ปิดการเชื่อมต่อ

    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Course deleted successfully" });
    } else {
      res.status(404).json({ message: "Course not found or already deleted" });
    }
  } catch (err) {
    console.error("Error deleting course:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function updateOneByCourseId(req, res) {
  const { course_id } = req.params;
  const updateFields = req.body;

  // Validate that at least one update field is provided
  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({ message: "No update fields provided" });
  }

  // Define allowed fields for update
  const allowedFields = [
    "course_name",
    "course_engname",
    "new_course_id",
    "program_id",
    "semester_id",
  ];

  // Check if any unexpected fields are being updated
  const invalidFields = Object.keys(updateFields).filter(
    (field) => !allowedFields.includes(field)
  );

  if (invalidFields.length > 0) {
    return res.status(400).json({
      message: `Invalid update fields: ${invalidFields.join(", ")}`,
    });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Dynamic update logic
    const updateOperations = [];
    const updateValues = [];

    // Construct dynamic update query
    if (updateFields.course_name) {
      updateOperations.push("course_name = ?");
      updateValues.push(updateFields.course_name);
    }

    if (updateFields.course_engname) {
      updateOperations.push("course_engname = ?");
      updateValues.push(updateFields.course_engname);
    }

    // If new course ID is provided, handle it separately
    if (updateFields.new_course_id) {
      // Check if new course ID exists
      const [existingNewCourse] = await conn.query(
        "SELECT * FROM course WHERE course_id = ?",
        [updateFields.new_course_id]
      );

      if (!existingNewCourse) {
        // Insert new course if it doesn't exist
        await conn.query(
          "INSERT INTO course (course_id, course_name, course_engname) VALUES (?, ?, ?)",
          [
            updateFields.new_course_id,
            updateFields.course_name || "",
            updateFields.course_engname || "",
          ]
        );
      }

      // Update related tables with new course ID
      await conn.query(
        "UPDATE program_course SET course_id = ? WHERE course_id = ?",
        [updateFields.new_course_id, course_id]
      );
      await conn.query(
        "UPDATE course_plo SET course_id = ? WHERE course_id = ?",
        [updateFields.new_course_id, course_id]
      );
      await conn.query("UPDATE plo_clo SET course_id = ? WHERE course_id = ?", [
        updateFields.new_course_id,
        course_id,
      ]);
      await conn.query(
        "UPDATE course_clo SET course_id = ? WHERE course_id = ?",
        [updateFields.new_course_id, course_id]
      );
    }

    // Perform update for course table
    if (updateOperations.length > 0) {
      const updateQuery = `UPDATE course 
                SET ${updateOperations.join(", ")} 
                WHERE course_id = ?`;

      updateValues.push(updateFields.new_course_id || course_id);

      await conn.query(updateQuery, updateValues);
    }

    await conn.commit();
    res.status(200).json({
      message: "Course updated successfully.",
      updatedFields: Object.keys(updateFields),
    });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Error updating program_course:", err);
    res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  } finally {
    if (conn) conn.release();
  }
}

async function getManyCourseDetail(req, res) {
  const { program_id, year } = req.query; // รับ parameter year เพิ่มเติม

  let conn;
  if (!program_id) {
    return res.status(400).json({ message: "Program ID is required" });
  }

  try {
    conn = await pool.getConnection();
    let query = `SELECT 
                pc.program_course_id, 
                pc.year, 
                pc.semester_id, 
                pc.course_id, 
                pc.section_id, 
                p.program_name, 
                c.course_name,
                c.course_engname, 
                sm.semester_name
            FROM 
                program_course pc
            JOIN program p ON pc.program_id = p.program_id
            JOIN course c ON pc.course_id = c.course_id
            LEFT JOIN section s ON pc.section_id = s.section_id
            JOIN semester sm ON pc.semester_id = sm.semester_id
            WHERE 
                pc.program_id = ?`;

    let params = [program_id];

    // ถ้ามีการส่ง year มา ให้เพิ่มเงื่อนไขในการกรอง
    if (year) {
      query += " AND pc.year = ?";
      params.push(year);
    }

    const result = await conn.query(query, params);

    if (Array.isArray(result)) {
      console.log("Number of rows fetched:", result.length);
      console.log(
        "Using filters - Program ID:",
        program_id,
        "Year:",
        year || "All years"
      );
    } else {
      console.log("Result is not an array:", result);
    }

    if (result.length === 0) {
      return res.status(404).json({
        message: year
          ? `No courses found for program ${program_id} in year ${year}`
          : `No courses found for program ${program_id}`,
      });
    }

    res.status(200).json(result);
    conn.release();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching program_course data" });
  } finally {
    if (conn) conn.release();
  }
}

export {
  importExcel,
  getOneById,
  createOne,
  deleteOneById,
  updateOneByCourseId,
  getManyCourseDetail,
};
