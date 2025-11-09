import express from "express";
import {
  registerUser,
  loginStudent,
  loginParent,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  resetStudentPin,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  deactivateUser,
  activateUser,
} from "../controllers/userController.js";
import { changeOwnPin } from "../controllers/authController.js";
import { protectUser, protectAdmin, studentOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// PUBLIC ROUTES (Authentication)
// ==========================================
router.post("/register", registerUser);
router.post("/login", loginUser); // Legacy endpoint - auto-detects role
router.post("/login/student", loginStudent); // Student login with admission number + PIN
router.post("/login/parent", loginParent); // Parent login with email + password
router.post("/reset-pin", resetStudentPin); // PIN reset for forgotten PINs

// ==========================================
// PROTECTED ROUTES (User only)
// ==========================================
router.get("/profile", protectUser, getUserProfile);
router.put("/profile", protectUser, updateUserProfile);
router.put("/change-password", protectUser, changeUserPassword);
router.put("/change-pin", protectUser, studentOnly, changeOwnPin); // Student changes their own PIN

// ==========================================
// ADMIN ROUTES (User management)
// ==========================================
router.get("/", protectAdmin, getAllUsers);
router.get("/:id", protectAdmin, getUserById);
router.put("/:id", protectAdmin, updateUser);
router.delete("/:id", protectAdmin, deleteUser);
router.patch("/:id/deactivate", protectAdmin, deactivateUser);
router.patch("/:id/activate", protectAdmin, activateUser);

export default router;
