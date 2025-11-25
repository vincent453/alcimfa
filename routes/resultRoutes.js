import express from "express";
import { 
  uploadResult, 
  getStudentResult, 
  renderResultCard,
  viewAllResults
} from "../controllers/resultController.js";
import { protect, publicOrProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, uploadResult);
router.get("/view", protect, viewAllResults);
router.get("/card/:studentId", protect, renderResultCard);
router.get("/:studentId", protect, getStudentResult);

export default router;
