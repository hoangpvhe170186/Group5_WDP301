import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

export { cloudinary };          // named export
export default cloudinary;      // default export là client

// (tuỳ chọn) helper nếu cần
export async function uploadToCloudinary(localPath: string, opts: any = {}) {
  return cloudinary.uploader.upload(localPath, { resource_type: "auto", ...opts });
}
