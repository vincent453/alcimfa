import express from "express";
import { requireUserAuth, redirectIfLoggedIn } from "../middleware/renderMiddleware.js";
import User from "../models/userModel.js";
import Student from "../models/studentModel.js";
import Result from "../models/resultModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

// Login page
router.get("/login", redirectIfLoggedIn, (req, res) => {
  res.render("user/login", { 
    error: null,
    title: "User Login"
  });
});

// Process login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.render("user/login", { 
        error: "Invalid email or password",
        title: "User Login"
      });
    }
    
    if (!user.isActive) {
      return res.render("user/login", { 
        error: "Account is deactivated",
        title: "User Login"
      });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render("user/login", { 
        error: "Invalid email or password",
        title: "User Login"
      });
    }
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });
    
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    req.session.userToken = token;
    
    await user.updateLastLogin();
    
    res.redirect("/user/dashboard");
  } catch (error) {
    res.render("user/login", { 
      error: "Login failed",
      title: "User Login"
    });
  }
});

// Registration page
router.get("/register", redirectIfLoggedIn, async (req, res) => {
  const students = await Student.find().sort({ name: 1 });
  res.render("user/register", { 
    error: null,
    students,
    title: "User Registration"
  });
});

// Process registration
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, studentId, phoneNumber } = req.body;
    
    const existing = await User.findOne({ email });
    if (existing) {
      const students = await Student.find().sort({ name: 1 });
      return res.render("user/register", { 
        error: "Email already registered",
        students,
        title: "User Registration"
      });
    }
    
    await User.create({
      name,
      email,
      password,
      role,
      student: studentId || undefined,
      phoneNumber
    });
    
    res.redirect("/user/login?success=Registration successful");
  } catch (error) {
    const students = await Student.find().sort({ name: 1 });
    res.render("user/register", { 
      error: error.message,
      students,
      title: "User Registration"
    });
  }
});

// Dashboard
router.get("/dashboard", requireUserAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("student");
    
    let result = null;
    if (user.student) {
      result = await Result.findOne({ student: user.student._id }).sort({ createdAt: -1 });
    }
    
    res.render("user/dashboard", {
      title: "My Dashboard",
      user,
      result
    });
  } catch (error) {
    res.render("error", { message: error.message });
  }
});

// My Results
router.get("/results", requireUserAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("student");
    
    if (!user.student) {
      return res.render("user/my-results", {
        title: "My Results",
        user,
        results: []
      });
    }
    
    const results = await Result.find({ student: user.student._id }).sort({ createdAt: -1 });
    
    res.render("user/my-results", {
      title: "My Results",
      user,
      results
    });
  } catch (error) {
    res.render("error", { message: error.message });
  }
});


// Logout
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/user/login");
});

export default router;