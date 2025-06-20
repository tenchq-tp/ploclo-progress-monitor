import pool from "../utils/db.js";

// ✅ สรุปคะแนน CLO ของนักศึกษาในโปรแกรม (พร้อม min, max, avg)
export async function getCLOSummaryReport(req, res) {
  try {
    const conn = await pool.getConnection();
    const query = `
      SELECT 
        s.student_id,
        CONCAT(s.first_name, ' ', s.last_name) AS student_name,
        clo.CLO_code,
        SUM(ag.score * ac.weight / 100) AS clo_score
      FROM student s
      JOIN assignment_student astu ON s.student_id = astu.student_id
      JOIN assignment_grade ag ON ag.assignment_student_id = astu.id
      JOIN assignments a ON a.assignment_id = astu.assignment_id
      JOIN assignment_clo ac ON ac.assignment_id = a.assignment_id
      JOIN clo ON clo.CLO_id = ac.clo_id
      GROUP BY s.student_id, clo.CLO_code, s.first_name, s.last_name
      ORDER BY s.student_id, clo.CLO_code;
    `;
    const result = await conn.query(query);
    conn.release();
    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching CLO summary:", err);
    res.status(500).json({ message: "Error fetching CLO summary", error: err.message });
  }
}

// ✅ สรุปคะแนน PLO ของนักศึกษาในโปรแกรม (พร้อม min, max, avg)
export async function getPLOSummaryReport(req, res) {
  try {
    const conn = await pool.getConnection();
    const query = `
      SELECT 
        s.student_id,
        CONCAT(s.first_name, ' ', s.last_name) AS student_name,
        p.PLO_code,
        SUM(ag.score * ac.weight * (pc.weight / 100) / 100) AS plo_score
      FROM student s
      JOIN assignment_student astu ON s.student_id = astu.student_id
      JOIN assignment_grade ag ON ag.assignment_student_id = astu.id
      JOIN assignments a ON a.assignment_id = astu.assignment_id
      JOIN assignment_clo ac ON ac.assignment_id = a.assignment_id
      JOIN clo c ON c.CLO_id = ac.clo_id
      JOIN plo_clo pc ON pc.CLO_id = c.CLO_id
      JOIN program_plo pp ON pp.plo_id = pc.PLO_id
      JOIN plo p ON p.PLO_id = pp.plo_id
      GROUP BY s.student_id, p.PLO_code, s.first_name, s.last_name
      ORDER BY s.student_id, p.PLO_code;
    `;
    const result = await conn.query(query);
    conn.release();
    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching PLO summary:", err);
    res.status(500).json({ message: "Error fetching PLO summary", error: err.message });
  }
}

export async function getCLOStatistics(req, res) {
  try {
    const conn = await pool.getConnection();
    const query = `
      SELECT 
        clo.CLO_code,
        MAX(clo_score) AS max_score,
        MIN(clo_score) AS min_score,
        AVG(clo_score) AS avg_score
      FROM (
        SELECT 
          s.student_id,
          clo.CLO_code,
          SUM(ag.score * ac.weight / 100) AS clo_score
        FROM student s
        JOIN assignment_student astu ON s.student_id = astu.student_id
        JOIN assignment_grade ag ON ag.assignment_student_id = astu.id
        JOIN assignments a ON a.assignment_id = astu.assignment_id
        JOIN assignment_clo ac ON ac.assignment_id = a.assignment_id
        JOIN clo ON clo.CLO_id = ac.clo_id
        GROUP BY s.student_id, clo.CLO_code
      ) AS student_clo
      JOIN clo ON clo.CLO_code = student_clo.CLO_code
      GROUP BY clo.CLO_code;
    `;
    const result = await conn.query(query);
    conn.release();
    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching CLO statistics:", err);
    res.status(500).json({ message: "Error fetching CLO statistics", error: err.message });
  }
}

// ✅ 4. สถิติ PLO: min, max, avg
export async function getPLOStatistics(req, res) {
  try {
    const conn = await pool.getConnection();
    const query = `
      SELECT 
        p.PLO_code,
        MAX(plo_score) AS max_score,
        MIN(plo_score) AS min_score,
        AVG(plo_score) AS avg_score
      FROM (
        SELECT 
          s.student_id,
          p.PLO_code,
          SUM(ag.score * ac.weight * (pc.weight / 100) / 100) AS plo_score
        FROM student s
        JOIN assignment_student astu ON s.student_id = astu.student_id
        JOIN assignment_grade ag ON ag.assignment_student_id = astu.id
        JOIN assignments a ON a.assignment_id = astu.assignment_id
        JOIN assignment_clo ac ON ac.assignment_id = a.assignment_id
        JOIN clo c ON c.CLO_id = ac.clo_id
        JOIN plo_clo pc ON pc.CLO_id = c.CLO_id
        JOIN program_plo pp ON pp.plo_id = pc.PLO_id
        JOIN plo p ON p.PLO_id = pp.plo_id
        GROUP BY s.student_id, p.PLO_code
      ) AS student_plo
      JOIN plo p ON p.PLO_code = student_plo.PLO_code
      GROUP BY p.PLO_code;
    `;
    const result = await conn.query(query);
    conn.release();
    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching PLO statistics:", err);
    res.status(500).json({ message: "Error fetching PLO statistics", error: err.message });
  }
}
