import express from "express";
import { 
  uploadResult, 
  getStudentResult, 
  renderResultCard,
  viewAllResults
} from "../controllers/resultController.js";
import { protect, publicOrProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * =========================================================
 * OPTION 1: FULLY PROTECTED (Recommended)
 * Only logged-in admins can upload and view results
 * =========================================================
 */
router.post("/", protect, uploadResult);
router.get("/view", protect, viewAllResults);
router.get("/card/:studentId", protect, renderResultCard);
router.get("/:studentId", protect, getStudentResult);

/**
 * =========================================================
 * OPTION 2: MIXED ACCESS (Upload protected, viewing public)
 * Uncomment to use instead of OPTION 1
 * =========================================================
// router.post("/", protect, uploadResult);
// router.get("/view", viewAllResults);
// router.get("/card/:studentId", renderResultCard);
// router.get("/:studentId", getStudentResult);
*/

/**
 * =========================================================
 * OPTION 3: PUBLIC WITH OPTIONAL AUTH
 * Uncomment to allow public viewing but optional token validation
 * =========================================================
// router.post("/", protect, uploadResult);
// router.get("/view", publicOrProtect, viewAllResults);
// router.get("/:studentId", publicOrProtect, getStudentResult);
// router.get("/card/:studentId", publicOrProtect, renderResultCard);
*/

export default router;
