const nodemailer = require("nodemailer");
const User = require("../models/User");

// Lưu OTP tạm thời (sử dụng object)
const otpStorage = {}; // { email: otp }

exports.sendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    // Kiểm tra email có tồn tại trong DB không
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "Email không tồn tại trong hệ thống!", code: "0" });
    }

    // Tạo mã OTP ngẫu nhiên
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Lưu tạm OTP vào bộ nhớ (hoặc Redis/DB nếu muốn)
    otpStorage[email] = otp;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "vebongdack@gmail.com",
        pass: process.env.APP_PASS, // App Password từ Google
      },
    });

    const mailOptions = {
      from: "vebongdack@gmail.com",
      to: email,
      subject: "Mã xác thực OTP",
      text: `Mã OTP của bạn là: ${otp}`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Đã gửi OTP", email, code: "1" });
  } catch (error) {
    console.error(error);
    res.json({ message: "Lỗi khi gửi email: " + error.message, code: "0" });
  }
};

exports.verifyOtp = (req, res) => {
  const { email, otp } = req.body;
  const storedOtp = otpStorage[email];

  if (!storedOtp) {
    return res.json({ message: "Không tìm thấy OTP cho email này", code: "0" });
  }

  if (otp === storedOtp) {
    // OTP đúng, có thể xóa khỏi bộ nhớ
    delete otpStorage[email];
    return res.json({ message: "Xác thực OTP thành công", code: "1" });
  } else {
    return res.json({ message: "Sai mã OTP", code: "0" });
  }
};
