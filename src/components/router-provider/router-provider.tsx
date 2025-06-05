import { RouterContext } from "@src/contexts/router-context";
import { Route } from "@src/types";
import { useEffect, useState } from "react";
import { NotFound } from "./not-found";

type RouterProviderProps = {
  routes: Route[];
  children: React.ReactNode;
};

export function RouterProvider({ routes, children }: RouterProviderProps) {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setPath(window.location.pathname);
    };

    const pushState = history.pushState;
    history.pushState = (...args) => {
      const result = pushState.apply(history, args);
      handleLocationChange();
      return result;
    };

    const replaceState = history.replaceState;
    history.replaceState = (...args) => {
      const result = replaceState.apply(history, args);
      handleLocationChange();
      return result;
    };

    window.addEventListener("popstate", handleLocationChange);

    return () => {
      history.pushState = pushState;
      history.replaceState = replaceState;
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

  const Component = routes.find((route) => route.path === path)?.Component ?? NotFound;

  return (
    <RouterContext.Provider value={{ location: window.location, path, Component }}>
      {children}
    </RouterContext.Provider>
  );
}
