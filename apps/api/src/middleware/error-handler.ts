import { STATUS_CODES } from "node:http";

import type { ErrorRequestHandler } from "express";
import * as z from "zod";

import type { Problem } from "@petlife/shared";

import { AppError } from "../errors.ts";

// body-parser and friends attach an http status to their errors
// grab it without trusting anything else in the error.
const httpStatusOf = (err: unknown): number | undefined => {
  if (typeof err === "object" && err !== null && "status" in err) {
    const { status } = err;
    if (typeof status === "number" && status >= 400 && status <= 599) {
      return status;
    }
  }
  return undefined;
};

// Last middleware: Every error type is one problem + json response.
export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req,
  res,
  next,
) => {
  // mid response failures can't become a clean problem response,
  // give back to express to tear connection down.
  if (res.headersSent) {
    next(err);
    return;
  }

  const instance = req.originalUrl;
  // our middleware always sets a string, but pino-http's published type
  // allows object ids too — pin it down once
  const requestId =
    typeof req.id === "object" ? JSON.stringify(req.id) : req.id;

  // zod validatoin failures:
  // 400 with per field details.
  if (err instanceof z.ZodError) {
    const problem: Problem = {
      type: "about:blank",
      title: "Bad Request",
      status: 400,
      detail: "Request validation failed.",
      instance,
      requestId,
      errors: z.flattenError(err).fieldErrors,
    };
    res.status(400).type("application/problem+json").json(problem);
    return;
  }

  // operational errors thrown on purpose
  if (err instanceof AppError) {
    const problem: Problem = {
      type: "about:blank",
      title: err.title,
      status: err.status,
      detail: err.message,
      instance,
      requestId,
    };
    req.log.warn({ err }, err.title);
    res.status(err.status).type("application/problem+json").json(problem);
    return;
  }

  // errors carrying a valid http status
  const status = httpStatusOf(err);
  if (status !== undefined) {
    const problem: Problem = {
      type: "about:blank",
      title: STATUS_CODES[status] ?? "Error",
      status,
      detail: err instanceof Error ? err.message : undefined,
      instance,
      requestId,
    };
    req.log.warn({ err }, "request failed");
    res.status(status).type("application/problem+json").json(problem);
    return;
  }

  // everything else is a programmer error: log everything, reveal nothing
  const problem: Problem = {
    type: "about:blank",
    title: "Internal Server Error",
    status: 500,
    detail: "An unexpected error occurred.",
    instance,
    requestId,
  };
  req.log.error({ err }, "unexpected error");
  res.status(500).type("application/problem+json").json(problem);
};
