import { FunctionComponent } from "react";

export type Route = {
  label: string;
  path: string;
  Component: FunctionComponent;
};
