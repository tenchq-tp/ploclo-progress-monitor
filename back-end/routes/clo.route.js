import express from "express";
import {
  getAll,
  getMapping,
  updateMapping,
  createMapping,
  createOne,
  deleteOneById,
  updateById,
} from "../controllers/clo.controller.js";
const router = express.Router();

router.get("/", getAll);
router.put("/:clo_id", updateById);
router.get("/mapping", getMapping);
router.patch("/mapping", updateMapping);
router.post("/mapping", createMapping);
router.post("/", createOne);
router.delete("/:clo_id", deleteOneById);

export default router;
