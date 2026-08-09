import express, { type Express } from "express";

// middlewares
import { requestId } from "./middleware/request-id.ts";
import { httpLogger } from "./middleware/http-logger.ts";

// import routers
import { pingRouter } from "./api/ping/ping.router.ts";

export const createApp = (): Express => {
  // app init
  const app = express();

  // middlewares
  app.use(requestId);
  app.use(httpLogger);
  app.use(express.json());

  // api endpoints
  app.use("/api/v1", pingRouter);

  return app;
};
