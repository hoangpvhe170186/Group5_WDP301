// Hàm tạo mã OTP 6 chữ số
const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 số
};

export { generateOtp };