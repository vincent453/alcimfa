import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ca1: { type: Number, default: 0 },
  ca2: { type: Number, default: 0 },
  exam: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  grade: { type: String },
  remark: { type: String },
});

const resultSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    term: { type: String, required: true },
    session: { type: String, required: true },
    subjects: [subjectSchema], // ✅ multiple subjects per result
    totalScore: { type: Number, default: 0 },
    average: { type: Number, default: 0 },
    gpa: { type: Number, default: 0 },
    position: { type: String },
    resultStatus: { type: String, default: "Pass" },
    headRemark: { type: String },
    teacherRemark: { type: String },
  },
  { timestamps: true }
);

const Result = mongoose.model("Result", resultSchema);
export default Result;
