import Admin from "../models/adminModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ==========================================
// API ENDPOINTS ONLY (JSON responses)
// ==========================================



// Login Admin (API) - Returns JSON with token
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin)
      return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    // Generate JWT token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Login successful",
      token,
      expiresIn: "7 days",
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Logout Admin (API)
export const logoutAdmin = async (req, res) => {
  try {
    res.json({
      message: "Logout successful",
      instructions: "Please delete the token from your client storage"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Current Admin Profile (API)
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select("-password");
    
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Admin Profile (API)
export const updateAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Update fields
    admin.name = req.body.name || admin.name;
    
    // Check if email is being changed
    if (req.body.email && req.body.email !== admin.email) {
      const emailExists = await Admin.findOne({ email: req.body.email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
      admin.email = req.body.email;
    }

    // Update password if provided
    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      admin.password = req.body.password;
    }

    const updatedAdmin = await admin.save();

    res.json({
      message: "Profile updated successfully",
      admin: {
        _id: updatedAdmin._id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Change Password (API)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: "Please provide current and new password" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: "New password must be at least 6 characters" 
      });
    }

    const admin = await Admin.findById(req.admin._id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.json({
      message: "Password changed successfully. Please login again.",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const changeOwnPin = async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;

    if (!currentPin || !newPin) {
      return res.status(400).json({ 
        message: "Current PIN and new PIN are required" 
      });
    }

    // Validate new PIN format
    if (!/^\d+$/.test(newPin)) {
      return res.status(400).json({ 
        message: "PIN must contain only numbers" 
      });
    }

    if (newPin.length < 4 || newPin.length > 8) {
      return res.status(400).json({ 
        message: "PIN must be between 4 and 8 digits" 
      });
    }

    // Get student from authenticated user
    const student = await Student.findById(req.user.student).select("+pin");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Verify current PIN
    const isPinValid = await student.comparePin(currentPin);
    if (!isPinValid) {
      return res.status(400).json({ 
        message: "Current PIN is incorrect" 
      });
    }

    // Set new PIN
    student.pin = newPin;
    await student.save();

    res.json({ 
      message: "PIN changed successfully",
      pinLastChanged: student.pinLastChanged,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

