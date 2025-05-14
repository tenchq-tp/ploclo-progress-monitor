import express from "express";
import {
  getAll,
  getOneById,
  importScoreFromExcel,
  addStudent,
  getAssignmentClo,
  addAssignment,
  getAllByCourse,
  getScoreOneById,
  updateScoreOne,
  getManyCourseByCourseId,
  addClo,
  deleteOneById,
  removeStudent,
  updateAssignment,
} from "../controllers/assignment.controller.js";
const router = express.Router();

router.get("/:assignment_id", getOneById);
router.get("/", getAll);
router.get("/course", getAllByCourse);
router.get("/clo", getAssignmentClo);
router.get("/score/:id", getScoreOneById);
router.get("/by-course", getManyCourseByCourseId);
router.post("/excel-score", importScoreFromExcel);
router.post("/add-student", addStudent);
router.post("/", addAssignment);
router.post("/score", updateScoreOne);
router.post("/clo", addClo);
router.delete("/:id", deleteOneById);
router.delete("/student", removeStudent);
router.put("/:id", updateAssignment);

router.post("/save_assignment_clo", async (req, res) => {
  try {
    const { data } = req.body;
    // ข้อมูลที่ส่งมา: [{ assignment_id, item: { clo_id }, score, weight }]

    // เรียกใช้ controller
    addClo(req, res);
  } catch (error) {
    console.error("Error saving assignment CLO:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
      error: error.message,
    });
  }
});

router.post("/save_scores", async (req, res) => {
  try {
    const { scores } = req.body;

    if (!scores || !Array.isArray(scores) || scores.length === 0) {
      return res.status(400).json({
        success: false,
        message: "ไม่มีข้อมูลคะแนนที่จะบันทึก",
      });
    }

    // คำสั่ง SQL จะใช้ INSERT ... ON DUPLICATE KEY UPDATE
    // นำไปใส่ใน controller
    const result = {
      success: true,
      message: `บันทึกคะแนนสำเร็จ ${scores.length} รายการ`,
    };

    res.json(result);
  } catch (error) {
    console.error("Error saving scores:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการบันทึกคะแนน",
      error: error.message,
    });
  }
});

// เพิ่ม endpoint สำหรับดึงข้อมูลรายละเอียด Assignment
router.get("/get_assignment_detail/:id", async (req, res) => {
  try {
    getOneById(req, res);
  } catch (error) {
    console.error("Error fetching assignment detail:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูล Assignment",
      error: error.message,
    });
  }
});

// เพิ่ม endpoint สำหรับเพิ่มนักเรียนเข้า Assignment
router.post("/add_students_to_assignment", async (req, res) => {
  try {
    addStudent(req, res);
  } catch (error) {
    console.error("Error adding students:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการเพิ่มนักเรียน",
      error: error.message,
    });
  }
});

export default router;
