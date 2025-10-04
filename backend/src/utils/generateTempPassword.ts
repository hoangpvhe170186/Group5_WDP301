// Hàm tạo mật khẩu tạm thời ngẫu nhiên
const generateTempPassword = (length: number = 8): string => {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  const allChars = lower + upper + numbers + special;

  let password = "";
  password += lower[Math.floor(Math.random() * lower.length)];
  password += upper[Math.floor(Math.random() * upper.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Đảm bảo đủ độ dài còn lại
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Trộn ngẫu nhiên các ký tự trong mật khẩu
  return password.split("").sort(() => Math.random() - 0.5).join("");
};

export { generateTempPassword };
