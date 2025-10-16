// backend/src/routes/vehicles.route.ts
import { Router } from "express";
import Vehicle from "../models/Vehicle";
import { cldUrl } from "../utils/cloudinaryUrl"; // nếu có

const router = Router();

// GET /api/vehicles
router.get("/", async (_req, res, next) => {
  try {
    const docs = await Vehicle.find().lean();

    const mapped = docs.map((v: any) => {
      const pid = v?.image?.public_id;
      const original =
        v?.image?.original ||
        (pid ? cldUrl(pid) : undefined) ||
        v?.image?.url; // fallback nếu DB lưu url
      const thumb =
        v?.image?.thumb ||
        (pid ? cldUrl(pid, "w_800,h_600,c_fill,q_auto,f_auto") : undefined) ||
        original;

      return { ...v, image: { ...v.image, original, thumb } };
    });

    res.json(mapped);
  } catch (err) {
    next(err);
  }
});

// (nếu cần) PATCH cập nhật ảnh theo biển số
router.patch("/:plate/image", async (req, res, next) => {
  try {
    const { plate } = req.params;
    const { url, public_id } = req.body;
    const update: any = {};
    if (url) update["image.original"] = url;
    if (public_id) update["image.public_id"] = public_id;
    const doc = await Vehicle.findOneAndUpdate(
      { plate_number: plate },
      { $set: update },
      { new: true }
    ).lean();
    if (!doc) return res.status(404).json({ message: "Vehicle not found" });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

export default router;
