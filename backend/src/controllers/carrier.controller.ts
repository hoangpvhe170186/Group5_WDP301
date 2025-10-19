import { Request, Response } from "express";
import Order from "../models/Order";
import Incident from "../models/Incident";
import UploadEvidence from "../models/UploadEvidence";
import { uploadToCloudinary } from "../lib/cloudinary";
import { Types } from "mongoose";

function getCarrierId(req: Request): string | null {
  return (req as any)?.user?._id || (req as any)?.user?.id || null;
}
function carrierFilter(userId: string) {
  const id = new Types.ObjectId(userId);
  return {
    $or: [
      { carrier_id: id },
      { carrier: id },
      { driver_id: id },
      { assigned_to: id },
    ],
  };
}

export const getCarrierOrders = async (req, res) => {
  try {
    const userId = (req as any)?.user?._id || (req as any)?.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const id = new Types.ObjectId(userId);
    const where = { $or: [{ carrier_id: id }, { carrier: id }, { driver_id: id }, { assigned_to: id }] };

    const orders = await Order.find(where)
      .sort({ updatedAt: -1 })
      // .populate("customer", "name email phone") // ❌ gây lỗi — bỏ
      .lean();

    return res.json({ orders });
  } catch (err) {
    console.error("getCarrierOrders error:", err);
    return res.status(500).json({ message: "Error fetching carrier orders" });
  }
};

export const getCarrierOrderDetail = async (req, res) => {
  try {
    const userId = (req as any)?.user?._id || (req as any)?.user?.id;
    const { orderId } = req.params;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!Types.ObjectId.isValid(orderId)) return res.status(400).json({ message: "Invalid ID" });

    const id = new Types.ObjectId(userId);
    const order = await Order.findOne({
      _id: new Types.ObjectId(orderId),
      $or: [{ carrier_id: id }, { carrier: id }, { driver_id: id }, { assigned_to: id }],
    })
      // .populate("customer", "name email phone") // ❌ bỏ
      .lean();

    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.json(order);
  } catch (err) {
    console.error("getCarrierOrderDetail error:", err);
    return res.status(500).json({ message: "Error fetching order detail" });
  }
};

export const acceptOrder = async (req: Request, res: Response) => {
  try {
    const userId = getCarrierId(req);
    const { orderId } = req.params;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const updated = await Order.findByIdAndUpdate(
      orderId,
      { carrier_id: userId, status: "ACCEPTED" },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: "Order not found" });

    return res.json(updated);
  } catch (err: any) {
    console.error("❌ acceptOrder error:", err);
    return res.status(500).json({ message: "Error accepting order" });
  }
};
export const updateOrderProgress = async (req: Request, res: Response) => {
  try {
    const userId = getCarrierId(req);
    const { orderId } = req.params;
    const { status } = req.body;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const updated = await Order.findOneAndUpdate(
      { _id: orderId, ...carrierFilter(userId) },
      { $set: { status } },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: "Order not found" });

    return res.json(updated);
  } catch (err: any) {
    console.error("❌ updateOrderProgress error:", err);
    return res.status(500).json({ message: "Error updating progress" });
  }
};
// ✅ Kiểm tra thông tin Carrier hiện tại
export const getMe = async (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json({
    id: user._id,
    fullName: user.full_name || user.fullName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    licenseNumber: user.licenseNumber,
    vehiclePlate: user.vehiclePlate,
    documents: user.documents || [],
  });
};

// ✅ Cập nhật thông tin cá nhân
export const updateMe = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { fullName, phone, licenseNumber, vehiclePlate } = req.body;
  Object.assign(user, { fullName, phone, licenseNumber, vehiclePlate });
  await user.save();
  res.json({
    id: user._id,
    fullName: user.fullName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    documents: user.documents || [],
  });
};

// ✅ Lấy toàn bộ đơn được assign cho Carrier
export const listOrders = async (req: Request, res: Response) => {
  const user = (req as any).user;
  console.log("🔎 USER TOKEN ID:", user._id);
  console.log("🟡 Carrier Query filter:", { carrier_id: user._id });
  const orders = await Order.find({ carrier_id: user._id })
    .populate("customer_id")
    .populate("package_id")
    .sort({ createdAt: -1 });

  return res.json({
    orders: orders.map((o: any) => ({
      id: String(o._id),
      orderCode: o.orderCode || `ORD-${String(o._id).slice(-6).toUpperCase()}`,
      customerName: o.customer_id?.full_name || "",
      pickup: { address: o.pickup_address },
      dropoff: { address: o.delivery_address },
      goodsSummary: o.package_id?.name || "",
      scheduledTime: o.scheduled_time || "",
      estimatePrice: o.total_price || 0,
      status: o.status,
    })),
  });
};

// ✅ Chi tiết đơn
export const getOrder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const o: any = await Order.findById(id)
    .populate("customer_id")
    .populate("package_id");
  if (!o) return res.status(404).json({ message: "Order not found" });

  res.json({
    id: String(o._id),
    orderCode: o.orderCode || `ORD-${String(o._id).slice(-6).toUpperCase()}`,
    customerName: o.customer_id?.full_name || "",
    pickup: { address: o.pickup_address },
    dropoff: { address: o.delivery_address },
    goodsSummary: o.package_id?.name || "",
    scheduledTime: o.scheduled_time || "",
    estimatePrice: o.total_price || 0,
    status: o.status,
  });
};


// ✅ Carrier từ chối đơn
export const declineOrder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const o = await Order.findByIdAndUpdate(id, { status: "DECLINED" }, { new: true });
  res.json(o);
};

// ✅ Xác nhận hợp đồng
export const confirmContract = async (req: Request, res: Response) => {
  const { id } = req.params;
  const o = await Order.findByIdAndUpdate(id, { status: "CONFIRMED" }, { new: true });
  res.json(o);
};

// ✅ Cập nhật tiến trình đơn hàng
export const updateProgress = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status: string };
  const allowed = ["ASSIGNED", "ACCEPTED", "CONFIRMED", "ON_THE_WAY", "ARRIVED", "DELIVERING", "DELIVERED", "COMPLETED"];
  if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status" });
  const o = await Order.findByIdAndUpdate(id, { status }, { new: true });
  res.json(o);
};

// ✅ Upload bằng chứng BEFORE/AFTER
export const uploadEvidence = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  const { phase } = req.body as { phase: "BEFORE" | "AFTER" };
  // @ts-ignore
  const files = (req.files as Express.Multer.File[]) || [];
  const uploads = await Promise.all(
    files.map(async (f) => {
      const r = await uploadToCloudinary(f.path);
      return { url: r.secure_url, type: f.mimetype };
    })
  );
  const doc = await UploadEvidence.create({ orderId: id, phase, files: uploads, uploadedBy: user._id });
  res.json(doc);
};

// ✅ Báo sự cố
export const reportIncident = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  const { type, description } = req.body as { type: string; description: string };
  // @ts-ignore
  const files = (req.files as Express.Multer.File[]) || [];
  const uploads = await Promise.all(
    files.map(async (f) => {
      const r = await uploadToCloudinary(f.path);
      return { url: r.secure_url, type: f.mimetype };
    })
  );
  const inc = await (Incident as any).create({
    orderId: id,
    reporterId: user._id,
    type,
    description,
    attachments: uploads,
    status: "OPEN",
  });
  res.json(inc);
};

// ✅ Xác nhận hoàn tất giao hàng
export const confirmDelivery = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { signatureUrl } = req.body as { signatureUrl?: string };
  const o = await Order.findByIdAndUpdate(id, { status: "COMPLETED" }, { new: true });
  res.json({ order: o, signatureUrl });
};
