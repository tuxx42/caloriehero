import { api } from "../client";
import type { TokenResponse } from "../types";

export function googleLogin(idToken: string): Promise<TokenResponse> {
  return api.post<TokenResponse>("/auth/google", { id_token: idToken });
}
