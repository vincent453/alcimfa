import Result from "../models/resultModel.js";
import Student from "../models/studentModel.js";

export const uploadResult = async (req, res) => {
  try {
    const { studentId, term, session, subjects, headRemark, teacherRemark } = req.body;

    // Validate
    if (!studentId || !term || !session) {
      return res.status(400).json({ message: "Student ID, term, and session are required" });
    }

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ message: "At least one subject is required" });
    }

    // Student check
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Validate subjects
    for (const s of subjects) {
      if (!s.name || s.ca1 === undefined || s.ca2 === undefined || s.exam === undefined) {
        return res.status(400).json({ 
          message: `Missing score fields for ${s.name}` 
        });
      }
    }

    let totalScore = 0;
    let gradedSubjects = [];

    for (const s of subjects) {
      if (s.ca1 < 0 || s.ca1 > 15) return res.status(400).json({ message: `CA1 invalid for ${s.name}` });
      if (s.ca2 < 0 || s.ca2 > 15) return res.status(400).json({ message: `CA2 invalid for ${s.name}` });
      if (s.exam < 0 || s.exam > 70) return res.status(400).json({ message: `Exam invalid for ${s.name}` });

      const total = s.ca1 + s.ca2 + s.exam;
      let grade, remark;

      if (total >= 70) { grade = "A"; remark = "Excellent"; }
      else if (total >= 60) { grade = "B"; remark = "Very Good"; }
      else if (total >= 50) { grade = "C"; remark = "Good"; }
      else if (total >= 40) { grade = "D"; remark = "Fair"; }
      else { grade = "F"; remark = "Poor"; }

      totalScore += total;
      gradedSubjects.push({ ...s, total, grade, remark });
    }

    const average = totalScore / subjects.length;

    const gpa = (avg => {
      if (avg >= 70) return 4.0;
      if (avg >= 60) return 3.0;
      if (avg >= 50) return 2.0;
      if (avg >= 40) return 1.0;
      return 0.0;
    })(average);

    const resultStatus = average >= 40 ? "Pass" : "Fail";

    const result = await Result.create({
      student: studentId,
      term,
      session,
      subjects: gradedSubjects,
      totalScore,
      average: average.toFixed(2),
      gpa: gpa.toFixed(2),
      resultStatus,
      headRemark,
      teacherRemark,
    });

    res.status(201).json({
      message: "Result uploaded successfully",
      result,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get student result JSON
export const getStudentResult = async (req, res) => {
  try {
    const result = await Result.findOne({ student: req.params.studentId })
      .populate("student");

    if (!result) {
      return res.status(404).json({ message: "No result found" });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Render EJS report card with student photo
export const renderResultCard = async (req, res) => {
  try {
    const { studentId } = req.params;

    const result = await Result.findOne({ student: studentId })
      .populate("student");

    if (!result) {
      return res.status(404).render("error", { message: "No result found" });
    }

    const maxMarks = result.subjects.length * 100;
    const totalInWords = convertNumberToWords(result.totalScore);

    const reportData = {
      student: {
        name: result.student.name,
        admissionNo: result.student.regNumber,
        class: result.student.classLevel,
        gender: result.student.gender,
        session: result.student.session,
        photo: result.student.profilePhoto || null,  // ⭐ ADDED PROFILE PHOTO
      },
      term: result.term,
      session: result.session,
      subjects: result.subjects,
      summary: {
        grandTotal: result.totalScore,
        maxMarks,
        average: result.average,
        gpa: result.gpa,
        totalInWords,
        resultStatus: result.resultStatus,
      },
      remarks: {
        teacher: result.teacherRemark || "",
        headOfSchool: result.headRemark || "",
      },
      gradingScale: [
        { grade: "A", min: "70%", max: "100%" },
        { grade: "B", min: "60%", max: "69%" },
        { grade: "C", min: "50%", max: "59%" },
        { grade: "D", min: "40%", max: "49%" },
        { grade: "F", min: "0%", max: "39%" },
      ],
    };

    res.render("reportCard", reportData);
  } catch (err) {
    res.status(500).render("error", { message: "Error loading report card" });
  }
};

// Number to words
function convertNumberToWords(num) {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];

  if (num === 0) return "Zero";

  let words = "";

  if (num >= 1000) {
    words += ones[Math.floor(num / 1000)] + " Thousand ";
    num %= 1000;
  }
  if (num >= 100) {
    words += ones[Math.floor(num / 100)] + " Hundred ";
    num %= 100;
  }
  if (num >= 20) {
    words += tens[Math.floor(num / 10)] + " ";
    num %= 10;
  } else if (num >= 10) {
    words += teens[num - 10] + " ";
    return words.trim();
  }

  if (num > 0) words += ones[num] + " ";

  return words.trim();
}
