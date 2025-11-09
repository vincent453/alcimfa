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

router.post("/login", loginUser);

// ==========================================
// USER ROUTES (User authentication required)
// ==========================================
router.get("/profile", protectUser, getUserProfile);
router.put("/profile", protectUser, updateUserProfile);
router.put("/change-password", protectUser, changeUserPassword);

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
