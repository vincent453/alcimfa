import express from "express";
import { uploadResult, getStudentResult, renderResultCard } from "../controllers/resultController.js";
import { protect, publicOrProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * =========================================================
 * OPTION 1: FULLY PROTECTED (Recommended)
 * Only logged-in admins can upload and view results
 * =========================================================
 */
router.post("/", protect, uploadResult);               // Admin only: upload result
router.get("/:studentId", protect, getStudentResult); // Admin only: get student JSON result
router.get("/card/:studentId", protect, renderResultCard); // Admin only: render EJS report card

/**
 * =========================================================
 * OPTION 2: MIXED ACCESS (Upload protected, viewing public)
 * Uncomment to use instead of OPTION 1
 * =========================================================
// router.post("/", protect, uploadResult);          // Admin only: upload
// router.get("/card/:studentId", renderResultCard);  // Public: render report card
// router.get("/:studentId", getStudentResult);       // Public: get JSON result
*/

/**
 * =========================================================
 * OPTION 3: PUBLIC WITH OPTIONAL AUTH
 * Uncomment to allow public viewing but optional token validation
 * =========================================================
// router.post("/", protect, uploadResult);                      // Admin only: upload
// router.get("/:studentId", publicOrProtect, getStudentResult); // Public or Authenticated
// router.get("/card/:studentId", publicOrProtect, renderResultCard); // Public or Authenticated
*/

export default router;
