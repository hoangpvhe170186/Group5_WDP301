
export const cldUrl = (
  publicId: string,
  transform?: string,
  resourceType: "image" | "video" = "image"
) => {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME!;
  const t = transform ? `${transform}/` : "";
  return `https://res.cloudinary.com/${cloud}/${resourceType}/upload/${t}${publicId}`;
};

export const cldThumb = (publicId: string, resourceType: "image" | "video" = "image") => {
  if (resourceType === "video") {
    // so_1: lấy frame đầu, f_jpg: xuất JPG
    return cldUrl(`${publicId}.jpg`, "so_1,w_800,h_600,c_fill,q_auto", "video");
  }
  return cldUrl(publicId, "w_800,h_600,c_fill,q_auto,f_auto", "image");
};
