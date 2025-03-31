const Message = require("../models/Message");

// Lấy tin nhắn theo groupId
exports.getMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    console.log("🔍 Fetching messages for groupId:", groupId);

    const messages = await Message.find({ groupId })
      .populate("senderId", "fullName") // Lấy thông tin name từ senderId
      .sort({ createdAt: 1 });

    console.log("📩 Messages found:", messages);

    if (!messages || messages.length === 0) {
      return res.status(404).json({ message: "Không có tin nhắn nào!" });
    }

    const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      groupId: msg.groupId,
      senderName: msg.senderId?.fullName || "Unknown", // Check nếu không có name
      message: msg.message,
      timestamp: msg.timestamp
    }));

    res.json(formattedMessages);
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
