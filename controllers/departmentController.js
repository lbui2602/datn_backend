const Department = require('../models/Department');

// Lấy danh sách phòng ban
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Lấy chi tiết phòng ban theo ID
const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ message: 'Phòng ban không tồn tại' });
    res.json(department);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Thêm phòng ban
const createDepartment = async (req, res) => {
  try {
    const { name } = req.body;

    // Kiểm tra phòng ban đã tồn tại chưa
    const departmentExists = await Department.findOne({ name });
    if (departmentExists) return res.status(400).json({ message: 'Phòng ban đã tồn tại' });

    const department = await Department.create({ name });
    res.status(201).json(department);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Cập nhật phòng ban
const updateDepartment = async (req, res) => {
  try {
    const { name } = req.body;
    const department = await Department.findById(req.params.id);

    if (!department) return res.status(404).json({ message: 'Phòng ban không tồn tại' });

    department.name = name || department.name;
    await department.save();

    res.json({ message: 'Cập nhật thành công', department });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Xóa phòng ban
const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) return res.status(404).json({ message: 'Phòng ban không tồn tại' });

    await department.deleteOne();
    res.json({ message: 'Xóa phòng ban thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
