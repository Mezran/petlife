import type { RequestHandler } from "express";

import { NotFoundError } from "../errors.ts";

// runs when no route is matched.
export const notFound: RequestHandler = (req, res, next) => {
  next(new NotFoundError(`No route for ${req.method} ${req.path}`));
};
