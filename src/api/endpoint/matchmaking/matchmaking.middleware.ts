import { Request, Response } from "express";
import { isAuth } from "../../utils/Authentification";

const middleware = async (req: Request, res: Response, next) => {
  const auth = await isAuth(req);
  if (auth) {
    res.locals.user = auth;
    next();
  } else {
    res.status(401).send("Unauthorized");
  }
};

export { middleware };
