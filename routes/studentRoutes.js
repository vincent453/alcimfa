import express from "express";
import {
  addStudent,
  getStudents,
  updateStudent,
  deleteStudent,
} from "../controllers/studentController.js";

import { protect } from "../middleware/authMiddleware.js";
import { upload, uploadToCloudinary } from '../config/cloudinary.js'; // ⭐ MULTER + CLOUDINARY

const router = express.Router();

// ⭐ Add Student (with profile photo)
router.post(
  "/",
  protect,
  addStudent
);

// ⭐ Get all students
router.get("/", protect, getStudents);

// ⭐ Update student (with profile photo replacement)
router.put(
  "/:id",
  protect,
  upload.single("profilePhoto"), // <-- allow updating profile photo
  updateStudent
);

// ⭐ Delete student
router.delete("/:id", protect, deleteStudent);

export default router;
