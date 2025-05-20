import pool from "../utils/db.js";

export async function getPloScoresByStudent(req, res) {
  const { student_id } = req.params;
  const year = req.query.year || 2025; // ใส่ default ปีไว้ ถ้าไม่ส่ง query string

  try {
    const rows = await pool.query(
      `
      WITH student_clo_score AS (
        SELECT
            astu.student_id,
            ac.clo_id,
            SUM((ag.score / a.total_score) * ac.weight * a.total_score) AS clo_score
        FROM
            assignments a
        JOIN assignment_clo ac ON a.assignment_id = ac.assignment_id
        JOIN assignment_student astu ON a.assignment_id = astu.assignment_id
        JOIN assignment_grade ag ON ag.assignment_student_id = astu.id
        WHERE
            astu.student_id = ?
        GROUP BY
            astu.student_id, ac.clo_id
      )
      SELECT
          p.PLO_id,
          SUM(sc.clo_score * (p.weight / 100)) AS plo_score
      FROM
          student_clo_score sc
      JOIN
          plo_clo p ON sc.clo_id = p.CLO_id
      WHERE
          p.year = ?
      GROUP BY
          p.PLO_id
      ORDER BY
          p.PLO_id
      `,
      [student_id, year]
    );

    if (!rows || rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No PLO scores found for this student." });
    }

    res.status(200).json(rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({
      message: "Database error",
      error: err.message || err,
    });
  }
}

export const getCloScoresByStudent = async (req, res) => {
  const { student_id } = req.params;

  try {
    const rows = await pool.query(
      `
      SELECT
          astu.student_id,
          ac.clo_id,
          SUM((ag.score / a.total_score) * ac.weight * a.total_score) AS total_score_clo
      FROM
          assignments a
      JOIN
          assignment_clo ac ON a.assignment_id = ac.assignment_id
      JOIN
          assignment_student astu ON a.assignment_id = astu.assignment_id
      JOIN
          assignment_grade ag ON ag.assignment_student_id = astu.id
      WHERE
          astu.student_id = ?
      GROUP BY
          astu.student_id,
          ac.clo_id
      ORDER BY
          ac.clo_id
      `,
      [student_id]
    );

    if (!rows || rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No CLO scores found for this student." });
    }

    res.status(200).json(rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({
      message: "Database error",
      error: err.message || err,
    });
  }
};

export const getCloAndPloScoresByStudent = async (req, res) => {
  const { student_id } = req.params;
  const year = req.query.year || 2025;

  try {
    // ----------------------------
    // 1. ดึงคะแนน CLO ของนักเรียน
    // ----------------------------
    const cloRows = await pool.query(
      `
      SELECT 
          astu.student_id,
          ac.clo_id,
          SUM((ag.score / a.total_score) * ac.weight * a.total_score) AS total_score_clo
      FROM 
          assignments a
      JOIN 
          assignment_clo ac ON a.assignment_id = ac.assignment_id
      JOIN 
          assignment_student astu ON a.assignment_id = astu.assignment_id
      JOIN 
          assignment_grade ag ON ag.assignment_student_id = astu.id
      WHERE 
          astu.student_id = ?
      GROUP BY 
          astu.student_id,
          ac.clo_id
      ORDER BY 
          ac.clo_id
      `,
      [student_id]
    );

    // สร้าง temp map เพื่อใช้กับ PLO query ด้านล่าง
    const cloScoreMap = {};
    cloRows.forEach((row) => {
      cloScoreMap[row.clo_id] = row.total_score_clo;
    });

    // ----------------------------
    // 2. ดึงคะแนน PLO ที่ใช้ weight จาก plo_clo
    // ----------------------------
    const ploRows = await pool.query(
      `
      SELECT 
          p.PLO_id,
          sc.clo_id,
          p.weight
      FROM 
          plo_clo p
      JOIN (
        SELECT 
            ac.clo_id,
            SUM((ag.score / a.total_score) * ac.weight * a.total_score) AS clo_score
        FROM 
            assignments a
        JOIN assignment_clo ac ON a.assignment_id = ac.assignment_id
        JOIN assignment_student astu ON a.assignment_id = astu.assignment_id
        JOIN assignment_grade ag ON ag.assignment_student_id = astu.id
        WHERE 
            astu.student_id = ?
        GROUP BY 
            ac.clo_id
      ) sc ON sc.clo_id = p.CLO_id
      WHERE 
          p.year = ?
      `,
      [student_id, year]
    );

    // คำนวณ PLO score จาก clo score * weight
    const ploScoreMap = {};
    ploRows.forEach((row) => {
      const cloScore = cloScoreMap[row.clo_id] || 0;
      const contribution = (cloScore * row.weight) / 100;
      if (!ploScoreMap[row.PLO_id]) {
        ploScoreMap[row.PLO_id] = 0;
      }
      ploScoreMap[row.PLO_id] += contribution;
    });

    const ploScores = Object.entries(ploScoreMap).map(([plo_id, score]) => ({
      PLO_id: Number(plo_id),
      plo_score: score,
    }));

    // ----------------------------
    // ส่งผลลัพธ์กลับ
    // ----------------------------
    res.status(200).json({
      student_id,
      year: Number(year),
      clo_scores: cloRows,
      plo_scores: ploScores,
    });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({
      message: "Database error",
      error: err.message || err,
    });
  }
};

export const getAvgPloScoresForAllStudents = async (req, res) => {
  try {
    const rows = await pool.query(
      `
      SELECT
          p.PLO_id,
          p.PLO_name,
          AVG(student_plo_score) AS avg_plo_score
      FROM
          (
              -- คำนวณคะแนนของนักเรียนแต่ละคนในแต่ละ PLO
              SELECT
                  ag.assignment_student_id,
                  pc.PLO_id,
                  SUM(
                      (ag.score / a.total_score) -- สัดส่วนคะแนนงานที่นักเรียนได้
                      * ac.weight               -- น้ำหนัก CLO ต่อ assignment
                      * pc.weight               -- น้ำหนัก CLO ต่อ PLO
                  ) AS student_plo_score
              FROM assignment_grade ag
              INNER JOIN assignment_student ast ON ag.assignment_student_id = ast.id
              INNER JOIN assignments a ON ast.assignment_id = a.assignment_id
              INNER JOIN assignment_clo ac ON a.assignment_id = ac.assignment_id
              INNER JOIN plo_clo pc ON ac.clo_id = pc.CLO_id
                  AND pc.year = YEAR(CURDATE()) -- ปีปัจจุบัน (หรือเปลี่ยนเป็น ? ได้ถ้าจะรับจาก req.query)
              GROUP BY ag.assignment_student_id, pc.PLO_id
          ) AS student_plo_scores
      INNER JOIN plo p ON student_plo_scores.PLO_id = p.PLO_id
      GROUP BY p.PLO_id, p.PLO_name
      ORDER BY p.PLO_id
      `
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "No average PLO scores found." });
    }

    res.status(200).json(rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({
      message: "Database error",
      error: err.message || err,
    });
  }
};

export const getCloScoresByStudentAndCourse = async (req, res) => {
  const { student_id } = req.params;
  const { course_id } = req.query;

  if (!course_id) {
    return res.status(400).json({ message: "Missing course_id in query." });
  }

  try {
    const rows = await pool.query(
      `
      SELECT
          clo.CLO_id,
          clo.CLO_code,
          clo.CLO_name,
          SUM(
              (ag.score / a.total_score) * ac.weight
          ) AS clo_score
      FROM assignment_grade ag
      JOIN assignment_student ast ON ag.assignment_student_id = ast.id
      JOIN assignments a ON ast.assignment_id = a.assignment_id
      JOIN assignment_clo ac ON a.assignment_id = ac.assignment_id
      JOIN clo ON ac.clo_id = clo.CLO_id
      JOIN program_course pc ON a.program_course_id = pc.program_course_id
      WHERE ast.student_id = ?
        AND pc.course_id = ?
      GROUP BY clo.CLO_id, clo.CLO_code, clo.CLO_name
      ORDER BY clo.CLO_id
      `,
      [student_id, course_id]
    );

    if (!rows || rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No CLO scores found for this student and course." });
    }

    res.status(200).json(rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({
      message: "Database error",
      error: err.message || err,
    });
  }
};

export const getAverageCloScoresByCourse = async (req, res) => {
  const { course_id } = req.query;

  if (!course_id) {
    return res.status(400).json({ message: "Missing course_id in query." });
  }

  try {
    const rows = await pool.query(
      `
      SELECT 
          clo.CLO_id,
          clo.CLO_code,
          clo.CLO_name,
          AVG(student_clo_score.total_clo_score) AS average_clo_score
      FROM (
          SELECT
              ast.student_id,
              clo.CLO_id,
              SUM((ag.score / a.total_score) * ac.weight) AS total_clo_score
          FROM assignment_grade ag
          JOIN assignment_student ast ON ag.assignment_student_id = ast.id
          JOIN assignments a ON ast.assignment_id = a.assignment_id
          JOIN assignment_clo ac ON a.assignment_id = ac.assignment_id
          JOIN clo ON ac.clo_id = clo.CLO_id
          JOIN program_course pc ON a.program_course_id = pc.program_course_id
          WHERE pc.course_id = ?
          GROUP BY ast.student_id, clo.CLO_id
      ) AS student_clo_score
      JOIN clo ON student_clo_score.CLO_id = clo.CLO_id
      GROUP BY clo.CLO_id, clo.CLO_code, clo.CLO_name
      ORDER BY clo.CLO_id
      `,
      [course_id]
    );

    if (!rows || rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No average CLO scores found for this course." });
    }

    res.status(200).json(rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({
      message: "Database error",
      error: err.message || err,
    });
  }
};
