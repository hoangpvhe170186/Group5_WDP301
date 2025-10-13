import { Request, Response } from "express";
import Order from "../models/Order";
import Incident from "../models/Incident"; // assume exists in your repo
import UploadEvidence from "../models/UploadEvidence";
import { uploadToCloudinary } from "../lib/cloudinary";

export const getMe = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const profile = {
    id: user._id,
    fullName: user.fullName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    licenseNumber: user.licenseNumber,
    vehiclePlate: user.vehiclePlate,
    documents: user.documents || [],
  };
  res.json(profile);
};

export const updateMe = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { fullName, phone, licenseNumber, vehiclePlate } = req.body;
  Object.assign(user, { fullName, phone, licenseNumber, vehiclePlate });
  await user.save();
  return res.json({
    id: user._id,
    fullName: user.fullName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    licenseNumber: user.licenseNumber,
    vehiclePlate: user.vehiclePlate,
    documents: user.documents || [],
  });
};

export const listOrders = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { status } = req.query as { status?: string };

  const filter: any = { carrierId: user._id };
  if (status === "ACTIVE") {
    filter.status = { $in: ["ACCEPTED", "CONFIRMED", "ON_THE_WAY", "ARRIVED", "DELIVERING", "DELIVERED"] };
  } else if (status === "HISTORY") {
    filter.status = { $in: ["COMPLETED", "CANCELLED"] };
  } else if (status) {
    filter.status = status;
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 });
  res.json(orders.map((o) => ({
    id: String(o._id),
    orderCode: o.orderCode,
    customerName: "",
    pickup: o.pickup,
    dropoff: o.dropoff,
    goodsSummary: o.goodsSummary,
    scheduledTime: o.scheduledTime,
    estimatePrice: o.estimatePrice,
    status: o.status,
  })));
};

export const getOrder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const o = await Order.findById(id);
  if (!o) return res.status(404).json({ message: "Order not found" });
  res.json({
    id: String(o._id),
    orderCode: o.orderCode,
    customerName: "",
    pickup: o.pickup,
    dropoff: o.dropoff,
    goodsSummary: o.goodsSummary,
    scheduledTime: o.scheduledTime,
    estimatePrice: o.estimatePrice,
    status: o.status,
  });
};

export const acceptOrder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const o = await Order.findByIdAndUpdate(id, { status: "ACCEPTED" }, { new: true });
  res.json(o);
};

export const declineOrder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const o = await Order.findByIdAndUpdate(id, { status: "DECLINED" }, { new: true });
  res.json(o);
};

export const confirmContract = async (req: Request, res: Response) => {
  const { id } = req.params;
  const o = await Order.findByIdAndUpdate(id, { status: "CONFIRMED" }, { new: true });
  res.json(o);
};

export const updateProgress = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status: any };
  const allowed = ["ACCEPTED", "CONFIRMED", "ON_THE_WAY", "ARRIVED", "DELIVERING", "DELIVERED", "COMPLETED"];
  if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status" });
  const o = await Order.findByIdAndUpdate(id, { status }, { new: true });
  res.json(o);
};

export const uploadEvidence = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  const { phase } = req.body as { phase: "BEFORE" | "AFTER" };

  // @ts-ignore
  const files = (req.files as Express.Multer.File[]) || [];
  const uploads = await Promise.all(
    files.map(async (f) => {
      const r = await uploadToCloudinary
      (f.path);
      return { url: r.secure_url, type: f.mimetype };
    })
  );

  const doc = await UploadEvidence.create({ orderId: id, phase, files: uploads, uploadedBy: user._id });
  res.json(doc);
};

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

export const confirmDelivery = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { signatureUrl } = req.body as { signatureUrl?: string };
  const o = await Order.findByIdAndUpdate(id, { status: "COMPLETED" }, { new: true });
  res.json({ order: o, signatureUrl });
};
