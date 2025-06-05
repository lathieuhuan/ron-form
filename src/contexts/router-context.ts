import { createContext, FunctionComponent } from "react";

export const RouterContext = createContext<{
  location: Location;
  path: string;
  Component: FunctionComponent;
}>({ location: window.location, path: window.location.pathname, Component: () => null });
