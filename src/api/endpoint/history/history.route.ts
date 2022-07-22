import express, { Request, Response } from "express";
import {
  deleteHistories,
  deleteHistory,
  editHistory,
  getHistories,
  getHistory,
  insertHistory,
} from "./history.controller";
const router = express.Router();

router.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const data = await getHistory(id);
    res.send({ message: data });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req: Request, res: Response, next) => {
  try {
    const page = parseInt(req.query.page as string);
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
    const data = await getHistories(res.locals.user, {
      page,
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
    res.send({ message: data });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req: Request, res: Response, next) => {
  try {
    const payload = req.body;
    await insertHistory(payload, res.locals.user);
    res.send({});
  } catch (error) {}
});

router.put("/", async (req: Request, res: Response, next) => {
  try {
    const { payload, id } = req.body;
    const data = await editHistory(res.locals.user, id, payload);
    res.send({ message: data });
  } catch (error) {}
});

router.delete("/", async (req: Request, res: Response, next) => {
  try {
    const { id } = req.body;
    const data = await deleteHistory(res.locals.user, id);
    res.send({ message: data });
  } catch (error) {
    console.log(error);
  }
});

router.delete("/all", async (req: Request, res: Response, next) => {
  try {
    const data = await deleteHistories(res.locals.user);
    res.send({ message: data });
  } catch (error) {
    console.log(error);
  }
});

export { router };
