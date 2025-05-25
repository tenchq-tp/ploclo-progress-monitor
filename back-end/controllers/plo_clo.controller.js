import pool from "../utils/db.js";

async function getMany(req, res) {
  // console.log("\n\nReq -----> ", req);
  const { course_id, section_id, semester_id, year, program_id, clo_ids } =
    req.query;

  if (!course_id || !section_id || !semester_id || !year || !program_id) {
    return res.status(400).json({
      success: false,
      message:
        "Missing required parameters: course_id, section_id, semester_id, year, program_id",
    });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // แสดงคำสั่ง SQL ที่ใช้ในการดึงข้อมูล PLO-CLO mappings
    const query = `
            SELECT 
                plo_clo.PLO_CLO_id,
                plo_clo.year,
                plo_clo.weight,
                plo_clo.semester_id,
                plo_clo.course_id,
                plo_clo.section_id,
                plo_clo.PLO_id,
                plo_clo.CLO_id,
                plo.PLO_code,
                plo.PLO_name,
                plo.PLO_engname,
                clo.CLO_code,
                clo.CLO_name,
                clo.CLO_engname
            FROM 
                plo_clo
            JOIN 
                plo ON plo_clo.PLO_id = plo.PLO_id
            JOIN 
                clo ON plo_clo.CLO_id = clo.CLO_id
            JOIN
                program_plo pp ON plo.PLO_id = pp.plo_id 
            WHERE 
                plo_clo.course_id = ? 
                AND plo_clo.section_id = ? 
                AND plo_clo.semester_id = ? 
                AND plo_clo.year = ? 
                AND pp.program_id = ?
        `;

    console.log("Executing SQL Query:", query);
    console.log("Parameters:", [
      course_id,
      section_id,
      semester_id,
      year,
      program_id,
    ]);

    const result = await conn.query(query, [
      course_id,
      section_id,
      semester_id,
      year,
      program_id,
    ]);

    if (!result || (Array.isArray(result) && result.length === 0)) {
      console.log("No PLO-CLO mappings found");
      return res.status(200).json([]); // ส่ง array ว่างแทนที่จะส่ง 404
    }

    // แปลงข้อมูลให้เป็น array เสมอ
    const mappings = Array.isArray(result) ? result : [result];

    // แปลงค่า BigInt เป็น string ก่อนส่งกลับ
    const sanitizedMappings = mappings.map((mapping) => {
      const sanitizedMapping = {};

      // แปลงทุก property ที่เป็น BigInt เป็น string
      Object.keys(mapping).forEach((key) => {
        sanitizedMapping[key] =
          typeof mapping[key] === "bigint"
            ? mapping[key].toString()
            : mapping[key];
      });

      return sanitizedMapping;
    });

    return res.status(200).json(sanitizedMappings);
  } catch (err) {
    console.error("Error fetching PLO-CLO mappings:", err);
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  } finally {
    if (conn) conn.release();
  }
}

