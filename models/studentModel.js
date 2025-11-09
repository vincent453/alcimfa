import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
      enum: {
        values: ["Male", "Female"],
        message: "Gender must be either Male or Female",
      },
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
    // PIN for student login
    pin: {
      type: String,
      select: false, // Don't return PIN by default in queries
      minlength: 4,
    },
    // Track if PIN has been set
    hasPinSet: {
      type: Boolean,
      default: false,
    },
    // Track last PIN change
    pinLastChanged: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Hash PIN before saving
studentSchema.pre("save", async function (next) {
  // Only hash if PIN is modified
  if (!this.isModified("pin")) {
    return next();
  }
  
  // If PIN is being set or changed
  if (this.pin) {
    const salt = await bcrypt.genSalt(10);
    this.pin = await bcrypt.hash(this.pin, salt);
    this.hasPinSet = true;
    this.pinLastChanged = new Date();
  }
  
  next();
});

// Method to compare entered PIN with hashed PIN
studentSchema.methods.comparePin = async function (enteredPin) {
  if (!this.pin) {
    return false;
  }
  return await bcrypt.compare(enteredPin, this.pin);
};

// Method to generate a random PIN
studentSchema.methods.generatePin = function () {
  // Generate 6-digit PIN
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Static method to generate PIN for multiple students
studentSchema.statics.generatePinForStudent = async function (studentId) {
  const student = await this.findById(studentId);
  if (!student) {
    throw new Error("Student not found");
  }
  
  // Generate 6-digit PIN
  const pin = Math.floor(100000 + Math.random() * 900000).toString();
  student.pin = pin;
  await student.save();
  
  return pin; // Return unhashed PIN to send to student/parent
};

const Student = mongoose.model("Student", studentSchema);
export default Student;
