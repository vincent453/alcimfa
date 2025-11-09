import jwt from "jsonwebtoken";
import Admin from "../models/adminModel.js";
import User from "../models/userModel.js";

// Middleware to check if admin is logged in (for EJS pages)
export const requireAdminAuth = async (req, res, next) => {
  try {
    // Check session first
    if (!req.session.admin) {
      return res.redirect('/admin/login');
    }
    
    // Verify token if exists
    const token = req.session.adminToken;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const admin = await Admin.findById(decoded.id).select("-password");
      
      if (!admin) {
        req.session.destroy();
        return res.redirect('/admin/login');
      }
      
      req.admin = admin;
      res.locals.admin = admin;
    }
    
    next();
  } catch (error) {
    req.session.destroy();
    res.redirect('/admin/login');
  }
};

// Middleware to check if user is logged in (for EJS pages)
export const requireUserAuth = async (req, res, next) => {
  try {
    if (!req.session.user) {
      return res.redirect('/user/login');
    }
    
    const token = req.session.userToken;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      
      if (!user || !user.isActive) {
        req.session.destroy();
        return res.redirect('/user/login');
      }
      
      req.user = user;
      res.locals.user = user;
    }
    
    next();
  } catch (error) {
    req.session.destroy();
    res.redirect('/user/login');
  }
};

// Redirect if already logged in
export const redirectIfLoggedIn = (req, res, next) => {
  if (req.session.admin) {
    return res.redirect('/admin/dashboard');
  }
  if (req.session.user) {
    return res.redirect('/user/dashboard');
  }
  next();
};