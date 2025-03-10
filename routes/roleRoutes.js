const express = require('express');
const {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole
} = require('../controllers/roleController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', createRole);
router.get('/', getAllRoles); 
router.get('/:id', protect(), getRoleById); 
router.put('/:id', protect(), updateRole); 
router.delete('/:id', protect(), deleteRole); 

module.exports = router;
