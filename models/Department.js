const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  _id: {type : String, required : true},
  name: { type: String, required: true, unique: true }
}, 
{ _id: false }
);

module.exports = mongoose.model('Department', DepartmentSchema);
