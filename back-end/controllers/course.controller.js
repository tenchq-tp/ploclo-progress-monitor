import pool from "../utils/db.js";

async function getAll(req, res) {
  try {
    const conn = await pool.getConnection();
    const result = await conn.query("SELECT * FROM course");
    res.json(resultyFilter);
    conn.release();
  } catch (err) {
    console.error(err);
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

export { getAll, createOne, updateOneById, deleteOneById, getManyByFilter };
