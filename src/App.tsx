import { Outlet } from "./components/Outlet";
import { RouterProvider } from "./components/RouterProvider";
import { Sidebar } from "./components/Sidebar";
import { routes } from "./routes";

function App() {
  return (
    <div className="app">
      <RouterProvider routes={routes}>
        <Sidebar items={routes} />
        <Outlet />
      </RouterProvider>
    </div>
  );
}

export default App;
