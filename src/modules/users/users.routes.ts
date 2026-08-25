import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { getUser, updateUser } from "./users.controller";

const router = Router();

router.get("/profile", authenticate, getUser);
router.patch("/profile", authenticate, updateUser);

export default router;
