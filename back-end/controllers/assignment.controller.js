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
  } = req.body;
  try {
    const query = `
      INSERT INTO assignments (program_course_id, assignment_name, description, total_score, due_date, faculty_id, university_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await pool.query(query, [
      program_course_id,
      name,
      description,
      max_score,
      due_date,
      university_id,
      faculty_id,
    ]);
    res.status(200).json({ body: req.body });
  } catch (error) {
    res.status(500).json({ message: "Error while create assignment" });
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
// export async function getManyBy(req, res) {
//   const { program_course_id}

//   let query = `SELECT ass.assignment_id, ass.assignment_name, c.course_name, c.course_id, p.program_name, p.year, pc.semester_id, pc.section_id,  u.university_name_en
//     FROM assignments AS ass
//     LEFT JOIN program_course AS pc ON pc.program_course_id=ass.program_course_id
//     LEFT JOIN program AS p ON p.program_id=pc.program_id
//     LEFT JOIN course AS c ON pc.course_id=c.course_id
//     LEFT JOIN university AS u ON u.university_id=ass.university_id;`;
// }
