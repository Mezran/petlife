import { pinoHttp } from "pino-http";

import { logger } from "../logger.ts";

export const httpLogger = pinoHttp({ logger });
