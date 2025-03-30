const Message = require("../models/Message");

// Lấy tin nhắn theo groupId
exports.getMessages = async (req, res) => {
  const { groupId } = req.params;
  const messages = await Message.find({ groupId }).sort({ timestamp: 1 });
  res.json(messages);
};

// Gửi tin nhắn mới (Sử dụng trong socket)
exports.createMessage = async (data) => {
  const newMessage = new Message(data);
  await newMessage.save();
  return newMessage;
};
