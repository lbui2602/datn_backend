const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true, index: true }, 
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
  message: { type: String, required: true, trim: true }, 
}, { timestamps: true }); 

module.exports = mongoose.model("Message", MessageSchema);
