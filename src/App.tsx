import { Sidebar } from "@src/features/layout/Sidebar";
import { Outlet, RouterProvider } from "@src/lib/router";
import { routes } from "@src/routes";

function App() {
  return (
    <div className="app">
      <RouterProvider routes={routes}>
        <Sidebar items={routes} />
        <div className="grow">
          <Outlet />
        </div>
      </RouterProvider>
    </div>
  );
}

export default App;
