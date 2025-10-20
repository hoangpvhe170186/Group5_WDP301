import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

export async function uploadToCloudinary(localPath: string) {
  return cloudinary.uploader.upload(localPath, { resource_type: "auto" });
}

// 👉 Export default để tránh lỗi "no exported member"
export default uploadToCloudinary;
