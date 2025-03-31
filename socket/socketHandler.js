const MessageController = require("../controllers/messageController");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔵 User connected: ${socket.id}`);

    // Lưu danh sách nhóm của user
    socket.userGroups = new Set();

    // Xử lý khi user join vào nhóm
    socket.on("join_group", (groupId) => {
      const rooms = socket.adapter.rooms;

      if (!rooms.has(groupId)) {  // Kiểm tra nếu chưa join
        socket.join(groupId);
        socket.userGroups.add(groupId);
        console.log(`✅ User ${socket.id} joined group ${groupId}`);
      } else {
        console.log(`⚠️ User ${socket.id} already in group ${groupId}`);
      }
    });

    // Xử lý gửi tin nhắn
    socket.on("send_message", async (data) => {
      try {
        if (!data.groupId || !data.senderId || !data.message) {
          return console.log("❌ Missing message data");
        }

        const newMessage = await MessageController.createMessage(data);
        
        // Phát tin nhắn đến nhóm tương ứng
        io.to(data.groupId).emit("receive_message", newMessage);
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

      socket.userGroups.clear(); // Xóa danh sách nhóm
    });
  });
};
