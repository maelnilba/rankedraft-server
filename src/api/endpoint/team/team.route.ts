import express, { Request, Response } from "express";
import {
  getTeams,
  getTeamsNames,
  joinTeam,
  postTeam,
  quitTeam,
} from "./team.controller";
const router = express.Router();

router.put("/quit", async (req: Request, res: Response, next) => {
  try {
    const payload = req.body;
    const message = await quitTeam(payload, res.locals.user);

    if (message) {
      res.status(403);
      return;
    }
    res.send({ message });
  } catch (error) {
    console.log(error);
  }
});

router.put("/join", async (req: Request, res: Response, next) => {
  try {
    const payload = req.body;
    let message: string;
    try {
      message = await joinTeam(payload, res.locals.user);
    } catch (error) {
      message = "";
    }

    res.send({ message });
  } catch (error) {
    console.log(error);
  }
});

router.get("/names", async (req: Request, res: Response, next) => {
  try {
    const data = await getTeamsNames(res.locals.user);

    res.send({ message: data });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req: Request, res: Response, next) => {
  try {
    const data = await getTeams(res.locals.user);

    res.send({ message: data });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req: Request, res: Response, next) => {
  try {
    const payload = req.body;
    const message = await postTeam(payload, res.locals.user);
    if (message) {
      res.status(403);
      return;
    }
    res.send({ message });
  } catch (error) {
    next(error);
  }
});

export { router };
