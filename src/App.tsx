import { Outlet } from "./components/Outlet";
import { RouterProvider } from "./components/RouterProvider";
import { Sidebar } from "./features/layout/Sidebar";
import { routes } from "./routes";

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
