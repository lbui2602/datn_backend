// controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { onlineUsers } = require("../socket/socketHandler");
dotenv.config();

// Tạo token
const generateToken = (id, roleId) => {
  return jwt.sign({ id, roleId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};
const removeVietnameseTones = (str) => {
  return str.normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D");
};

const registerUser = async (req, res) => {
  try {
      const { fullName, email, password, phone, address, roleId, idDepartment } = req.body;
      if (!email || !password || !fullName || !address || !phone) {
          return res.json({ message: 'Vui lòng nhập đầy đủ thông tin!',code:'0' });
      }
      const fullName_no_accent = removeVietnameseTones(fullName);

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.json({ message: 'Email không hợp lệ!', code: '0' });
      }
      // Kiểm tra email đã tồn tại chưa
      const existingUser = await User.findOne({ email });
      if (existingUser) {
          return res.json({ message: 'Email đã tồn tại!',code:'0'});
      }
      const newUser = new User({
          fullName,
          fullName_no_accent,
          email,
          password,
          phone,
          address,
          roleId,
          idDepartment,
          image : "",
          status : false
      });

      await newUser.save();
      res.json({ message: 'Đăng ký thành công!',code:"1", user: newUser });

  } catch (error) {
      res.status(500).json({ message:"Server error: "+error.message,code:"0"});
  }
};
const acceptUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.json({ message: "Người dùng không tồn tại", code: '0' });
    }

    // Kiểm tra nếu status đã là true rồi
    if (user.status === true) {
      return res.json({ message: "Người dùng đã được duyệt trước đó", code: '0' });
    }

    user.status = true;
    await user.save();

    res.json({ message: "Duyệt người dùng thành công", code: '1', user });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message, code: '0' });
  }
};

// Đăng nhập
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: 'Email này không tồn tại!',code:"0" });
    }else if( !(await user.matchPassword(password))){
      return res.json({ message: 'Sai mật khẩu!',code:"0" });
    }

    res.json({
      message:"Đăng nhập thành công!",
      code:"1",
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
    res.status(500).json({ message: 'Server error: '+error.message,code:"0" });
  }
};
const updateUser = async (req, res) => {
  try {
      const { fullName, phone, address, roleId, idDepartment } = req.body;
      const user = await User.findById(req.user.id); // Lấy id từ token

      if (!user) return res.json({ message: "Không tìm thấy người dùng!",code:'0' });

      if (fullName) {
        user.fullName = fullName;
        user.fullName_no_accent = removeVietnameseTones(fullName);
      }
      user.phone = phone || user.phone;
      user.address = address || user.address;
      user.roleId = roleId || user.roleId;
      user.idDepartment = idDepartment || user.idDepartment;

      await user.save();
      res.json({ message: "Cập nhật thông tin thành công",code:'1', user });
  } catch (error) {
      res.status(500).json({ message: "Server error: "+error.message, code:'0' });
  }
};

// Đổi mật khẩu
const changePassword = async (req, res) => {
  try {
      const { oldPassword, newPassword } = req.body;
      const user = await User.findById(req.user.id);

      if (!user) return res.json({ message: "Không tìm thấy người dùng!",code:'0' });

      // Kiểm tra mật khẩu cũ
      const isMatch = await user.matchPassword(oldPassword);
      if (!isMatch) return res.json({ message: "Mật khẩu cũ không đúng!",code:'0' });
      const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ _id: user.id }, { $set: { password: hashedPassword } });

      res.json({ message: "Thay đổi mật khẩu thành công",code:'1' });
  } catch (error) {
      res.status(500).json({ message: "Server error: "+error.message, code:'0' });
  }
};

// Kiểm tra mật khẩu
const checkPassword = async (req, res) => {
  try {
      const { password } = req.body;
      const user = await User.findById(req.user.id);

      if (!user) return res.json({ message: "Không tìm thấy người dùng" });

      // Kiểm tra mật khẩu
      const isMatch = await user.matchPassword(password);
      if (!isMatch) return res.json({ message: "false" });

      res.json({ message: "true" });
  } catch (error) {
      res.status(500).json({ message: "Server error: "+error.message });
  }
};

