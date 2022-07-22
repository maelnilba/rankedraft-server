import express, { Response, Request } from "express";
import { fetchDraft } from "./draft.controller";
import { ParseHTMLToDraft } from "./ParseFunction";
const router = express.Router();

router.get("/:link(*)", async (req: Request, res: Response, next) => {
  try {
    const link = req.params.link;
    if (link.length < 40 && link.length > 70) {
      res.status(403).send({
        message: { error: "Invalid link." },
      });
      return;
    }

    const code = await fetchDraft(link);
    const data = ParseHTMLToDraft(code);
    if (!data || !code) {
      res.status(403).send({
        message: { error: "Invalid link." },
      });
      throw new Error("");
    }

    res.send({ message: data });
  } catch (error) {
    next(error);
  }
});

export { router };
