import pool from "../utils/db.js";

async function getAll(req, res) {
  const query = `SELECT * FROM university LIMIT 10;`;

  try {
    const conn = await pool.getConnection();
    await conn.query("SET NAMES utf8mb4");
    const result = await conn.query(query);
    res.status(201).json({
      data: result,
      message: "Get data successfully.",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
}

async function insertOne(req, res) {
  const query = `INSERT INTO university(university_name_en, university_name_th)
VALUES ("Naresuan University","มหาวิทยาลัยนเรศวร");`;

  try {
    const conn = await pool.getConnection();
    const result = await conn.query(query);
    res.status(201).json({
      message: "insert successfully.",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
}

export { getAll, insertOne };
