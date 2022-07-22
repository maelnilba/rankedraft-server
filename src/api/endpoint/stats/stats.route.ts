import express, { Request, Response } from "express";
import { getStats } from "./stats.controller";
import { AllStats } from "./StatsFunction";

const router = express.Router();

router.get("/", async (req: Request, res: Response, next) => {
  try {
    const pseudo = req.query.pseudo as string;
    const team_id = req.query.team_id as string;
    const map_id = req.query.map_id as string;
    const result = req.query.result as string;
    const letter = req.query.letter as string;
    const is_kta = req.query.is_kta as string;
    const initiative = req.query.initiative as string;
    const start_date = req.query.start_date as string;
    const end_date = req.query.end_date as string;
    const compo = req.query.compo as string;
    const respect_order =
      (req.query.respect_order as string) === "true" ? true : false;
    const respect_compo =
      (req.query.respect_compo as string) === "true" ? true : false;
    const tags = req.query.tags as string;
    let c: number[][] | null;
    try {
      c = JSON.parse(compo);
    } catch (error) {
      c = null;
    }

    const stats = await getStats(res.locals.user, {
      page: null,
      pseudo,
      team_id,
      map_id,
      result,
      letter,
      is_kta,
      initiative,
      start_date,
      end_date,
      compo: compo ? c : null,
      respect_order,
      respect_compo,
      tags,
    });
    const data = AllStats(stats);
    res.send({ message: data });
  } catch (error) {
    next(error);
  }
});

router.get("/raw", async (req: Request, res: Response, next) => {
  try {
    const pseudo = req.query.pseudo as string;
    const team_id = req.query.team_id as string;
    const map_id = req.query.map_id as string;
    const result = req.query.result as string;
    const letter = req.query.letter as string;
    const is_kta = req.query.is_kta as string;
    const initiative = req.query.initiative as string;
    const start_date = req.query.start_date as string;
    const end_date = req.query.end_date as string;
    const compo = req.query.compo as string;
    const respect_order =
      (req.query.respect_order as string) === "true" ? true : false;
    const respect_compo =
      (req.query.respect_compo as string) === "true" ? true : false;
    const tags = req.query.tags as string;
    let c: number[][] | null;
    try {
      c = JSON.parse(compo);
    } catch (error) {
      c = null;
    }

    const stats = await getStats(res.locals.user, {
      page: null,
      pseudo,
      team_id,
      map_id,
      result,
      letter,
      is_kta,
      initiative,
      start_date,
      end_date,
      compo: compo ? c : null,
      respect_order,
      respect_compo,
      tags,
    });

    const data = stats;
    res.send({ message: data });
  } catch (error) {
    next(error);
  }
});

export { router };
