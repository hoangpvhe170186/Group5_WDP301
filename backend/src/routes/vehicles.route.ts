// routes/vehicles.route.ts

import { Router } from "express";
import Vehicle from "../models/Vehicle";
import { cldUrl } from "../utils/cloudinaryUrl";
// 👇 1. Import hàm mới từ controller (giả sử bạn đã thêm nó vào)
import { getVehicleNavigationList } from "../controllers/vehicle.controller"; 

const router = Router();

// Route mới để lấy danh sách xe cho việc điều hướng
// 👇 2. Thêm route mới vào đây
router.get("/navigation-list", getVehicleNavigationList);

router.get("/", async (_req, res) => {
  const docs = await Vehicle.find().lean();
  const withUrls = docs.map((v: any) => {
    const image = v.image || {};
    const pid = v.image?.public_id;
    const original = v.image?.original || (pid ? cldUrl(pid) : undefined);
    const thumb = v.image?.thumb || (pid ? cldUrl(pid, "w_800,h_600,c_fill,q_auto,f_auto") : undefined);
    return { ...v, image: { ...image, original, thumb } };
  });
  res.json(withUrls);
});

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const v = await Vehicle.findById(id).lean();
    if (!v) return res.status(404).json({ error: "Not found" });
    const image = v.image || {};
    const pid = v.image?.public_id;
    const original = v.image?.original || (pid ? cldUrl(pid) : undefined);
    const thumb = v.image?.thumb || (pid ? cldUrl(pid, "w_800,h_600,c_fill,q_auto,f_auto") : undefined);
    res.json({ ...v, image: { ...image, original, thumb } });
  } catch (err) {
    console.error("GET /api/vehicles/:id error", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;