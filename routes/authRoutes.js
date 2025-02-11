// routes/authRoutes.js
const express = require('express');
const {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateUser,
  changePassword,
  checkPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Đăng ký
router.post('/register', registerUser);

// Đăng nhập
router.post('/login', loginUser);

// Đăng xuất
router.post('/logout', logoutUser);

// Lấy thông tin hồ sơ (bảo vệ bởi middleware)
router.get('/getProfile', protect(), getProfile);

router.put('/update', protect(), updateUser);

// Đổi mật khẩu
router.put('/change-password', protect(), changePassword);

// Kiểm tra mật khẩu
router.post('/check-password', protect(), checkPassword);

module.exports = router;
