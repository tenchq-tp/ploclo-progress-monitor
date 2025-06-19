import express from "express";
const router = express.Router();
import {
  cloMapping,
  createOne,
  deleteOne,
  getAll,
  getByCourseId,
  getOne,
  patchOne,
  updateOne,
  uploadExcel,
} from "../controllers/clo.controller.js";

router.get("/", getAll);
router.get("/a/:id", getOne);
router.get("/course", getByCourseId);
router.post("/", createOne);
router.put("/:id", updateOne);
router.patch("/:id", patchOne);
router.delete("/:id", deleteOne);
router.post("/upload", uploadExcel);
router.get("/clo-mapping/:course_id", cloMapping);

export default router;
