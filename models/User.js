const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    fullName_no_accent: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    birthday: { type: String, required: true }, // Ngày sinh dạng String
    gender: { type: String, required: true },   // Giới tính dạng String
    roleId: { type: String, ref: 'Role', required: true },
    idDepartment: { type: String, ref: 'Department', required: true },
    image: { type: String, required: false },
    status: { type: Boolean, required: true }
  },
  { timestamps: true }
);

// Hash mật khẩu trước khi lưu
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// So sánh mật khẩu
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
