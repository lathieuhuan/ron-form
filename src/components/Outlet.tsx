import { useContext } from "react";
import { RouterContext } from "@src/contexts/RouterContext";

export function Outlet() {
  const { Component } = useContext(RouterContext);
  return <Component />;
}
