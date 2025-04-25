const Department = require('../models/Department');

// Lấy danh sách phòng ban
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    res.json({code:'1',departments});
  } catch (error) {
    res.status(500).json({ message: 'Server error: '+error.message, code:'0' });
  }
};

// Lấy chi tiết phòng ban theo ID
const getDepartmentById = async (req, res) => {
  try {
    const id = req.params.id
    const department = await Department.findById(id);
    if (!department) return res.json({ message: 'Phòng ban không tồn tại',code:'0' });
    res.json({code:'1',department});
  } catch (error) {
    res.status(500).json({ message: 'Server error: '+error.message, code:'0' });
  }
};

// Thêm phòng ban
const createDepartment = async (req, res) => {
  try {
    const { _id,name } = req.body;
    // Kiểm tra phòng ban đã tồn tại chưa
    const departmentExists = await Department.findOne({ name });
    if (departmentExists) return res.json({ message: 'Phòng ban đã tồn tại',code:'0' });

    const department = await Department.create({ _id,name });
    res.json({code:'1',department});
  } catch (error) {
    res.status(500).json({ message: 'Server error: '+error.message, code:'0' });
  }
};

// Cập nhật phòng ban
const updateDepartment = async (req, res) => {
  try {
    const { name } = req.body;
    const department = await Department.findById(req.params.id);

    if (!department) return res.json({ message: 'Phòng ban không tồn tại',code:'0' });

    department.name = name || department.name;
    await department.save();

    res.json({ message: 'Cập nhật thành công',code:'1', department });
  } catch (error) {
    res.status(500).json({ message: 'Server error: '+error.message, code:'0' });
  }
};

// Xóa phòng ban
const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) return res.json({ message: 'Phòng ban không tồn tại',code:'0' });

    await department.deleteOne();
    res.json({ message: 'Xóa phòng ban thành công',code:'1' });
  } catch (error) {
    res.status(500).json({ message: 'Server error: '+error.message, code:'0' });
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
