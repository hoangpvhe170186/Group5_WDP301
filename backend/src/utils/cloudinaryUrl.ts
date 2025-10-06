// cloudinaryUrl.ts
export const cldUrl = (publicId: string, transform?: string) => {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME!;
  const t = transform ? `${transform}/` : "";
  return `https://res.cloudinary.com/${cloud}/image/upload/${t}${publicId}`;
};

