// routes/authRoutes.js
const express = require('express');
const {
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
} = require('../controllers/authController');
const upload = require('../middleware/uploadAvatarMiddleware');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();
router.post('/register', upload.single('image'), registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/getProfile', protect(), getProfile);
router.put('/update', protect(), updateUser);
router.put('/change-password', protect(), changePassword);
router.post('/check-password', protect(), checkPassword);
router.get('/department/:idDepartment', protect(), getListUserByDepartmentID);
router.get('/', protect(), getAllUser);
router.get('/:userId', protect(), getProfileByUserId);
module.exports = router;
