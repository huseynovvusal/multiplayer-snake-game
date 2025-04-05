import { createRoot } from "react-dom/client"
import "./index.css"

import { createBrowserRouter, RouterProvider } from "react-router"
import Home from "./pages/home.tsx"
import Game from "./pages/game.tsx"
import { SocketProvider } from "./contexts/SocketContext.tsx"

const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/game",
    Component: Game,
  },
])

createRoot(document.getElementById("root")!).render(
  <SocketProvider>
    <RouterProvider router={router} />
  </SocketProvider>
)
