const express = require("express");
const { getGroups, createGroup,getGroupByUserId } = require("../controllers/groupController");
const router = express.Router();

router.get("/", getGroups);
router.get("/:userId", getGroupByUserId);
router.post("/", createGroup);

module.exports = router;
