const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const protect = (allowedRoles) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Chưa xác thực' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // { id, role, ... }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Không có quyền truy cập' });
      }

      next(); // Tiếp tục nếu hợp lệ
    } catch (error) {
      res.status(401).json({ message: 'Token không hợp lệ' });
    }
  };
};

module.exports = { protect };
