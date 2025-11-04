import ExtraFee from "../models/ExtraFee";

export const getAllExtraFees = async (req, res) => {
  try {
    const fees = await ExtraFee.find({ is_active: true }).sort({ category: 1 });
    res.json({ success: true, data: fees });
  } catch (err) {
    console.error("getAllExtraFees error:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách phụ phí",
    });
  }
};