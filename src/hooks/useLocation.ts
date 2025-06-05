import { useContext } from "react";
import { RouterContext } from "@src/contexts/router-context";

export function useLocation() {
  const { location } = useContext(RouterContext);
  return location;
}
