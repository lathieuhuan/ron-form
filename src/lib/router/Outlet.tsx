import { useContext } from "react";
import { RouterContext } from "./context";

export function Outlet() {
  const { Component } = useContext(RouterContext);
  return <Component />;
}
