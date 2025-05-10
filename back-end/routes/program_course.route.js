import express from "express";
const router = express.Router();
import {
  importExcel,
  getOneById,
  createOne,
  deleteOneById,
  updateOneByCourseId,
  getManyCourseDetail,
} from "../controllers/program_course.controller.js";

router.post("/excel", importExcel);
router.get("/", getOneById);
router.post("/", createOne);
router.delete("/", deleteOneById);
router.put("/:course_id", updateOneByCourseId);
router.get("/detail", getManyCourseDetail);

export default router;
