import { useContext } from "react";
import { RouterContext } from "@src/contexts/RouterContext";

export function useLocation() {
  const { location } = useContext(RouterContext);
  return location;
}
