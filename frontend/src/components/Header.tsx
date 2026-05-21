import { Link, useLocation } from "react-router"
import { JP } from "./JP"

export function Header() {
  const { pathname } = useLocation()

  const navItems = [
    { to: "/", en: "Home", jp: "ホーム" },
    { to: "/lab/gestures", en: "Lab", jp: "監査" },
    { to: "/about", en: "About", jp: "について" },
  ]

  return (
    <header className="sticky top-0 z-50 border-b-2 border-dashed border-sage-300 bg-cream-50/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <Link to="/" className="group flex items-center gap-3">
          <div className="float flex h-11 w-11 items-center justify-center rounded-full bg-sage-300 text-cream-50 shadow-md shadow-sage-500/30">
            <JP className="text-xl font-semibold">話</JP>
          </div>
          <div className="flex flex-col leading-tight">
            <span
              className="text-3xl text-sage-600"
              style={{
                fontFamily: "var(--font-display)",
                lineHeight: "1",
              }}
            >
              chat-app
            </span>
            <JP className="text-[10px] font-medium text-rose-400">
              キャラクターと話そう
            </JP>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const active =
              pathname === item.to ||
              (item.to === "/lab/gestures" && pathname.startsWith("/lab/gestures"))
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-sage-300 text-cream-50 shadow-sm"
                    : "text-text-secondary hover:bg-cream-100"
                }`}
              >
                <span style={{ fontFamily: "var(--font-display)", fontSize: "1.1em" }}>
                  {item.en.toLowerCase()}
                </span>
                <JP className="text-[9px] opacity-80">{item.jp}</JP>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
