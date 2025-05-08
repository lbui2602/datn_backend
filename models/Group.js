  const mongoose = require("mongoose");

  const GroupSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true, trim: true }, 
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
  }, { timestamps: true }); 

  module.exports = mongoose.model("Group", GroupSchema);
