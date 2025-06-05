import { useLocation } from "@src/hooks/useLocation";

export function useActivePath() {
  const location = useLocation();
  return location.pathname;
}
