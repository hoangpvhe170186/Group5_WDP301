import nodemailer, { SentMessageInfo, Transporter } from "nodemailer";

// Định nghĩa kiểu cho đối số của hàm sendMail
interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

// Kiểu kết quả trả về của hàm sendMail
interface SendMailResult {
  success: boolean;
  info?: SentMessageInfo;
  error?: string;
}

const sendMail = async ({
  to,
  subject,
  html,
}: SendMailOptions): Promise<SendMailResult> => {
  // Tạo transporter với cấu hình SMTP
  const transporter: Transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT), // Chuyển đổi từ string sang number
    secure: process.env.SMTP_PORT === "465", // true nếu 465, false nếu 587
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"Hệ thống" <${process.env.EMAIL_USERNAME}>`, // Tên người gửi
    to,
    subject,
    html,
  };

  try {
    const info: SentMessageInfo = await transporter.sendMail(mailOptions);
    return { success: true, info };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export { sendMail };