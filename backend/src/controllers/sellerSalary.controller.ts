
import { Request, Response } from "express";
import {
  calculateSellerSalary,
  getSellerSalary,
  listSellerSalaries,
  getSalariesSummary,
} from "../services/sellerSalary.service";

export async function postCalculate(req: Request, res: Response) {
  try {
    const { sellerId } = req.params;
    const { month, year, baseSalary, commissionPerOrder } = req.body;

    const record = await calculateSellerSalary(sellerId, Number(month), Number(year), {
      baseSalary,
      commissionPerOrder,
    });
    res.json({ success: true, data: record });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const { sellerId } = req.params;
    const { month, year } = req.query;
    const record = await getSellerSalary(
      String(sellerId),
      Number(month),
      Number(year)
    );
    res.json({ success: true, data: record });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function getList(req: Request, res: Response) {
  try {
    const { month, year, sellerId, page, limit } = req.query as any;
    const result = await listSellerSalaries({
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
      sellerId,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function getSummary(req: Request, res: Response) {
  try {
    const { month, year } = req.query as any;
    const summary = await getSalariesSummary(Number(month), Number(year));
    res.json({ success: true, data: summary });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}
