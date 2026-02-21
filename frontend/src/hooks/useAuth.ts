import { useCallback } from "react";
import { googleLogin } from "../api/endpoints/auth";
import { useAuthStore } from "../stores/auth";

export function useAuth() {
  const { login, logout, user, token } = useAuthStore();

  const handleGoogleSuccess = useCallback(
    async (credentialResponse: { credential?: string }) => {
      if (!credentialResponse.credential) return;
      const res = await googleLogin(credentialResponse.credential);
      login(res.access_token, res.user);
    },
    [login],
  );

  return {
    user,
    token,
    isAuthenticated: !!token,
    handleGoogleSuccess,
    logout,
  };
}
