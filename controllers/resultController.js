import Result from "../models/resultModel.js";
import Student from "../models/studentModel.js";

export const uploadResult = async (req, res) => {
  try {
    const { studentId, term, session, subjects, headRemark, teacherRemark } = req.body;

    // ✅ Validate required fields
    if (!studentId || !term || !session) {
      return res.status(400).json({ message: "Student ID, term, and session are required" });
    }

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ message: "At least one subject is required" });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // ✅ Validate each subject has required fields
    for (const subj of subjects) {
      if (!subj.name) {
        return res.status(400).json({ message: "Subject name is required" });
      }
      if (subj.ca1 === undefined || subj.ca2 === undefined || subj.exam === undefined) {
        return res.status(400).json({ 
          message: `Missing scores for ${subj.name}. CA1, CA2, and Exam are required` 
        });
      }
    }

    let totalScore = 0;
    let gradedSubjects = [];

    // Validate and process subjects
    for (const subj of subjects) {
      // ✅ Validation for score ranges
      if (subj.ca1 < 0 || subj.ca1 > 15) {
        return res.status(400).json({ 
          message: `Invalid CA1 score for ${subj.name}. Must be between 0-15` 
        });
      }
      if (subj.ca2 < 0 || subj.ca2 > 15) {
        return res.status(400).json({ 
          message: `Invalid CA2 score for ${subj.name}. Must be between 0-15` 
        });
      }
      if (subj.exam < 0 || subj.exam > 70) {
        return res.status(400).json({ 
          message: `Invalid Exam score for ${subj.name}. Must be between 0-70` 
        });
      }

      const total = subj.ca1 + subj.ca2 + subj.exam;
      let grade, remark;

      if (total >= 70) { grade = "A"; remark = "Excellent"; }
      else if (total >= 60) { grade = "B"; remark = "Very Good"; }
      else if (total >= 50) { grade = "C"; remark = "Good"; }
      else if (total >= 40) { grade = "D"; remark = "Fair"; }
      else { grade = "F"; remark = "Poor"; }

      totalScore += total;
      gradedSubjects.push({ ...subj, total, grade, remark });
    }

    const average = totalScore / subjects.length;
    
    // ✅ Fixed GPA calculation (4.0 scale)
    const calculateGPA = (avg) => {
      if (avg >= 70) return 4.0;
      if (avg >= 60) return 3.0;
      if (avg >= 50) return 2.0;
      if (avg >= 40) return 1.0;
      return 0.0;
    };
    
    const gpa = calculateGPA(average);
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

// Get a student's full result sheet (JSON)
export const getStudentResult = async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await Result.findOne({ student: studentId })
      .populate("student", "name regNumber classLevel gender");

    if (!result) {
      return res.status(404).json({ message: "No result found" });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Render EJS Report Card
export const renderResultCard = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const result = await Result.findOne({ student: studentId })
      .populate("student", "name regNumber classLevel session gender");

    if (!result) {
      return res.status(404).render("error", { 
        message: "No result found for this student" 
      });
    }

    // Calculate total marks for display
    const maxMarks = result.subjects.length * 100;
    const totalInWords = convertNumberToWords(result.totalScore);

    // Prepare data for EJS template
    const reportData = {
      student: {
        name: result.student.name,
        admissionNo: result.student.regNumber,
        class: result.student.classLevel,
        section: "Senior Secondary Section",
        gender: result.student.gender || "Male", // ✅ Use from database or default
        examName: `${result.term} Examination`,
      },
      session: result.session,
      term: result.term,
      subjects: result.subjects,
      summary: {
        grandTotal: result.totalScore,
        maxMarks: maxMarks,
        average: result.average,
        gpa: result.gpa,
        totalInWords: totalInWords,
        resultStatus: result.resultStatus,
      },
      remarks: {
        teacher: result.teacherRemark || "Keep up the good work!",
        headOfSchool: result.headRemark || "Well done!",
      },
      attendance: {
        workingDays: 0, // You can add this to your result model
        daysAttended: 0,
        percentage: "0.00",
      },
      gradingScale: [
        { grade: "A", min: "70%", max: "100%" },
        { grade: "B", min: "60%", max: "69%" },
        { grade: "C", min: "50%", max: "59%" },
        { grade: "D", min: "40%", max: "49%" },
        { grade: "F", min: "0%", max: "39%" },
      ],
      nextTermDate: "28th of April, 2025",
    };

    res.render("reportCard", reportData);
  } catch (error) {
    console.error("Error rendering report card:", error);
    res.status(500).render("error", { 
      message: "Error loading report card" 
    });
  }
};

// Helper function to convert numbers to words
function convertNumberToWords(num) {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];

  if (num === 0) return "Zero";

  let words = "";

  // Handle thousands
  if (num >= 1000) {
    words += ones[Math.floor(num / 1000)] + " Thousand ";
    num %= 1000;
  }

  // Handle hundreds
  if (num >= 100) {
    words += ones[Math.floor(num / 100)] + " Hundred ";
    num %= 100;
  }

  // Handle tens and ones
  if (num >= 20) {
    words += tens[Math.floor(num / 10)] + " ";
    num %= 10;
  } else if (num >= 10) {
    words += teens[num - 10] + " ";
    return words.trim();
  }

  if (num > 0) {
    words += ones[num] + " ";
  }

  return words.trim();
}