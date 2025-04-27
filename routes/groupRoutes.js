const express = require("express");
const { getGroups, createGroup,getGroupByUserId,getPrivateGroup,getGroupById, deleteUser, addUserToGroup } = require("../controllers/groupController");
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

router.get("/", getGroups);
router.get("/:userId", getGroupByUserId);
router.get("/getById/:groupId",protect(), getGroupById);
router.get("/getPrivateGroup/:userId2", protect(),getPrivateGroup);
router.post("/",protect(), createGroup);
router.post("/delete",protect(),deleteUser);
router.post("/add",protect(),addUserToGroup);

module.exports = router;
