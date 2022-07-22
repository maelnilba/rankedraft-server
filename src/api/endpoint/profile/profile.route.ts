import express, { Response, Request } from "express";
import {
  getProfileFromId,
  getProfile,
  updateProfile,
  updateProfileVisibility,
  getProfileVisibility,
} from "./profile.controller";
const router = express.Router();

router.get("/:id", async (req: Request, res: Response, next) => {
  try {
    const id = req.params.id;
    const data = await getProfileFromId(id);
    res.send({ message: data });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req: Request, res: Response, next) => {
  try {
    const data = await getProfile(res.locals.user);
    res.send({ message: data });
  } catch (error) {
    next(error);
  }
});

router.get("/ladder/visibility", async (req: Request, res: Response, next) => {
  try {
    const data = await getProfileVisibility(res.locals.user);
    res.send({ message: data });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req: Request, res: Response, next) => {
  try {
    const payload = req.body;

    await updateProfile(payload, res.locals.user);
    res.send({ message: "" });
  } catch (error) {
    next(error);
  }
});

router.post("/ladder/visibility", async (req: Request, res: Response, next) => {
  try {
    const payload = req.body;
    const data = await updateProfileVisibility(payload, res.locals.user);
    res.send({ message: data });
  } catch (error) {
    next(error);
  }
});

export { router };
