const Group = require("../models/Group");
const User = require("../models/User");
const Message = require("../models/Message");

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
exports.getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Lấy group theo id
    const group = await Group.findById(groupId).lean();

    if (!group) {
      return res.status(404).json({ code: '0', message: 'Không tìm thấy nhóm' });
    }

    // Kiểm tra xem có phải nhóm private không
    if (group.name.startsWith("private_") && group.members.length === 2) {
      const userId = req.user.id; // lấy user hiện tại (đã gán vào req.user từ middleware auth)
      const otherUserId = group.members.find(id => id.toString() !== userId.toString());

      if (otherUserId) {
        const otherUser = await User.findById(otherUserId).lean();
        if (otherUser) {
          group.name = otherUser.fullName || "Unknown User";
          group.image = otherUser.image || "";
        } else {
          group.name = "Unknown User";
          group.image = "";
        }
      }
    }

    res.json({ code: '1', message: 'Lấy thông tin nhóm thành công', group: group });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: '0', message: 'Lỗi khi lấy thông tin nhóm', error });
  }
};

exports.getPrivateGroup = async (req, res) => {
  try {
    const { userId2 } = req.params;
    const userId1 = req.user.id

    // B1: Tìm xem đã có nhóm private giữa 2 user chưa
    let group = await Group.findOne({
      members: { $all: [userId1, userId2] }, // phải chứa đủ 2 người
      $expr: { $eq: [{ $size: "$members" }, 2] } // đúng 2 người
    }).lean();

    // B2: Nếu chưa có thì tạo mới
    if (!group) {
      const groupName = `private_${userId1}_${userId2}`;
      const newGroup = await Group.create({
        name: groupName,
        members: [userId1, userId2]
      });
      group = newGroup.toObject();
    }

    // B3: Lấy thông tin user còn lại
    const otherUser = await User.findById(userId2).lean();

    if (otherUser) {
      group.name = otherUser.fullName || "Unknown User";
      group.image = otherUser.image || "";
    } else {
      group.name = "Unknown User";
      group.image = "";
    }

    res.json({ code: "1", message: "Lấy hoặc tạo nhóm thành công", group: group });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "0", message: "Lỗi khi lấy/tạo nhóm", error });
  }
};

exports.getGroupByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    // Lấy các nhóm có userId nằm trong members
    let groups = await Group.find({ members: { $in: [userId] } }).lean();

    const groupsWithMessages = [];

    // Duyệt từng nhóm
    for (let group of groups) {
      // Nếu là nhóm private (có 2 thành viên và tên bắt đầu bằng 'private_')
      if (group.name.startsWith("private_") && group.members.length === 2) {

        const messageCount = await Message.countDocuments({ groupId: group._id });
        // Tìm user còn lại
        if (messageCount > 0) {
          const otherUserId = group.members.find((id) => id.toString() !== userId.toString());
          // Lấy thông tin user còn lại
          const otherUser = await User.findById(otherUserId).lean();

          if (otherUser) {
            group.name = otherUser.fullName || "Unknown User";
            group.image = otherUser.image || ""; // nếu bạn cần ảnh luôn
          } else {
            group.name = "Unknown User";
          }
          groupsWithMessages.push(group);
        }
      } else {
        // Nếu là nhóm bình thường thì dùng tên nhóm
        group.name = group.name;
        groupsWithMessages.push(group);
      }
    }

    res.json({ code: '1', message: 'Lấy thông tin nhóm thành công', groups: groupsWithMessages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách nhóm", error });
  }
};
exports.getGroupByUserId2 = async (req, res) => {
  try {
    const { userId } = req.params;

    // Lấy tất cả các nhóm mà user tham gia
    let groups = await Group.find({ members: { $in: [userId] } }).lean();

    const groupsWithMessages = [];

    for (let group of groups) {
      // Kiểm tra group có ít nhất 1 message không
      const messageCount = await Message.countDocuments({ groupId: group._id });
      if (messageCount > 0) {
        console.log("count > 0")
        // Nếu là nhóm private (2 người, tên bắt đầu private_)
        if (group.name.startsWith("private_") && group.members.length === 2) {
          const otherUserId = group.members.find((id) => id.toString() !== userId.toString());

          const otherUser = await User.findById(otherUserId).lean();

          if (otherUser) {
            group.name = otherUser.fullName || "Unknown User";
            group.image = otherUser.image || "";
          } else {
            group.name = "Unknown User";
          }
        }
        // Nếu không phải nhóm private thì giữ nguyên tên group

        groupsWithMessages.push(group);
      }
    }

    res.json({
      code: '1',
      message: 'Lấy thông tin nhóm thành công',
      groups: groupsWithMessages
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Lỗi khi lấy danh sách nhóm",
      error
    });
  }
};

