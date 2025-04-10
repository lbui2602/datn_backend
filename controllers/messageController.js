const Message = require("../models/Message");

exports.getMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    console.log("🔍 Fetching messages for groupId:", groupId);

    const messages = await Message.find({ groupId })
      .populate("senderId", "fullName image")
      .sort({ createdAt: 1 });

    if (!messages || messages.length === 0) {
      return res.json({ message: "Không có tin nhắn nào!" });
    }

    const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      groupId: msg.groupId,
      senderId: msg.senderId._id,
      senderName: msg.senderId?.fullName || "Unknown",
      senderImage: msg.senderId?.image || "",
      message: msg.message,
      createdAt: msg.createdAt, // Lấy thời gian gửi
      updatedAt: msg.updatedAt  // Lấy thời gian cập nhật
    }));

    res.json({ code: "1", message: "Lấy tin nhắn thành công!", messages: formattedMessages });
  } catch (error) {
    console.error("❌ Lỗi lấy tin nhắn:", error);
    res.status(500).json({ message: "Lỗi lấy tin nhắn", error: error.message });
  }
};


// Gửi tin nhắn mới (Sử dụng trong socket)
exports.createMessage = async (data) => {
  const newMessage = new Message(data);
  await newMessage.save();
  return newMessage;
};
