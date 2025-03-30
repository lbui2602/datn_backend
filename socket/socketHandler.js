const MessageController = require("../controllers/messageController");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_group", (groupId) => {
      socket.join(groupId);
      console.log(`User joined group ${groupId}`);
    });

    socket.on("send_message", async (data) => {
      const newMessage = await MessageController.createMessage(data);
      io.to(data.groupId).emit("receive_message", newMessage);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
};
