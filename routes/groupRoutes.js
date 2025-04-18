const express = require("express");
const { getGroups, createGroup,getGroupByUserId,getPrivateGroup,getGroupById } = require("../controllers/groupController");
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

router.get("/", getGroups);
router.get("/:userId", getGroupByUserId);
router.get("/getById/:groupId",protect(), getGroupById);
router.get("/getPrivateGroup/:userId2", protect(),getPrivateGroup);
router.post("/", createGroup);

module.exports = router;
