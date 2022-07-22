import express, { Request, Response } from "express";
import { Role } from "../../types/Role";
import { editProfile, getProfiles } from "./moderation.controller";
const router = express.Router();

router.get("/profile/:names", async (req: Request, res: Response, next) => {
  try {
    const names = req.params.names;
    const data = await getProfiles(names);
    res.send({ message: data });
  } catch (error) {
    next(error);
  }
});

router.put("/profile", async (req: Request, res: Response, next) => {
  try {
    const payload: {
      avatar?: number;
      elo?: number;
      role?: Role;
      ban?: number;
      user_id: string;
    } = req.body;

    await editProfile(payload);
  } catch (error) {
    console.log(error);
  }
});

export { router };
