import { useEffect, useState } from "react";

export function useNow(intervalMs = 1_000): number {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1_000));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Math.floor(Date.now() / 1_000)), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return now;
}
