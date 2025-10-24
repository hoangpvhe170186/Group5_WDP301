// utils/generateCode.js
export function generateCode(prefix) {
  const year = new Date().getFullYear().toString().slice(-2); // Lấy 2 số cuối năm hiện tại (VD: "25")
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase(); // VD: "8A3B2C"
  return `${prefix}-${year}-${randomPart}`;
}
