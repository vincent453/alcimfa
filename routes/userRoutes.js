import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  deactivateUser,
  activateUser,
} from "../controllers/userController.js";
import { protectUser, protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// PUBLIC ROUTES (No authentication required)
// ==========================================
router.post("/register", registerUser);
router.post("/login", loginUser);

// ==========================================
// USER ROUTES (User authentication required)
// ==========================================
router.get("/profile", protectUser, getUserProfile);
router.put("/profile", protectUser, updateUserProfile);
router.put("/change-password", protectUser, changeUserPassword);import express from "express";
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
import { changeOwnPin } from "../controllers/adminController.js";
import { protect, protectAdmin } from "../middleware/authMiddleware.js";

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
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.put("/change-password", protect, changeUserPassword);
router.put("/change-pin", protect, changeOwnPin); // Student changes their own PIN

// ==========================================
// ADMIN ROUTES (User management)
// ==========================================
router.get("/", protect, protectAdmin, getAllUsers);
router.get("/:id", protect, protectAdmin, getUserById);
router.put("/:id", protect, protectAdmin, updateUser);
router.delete("/:id", protect, protectAdmin, deleteUser);
router.patch("/:id/deactivate", protect, protectAdmin, deactivateUser);
router.patch("/:id/activate", protect, protectAdmin, activateUser);

export default router;

// ==========================================
// ADMIN ROUTES (Admin authentication required)
// ==========================================
router.get("/", protectAdmin, getAllUsers);
router.get("/:id", protectAdmin, getUserById);
router.put("/:id", protectAdmin, updateUser);
router.delete("/:id", protectAdmin, deleteUser);
router.patch("/:id/deactivate", protectAdmin, deactivateUser);
router.patch("/:id/activate", protectAdmin, activateUser);

export default router;
