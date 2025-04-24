const MessageController = require("../controllers/messageController");
const Message = require("../models/Message");

const onlineUsers = new Map(); // userId -> Set(socketId)
let ioGlobal = null;
module.exports = (io) => {
  ioGlobal = io;
  io.on("connection", (socket) => {
    console.log(`🔵 User connected: ${socket.id}`);

    // Lưu danh sách group mà user tham gia
    socket.userGroups = new Set();

    // Khi client báo userId sau khi kết nối
    socket.on('user_connected', (userId) => {
      // ✅ Remove socketId from any old user
      for (const [key, socketSet] of onlineUsers.entries()) {
        if (socketSet.has(socket.id)) {
          socketSet.delete(socket.id);
          if (socketSet.size === 0) {
            onlineUsers.delete(key);
          }
        }
      }

      // ✅ Add socket.id to the correct userId
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId).add(socket.id);

      console.log(`✅ User ${userId} connected with socket ${socket.id}`);
    });

    // Khi client yêu cầu join group
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

    // Khi client gửi tin nhắn
    socket.on("send_message", async (data) => {
      try {
        console.log("📤 Received send_message:", data);

        if (!data.groupId || !data.senderId || !data.message) {
          return console.log("❌ Missing message data");
        }

        // Tạo tin nhắn mới
        const newMessage = await MessageController.createMessage(data);
        console.log("✅ Message created:", newMessage);

        // Populate thông tin người gửi
        const populatedMessage = await Message.findById(newMessage._id)
          .populate("senderId", "fullName image")
          .lean();

        if (!populatedMessage) {
          return console.log("❌ Could not find message after creation.");
        }

        console.log(
          "📢 Users in group before sending message:",
          io.sockets.adapter.rooms.get(data.groupId)
        );

        // Gửi message tới tất cả thành viên trong group
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

    // Khi client disconnect
    socket.on('disconnect', () => {
      console.log(`🔴 User disconnected: ${socket.id}`);

      // Duyệt hết Map
      for (const [userId, socketSet] of onlineUsers.entries()) {
        if (socketSet.has(socket.id)) {
          socketSet.delete(socket.id); // Xóa socket.id ra khỏi Set

          // Nếu user đó không còn socketId nào thì xóa luôn userId ra khỏi Map
          if (socketSet.size === 0) {
            onlineUsers.delete(userId);
          }

          console.log(`🚪 User ${socket.id} left group ${userId}`);
          break; // Vì một socket.id chỉ nằm ở 1 user nên break luôn
        }
      }

      console.log("🗺️ Current onlineUsers:", Object.fromEntries(
        Array.from(onlineUsers.entries()).map(([userId, socketSet]) => [userId, Array.from(socketSet)])
      ));
    });
  });
};

// Helper function để in Map cho đẹp
function mapToObject(map) {
  const obj = {};
  for (const [key, value] of map.entries()) {
    obj[key] = Array.from(value);
  }
  return obj;
}

function emitBlockAccount(userId) {
  if (!ioGlobal) {
    console.error("❌ io is not initialized");
    return;
  }
  const sockets = onlineUsers.get(userId);
  if (sockets && sockets.size > 0) {
    for (const socketId of sockets) {
      const socket = ioGlobal.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit('block_account', { userId });
      }
    }
    console.log(`🚫 Emit block_account to user ${userId}`);
  }
}

module.exports.onlineUsers = onlineUsers;
module.exports.emitBlockAccount = emitBlockAccount;
