import express from "express";
const router = express.Router();
import {
  addProgramCourseCLO,
  importProgramCourseCLOFromExcel,
  getSectionByCourse,
  getCloMappingByFilter,
  updateWeightByCourse,
} from "../controllers/clo_mapping.controller.js";

router.post("/", addProgramCourseCLO);
router.post("/excel", importProgramCourseCLOFromExcel);
router.get("/", getSectionByCourse);
router.get("/weight", getCloMappingByFilter);
router.put("/weight", updateWeightByCourse);

export default router;
