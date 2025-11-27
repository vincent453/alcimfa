import express from "express";
import { uploadResult, getStudentResult, renderResultCard } from "../controllers/resultController.js";
import { protect, publicOrProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// OPTION 1: FULLY PROTECTED (Recommended)
// Only logged-in admins can access
// ==========================================
// router.post("/", protect, uploadResult);              // ✅ Admin only
// router.get("/:studentId", protect, getStudentResult); // ✅ Admin only
// router.get("/card/:studentId", protect, renderResultCard); // ✅ Admin only


// ==========================================
// OPTION 2: MIXED ACCESS
// Upload protected, viewing public
// ==========================================
router.post("/", protect, uploadResult);
router.get("/card/:studentId", renderResultCard);  // Specific route FIRST
router.get("/:studentId", getStudentResult);       // Dynamic route LAST

// ==========================================
// OPTION 3: PUBLIC WITH OPTIONAL AUTH
// Public access, but validates token if provided
// ==========================================
// router.post("/", protect, uploadResult);                      // ✅ Admin only
// router.get("/:studentId", publicOrProtect, getStudentResult); // 🔓 Public or Authenticated
// router.get("/card/:studentId", publicOrProtect, renderResultCard); // 🔓 Public or Authenticated

export default router;
