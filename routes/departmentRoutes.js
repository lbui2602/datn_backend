const express = require('express');
const {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
} = require('../controllers/departmentController');

const router = express.Router();

router.get('/', getDepartments);            // Lấy danh sách phòng ban
router.get('/:id', getDepartmentById);      // Lấy chi tiết phòng ban
router.post('/', createDepartment);         // Thêm phòng ban
router.put('/:id', updateDepartment);       // Cập nhật phòng ban
router.delete('/:id', deleteDepartment);    // Xóa phòng ban

module.exports = router;
