import { useActivePath } from "@src/hooks/useActivePath";
import { Route } from "@src/types";

type SidebarProps = {
  items: Route[];
};

export function Sidebar({ items }: SidebarProps) {
  const activePath = useActivePath();

  return (
    <div className="w-40 p-4 flex flex-col gap-1 bg-black shrink-0">
      {items.map((item) => (
        <a
          href={item.path}
          key={item.path}
          data-active={activePath === item.path}
          className="p-2 rounded font-semibold hover:bg-background data-[active=true]:text-primary"
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
