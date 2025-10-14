import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  getUserByName
} from "../controllers/user.controller";

const router = express.Router();

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);

export default router;
