import { useActivePath } from "@src/hooks/useActivePath";
import { Route } from "@src/types";

import "./sidebar.css";

type SidebarProps = {
  items: Route[];
};

export function Sidebar({ items }: SidebarProps) {
  const activePath = useActivePath();

  return (
    <div className="sidebar">
      {items.map((item) => (
        <a
          href={item.path}
          key={item.path}
          className={activePath === item.path ? "active" : ""}
          onClick={(e) => {
            e.preventDefault();
            window.history.pushState({}, "", item.path);
          }}
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}
