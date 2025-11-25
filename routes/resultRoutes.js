import express from "express";
import { 
  uploadResult, 
  getStudentResult, 
  renderResultCard,
  viewAllResults  // ⭐ Add this import
} from "../controllers/resultController.js";
import { protect, publicOrProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * =========================================================
 * OPTION 1: FULLY PROTECTED (Recommended)
 * Only logged-in admins can upload and view results
 * =========================================================
 */
router.post("/", protect, uploadResult);                      // Admin only: upload result
router.get("/view", protect, viewAllResults);                 // ⭐ NEW: View all results page
router.get("/card/:studentId", protect, renderResultCard);    // Admin only: render EJS report card
router.get("/:studentId", protect, getStudentResult);         // Admin only: get student JSON result

/**
 * =========================================================
 * OPTION 2: MIXED ACCESS (Upload protected, viewing public)
 * Uncomment to use instead of OPTION 1
 * =========================================================
// router.post("/", protect, uploadResult);                   // Admin only: upload
// router.get("/view", viewAllResults);                       // Public: view all results
// router.get("/card/:studentId", renderResultCard);          // Public: render report card
// router.get("/:studentId", getStudentResult);               // Public: get JSON result
*/

/**
 * =========================================================
 * OPTION 3: PUBLIC WITH OPTIONAL AUTH
 * Uncomment to allow public viewing but optional token validation
 * =========================================================
// router.post("/", protect, uploadResult);                          // Admin only: upload
// router.get("/view", publicOrProtect, viewAllResults);             // Public or Authenticated
// router.get("/:studentId", publicOrProtect, getStudentResult);     // Public or Authenticated
// router.get("/card/:studentId", publicOrProtect, renderResultCard); // Public or Authenticated
*/

export default router;
```

## Important: Route Order Matters! ⚠️

Notice I moved `/view` route **BEFORE** `/:studentId`. This is crucial because:
- `/view` is a **specific route**
- `/:studentId` is a **dynamic route** that catches anything

If `/:studentId` comes first, Express would treat "view" as a studentId and try to find a student with ID "view".

## 3. Access Your Page

Now you can access the results page at:
```
http://localhost:3000/api/results/view
