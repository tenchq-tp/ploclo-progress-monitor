import express from "express";
const router = express.Router();
import pool from "../utils/db.js";

router.get("/", async (req, res) => {
  let conn;
  try {
    const { program_id, course_id, semester_id, year } = req.query;

    // Validate required parameters
    if (!program_id || !course_id || !semester_id || !year) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters",
      });
    }

    // Get a connection from the pool
    conn = await pool.getConnection();

    // SQL query to fetch PLO-CLO mappings without considering section
    const query = `
      SELECT pc.PLO_CLO_id, pc.PLO_id, pc.CLO_id, pc.weight, pc.year, pc.semester_id,
             p.PLO_code, p.PLO_name, p.PLO_engname,
             c.CLO_code, c.CLO_name, c.CLO_engname
      FROM plo_clo pc
      JOIN plo p ON pc.PLO_id = p.PLO_id
      JOIN clo c ON pc.CLO_id = c.CLO_id
      WHERE pc.course_id = ?
      AND pc.semester_id = ?
      AND pc.year = ?
      AND EXISTS (
        SELECT 1 FROM program_plo pp
        WHERE pp.program_id = ?
        AND pp.plo_id = pc.PLO_id
      )
      ORDER BY p.PLO_code, c.CLO_code
    `;

    // Execute the query with parameters
    const mappings = await conn.query(query, [
      course_id,
      semester_id,
      year,
      program_id,
    ]);

    res.json({
      success: true,
      data: mappings,
    });
  } catch (error) {
    console.error("Error fetching PLO-CLO mappings:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred fetching PLO-CLO mappings",
      error: error.message,
    });
  } finally {
    // Release connection when done
    if (conn) conn.release();
  }
});

// Export the router
export default router;
