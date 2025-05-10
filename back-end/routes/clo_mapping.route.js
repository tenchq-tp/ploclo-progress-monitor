import express from "express";
const router = express.Router();
import {
  addProgramCourseCLO,
  importProgramCourseCLOFromExcel,
} from "../controllers/clo_mapping.controller.js";

router.post("/", addProgramCourseCLO);
router.post("/excel", importProgramCourseCLOFromExcel);

export default router;
