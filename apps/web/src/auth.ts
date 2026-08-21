// ---------------------------------------------------------------------------
// auth stub — the router's picture of "who is logged in".
// 6.4 replaces this object with BetterAuth's live client session; the guard
// in routes/_authed.tsx and the router context already speak this shape, so
// only this file changes.
// ---------------------------------------------------------------------------

export interface AuthState {
  isAuthenticated: boolean;
}

// flip to true locally to walk through the guard before 6.4 exists
export const authStub: AuthState = {
  isAuthenticated: true,
};
