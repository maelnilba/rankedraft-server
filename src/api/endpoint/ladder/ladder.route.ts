import express, { Request, Response } from "express";
import { getLadder, getRank } from "./ladder.controller";
const router = express.Router();

router.get("/rank/:id", async (req: Request, res: Response, next) => {
  try {
    const id = req.params.id;

    const data = await getRank(id);

    if (!data) {
      res.status(403);
      throw new Error("Error in get ladder");
    }

    res.send({ message: data });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.get("/", async (req: Request, res: Response, next) => {
  try {
    const page = parseInt(req.query.page as string);
    const data = await getLadder({ page });

    if (!data) {
      res.status(403);
      throw new Error("Error in get ladder");
    }

    res.send({ message: data });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

export { router };
