import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getMe } from "../api/endpoints/users";

export function useOnboardingCheck() {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getMe()
      .then((data) => {
        if (data.profile === null) {
          navigate("/onboarding", { replace: true });
        } else {
          setReady(true);
        }
      })
      .catch(() => {
        setReady(true);
      });
  }, [navigate]);

  return { ready };
}
