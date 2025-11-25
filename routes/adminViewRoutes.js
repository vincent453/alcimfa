import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { requireAdminAuth, redirectIfLoggedIn } from "../middleware/renderMiddleware.js";
import { upload, uploadToCloudinary } from "../config/cloudinary.js";

import Admin from "../models/adminModel.js";
import Student from "../models/studentModel.js";
import Result from "../models/resultModel.js";
import User from "../models/userModel.js";

const router = express.Router();

// ======================
// ADMIN LOGIN & LOGOUT
// ======================

// Show login page
router.get("/login", redirectIfLoggedIn, (req, res) => {
  res.render("admin/login", { error: null, title: "Admin Login" });
});

// Process login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new Error("Email and password are required");

    const admin = await Admin.findOne({ email });
    if (!admin) throw new Error("Invalid email or password");

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) throw new Error("Invalid email or password");

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    req.session.admin = { _id: admin._id, name: admin.name, email: admin.email };
    req.session.adminToken = token;

    res.redirect("/admin/dashboard");
  } catch (error) {
    res.render("admin/login", { error: error.message, title: "Admin Login" });
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) console.error("Session destroy error:", err);
    res.redirect("/admin/login");
  });
});

// ======================
// DASHBOARD
// ======================

router.get("/dashboard", requireAdminAuth, async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalResults = await Result.countDocuments();
    const recentStudents = await Student.find().sort({ createdAt: -1 }).limit(5);

    res.render("admin/dashboard", {
      title: "Admin Dashboard",
      admin: req.admin,
      adminToken: req.session.adminToken,
      stats: { totalStudents, totalUsers, totalResults },
      recentStudents
    });
  } catch (error) {
    res.render("error", { message: error.message });
  }
});

// ======================
// STUDENT MANAGEMENT
// ======================

// List students
router.get("/students", requireAdminAuth, async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.render("admin/students", { title: "Students Management", admin: req.admin, adminToken: req.session.adminToken, students, success: req.query.success, error: req.query.error });
  } catch (error) {
    res.render("error", { message: error.message });
  }
});

// Add student form
router.get("/students/add", requireAdminAuth, (req, res) => {
  res.render("admin/add-student", { title: "Add New Student", admin: req.admin, adminToken: req.session.adminToken, error: null });
});

// Add student process
router.post("/students/add", requireAdminAuth, upload.single('photo'), async (req, res) => {
  try {
    const { name, classLevel, session, regNumber, gender, dateOfBirth, address, parentName, parentPhone, parentEmail } = req.body;

    let profilePhotoUrl = null;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'students');
      profilePhotoUrl = result.secure_url;
    }

    const existing = await Student.findOne({ regNumber });
    if (existing) throw new Error("Registration number already exists");

    await Student.create({ name, classLevel, session, regNumber, gender, dateOfBirth, address, parentName, parentPhone, parentEmail, profilePhoto: profilePhotoUrl });
    res.redirect("/admin/students?success=Student added successfully");
  } catch (error) {
    res.render("admin/add-student", { title: "Add New Student", admin: req.admin, adminToken: req.session.adminToken, error: error.message });
  }
});

// Edit student form
router.get("/students/edit/:id", requireAdminAuth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.redirect("/admin/students?error=Student not found");
    res.render("admin/edit-student", { title: "Edit Student", admin: req.admin, adminToken: req.session.adminToken, student, error: null });
  } catch (error) {
    res.redirect("/admin/students?error=" + error.message);
  }
});

// Edit student process
router.post("/students/edit/:id", requireAdminAuth, async (req, res) => {
  try {
    const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.redirect("/admin/students?error=Student not found");
    res.redirect("/admin/students?success=Student updated successfully");
  } catch (error) {
    res.redirect("/admin/students?error=" + error.message);
  }
});

// Delete student
router.post("/students/delete/:id", requireAdminAuth, async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.redirect("/admin/students?success=Student deleted successfully");
  } catch (error) {
    res.redirect("/admin/students?error=" + error.message);
  }
});

// ======================
// RESULT MANAGEMENT
// ======================

