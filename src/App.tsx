import { Outlet } from "./components/outlet";
import { RouterProvider } from "./components/router-provider";
import { Sidebar } from "./components/sidebar";
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
