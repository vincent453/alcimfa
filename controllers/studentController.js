import Student from "../models/studentModel.js";

// @desc Add new student
// @route POST /api/students
export const addStudent = async (req, res) => {
  try {
    const {
      name,
      classLevel,
      session,
      regNumber,
      gender,
      dateOfBirth,
      address,
      parentName,
      parentPhone,
      parentEmail
    } = req.body;

    if (!name || !classLevel || !session || !regNumber || !gender) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    const existing = await Student.findOne({ regNumber });
    if (existing) {
      return res.status(400).json({ message: "Reg Number already exists" });
    }

    const student = await Student.create({
      name,
      classLevel,
      session,
      regNumber,
      gender,
      dateOfBirth,
      address,
      parentName,
      parentPhone,
      parentEmail
    });

    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all students
// @route GET /api/students
export const getStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update student
// @route PUT /api/students/:id
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Student.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Student not found" });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete student
// @route DELETE /api/students/:id
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Student.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Student not found" });
    res.status(200).json({ message: "Student removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
