import pool from "../utils/db.js";

async function addProgramCourseCLO(req, res) {
  const {
    program_id,
    course_id,
    semester_id,
    year,
    CLO_code,
    CLO_name,
    CLO_engname,
  } = req.body;

  if (
    !program_id ||
    !course_id ||
    !semester_id ||
    !year ||
    !CLO_code ||
    !CLO_name ||
    !CLO_engname
  ) {
    return res.status(400).json({
      message:
        "Missing required fields. Please select all necessary options and provide CLO details.",
    });
  }

  try {
    const conn = await pool.getConnection();

    // เพิ่ม CLO ใหม่
    const insertCLOQuery = `
            INSERT INTO clo (CLO_code, CLO_name, CLO_engname, timestamp)
            VALUES (?, ?, ?, NOW())
        `;
    const cloResult = await conn.query(insertCLOQuery, [
      CLO_code,
      CLO_name,
      CLO_engname,
    ]);

    // ดึง clo_id ที่เพิ่มมาใหม่
    const clo_id = cloResult.insertId;

    // เพิ่มข้อมูลลงในตาราง course_clo
    const insertCourseCLOQuery = `
            INSERT INTO course_clo (course_id, semester_id, section_id, year, clo_id)
            VALUES (?, ?, 1, ?, ?)
        `;
    await conn.query(insertCourseCLOQuery, [
      course_id,
      semester_id,
      year,
      clo_id,
    ]);

    res
      .status(201)
      .json({ message: "CLO added successfully!", clo_id: Number(clo_id) }); // แปลง BigInt เป็น Number
    conn.release();
  } catch (err) {
    console.error("Error adding CLO:", err);
    res.status(500).json({ message: "Database error" });
  }
} // สำหรับทีละรายการ

