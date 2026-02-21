import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../stores/auth";

interface SSEOptions {
  onMessage?: (data: string) => void;
  onError?: () => void;
}

export function useSSE(path: string | null, options: SSEOptions = {}) {
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const sourceRef = useRef<EventSource | null>(null);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!path || !token) return;

    const url = `/api/v1${path}`;
    // Pass token as query param for SSE (can't set headers on EventSource)
    const separator = url.includes("?") ? "&" : "?";
    const source = new EventSource(`${url}${separator}token=${token}`);
    sourceRef.current = source;

    source.addEventListener("status", (e) => {
      setLastEvent(e.data);
      options.onMessage?.(e.data);
    });

    source.onopen = () => setConnected(true);
    source.onerror = () => {
      setConnected(false);
      options.onError?.();
    };

    return () => {
      source.close();
      sourceRef.current = null;
      setConnected(false);
    };
  }, [path, token]); // eslint-disable-line react-hooks/exhaustive-deps

  return { lastEvent, connected };
}
