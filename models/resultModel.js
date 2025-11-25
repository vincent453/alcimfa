import mongoose from "mongoose";

// Schema for individual subjects in a result
const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ca1: { type: Number, default: 0, min: 0, max: 15 },
  ca2: { type: Number, default: 0, min: 0, max: 15 },
  exam: { type: Number, default: 0, min: 0, max: 70 },
  total: { type: Number, default: 0 },
  grade: { type: String },
  remark: { type: String },
});

// Main result schema
const resultSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    term: { type: String, required: true },
    session: { type: String, required: true },
    subjects: [subjectSchema], // Multiple subjects per result
    totalScore: { type: Number, default: 0 },
    average: { type: Number, default: 0 },
    gpa: { type: Number, default: 0 },
    position: { type: String }, // e.g., "1st", "2nd"
    resultStatus: { type: String, enum: ["Pass", "Fail"], default: "Pass" },
    headRemark: { type: String },
    teacherRemark: { type: String },
  },
  { timestamps: true }
);

// Optional: index for faster queries by student and session
resultSchema.index({ student: 1, session: 1, term: 1 });

const Result = mongoose.model("Result", resultSchema);
export default Result;
