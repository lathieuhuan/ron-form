import { useContext } from "react";
import { RouterContext } from "../context";

export function useLocation() {
  const { location } = useContext(RouterContext);
  return location;
}
