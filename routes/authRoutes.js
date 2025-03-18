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
  getProfileByUserId,
  uploadAvatar,
  updateFaceToken,
  searchUserByFaceToken
} = require('../controllers/authController');
const upload = require('../middleware/uploadAvatarMiddleware');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();
router.post('/register', registerUser);
router.post('/uploadAvatar', upload.single('image_file'), uploadAvatar);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/getProfile', protect(), getProfile);
router.put('/update', protect(), updateUser);
router.put('/change-password', protect(), changePassword);
router.post('/check-password', protect(), checkPassword);
router.get('/department/:idDepartment', protect(), getListUserByDepartmentID);
router.get('/', protect(), getAllUser);
router.put('/updateFaceToken', updateFaceToken);
router.get('/:userId', protect(), getProfileByUserId);
router.post('/search_user_by_face_token', searchUserByFaceToken);
module.exports = router;
