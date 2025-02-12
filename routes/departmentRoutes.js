const express = require('express');
const {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
} = require('../controllers/departmentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/',protect(), getDepartments);      
router.get('/:id',protect(), getDepartmentById);      
router.post('/',protect(), createDepartment);        
router.put('/:id',protect(), updateDepartment);       
router.delete('/:id',protect(), deleteDepartment);    

module.exports = router;
