import express, { type Express } from "express";

// config
import { config } from "./config.ts";

// middlewares
import { requestId } from "./middleware/request-id.ts";
import { httpLogger } from "./middleware/http-logger.ts";
import { notFound } from "./middleware/not-found.ts";
import { errorHandler } from "./middleware/error-handler.ts";

// import routers
import { pingRouter } from "./api/ping/ping.router.ts";
import { debugRouter } from "./api/debug/debug.router.ts";
import { healthRouter } from "./api/health/health.router.ts";
import { petsRouter } from "./api/pets/pets.router.ts";

export const createApp = (): Express => {
  // app init
  const app = express();

  // infrastructure endpoints
  app.use(healthRouter);

  // middlewares
  app.use(requestId);
  app.use(httpLogger);
  app.use(express.json());

  // api endpoints
  app.use("/api/v1", pingRouter);
  app.use("/api/v1/pets", petsRouter);
  if (config.isDevelopment) {
    // exists only to exercise the error pipeline — never mounted in prod
    app.use("/api/v1/debug", debugRouter);
  }

  // no route matched → a real 404 into the error pipeline
  app.use(notFound);

  // dead last: arity 4 marks it as the error handler
  app.use(errorHandler);

  return app;
};
