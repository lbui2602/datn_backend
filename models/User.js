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
    roleId: { type: String, ref: 'Role', required: true }, // Liên kết đến bảng Role
    idDepartment: { type: String, ref: 'Department', required: true }, // Liên kết đến bảng Department
    image: { type: String, required: false },
    face_token: { type: String, required: false },
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