// Upload result form
router.get("/results/upload", requireAdminAuth, async (req, res) => {
  try {
    const students = await Student.find().sort({ name: 1 });
    res.render("admin/upload-result", { title: "Upload Result", admin: req.admin, adminToken: req.session.adminToken, students, error: null, success: req.query.success });
  } catch (error) {
    res.render("error", { message: error.message });
  }
});

// View all results
router.get("/results", requireAdminAuth, async (req, res) => {
  try {
    const results = await Result.find()
      .populate("student")
      .sort({ createdAt: -1 });

    console.log('📊 Total results found:', results.length);

    // Filter out any results with missing student
    const validResults = results.filter(r => r.student);

    console.log('✅ Valid results (with students):', validResults.length);

    // Transform data to match your template structure
    const formattedResults = validResults.map(result => ({
      student: {
        _id: result.student._id,
        name: result.student.name,
        classLevel: result.student.classLevel
      },
      result: {
        term: result.term,
        session: result.session,
        totalScore: result.totalScore,
        average: result.average,
        gpa: result.gpa,
        resultStatus: result.resultStatus,
        subjects: result.subjects
      }
    }));

    console.log('📦 Formatted results:', formattedResults.length);

    res.render("admin/view-results", {
      title: "View Results",
      admin: req.admin,
      adminToken: req.session.adminToken,
      results: formattedResults
    });

  } catch (error) {
    console.error('❌ View Results Error:', error);
    res.render("admin/view-results", {
      title: "View Results",
      admin: req.admin || null,
      adminToken: req.session.adminToken || null,
      results: []
    });
  }
});
// ======================
// USER MANAGEMENT
// ======================

// List users
router.get("/users", requireAdminAuth, async (req, res) => {
  try {
    const users = await User.find().populate("student", "name regNumber classLevel").sort({ createdAt: -1 });
    res.render("admin/users", { title: "User Management", admin: req.admin, adminToken: req.session.adminToken, users, success: req.query.success, error: req.query.error });
  } catch (error) {
    res.render("error", { message: error.message });
  }
});

// Add user form
router.get("/add-user", requireAdminAuth, async (req, res) => {
  const students = await Student.find().select("name regNumber");
  res.render("admin/add-user", { title: "Add User", students, error: null, success: null });
});

// Add user process
router.post("/add-user", requireAdminAuth, async (req, res) => {
  try {
    const { name, email, password, role, studentId, phoneNumber } = req.body;
    // You can integrate your User creation logic here
    res.render("admin/add-user", { title: "Add User", students: await Student.find().select("name regNumber"), success: "User added successfully!", error: null });
  } catch (err) {
    res.render("admin/add-user", { title: "Add User", students: await Student.find().select("name regNumber"), error: "Failed to add user.", success: null });
  }
});

// ======================
// SETTINGS
// ======================

router.get("/settings", requireAdminAuth, (req, res) => {
  res.render("admin/settings", { title: "Settings", admin: req.admin, adminToken: req.session.adminToken, success: req.query.success, error: req.query.error });
});

// Change password
router.post("/settings/change-password", requireAdminAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) return res.redirect("/admin/settings?error=Passwords do not match");
    if (newPassword.length < 6) return res.redirect("/admin/settings?error=Password must be at least 6 characters");

    const admin = await Admin.findById(req.admin._id);
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) return res.redirect("/admin/settings?error=Current password is incorrect");

    admin.password = newPassword;
    await admin.save();
    res.redirect("/admin/settings?success=Password changed successfully");
  } catch (error) {
    res.redirect("/admin/settings?error=" + error.message);
  }
});

// ======================
// PROFILE
// ======================

router.get("/profile", requireAdminAuth, (req, res) => {
  res.render("admin/profile", { title: "My Profile", admin: req.admin, adminToken: req.session.adminToken, success: req.query.success, error: req.query.error });
});

router.post("/profile", requireAdminAuth, async (req, res) => {
  try {
    const { name, email } = req.body;
    const admin = await Admin.findByIdAndUpdate(req.admin._id, { name, email }, { new: true });
    req.session.admin = { _id: admin._id, name: admin.name, email: admin.email };
    res.redirect("/admin/profile?success=Profile updated successfully");
  } catch (error) {
    res.redirect("/admin/profile?error=" + error.message);
  }
});

export default router;
