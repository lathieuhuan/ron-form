import { useContext } from "react";
import { RouterContext } from "@src/contexts/router-context";

export function Outlet() {
  const { Component } = useContext(RouterContext);
  return <Component />;
}
