import pool from "../utils/db.js";
import mysql from "mysql2/promise";

async function getAll(req, res) {
  try {
    const conn = await pool.getConnection();
    const result = await conn.query(`SELECT 
      c.course_id,
        c.course_name,
        c.course_engname,
        pc.year
    FROM program_course AS pc
    LEFT JOIN course AS c ON pc.course_id=c.course_id`);
    res.json(result);
    conn.release();
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching course");
  }
}

async function getOneById(req, res) {
  const { course_id } = req.params;
  try {
    const query = `SELECT * FROM course WHERE course_id = ?`;
    const result = await pool.query(query, [course_id]);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).send("Error fetching course");
  }
}

async function createOne(req, res) {
  const { course_id, course_name, course_engname } = req.body;
  try {
    await pool.query(
      "INSERT INTO course (course_id, course_name, course_engname) VALUES (?, ?, ?)",
      [course_id, course_name, course_engname]
    );
    res.status(200).send("Course added successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error adding course");
  }
}

async function updateOneById(req, res) {
  const { course_id } = req.params;
  const { course_name, course_engname } = req.body;

  try {
    await pool.query(
      "UPDATE course SET course_name = ?, course_engname = ? WHERE course_id = ?",
      [course_name, course_engname, course_id]
    );
    res.status(200).json({ message: "Course updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating course");
  }
}

async function deleteOneById(req, res) {
  const { course_id } = req.params;
  try {
    await pool.query("DELETE FROM course WHERE course_id = ?", [course_id]);
    res.status(200).send("Course deleted successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting course");
  }
}

async function getManyByFilter(req, res) {
  const { semester_id, year } = req.query;

  try {
    const response = await pool.query(
      "SELECT DISTINCT c.course_id, c.course_name, c.course_engname FROM program_course AS pc LEFT JOIN course AS c ON pc.course_id=c.course_id WHERE pc.semester_id=? AND pc.year=?",
      [semester_id, year]
    );
    console.log(response);
    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error get course something with filter...");
  }
}

async function importCoursesFromExcel(req, res) {
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
        section_id = 1,
      } = course;

      if (!program_id || !course_id || !course_name || !semester_id || !year) {
        conn.release();
        console.log("Missing data:", course);
        return res.status(400).json({
          message:
            "Missing required fields in some rows. Please ensure all fields are complete.",
        });
      }

      const [existingCourse] = await conn.query(
        `SELECT 1 FROM course WHERE course_id = ?`,
        [course_id]
      );

      if (!existingCourse || existingCourse.length === 0) {
        await conn.query(
          `INSERT INTO course (course_id, course_name, course_engname, timestamp)
           VALUES (?, ?, ?, NOW())`,
          [course_id, course_name, course_engname]
        );
      } else {
        await conn.query(
          `UPDATE course
           SET course_name = ?, course_engname = ?, timestamp = NOW()
           WHERE course_id = ?`,
          [course_name, course_engname, course_id]
        );
      }

      const [existingSection] = await conn.query(
        `SELECT 1 FROM section WHERE section_id = ?`,
        [section_id]
      );

      if (!existingSection || existingSection.length === 0) {
        await conn.query(`INSERT INTO section (section_id) VALUES (?)`, [
          section_id,
        ]);
      }

      const [existingProgramCourse] = await conn.query(
        `SELECT 1
         FROM program_course
         WHERE program_id = ? AND course_id = ? AND semester_id = ?`,
        [program_id, course_id, semester_id]
      );

      if (!existingProgramCourse || existingProgramCourse.length === 0) {
        await conn.query(
          `INSERT INTO program_course (
             program_id, course_id, semester_id, year, section_id
           )
           VALUES (?, ?, ?, ?, ?)`,
          [program_id, course_id, semester_id, year, section_id]
        );
      } else {
        await conn.query(
          `UPDATE program_course
           SET year = ?, section_id = ?
           WHERE program_id = ? AND course_id = ? AND semester_id = ?`,
          [year, section_id, program_id, course_id, semester_id]
        );
      }
    }

    conn.release();
    res.status(201).json({ message: "All courses uploaded successfully!" });
  } catch (err) {
    console.error("Error adding courses from Excel:", err);
    res.status(500).json({
      message: "Database error occurred while processing Excel data.",
      error: err.message,
    });
  }
}

export {
  getAll,
  createOne,
  getOneById,
  updateOneById,
  deleteOneById,
  getManyByFilter,
  importCoursesFromExcel,
};
