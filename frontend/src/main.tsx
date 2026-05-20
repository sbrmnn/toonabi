import { lazy, StrictMode, Suspense } from "react"
import { createRoot } from "react-dom/client"
import {
  BrowserRouter,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router"
import { Header } from "./components/Header"
import { JP } from "./components/JP"
import { Home } from "./pages/Home"
import "./index.css"

const Chat = lazy(() =>
  import("./pages/Chat").then((m) => ({ default: m.Chat })),
)
const Capture = lazy(() =>
  import("./pages/Capture").then((m) => ({ default: m.Capture })),
)
const GestureLab = lazy(() =>
  import("./pages/GestureLab").then((m) => ({ default: m.GestureLab })),
)

function ChatLoading() {
  return (
    <div className="flex h-[calc(100svh-65px)] items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="float text-3xl">☁</span>
        <JP className="text-sm font-semibold text-rose-400">読み込み中</JP>
        <span
          className="text-3xl text-sage-600"
          style={{ fontFamily: "var(--font-display)" }}
        >
          loading...
        </span>
      </div>
    </div>
  )
}

/** Wrap pages that should show the site header. */
function WithHeader() {
  const { pathname } = useLocation()
  // Capture pages are headless; never show chrome there.
  if (pathname.startsWith("/capture/")) return <Outlet />
  return (
    <>
      <Header />
      <Outlet />
    </>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<WithHeader />}>
          <Route path="/" element={<Home />} />
          <Route
            path="/chat/:id"
            element={
              <Suspense fallback={<ChatLoading />}>
                <Chat />
              </Suspense>
            }
          />
          <Route
            path="/capture/:id"
            element={
              <Suspense fallback={null}>
                <Capture />
              </Suspense>
            }
          />
          <Route
            path="/lab/gestures/:id"
            element={
              <Suspense fallback={<ChatLoading />}>
                <GestureLab />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
