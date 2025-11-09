import User from "../models/userModel.js";
import Student from "../models/studentModel.js";
import jwt from "jsonwebtoken";

// @desc    Register a new user (student/parent)
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, studentId, phoneNumber } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        message: "Name, email, password, and role are required" 
      });
    }

    // Only allow student and parent roles
    if (!["student", "parent"].includes(role)) {
      return res.status(400).json({ 
        message: "Invalid role. Only student and parent roles are allowed" 
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        message: "Password must be at least 6 characters" 
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Validate student ID for students and parents
    if ((role === "student" || role === "parent") && !studentId) {
      return res.status(400).json({ 
        message: `Student ID is required for ${role}s` 
      });
    }

    // Verify student exists
    if (studentId) {
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // For student role, check if student already has a user account
      if (role === "student") {
        const existingStudentUser = await User.findOne({ 
          student: studentId, 
          role: "student" 
        });
        if (existingStudentUser) {
          return res.status(400).json({ 
            message: "This student already has a registered account" 
          });
        }
      }
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      student: studentId || undefined,
      phoneNumber,
    });

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        student: user.student,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login student with admission number and PIN
// @route   POST /api/users/login/student
// @access  Public
export const loginStudent = async (req, res) => {
  try {
    const { admissionNumber, pin } = req.body;

    // Validate input
    if (!admissionNumber || !pin) {
      return res.status(400).json({ 
        message: "Admission number and PIN are required" 
      });
    }

    // Find student by registration/admission number
    const student = await Student.findOne({ regNumber: admissionNumber })
      .select("+pin");
    
    if (!student) {
      return res.status(400).json({ 
        message: "Invalid admission number or PIN" 
      });
    }

    // Check if student has a PIN set
    if (!student.pin) {
      return res.status(400).json({ 
        message: "No PIN set for this student. Please contact admin." 
      });
    }

    // Compare PIN
    const isPinValid = await student.comparePin(pin);
    if (!isPinValid) {
      return res.status(400).json({ 
        message: "Invalid admission number or PIN" 
      });
    }

    // Find or create user account for student
    let user = await User.findOne({ 
      student: student._id, 
      role: "student" 
    });

    if (!user) {
      // Create user account if it doesn't exist
      user = await User.create({
        name: student.name,
        email: student.email || `${student.regNumber}@student.school.com`,
        password: pin, // Use PIN as initial password
        role: "student",
        student: student._id,
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ 
        message: "Account is deactivated. Please contact admin." 
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role, studentId: student._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      expiresIn: "7 days",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        student: {
          _id: student._id,
          name: student.name,
          regNumber: student.regNumber,
          classLevel: student.classLevel,
        },
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login parent with email and password
// @route   POST /api/users/login/parent
// @access  Public
export const loginParent = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        message: "Email and password are required" 
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email, role: "parent" })
      .select("+password");
    
    if (!user) {
      return res.status(400).json({ 
        message: "Invalid email or password" 
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ 
        message: "Account is deactivated. Please contact admin." 
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        message: "Invalid email or password" 
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Populate student details
    await user.populate("student", "name regNumber classLevel");

    res.json({
      message: "Login successful",
      token,
      expiresIn: "7 days",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        student: user.student,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Legacy login endpoint (deprecated - redirects based on role)
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password, admissionNumber, pin } = req.body;

    // If admission number and pin provided, use student login
    if (admissionNumber && pin) {
      return loginStudent(req, res);
    }

    // Otherwise, try parent login
    if (email && password) {
      // Find user to determine role
      const user = await User.findOne({ email }).select("+password");
      
      if (!user) {
        return res.status(400).json({ 
          message: "Invalid email or password" 
        });
      }

      if (user.role === "parent") {
        return loginParent(req, res);
      } else {
        return res.status(400).json({ 
          message: "Please use admission number and PIN for student login" 
        });
      }
    }

    return res.status(400).json({ 
      message: "Invalid login credentials provided" 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private (User only)
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("student", "name regNumber classLevel session");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
      student: user.student,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private (User only)
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update allowed fields
    user.name = req.body.name || user.name;
    user.phoneNumber = req.body.phoneNumber || user.phoneNumber;

    // Check if email is being changed and if it's already taken
    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = req.body.email;
    }

    // Update password if provided
    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.status(400).json({ 
          message: "Password must be at least 6 characters" 
        });
      }
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phoneNumber: updatedUser.phoneNumber,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private (User only)
export const changeUserPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: "Current password and new password are required" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: "New password must be at least 6 characters" 
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ 
        message: "Current password is incorrect" 
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset student PIN (for students who forgot)
// @route   POST /api/users/reset-pin
// @access  Public
export const resetStudentPin = async (req, res) => {
  try {
    const { admissionNumber, email } = req.body;

    if (!admissionNumber || !email) {
      return res.status(400).json({ 
        message: "Admission number and email are required" 
      });
    }

    // Find student
    const student = await Student.findOne({ 
      regNumber: admissionNumber,
      email: email 
    });

    if (!student) {
      return res.status(404).json({ 
        message: "Student not found with provided details" 
      });
    }

    // Generate temporary PIN (you can implement email sending here)
    const tempPin = Math.floor(100000 + Math.random() * 900000).toString();
    student.pin = tempPin;
    await student.save();

    // TODO: Send email with temporary PIN
    // await sendEmail(email, "PIN Reset", `Your temporary PIN is: ${tempPin}`);

    res.json({ 
      message: "A temporary PIN has been sent to your email. Please check your inbox." 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const { role, isActive } = req.query;

    // Build filter - only allow student and parent
    const filter = {};
    if (role && ["student", "parent"].includes(role)) {
      filter.role = role;
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const users = await User.find(filter)
      .select("-password")
      .populate("student", "name regNumber classLevel")
      .sort({ createdAt: -1 });

    res.json({
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID (Admin only)
// @route   GET /api/users/:id
// @access  Private (Admin only)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("student", "name regNumber classLevel session");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
// @access  Private (Admin only)
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    
    // Only allow student and parent roles
    if (req.body.role && ["student", "parent"].includes(req.body.role)) {
      user.role = req.body.role;
    }
    
    user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
    user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;
    
    if (req.body.student) {
      user.student = req.body.student;
    }

    const updatedUser = await user.save();

    res.json({
      message: "User updated successfully",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne();

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Deactivate user account (Admin only)
// @route   PATCH /api/users/:id/deactivate
// @access  Private (Admin only)
export const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isActive = false;
    await user.save();

    res.json({ message: "User account deactivated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Activate user account (Admin only)
// @route   PATCH /api/users/:id/activate
// @access  Private (Admin only)
export const activateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isActive = true;
    await user.save();

    res.json({ message: "User account activated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
