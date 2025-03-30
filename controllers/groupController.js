const Group = require("../models/Group");

// Lấy danh sách nhóm chat
exports.getGroups = async (req, res) => {
  const groups = await Group.find();
  res.json(groups);
};

// Tạo nhóm mới
exports.createGroup = async (req, res) => {
  const { name, members } = req.body;
  const newGroup = new Group({ name, members });
  await newGroup.save();
  res.status(201).json(newGroup);
};
