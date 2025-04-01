const MessageController = require("../controllers/messageController");
const Message = require("../models/Message");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔵 User connected: ${socket.id}`);

    // Lưu danh sách nhóm của user
    socket.userGroups = new Set();

    // Xử lý khi user join vào nhóm
    socket.on("join_group", (groupId) => {
      if (!socket.rooms.has(groupId)) {
        socket.join(groupId);
        socket.userGroups.add(groupId);
        console.log(`✅ User ${socket.id} joined group ${groupId}`);
        console.log("📢 Users in group:", groupId, io.sockets.adapter.rooms.get(groupId));
      } else {
        console.log(`⚠️ User ${socket.id} already in group ${groupId}`);
      }
    });

    // Xử lý gửi tin nhắn
    socket.on("send_message", async (data) => {
      try {
        console.log("📤 Received send_message:", data);

        if (!data.groupId || !data.senderId || !data.message) {
          return console.log("❌ Missing message data");
        }

        // Tạo tin nhắn mới
        const newMessage = await MessageController.createMessage(data);
        console.log("✅ Message created:", newMessage);

        // Lấy thông tin đầy đủ của người gửi
        const populatedMessage = await Message.findById(newMessage._id)
          .populate("senderId", "fullName image")
          .lean();

        if (!populatedMessage) {
          return console.log("❌ Could not find message after creation.");
        }

        // Debug: Kiểm tra có bao nhiêu socket trong group
        console.log("📢 Users in group before sending message:", io.sockets.adapter.rooms.get(data.groupId));

        // Gửi tin nhắn đã có đầy đủ thông tin tới nhóm
        io.to(data.groupId).emit("receive_message", {
          _id: populatedMessage._id,
          groupId: populatedMessage.groupId,
          senderId: populatedMessage.senderId._id,
          senderName: populatedMessage.senderId?.fullName || "Unknown",
          senderImage: populatedMessage.senderId?.image || "",
          message: populatedMessage.message,
          createdAt: populatedMessage.createdAt,
          updatedAt: populatedMessage.updatedAt,
        });

        console.log(`📩 Message sent to group ${data.groupId}`);
      } catch (error) {
        console.error("❌ Error sending message:", error);
      }
    });

    // Xử lý khi client disconnect
    socket.on("disconnect", () => {
      console.log(`🔴 User disconnected: ${socket.id}`);

      // Rời khỏi tất cả nhóm đã tham gia
      socket.userGroups.forEach((groupId) => {
        socket.leave(groupId);
        console.log(`🚪 User ${socket.id} left group ${groupId}`);
      });

      socket.userGroups.clear();
    });
  });
};