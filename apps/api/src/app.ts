import express, { type Express } from "express";

// import routers
import { pingRouter } from "./api/ping/ping.router.ts";

export const createApp = (): Express => {
  // app init
  const app = express();

  // middlewares
  app.use(express.json());

  // api endpoints
  app.use("/api/v1", pingRouter);

  return app;
};
