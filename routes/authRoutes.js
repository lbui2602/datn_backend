// routes/authRoutes.js
const express = require('express');
const {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  getUserInfo,
  updateUser,
  changePassword,
  checkPassword,
  getListUserByDepartmentID,
  getAllUser,
  getProfileByUserId,
  uploadAvatar,
  acceptUser,
  searchByName,
  registerAdmin,
  deleteUser,
  resetPassword,
  updatePassword
} = require('../controllers/authController');
const upload = require('../middleware/uploadAvatarMiddleware');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();
router.post('/register/admin', registerAdmin);
router.post('/register', registerUser);
router.post('/uploadAvatar', upload.single('image_file'), uploadAvatar);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/getProfile', protect(), getProfile);
router.get('/getUserInfo', protect(), getUserInfo);
router.put('/update', protect(), updateUser);
router.put('/change-password', protect(), changePassword);
router.put('/update-password', updatePassword);
router.put('/reset-password', protect(), resetPassword);
router.post('/check-password', protect(), checkPassword);
router.get('/staff/:idDepartment', protect(), getListUserByDepartmentID);
router.get('/search', protect(), searchByName);
router.get('/getAll/:userId', protect(), getAllUser);
router.get('/getProfileByUserId/:userId', protect(), getProfileByUserId);
router.put('/accept',protect(), acceptUser);
router.delete('/delete/:userId',protect(), deleteUser);
module.exports = router;