// Đăng xuất
const logoutUser = (req, res) => {
  res.json({ message: 'Đã đăng xuất thành công' });
};

// Lấy hồ sơ người dùng
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('roleId', 'name') // Lấy tên role từ bảng Role
      .populate('idDepartment', 'name'); // Lấy tên department từ bảng Department

    if (!user) {
      return res.json({ message: 'Người dùng không tồn tại', code: '0' });
    }

    res.json({
      code: '1',
      message: 'Lấy thông tin người dùng thành công',
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.roleId ? user.roleId.name : null, // Đổi roleId thành role name
        department: user.idDepartment ? user.idDepartment.name : null, // Đổi idDepartment thành department name
        image: user.image,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        __v: user.__v,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const getListUserByDepartmentID = async (req, res) => {
  try {
    const { idDepartment } = req.params;
    const users = await User.find({ idDepartment })
      .populate('roleId', 'name') 
      .populate('idDepartment', 'name');

    if (!users.length) {
      return res.json({ message: "Không có người dùng nào trong phòng ban này", code: '0' });
    }

    const formattedUsers = users.map(user => ({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.roleId ? user.roleId.name : null,
      department: user.idDepartment ? user.idDepartment.name : null,
      image: user.image,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    res.json({ code: '1', users: formattedUsers });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
const searchByName = async (req, res) => {
  try {
    const name = req.query.name || "";
    const normalized = removeVietnameseTones(name).toLowerCase();

    const users = await User.find({
      fullName_no_accent: { $regex: normalized, $options: "i" } // không phân biệt hoa thường
    })
    .populate('roleId', 'name') 
    .populate('idDepartment', 'name');

    const formattedUsers = users.map(user => ({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.roleId ? user.roleId.name : null,
      department: user.idDepartment ? user.idDepartment.name : null,
      image: user.image,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    res.json({ code: '1', users: formattedUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Lấy toàn bộ danh sách người dùng
const getAllUser = async (req, res) => {
  try {
    console.log(onlineUsers)
    const { userId } = req.params;
    const { search } = req.query; // lấy search từ query string

    // Tạo điều kiện tìm kiếm
    const query = {
      _id: { $ne: userId }, // loại trừ userId
    };

    if (search && search.trim() !== "") {
      query.fullName_no_accent = { $regex: search, $options: "i" }; // tìm theo fullName chứa search (không phân biệt hoa thường)
    }

    const users = await User.find(query).lean();

    const usersWithStatus = users.map((user) => ({
      ...user,
      isOnline: onlineUsers.has(user._id.toString()), // Check online
    }));
  

    res.json({ code: "1", message: "Lấy danh sách user thành công", users: usersWithStatus });
  } catch (error) {
    res.status(500).json({ code: "0", message: "Lỗi khi lấy danh sách user", error:error });
  }
};



const getProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .populate('roleId', 'name') // Lấy tên role từ bảng Role
      .populate('idDepartment', 'name'); // Lấy tên department từ bảng Department

    if (!user) {
      return res.json({ message: 'Người dùng không tồn tại', code: '0' });
    }

    res.json({
      code: '1',
      message: 'Lấy thông tin người dùng thành công',
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.roleId ? user.roleId.name : null, 
        department: user.idDepartment ? user.idDepartment.name : null, 
        image: user.image,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        __v:user.__v
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error: "+error.message, code:'0'});
  }
};

const uploadAvatar = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.json({ message: "Người dùng không tồn tại",code:'0' });
    }

    if (!req.file) {
      return res.json({ message: "Vui lòng chọn ảnh!",code:'0' });
    }

    // Đường dẫn ảnh mới
    const avatarPath = `/uploads/avatar/${req.file.filename}`;
    user.image = avatarPath;

    await user.save();
    res.json({ message: "Ảnh đại diện cập nhật thành công",code:'1', image: avatarPath });

  } catch (error) {
    res.status(500).json({ message: "Server error: "+error.message, code:'0' });
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
  getProfileByUserId,
  uploadAvatar,
  acceptUser,
  searchByName
};
