import { UserDocument } from "../models/User"; // chỉnh đúng đường dẫn model User
import { Connection } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument & { id?: string }; // nếu bạn dùng JWT decode thì giữ id
      db?: Connection | any; // nếu bạn inject mongoose vào req.db
    }
  }
}
