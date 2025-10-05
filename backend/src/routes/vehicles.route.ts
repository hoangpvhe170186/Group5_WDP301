// routes/vehicles.route.ts (BE)
import { Router } from "express";
import Vehicle from "../models/Vehicle";
import { cldUrl } from "../utils/cloudinaryUrl";

const router = Router();

router.get("/", async (_req, res) => {
  const docs = await Vehicle.find().lean();

  const withUrls = docs.map((v: any) => {
    const image = v.image || {};
    const pid = v.image?.public_id;
const original = v.image?.original || (pid ? cldUrl(pid) : undefined);
const thumb    = v.image?.thumb    || (pid ? cldUrl(pid, "w_800,h_600,c_fill,q_auto,f_auto") : undefined);
    return { ...v, image: { ...image, original, thumb } };
  });

  res.json(withUrls);
});

export default router;
