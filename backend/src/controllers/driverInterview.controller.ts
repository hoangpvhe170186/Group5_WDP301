import DriverInterviewRequest from "../models/DriverInterviewRequest";
import Notification from "../models/Notification";

export async function applyInterview(req, res) {
  try {
    const payload = { ...req.body };
    if (payload.preferred_day) payload.preferred_day = new Date(payload.preferred_day);

    const doc = await DriverInterviewRequest.create(payload);

    // tạo thông báo cho seller
    await Notification.create({
      recipient_role: "seller",
      ref_type: "DriverInterview",
      ref_id: doc._id,
      message: `Ứng viên tài xế mới: ${doc.full_name} — ${doc.phone}`,
      type: "DriverInterview",
      is_read: false,
    });
const io = req.app.get("io");
    if (io) {
      io.to("support_staff").emit("new_notification", {
        type: "DriverInterview",
        ref_type: "DriverInterview",
        ref_id: doc._id,
        message: `Ứng viên tài xế mới: ${doc.full_name} — ${doc.phone}`,
        created_at: new Date(),
      });
    }

    return res.status(201).json({ ok: true, id: doc._id });
  } catch (e) {
    console.error("applyInterview error:", e);
    return res.status(400).json({ message: e.message });
  }
}

export async function listInterviews(req, res) {
  try {
    const list = await DriverInterviewRequest.find().sort({ created_at: -1 }).lean();
    res.json(list);
  } catch (e) {
    console.error("listInterviews error:", e);
    res.status(500).json({ message: e.message });
  }
}

export async function updateStatus(req, res) {
  try {
    const doc = await DriverInterviewRequest.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, reviewed_by: req.user?._id, reviewed_at: new Date() },
      { new: true }
    );
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}
