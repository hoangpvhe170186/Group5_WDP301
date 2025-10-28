import { Request, Response } from "express";
import DriverInterviewRequest from "../models/DriverInterviewRequest";
import Notification from "../models/Notification";

function toISODateOnly(d?: Date | string) {
  if (!d) return undefined;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return undefined;
  // trả ISO để FE định dạng lại
  return date.toISOString();
}

export async function applyInterview(req: Request, res: Response) {
  try {
    const payload = { ...req.body };

    payload.full_name = String(payload.full_name || "").trim();
    payload.phone = String(payload.phone || "").trim();
    payload.email = String(payload.email || "").trim();
    payload.city = String(payload.city || "").trim();
    payload.vehicle_type = String(payload.vehicle_type || "truck").trim();
    payload.notes = String(payload.notes || "").trim();

    if (payload.preferred_day) {
      const d = new Date(payload.preferred_day);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ message: "preferred_day không hợp lệ" });
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (d < today) {
        return res.status(400).json({ message: "preferred_day phải từ hôm nay trở đi" });
      }
      payload.preferred_day = d;
    } else {
      return res.status(400).json({ message: "Thiếu preferred_day" });
    }

    if (!["morning", "afternoon"].includes(payload.time_slot)) {
      return res.status(400).json({ message: "time_slot không hợp lệ" });
    }

    if (payload.note_image && typeof payload.note_image === "object") {
      const { url, public_id } = payload.note_image;
      payload.note_image = {
        url: url || undefined,
        public_id: public_id || undefined,
      };
    } else {
      payload.note_image = null;
    }

    const doc = await DriverInterviewRequest.create(payload);

    await Notification.create({
      type: "DriverInterview",
      message: `Ứng viên tài xế mới: ${doc.full_name} — ${doc.phone}`,
      ref_type: "DriverInterview",
      ref_id: String(doc._id),
      recipient_role: "seller",
      meta: {
        image_url: doc?.note_image?.url || undefined,
        preferred_day: toISODateOnly(doc?.preferred_day),
        time_slot: doc?.time_slot || undefined,
        notes: doc?.notes || undefined,
      },
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
  } catch (e: any) {
    console.error("applyInterview error:", e);
    return res.status(400).json({ message: e.message || "Bad request" });
  }
}

export async function listInterviews(req: Request, res: Response) {
  try {
    const list = await DriverInterviewRequest.find().sort({ created_at: -1 }).lean();
    res.json(list);
  } catch (e: any) {
    console.error("listInterviews error:", e);
    res.status(500).json({ message: e.message || "Server error" });
  }
}

export async function updateStatus(req: Request, res: Response) {
  try {
    const doc = await DriverInterviewRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status,
        reviewed_by: (req as any).user?._id,
        reviewed_at: new Date(),
      },
      { new: true }
    ).lean();
    res.json(doc);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Server error" });
  }
}
