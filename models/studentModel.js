import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    classLevel: {
      type: String,
      required: true,
    },

    session: {
      type: String,
      required: true,
    },

    regNumber: {
      type: String,
      required: true,
      unique: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: true,
    },

    dateOfBirth: {
      type: Date,
    },

    address: {
      type: String,
      trim: true,
    },

    parentName: {
      type: String,
      trim: true,
    },

    parentPhone: {
      type: String,
      trim: true,
    },

    parentEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },

    // ⭐ NEW FIELD FOR PROFILE PICTURE
    profilePhoto: {
      type: String,
      default: null, // Will store Cloudinary URL
    },
  },
  { timestamps: true }
);

const Student = mongoose.model("Student", studentSchema);
export default Student;
