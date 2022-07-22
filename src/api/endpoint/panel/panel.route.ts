import express, { Request, Response } from "express";
import { matchmaking } from "../../../app";
const router = express.Router();

router.get("/", async (req: Request, res: Response, next) => {
  try {
    let data = matchmaking.panel();

    if (!data) {
      res.status(403);
      throw new Error("Error in get panel");
    }

    res.send({ message: data });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

export { router };
