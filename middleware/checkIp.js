
const allowedIps = [
  '::ffff:192.168.52.236',
  '::ffff:127.0.0.1' // ví dụ: IP nội bộ trong mạng LAN
  // Thêm IP hợp lệ tại đây
];

const checkIp = (req, res, next) => {
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
    req.connection.remoteAddress;

  console.log('Request from IP:', ip);

  if (ip.startsWith('::ffff:192.168.52.') || allowedIps.includes(ip)) {
    next(); // IP hợp lệ, cho phép đi tiếp
  } else {
    return res.json({ message: 'Vui lòng bắt wifi công ty.', code : '0' });
  }
};

module.exports = checkIp;
