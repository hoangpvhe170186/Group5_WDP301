export type Blog = {
  slug: string;
  title: string;
  cover: string;
  intro: string;
  sections?: { heading?: string; bullets?: string[]; body?: string }[];
  outro?: string;
};

export const BLOGS: Record<string, Blog> = {
  "5-meo-dong-goi-do-dien-tu-an-toan": {
    slug: "5-meo-dong-goi-do-dien-tu-an-toan",
    title: "5 mẹo đóng gói đồ điện tử an toàn",
    cover: "/photo1.png",
    intro:
      "Đồ điện tử (TV, PC, loa, màn hình…) cần đóng gói cẩn thận để tránh sốc và ẩm trong quá trình vận chuyển.",
    sections: [
      {
        bullets: [
          "Ưu tiên hộp gốc: vừa khít, có mút đệm chuẩn hãng.",
          "Bọc bong bóng/xốp dày, nhất là phần góc và màn hình.",
          "Tháo rời & gom phụ kiện: bỏ túi zip, dán nhãn theo thiết bị.",
          "Dán & đánh dấu rõ: “Hàng dễ vỡ”, “Đặt đứng”, mũi tên chỉ chiều.",
          "Chống ẩm nhẹ: thêm gói hút ẩm (không chạm linh kiện).",
        ],
      },
    ],
    outro: "Đến nơi, mở hộp từ tốn và thử nguồn ngay để xử lý kịp thời nếu có vấn đề.",
  },

  "kinh-nghiem-van-chuyen-do-cong-kenh": {
    slug: "kinh-nghiem-van-chuyen-do-cong-kenh",
    title: "Kinh nghiệm vận chuyển đồ cồng kềnh",
    cover: "/photo.png",
    intro:
      "Tủ lạnh, máy giặt, sofa góc… dễ trầy xước và khó di chuyển. Chuẩn bị đúng sẽ giảm rủi ro và tiết kiệm thời gian.",
    sections: [
      { heading: "Đo đạc trước", bullets: ["Đo đồ + cửa/thang máy/hành lang.", "Tháo rời bộ phận rời nếu có."] },
      { heading: "Bọc bảo vệ", bullets: ["Mút xốp + màng PE phủ toàn bộ.", "Gia cố mép/góc; dán cảnh báo hướng đặt."] },
      { heading: "Dụng cụ", bullets: ["Xe đẩy, dây bản to, găng tay chống trượt.", "Đai nâng vai để phân tải trọng."] },
      { heading: "Kỹ thuật", bullets: ["Ưu tiên đi thẳng, người dẫn đường hô nhịp.", "Kê carton bảo vệ tường/thang máy."] },
      { heading: "Lên xe", bullets: ["Chọn thùng xe phù hợp kích thước.", "Chằng dây chữ X, chèn xốp chống rung."] },
    ],
    outro: "Nếu quá nặng, nên đặt gói bốc xếp chuyên nghiệp để an toàn cho người và tài sản.",
  },

  "checklist-chuyen-nha-trong-ngay": {
    slug: "checklist-chuyen-nha-trong-ngay",
    title: "Checklist chuyển nhà trong ngày",
    cover:
      "https://boxnlok.vn/uploads/blog/2025/Checklist-chuyen-nha-chung-cu-day-du-2025/Checklist-chuyen-nha-chung-cu-day-du-2025.jpg",
    intro: "Chuyển nhà gấp? Checklist tối giản này giúp bạn hoàn thành trong 1 ngày mà không rối.",
    sections: [
      {
        heading: "–24 → –6 giờ",
        bullets: [
          "Chốt xe/bốc xếp; đặt thang máy (chung cư).",
          "Chuẩn bị thùng, băng keo, bút lông, túi zip.",
          "Phân loại: dễ vỡ, điện tử, giấy tờ quan trọng.",
        ],
      },
      {
        heading: "–6 → –2 giờ",
        bullets: [
          "Mỗi phòng 1 màu nhãn; ghi PHÒNG + MỤC + ƯU TIÊN.",
          "Balo khẩn cấp: giấy tờ, tiền, sạc, quần áo 1–2 ngày.",
          "Xả nước máy giặt, xả tuyết tủ lạnh (nếu kịp).",
        ],
      },
      { heading: "–2 → 0 giờ", bullets: ["Thông thoáng đường đi.", "Ưu tiên đồ cồng kềnh trước, hộp sau."] },
      { heading: "0 → +4 giờ", bullets: ["Đặt đúng phòng theo nhãn.", "Mở balo khẩn cấp trước, còn lại mở dần."] },
    ],
    outro: "Giữ ưu tiên rõ ràng, bạn sẽ chuyển nhà gọn trong 1 ngày mà vẫn kiểm soát tiến độ.",
  },
};
