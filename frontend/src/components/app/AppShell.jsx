import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Radar, Inbox, Truck, Container, Warehouse, IndianRupee, Undo2, Phone, Bot,
  Bell, Search, ChevronDown, LogOut,
} from "lucide-react";
import { LogoMark } from "../site/Logo";
import { StatusTag } from "../site/ui";
import { ThemeToggle } from "../../theme";
import { useAuth, ROLES } from "../../auth";
import { useMock } from "../../mock/store";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const NAV = [
  { to: "/app", label: "Control Tower", icon: Radar, exact: true },
  { to: "/app/orders", label: "Orders", icon: Inbox },
  { to: "/app/loads", label: "Loads and Matching", icon: Truck },
  { to: "/app/fleet", label: "Fleet", icon: Container },
  { to: "/app/warehouse", label: "Warehouse", icon: Warehouse },
  { to: "/app/finance", label: "Finance", icon: IndianRupee },
  { to: "/app/returns", label: "Returns", icon: Undo2 },
  { to: "/app/calls", label: "Calls", icon: Phone },
  { to: "/app/agents", label: "Agents", icon: Bot },
];

export const ROLE_HOME = {
  "Ops Manager": "/app",
  Dispatcher: "/app/loads",
  "Warehouse Lead": "/app/warehouse",
  Finance: "/app/finance",
  Owner: "/app",
};

const cannedAnswer = (q) => {
  const s = q.toLowerCase();
  if (s.includes("delhi") || s.includes("aarav") || s.includes("truck")) {
    return "LR-8839 (Aarav Consumer Products, 18 pallets, Bhiwandi → Narela) broke down near Beawar at 2:10 AM. Transshipment to a partner truck 45 km away is pending your approval (+Rs 9,000, saves the 8-10 AM slot). Demo data.";
  }
  if (s.includes("rate") || s.includes("hasmukh")) {
    return "Hasmukhbhai closed at Rs 74,500 vs the Rs 78,000 benchmark on Mumbai → Delhi, after a 3-turn Gujarati negotiation. Awaiting approval in the Control Tower. Demo data.";
  }
  return "47 live shipments · 93% on-time · 6 need your attention. Try: 'Where is the Delhi truck for Aarav?' Demo data.";
};

const NavItems = ({ onNavigate, mobile = false }) => {
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return NAV.map(({ to, label, icon: Icon, exact }) => (
    <NavLink
      key={to}
      to={to}
      end={exact}
      onClick={onNavigate}
      data-testid={mobile ? `app-nav-mobile-${slug(label)}` : `app-nav-${slug(label)}`}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
          isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-heading"
        }`
      }
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label}
    </NavLink>
  ));
};

const AgentFeed = () => {
  const { activity } = useMock();
  return (
    <aside className="hidden w-72 shrink-0 border-l xl:block" data-testid="agent-activity-feed">
      <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto p-4">
        <h2 className="font-heading text-sm font-bold text-heading">Agent activity</h2>
        <p className="text-[10px] text-muted-foreground">Newest first · demo data</p>
        <ul className="mt-3 space-y-3">
          {activity.map((a) => (
            <li key={a.id} className="rounded-xl border bg-card p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{a.agent}</span>
                <span className="text-[10px] text-muted-foreground">{a.time}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-foreground">{a.action}</p>
              <div className="mt-2"><StatusTag variant={a.tag} /></div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export const AppShell = () => {
  const { session, logout, setRole } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState(null);

  const onSearch = (e) => {
    e.preventDefault();
    if (query.trim()) setAnswer(cannedAnswer(query));
  };

  const pickRole = (r) => {
    setRole(r);
    navigate(ROLE_HOME[r] || "/app");
  };

  return (
    <div className="min-h-screen bg-background" data-testid="app-shell">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 md:px-6">
          <NavLink to="/app" className="flex items-center gap-2" data-testid="app-logo">
            <LogoMark />
            <span className="hidden font-heading text-base font-bold text-heading sm:inline">Haulage AI</span>
          </NavLink>
          <span
            data-testid="demo-data-badge"
            className="rounded-full border border-dashed border-muted-foreground/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
          >
            Demo data
          </span>
          <form onSubmit={onSearch} className="relative mx-auto hidden w-full max-w-md md:block" role="search">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              data-testid="app-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Where is the Delhi truck for Aarav?"
              aria-label="Ask about your operation"
              className="h-9 w-full rounded-xl border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground"
            />
            {answer && (
              <div className="absolute left-0 right-0 top-11 z-50 rounded-xl border bg-popover p-3 shadow-md" data-testid="app-search-answer">
                <p className="text-xs leading-relaxed text-foreground">{answer}</p>
                <button type="button" onClick={() => setAnswer(null)} className="mt-2 text-[10px] font-semibold text-muted-foreground hover:text-foreground">
                  Dismiss
                </button>
              </div>
            )}
          </form>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" data-testid="app-notifications" aria-label="Notifications"
                  className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors hover:bg-accent">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-status-human text-[9px] font-bold text-white">6</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Notifications (demo)</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {["Breakdown near Beawar needs your approval", "Rate Rs 74,500 awaiting approval", "ORD-1042: weight field conflict"].map((n) => (
                  <DropdownMenuItem key={n} className="text-xs">{n}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeToggle testId="app-theme-toggle" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" data-testid="app-user-menu" className="inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition-colors hover:bg-accent">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {session?.role?.[0] || "U"}
                  </span>
                  <span className="hidden sm:inline">{session?.role}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <span className="block text-xs font-normal text-muted-foreground">{session?.email}</span>
                  Switch role
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ROLES.map((r) => (
                  <DropdownMenuItem key={r} data-testid={`app-role-${r.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} onClick={() => pickRole(r)}
                    className={r === session?.role ? "font-semibold" : ""}>
                    {r}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem data-testid="app-logout" onClick={() => { logout(); navigate("/login"); }}>
                  <LogOut className="mr-2 h-3.5 w-3.5" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t px-4 py-2 lg:hidden" aria-label="Sections">
          <NavItems mobile />
        </nav>
      </header>
      <div className="flex">
        <nav className="sticky top-16 hidden h-[calc(100vh-4rem)] w-56 shrink-0 space-y-1 overflow-y-auto border-r p-3 lg:block" aria-label="Sections">
          <NavItems />
        </nav>
        <main className="min-w-0 flex-1 p-4 md:p-6">
          <Outlet />
        </main>
        {pathname === "/app" && <AgentFeed />}
      </div>
    </div>
  );
};
