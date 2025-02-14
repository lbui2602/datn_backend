// controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
dotenv.config();

// Tạo token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const registerUser = async (req, res) => {
  try {
      console.log('Body:', req.body);
      console.log('File:', req.file);

      const { fullName, email, password, phone, address, roleId, idDepartment } = req.body;
      if (!email || !password || !fullName) {
          return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin!' });
      }

      // Kiểm tra email đã tồn tại chưa
      const existingUser = await User.findOne({ email });
      if (existingUser) {
          return res.status(400).json({ message: 'Email đã tồn tại!' });
      }

      // Mã hóa mật khẩu
      const hashedPassword = await bcrypt.hash(password, 10);

      // Đường dẫn ảnh nếu có
      const avatarPath = req.file ? `/uploads/avatar/${req.file.filename}` : null;

      // Tạo user mới
      const newUser = new User({
          fullName,
          email,
          password: hashedPassword,
          phone,
          address,
          roleId,
          idDepartment,
          image: avatarPath
      });

      await newUser.save();
      res.status(201).json({ message: 'Đăng ký thành công!', user: newUser });

  } catch (error) {
      res.status(500).json({ message: 'Lỗi server!', error: error.message });
  }
};


// Đăng nhập
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Sai email hoặc mật khẩu' });
    }

    res.json({
      _id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      roleId: user.roleId,
      idDepartment: user.idDepartment,
      image: user.image,
      token: generateToken(user.id, user.roleId),
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};
const updateUser = async (req, res) => {
  try {
      const { fullName, phone, address, roleId, idDepartment } = req.body;
      const user = await User.findById(req.user.id); // Lấy id từ token

      if (!user) return res.status(404).json({ message: "User not found" });

      // Cập nhật thông tin
      user.fullName = fullName || user.fullName;
      user.phone = phone || user.phone;
      user.address = address || user.address;
      user.roleId = roleId || user.roleId;
      user.idDepartment = idDepartment || user.idDepartment;

      await user.save();
      res.json({ message: "User updated successfully", user });
  } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Đổi mật khẩu
const changePassword = async (req, res) => {
  try {
      const { oldPassword, newPassword } = req.body;
      const user = await User.findById(req.user.id);

      if (!user) return res.status(404).json({ message: "User not found" });

      // Kiểm tra mật khẩu cũ
      const isMatch = await user.matchPassword(oldPassword);
      if (!isMatch) return res.status(400).json({ message: "Old password is incorrect" });
      const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ _id: user.id }, { $set: { password: hashedPassword } });

      res.json({ message: "Password updated successfully" });
  } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Kiểm tra mật khẩu
const checkPassword = async (req, res) => {
  try {
      const { password } = req.body;
      const user = await User.findById(req.user.id);

      if (!user) return res.status(404).json({ message: "User not found" });

      // Kiểm tra mật khẩu
      const isMatch = await user.matchPassword(password);
      if (!isMatch) return res.status(400).json({ message: "false" });

      res.json({ message: "true" });
  } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Đăng xuất
const logoutUser = (req, res) => {
  res.json({ message: 'Đã đăng xuất thành công' });
};

// Lấy hồ sơ người dùng
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    res.json({
      _id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      roleId: user.roleId,
      idDepartment: user.idDepartment,
      image: user.image,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const getListUserByDepartmentID = async (req, res) => {
  try {
    const { idDepartment } = req.params;
    const users = await User.find({ idDepartment });

    if (!users.length) {
      return res.status(404).json({ message: "Không có người dùng nào trong phòng ban này" });
    }

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Lấy toàn bộ danh sách người dùng
const getAllUser = async (req, res) => {
  try {
    const users = await User.find();

    if (!users.length) {
      return res.status(404).json({ message: "Không có người dùng nào" });
    }

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

const getProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    res.json({
      _id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      roleId: user.roleId,
      idDepartment: user.idDepartment,
      image: user.image,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateUser,
  changePassword,
  checkPassword,
  getListUserByDepartmentID,
  getAllUser,
  getProfileByUserId
};