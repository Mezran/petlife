import type { RequestHandler } from "express";
import { fromNodeHeaders } from "better-auth/node";

import { auth } from "../auth.ts";
import { UnauthorizedError } from "../errors.ts";

// the shape routes may rely on once requireAuth has run.
export interface AuthedUser {
  id: string;
  email: string;
  name: string;
}

// teach type system about req.user (set by requireAuth)
declare module "express-serve-static-core" {
  interface Request {
    user?: AuthedUser;
  }
}

// section: middleware
// 401 before any route logic. No valid session == no entry.
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (session === null) {
    throw new UnauthorizedError("Authentication required");
  }
  req.user = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
  next();
};

// section: helpers

// routes behind reqAuth read the user through this instead of asserting.
// A route that forgets the middleware fails as a 401 here.
export const authedUser = (req: { user?: AuthedUser }): AuthedUser => {
  if (req.user === undefined) {
    throw new UnauthorizedError("Authentication required");
  }
  return req.user;
};
