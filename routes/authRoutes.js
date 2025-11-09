import express from "express";
import {
  loginAdmin,
  logoutAdmin,
  getAdminProfile,
  updateAdminProfile,
  changePassword,
  generateStudentPin,
  resetStudentPin,
  setCustomStudentPin,
  bulkGeneratePins,
  checkPinStatus,
  getPinReport,
} from "../controllers/adminController.js";
import { protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// AUTH ROUTES
// ==========================================
router.post("/login", loginAdmin);
router.post("/logout", protectAdmin, logoutAdmin);

// ==========================================
// ADMIN PROFILE ROUTES
// ==========================================
router.get("/profile", protectAdmin, getAdminProfile);
router.put("/profile", protectAdmin, updateAdminProfile);
router.put("/change-password", protectAdmin, changePassword);

// ==========================================
// STUDENT PIN MANAGEMENT ROUTES
// ==========================================

// Bulk operations
router.post("/students/bulk-generate-pins", protectAdmin, bulkGeneratePins);
router.get("/students/pin-report", protectAdmin, getPinReport);

// Individual student PIN operations
router.get("/students/:id/pin-status", protectAdmin, checkPinStatus);
router.post("/students/:id/generate-pin", protectAdmin, generateStudentPin);
router.put("/students/:id/reset-pin", protectAdmin, resetStudentPin);
router.put("/students/:id/set-pin", protectAdmin, setCustomStudentPin);

export default router;
