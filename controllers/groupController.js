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
  res.json(newGroup);
};

exports.getGroupByUserId = async (req, res) => {
  try {
    const { userId } = req.params; // Lấy userId từ request params

    // Tìm các nhóm có userId nằm trong danh sách members (danh sách chứa userId)
    const groups = await Group.find({ members: { $in: [userId] } });

    res.json({code:'1',message:'Lấy thông tin nhóm thành công',groups:groups});
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách nhóm", error });
  }
};