async function createOne(req, res) {
  console.log("Received PLO-CLO mapping request body type:", typeof req.body);
  console.log("Is array?", Array.isArray(req.body));

  // แสดงข้อมูลโดยแปลง BigInt เป็น string ก่อน
  const safeStringify = (obj) => {
    return JSON.stringify(obj, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    );
  };

  console.log("Received PLO-CLO mapping request:", safeStringify(req.body));

  // ตรวจสอบและแปลงข้อมูลเป็น array
  let mappingsArray = [];

  // กรณีส่งเป็น array
  if (Array.isArray(req.body)) {
    mappingsArray = req.body;
  }
  // กรณีส่งเป็น object ที่มี scores เป็น array
  else if (req.body.scores && Array.isArray(req.body.scores)) {
    mappingsArray = req.body.scores;
  }
  // กรณีส่งเป็น object เดี่ยว
  else {
    mappingsArray = [req.body];
  }

  // ถ้าไม่มีข้อมูล
  if (mappingsArray.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No mapping data provided",
    });
  }

  console.log(`Processing ${mappingsArray.length} mappings`);

  // ตรวจสอบฟิลด์ที่จำเป็น
  const requiredFields = [
    "PLO_id",
    "CLO_id",
    "course_id",
    "section_id",
    "semester_id",
    "year",
    "weight",
  ];

  // สำหรับเก็บ mapping ที่มีปัญหา
  const invalidMappings = [];

  // สำหรับเก็บ mapping ที่ถูกต้อง
  const validMappings = [];

  // ตรวจสอบและเตรียมข้อมูล
  for (const mapping of mappingsArray) {
    // กรณีที่ข้อมูลอยู่ใน property 'data'
    const dataToCheck = mapping.data || mapping;

    // ตรวจสอบฟิลด์ที่จำเป็น
    const missingFields = requiredFields.filter(
      (field) => dataToCheck[field] === undefined
    );

    if (missingFields.length > 0) {
      invalidMappings.push({
        ...dataToCheck,
        missingFields: missingFields,
      });
      continue;
    }

    // ข้อมูลถูกต้อง ให้แปลงเป็นตัวเลข
    const processedData = {};
    requiredFields.forEach((field) => {
      processedData[field] =
        typeof dataToCheck[field] === "string"
          ? parseInt(dataToCheck[field], 10)
          : Number(dataToCheck[field]);
    });

    // ตรวจสอบว่าข้อมูลเป็นตัวเลขทั้งหมด
    const invalidFields = Object.entries(processedData)
      .filter(([key, value]) => isNaN(value))
      .map(([key]) => key);

    if (invalidFields.length > 0) {
      invalidMappings.push({
        ...dataToCheck,
        invalidFields: invalidFields,
      });
      continue;
    }

    // ข้อมูลถูกต้องทั้งหมด
    validMappings.push(processedData);
  }

  // ถ้าไม่มีข้อมูลที่ถูกต้อง
  if (validMappings.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No valid mappings found",
      invalidMappings: invalidMappings,
    });
  }

  try {
    const conn = await pool.getConnection();

    // เริ่ม transaction
    await conn.beginTransaction();

    // สำหรับเก็บผลลัพธ์
    const results = {
      inserted: [],
      updated: [],
      errors: [],
    };

    // ประมวลผลทีละ mapping
    for (const data of validMappings) {
      try {
        // ตรวจสอบว่ามีข้อมูลนี้อยู่แล้วหรือไม่
        const checkQuery = `
                    SELECT * FROM plo_clo 
                    WHERE course_id = ? AND section_id = ? AND semester_id = ? 
                    AND year = ? AND PLO_id = ? AND CLO_id = ?`;

        const existingMappings = await conn.query(checkQuery, [
          data.course_id,
          data.section_id,
          data.semester_id,
          data.year,
          data.PLO_id,
          data.CLO_id,
        ]);

        // แปลงให้เป็น array เสมอ
        const existingMapping = Array.isArray(existingMappings)
          ? existingMappings
          : existingMappings
            ? [existingMappings]
            : [];

        let result;

        if (existingMapping.length > 0) {
          // ถ้ามีข้อมูลอยู่แล้ว ให้อัพเดต
          const updateQuery = `
                        UPDATE plo_clo 
                        SET weight = ? 
                        WHERE course_id = ? AND section_id = ? AND semester_id = ? 
                        AND year = ? AND PLO_id = ? AND CLO_id = ?`;

          result = await conn.query(updateQuery, [
            data.weight,
            data.course_id,
            data.section_id,
            data.semester_id,
            data.year,
            data.PLO_id,
            data.CLO_id,
          ]);

          console.log(
            `Updated existing mapping: PLO=${data.PLO_id}, CLO=${data.CLO_id}, weight=${data.weight}`
          );

          results.updated.push({
            ...data,
            PLO_CLO_id: existingMapping[0].PLO_CLO_id,
          });
        } else {
          // ถ้ายังไม่มีข้อมูล ให้เพิ่มใหม่
          const insertQuery = `
                        INSERT INTO plo_clo (course_id, section_id, semester_id, year, PLO_id, CLO_id, weight)
                        VALUES (?, ?, ?, ?, ?, ?, ?)`;

          result = await conn.query(insertQuery, [
            data.course_id,
            data.section_id,
            data.semester_id,
            data.year,
            data.PLO_id,
            data.CLO_id,
            data.weight,
          ]);

          console.log(
            `Inserted new mapping: PLO=${data.PLO_id}, CLO=${data.CLO_id}, weight=${data.weight}`
          );

          // แปลง BigInt เป็น Number
          const insertId =
            typeof result.insertId === "bigint"
              ? Number(result.insertId)
              : result.insertId;

          results.inserted.push({
            ...data,
            PLO_CLO_id: insertId,
          });
        }
      } catch (mappingError) {
        console.error(
          `Error processing mapping:`,
          safeStringify(data),
          mappingError
        );
        results.errors.push({
          mapping: data,
          error: mappingError.message,
        });
      }
    }

    // ยืนยัน transaction
    await conn.commit();
    conn.release();

    // ตรวจสอบผลลัพธ์
    const successCount = results.inserted.length + results.updated.length;

    if (successCount > 0) {
      // เตรียมข้อมูลสำหรับส่งกลับ
      const response = {
        success: true,
        message: `Successfully processed ${successCount} PLO-CLO mappings`,
        details: {
          inserted: results.inserted.length,
          updated: results.updated.length,
          errors: results.errors.length,
        },
      };

      // ส่งข้อมูลกลับไปยัง client
      return res.status(200).json(response);
    } else {
      return res.status(500).json({
        success: false,
        message: "No mappings were processed successfully",
        errors: results.errors,
      });
    }
  } catch (error) {
    console.error("Error in PLO-CLO endpoint:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

async function updateOne(req, res) {
  const {
    program_id,
    year,
    semester_id,
    course_id,
    section_id,
    PLO_id,
    CLO_id,
    weight,
  } = req.body;

  // ตรวจสอบข้อมูลที่จำเป็น
  if (
    !program_id ||
    !year ||
    !semester_id ||
    !course_id ||
    !section_id ||
    !PLO_id ||
    !CLO_id ||
    weight === undefined
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Missing required fields: year, semester_id, course_id, section_id, PLO_id, CLO_id, or weight.",
    });
  }

  try {
    const conn = await pool.getConnection();

    // ตรวจสอบข้อมูลปัจจุบัน
    const queryCheck = `
            SELECT weight 
            FROM plo_clo
            WHERE year = ? AND semester_id = ? AND course_id = ? AND section_id = ? AND PLO_id = ? AND CLO_id = ?
        `;
    const [currentWeight] = await conn.query(queryCheck, [
      year,
      semester_id,
      course_id,
      section_id,
      PLO_id,
      CLO_id,
    ]);

    // หาก weight ไม่เปลี่ยนแปลงให้ส่งข้อความกลับ
    if (currentWeight.length > 0 && currentWeight[0].weight === weight) {
      conn.release();
      return res.status(400).json({
        success: false,
        message: "The weight value is already the same as the current one.",
      });
    }

    // อัปเดตเฉพาะค่า weight
    const queryUpdate = `
            UPDATE plo_clo
            SET weight = ?
            WHERE year = ? AND semester_id = ? AND course_id = ? AND section_id = ? AND PLO_id = ? AND CLO_id = ?
        `;
    const result = await conn.query(queryUpdate, [
      weight,
      year,
      semester_id,
      course_id,
      section_id,
      PLO_id,
      CLO_id,
    ]);

    conn.release();

    // แปลงค่า BigInt ให้เป็น String ก่อนที่จะส่งค่าผ่าน JSON
    const serializedResult = JSON.parse(
      JSON.stringify(result, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    res.json({
      success: true,
      message: "Weight updated successfully.",
      result: serializedResult,
    });
  } catch (error) {
    console.error("Error updating weight:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}

export { getMany, createOne, updateOne };
