import express from "express";
import {
  addStudent,
  getStudents,
  updateStudent,
  deleteStudent,
} from "../controllers/studentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All student routes protected - only admins can manage students
router.post("/", protect, addStudent);
router.get("/", protect, getStudents);
router.put("/:id", protect, updateStudent);
router.delete("/:id", protect, deleteStudent);

export default router;