async function importProgramCourseCLOFromExcel(req, res) {
  const cloDataArray = req.body;
  
  if (!Array.isArray(cloDataArray) || cloDataArray.length === 0) {
    return res.status(400).json({
      message: "No CLO data provided. Please upload valid Excel data.",
    });
  }

  let conn;
  
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction(); // เพิ่ม transaction

    // เปลี่ยนจาก semesterCloCodes เป็น courseCloCodes
    const courseCloCodes = new Map();
    
    for (let i = 0; i < cloDataArray.length; i++) {
      const cloData = cloDataArray[i];
      
      const { course_id, semester_id, year, CLO_code, CLO_name, CLO_engname } = cloData;

      // ตรวจสอบว่าข้อมูลครบถ้วน
      if (!course_id || !semester_id || !year || !CLO_code || !CLO_name || !CLO_engname) {
        await conn.rollback();
        return res.status(400).json({
          message: `Missing required fields in row ${i + 1}. Please ensure all fields are complete.`,
          row_data: cloData
        });
      }

      // **ตรวจสอบว่า course_id มีอยู่จริงในตาราง course**
      try {
        const courseQuery = `SELECT course_id FROM course WHERE course_id = ?`;
        const courseResult = await conn.query(courseQuery, [course_id]);
        
        if (!courseResult || courseResult.length === 0) {
          await conn.rollback();
          return res.status(400).json({
            message: `Course ID not found: ${course_id} in row ${i + 1}`,
            suggestion: "Please check that the course_id exists in the course table"
          });
        }
        
      } catch (courseError) {
        await conn.rollback();
        return res.status(400).json({
          message: `Error validating course: ${course_id}`,
          error: courseError.message
        });
      }

      // **เพิ่ม: ตรวจสอบว่า course_id, semester_id, year มีอยู่ใน program_course**
      try {
        const programCourseQuery = `
          SELECT section_id, program_id FROM program_course 
          WHERE course_id = ? AND semester_id = ? AND year = ?
        `;
        const programCourseResult = await conn.query(programCourseQuery, [
          parseInt(course_id), 
          semester_id, 
          year
        ]);
        
        if (!programCourseResult || programCourseResult.length === 0) {
          await conn.rollback();
          return res.status(400).json({
            message: `Course not found in program: course_id ${course_id}, semester ${semester_id}, year ${year} in row ${i + 1}`,
            suggestion: "Please ensure the course is registered in the selected program for this semester and year"
          });
        }
        
        // เก็บ section_id และ program_id สำหรับใช้ในการ insert
        cloData.section_id = programCourseResult[0].section_id;
        cloData.program_id = programCourseResult[0].program_id;
        
      } catch (programCourseError) {
        await conn.rollback();
        return res.status(400).json({
          message: `Error validating program course: course_id ${course_id} in row ${i + 1}`,
          error: programCourseError.message
        });
      }

      // **แก้ไข: ตรวจสอบความซ้ำภายใน batch แยกตาม course_id**
      const courseKey = `${course_id}_${semester_id}_${year}`;
      
      if (!courseCloCodes.has(courseKey)) {
        courseCloCodes.set(courseKey, new Set());
      }
      
      if (courseCloCodes.get(courseKey).has(CLO_code)) {
        await conn.rollback();
        return res.status(400).json({
          message: `Duplicate CLO_code "${CLO_code}" found in batch for course ${course_id}, semester ${semester_id}, year ${year}`,
        });
      }
      
      courseCloCodes.get(courseKey).add(CLO_code);
    }
    
    // **แก้ไข: ตรวจสอบ duplicate ตาม course_id แยกกัน**
    for (const [courseKey, codes] of courseCloCodes) {
      const [course_id, semester_id, year] = courseKey.split('_');
      const codesArray = Array.from(codes);
      const placeholders = codesArray.map(() => '?').join(', ');
      
      const duplicateCheck = await conn.query(`
        SELECT c.CLO_code 
        FROM clo c
        INNER JOIN course_clo cc ON c.clo_id = cc.clo_id
        WHERE c.CLO_code IN (${placeholders}) 
          AND cc.course_id = ? 
          AND cc.semester_id = ? 
          AND cc.year = ?
      `, [...codesArray, parseInt(course_id), semester_id, year]);

      if (duplicateCheck && duplicateCheck.length > 0) {
        const duplicateCodes = duplicateCheck.map(row => row.CLO_code);
        await conn.rollback();
        return res.status(400).json({
          message: `CLO codes already exist for course ${course_id}, semester ${semester_id}, year ${year}: ${duplicateCodes.join(', ')}`,
        });
      }
    }
    
    // **แก้ไข: เพิ่ม logic การ reuse CLO ที่มีข้อมูลเหมือนกัน**
    const insertedRecords = [];
    const reusedRecords = [];
    
    for (let i = 0; i < cloDataArray.length; i++) {
      const cloData = cloDataArray[i];
      const { course_id, semester_id, year, CLO_code, CLO_name, CLO_engname, section_id } = cloData;

      let clo_id;
      
      try {
        // **ตรวจสอบว่ามี CLO ที่มีข้อมูลเหมือนกันหมดหรือไม่**
        const existingCLOQuery = `
          SELECT clo_id FROM clo 
          WHERE CLO_code = ? AND CLO_name = ? AND CLO_engname = ?
          LIMIT 1
        `;
        const existingCLO = await conn.query(existingCLOQuery, [CLO_code, CLO_name, CLO_engname]);
        
        if (existingCLO && existingCLO.length > 0) {
          // **ใช้ CLO ที่มีอยู่แล้ว**
          clo_id = existingCLO[0].clo_id;
          
          reusedRecords.push({
            CLO_code,
            CLO_name,
            clo_id,
            course_id,
            reason: 'CLO already exists, reused existing record'
          });
          
        } else {
          // **เพิ่ม CLO ใหม่**
          const insertCLOQuery = `
            INSERT INTO clo (CLO_code, CLO_name, CLO_engname, timestamp)
            VALUES (?, ?, ?, NOW())
          `;
          const cloResult = await conn.query(insertCLOQuery, [
            CLO_code,
            CLO_name,
            CLO_engname,
          ]);

          clo_id = cloResult.insertId;
          
          insertedRecords.push({
            CLO_code,
            CLO_name,
            clo_id,
            course_id,
            type: 'new_clo'
          });
        }
        
        // **เพิ่มความสัมพันธ์ใน course_clo (ทำเสมอ)**
        const insertCourseCLOQuery = `
          INSERT INTO course_clo (course_id, semester_id, year, clo_id, section_id)
          VALUES (?, ?, ?, ?, ?)
        `;
        await conn.query(insertCourseCLOQuery, [
          parseInt(course_id),
          semester_id,
          year,
          clo_id,
          section_id
        ]);

        
      } catch (insertError) {
        await conn.rollback();
        return res.status(500).json({
          message: `Error processing CLO at row ${i + 1}: ${CLO_code}`,
          error: process.env.NODE_ENV === 'development' ? insertError.message : undefined
        });
      }
    }

    // **Commit transaction**
    await conn.commit();
    
    res.status(201).json({ 
      message: "All CLOs added successfully!",
      summary: {
        total_processed: cloDataArray.length,
        new_clos_created: insertedRecords.length,
        existing_clos_reused: reusedRecords.length,
        courses_processed: [...new Set(cloDataArray.map(item => item.course_id))],
        sections_involved: [...new Set(cloDataArray.map(item => item.section_id))]
      },
      details: {
        new_records: insertedRecords,
        reused_records: reusedRecords
      }
    });

  } catch (err) {
    // **Rollback หากเกิดข้อผิดพลาด**
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);
      }
    }
    
    console.error("Import error:", err);
    res.status(500).json({
      message: "Database error occurred while processing Excel data.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

async function getSectionByCourse(req, res) {
  const { course_id, semester_id, year } = req.query;
  try {
    const query =
      "SELECT section_id FROM program_course WHERE year=? AND semester_id=? AND course_id=?;";

    const response = await pool.query(query, [year, semester_id, course_id]);
    console.log(response);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: "Database error occurred while get section.",
    });
  }
}

async function getCloMappingByFilter(req, res) {
  const { course_id, semester_id, year } = req.query;
  try {
    const query = `SELECT c.CLO_code, cc.weight, cc.course_clo_id FROM course_clo AS cc
LEFT JOIN clo AS c ON cc.clo_id=c.CLO_id
WHERE cc.course_id=? AND cc.year=? AND cc.semester_id=?`;
    const response = await pool.query(query, [course_id, year, semester_id]);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: "Database error while fetch clo mapping",
    });
  }
}

async function updateWeightByCourse(req, res) {
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ message: "Invalid data" });
  }

  let caseStatements = "";
  let idPlaceholders = "";
  let values = [];

  for (let i = 0; i < updates.length; i++) {
    values.push(updates[i].id, updates[i].score);
    caseStatements += `WHEN ? THEN ? `;
    idPlaceholders += i === 0 ? "?" : ", ?";
  }
  for (let i = 0; i < updates.length; i++) {
    values.push(updates[i].id);
  }

  const query = `
    UPDATE course_clo
    SET weight = CASE course_clo_id
      ${caseStatements}
    END
    WHERE course_clo_id IN (${idPlaceholders})
  `;
  console.log(query);
  console.log(values);
  try {
    await pool.query(query, values);
    res.status(200).json({ message: "Scores updated successfully" });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

export {
  addProgramCourseCLO,
  importProgramCourseCLOFromExcel,
  getSectionByCourse,
  getCloMappingByFilter,
  updateWeightByCourse,
};