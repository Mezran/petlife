import type { RequestHandler } from "express";
import * as z from "zod";

// one generic guard for any route
// hand it a schema for the request.

interface RequestSchemas<TParams, TQuery, TBody> {
  params?: z.ZodType<TParams>;
  query?: z.ZodType<TQuery>;
  body?: z.ZodType<TBody>;
}

export const validate =
  <TParams = Record<string, string>, TQuery = unknown, TBody = unknown>(
    schemas: RequestSchemas<TParams, TQuery, TBody>,
  ): RequestHandler<TParams, unknown, TBody, TQuery> =>
  (req, _res, next) => {
    if (schemas.params) {
      req.params = schemas.params.parse(req.params);
    }
    if (schemas.query) {
      // express 5 made req.query a getter — shadow it with an own property
      Object.defineProperty(req, "query", {
        value: schemas.query.parse(req.query),
      });
    }
    if (schemas.body) {
      // express.json() leaves req.body undefined when nothing was sent —
      // schema.parse turns that into the 400 it deserves
      req.body = schemas.body.parse(req.body);
    }
    next();
  };
