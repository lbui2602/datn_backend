const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const protect = (roles = []) => {
  return (req, res, next) => {
    console.log('Middleware reached'); // Kiểm tra middleware có được gọi
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('No token provided'); // Debug: Token không được gửi
      return res.status(401).json({ message: 'Chưa xác thực' });
    }

    try {
      console.log('Verifying token...'); // Debug: Bắt đầu xác thực token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded:', decoded); // Debug: Token được giải mã thành công
      req.user = decoded;

      if (roles.length && !roles.includes(req.user.role)) {
        console.log('Unauthorized role:', req.user.role); // Debug: Role không hợp lệ
        return res.status(403).json({ message: 'Không có quyền truy cập' });
      }

      next(); // Cho phép tiếp tục request
    } catch (error) {
      console.log('Token verification failed:', error.message); // Debug: Lỗi xác thực token
      res.status(401).json({ message: 'Token không hợp lệ' });
    }
  };
};


module.exports = { protect };
