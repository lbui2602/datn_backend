const Role = require('../models/Role');

// Tạo role mới
const createRole = async (req, res) => {
  try {
    const { _id,name } = req.body;
    const existingRole = await Role.findById(_id);
    if (existingRole) {
      return res.status(400).json({ message: 'Id Role đã tồn tại!',code:"0" });
    }

    if (!name) {
      return res.status(400).json({ message: 'Tên vai trò không được để trống',code:"0" });
    }

    const newRole = new Role({ _id,name });
    await newRole.save();

    res.status(201).json({ message: 'Tạo vai trò thành công', role: newRole,code:"1"});
  } catch (error) {
    res.status(500).json({ message: 'Server error: '+error.message,code:"0" });
  }
};

// Lấy danh sách tất cả roles
const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.json({message:'Lấy role thành công',code:'1',roles});
  } catch (error) {
    res.status(500).json({ message: 'Server error: '+error.message, code:'0' });
  }
};

// Lấy role theo ID
const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findById(id);

    if (!role) {
      return res.status(404).json({ message: 'Không tìm thấy vai trò', code:'0' });
    }

    res.json({message:'Lấy role thành công',code:'1',role});
  } catch (error) {
    res.status(500).json({ message: 'Server error: '+error.message, code:'0' });
  }
};

// Cập nhật role
const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ message: 'Không tìm thấy role',code:"0" });
    }

    role.name = name || role.name;
    await role.save();

    res.json({ message: 'Cập nhật role thành công', role ,code:"1"});
  } catch (error) {
    res.status(500).json({ message: 'Server error: '+error.message,code:"0" });
  }
};

// Xóa role
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findById(id);

    if (!role) {
      return res.status(404).json({ message: 'Không tìm thấy vai trò',code:"0" });
    }

    await role.deleteOne();
    res.json({ message: 'Xóa vai trò thành công',code:"1"});
  } catch (error) {
    res.status(500).json({ message: 'Server error: '+error.message,code:"0"});
  }
};

module.exports = {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole
};
