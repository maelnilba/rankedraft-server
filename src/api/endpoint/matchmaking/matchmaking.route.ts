import express, { Request, Response } from "express";
import { getQueue, getSpectator } from "./matchmaking.controller";
const router = express.Router();

router.get("/lobbies", async (req: Request, res: Response, next) => {
  try {
    const data = await getSpectator();
    if (!data) {
      res.status(403);
      throw new Error("Error in get lobbies");
    }

    res.send({ message: data });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.get("/queue", async (req: Request, res: Response, next) => {
  try {
    const type = req.query.type as string;
    const data = await getQueue({ type });
    if (data === undefined) {
      res.status(403);
      throw new Error("Error in get queue");
    }

    res.send({ message: data });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

export { router };
