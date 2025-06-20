import express from "express";
const router = express.Router();
import {
  getCLOSummaryReport,
  getPLOSummaryReport,
  getCLOStatistics,
  getPLOStatistics
} from "../controllers/dashboard.controller.js";


router.get("/clo-summary", getCLOSummaryReport);    // summary ทั้งหมด (ทุกคน ทุก CLO)
router.get("/plo-summary", getPLOSummaryReport);    // summary ทั้งหมด (ทุกคน ทุก PLO)
router.get("/clo-statistics", getCLOStatistics);
router.get("/plo-statistics", getPLOStatistics);
export default router;
