const mongoose = require("mongoose");

const GroupSchema = new mongoose.Schema({
  name: String,
  members: [String], // Danh sách userId
});

module.exports = mongoose.model("Group", GroupSchema);
