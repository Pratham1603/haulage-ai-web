import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Radar, Inbox, Truck, Container, Warehouse, IndianRupee, Undo2, Phone, Bot,
  Bell, Search, ChevronDown, LogOut, Sparkles, Compass, Cpu, BarChart3,
} from "lucide-react";
import { LogoMark } from "../site/Logo";
import { StatusTag } from "../site/ui";
import { ThemeToggle } from "../../theme";
import { useAuth, ROLES } from "../../auth";
import { useMock } from "../../mock/store";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import { LIVE_API_ENABLED } from "../../lib/api";
import { CopilotDrawer } from "./CopilotDrawer";
import { DemoWalkthroughModal } from "./DemoWalkthroughModal";
import { LLMSettingsModal } from "./LLMSettingsModal";

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
  { to: "/app/analytics", label: "Analytics & ML", icon: BarChart3 },
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
    return "LR-8839 (Aarav Consumer Products, 18 pallets, Bhiwandi → Narela) broke down near Beawar at 2:10 AM. Transshipment to a partner truck 45 km away is pending your approval in the Control Tower.";
  }
  if (s.includes("rate") || s.includes("hasmukh")) {
    return "Hasmukhbhai closed at Rs 74,500 vs the Rs 78,000 benchmark on Mumbai → Delhi, after a Gujarati voice negotiation. View the full audio call in Voice AI Calls.";
  }
  return "Live Freight Operations active · MongoDB connected · AI Back-Office & Matching engine online.";
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
        `group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? "relative bg-accent text-heading before:absolute before:left-0 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-r-full before:bg-primary before:content-[''] border border-border/60"
            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
        }`
      }
    >
      <Icon className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110" aria-hidden="true" />
      {label}
    </NavLink>
  ));
};

const AgentFeed = () => {
  const { activity } = useMock();
  return (
    <aside className="hidden w-64 shrink-0 border-l xl:block" data-testid="agent-activity-feed">
      <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto p-4">
        <h2 className="label-caps text-muted-foreground">Agent activity</h2>
        <p className="mt-0.5 text-[10px] text-muted-foreground/70">Newest first · demo data</p>
        <ul className="mt-3 space-y-2">
          {activity.map((a) => (
            <li key={a.id} className="rounded-md border bg-card p-3 transition-colors hover:bg-accent/40">
              <div className="flex items-center justify-between gap-2">
                <span className="label-caps text-muted-foreground">{a.agent}</span>
                <span className="font-mono text-[10px] tabular text-muted-foreground">{a.time}</span>
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
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [llmSettingsOpen, setLlmSettingsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setCopilotOpen(true);
    }
  };

  const pickRole = (r) => {
    setRole(r);
    navigate(ROLE_HOME[r] || "/app");
  };

  return (
    <div className="min-h-screen bg-background" data-testid="app-shell">
      <header className={`sticky top-0 z-50 border-b bg-background/95 backdrop-blur transition-shadow duration-200 ${scrolled ? "header-shadow" : ""}`}>
        <div className="flex h-16 items-center gap-3 px-4 md:px-6">
          <NavLink to="/app" className="flex items-center gap-2" data-testid="app-logo">
            <LogoMark />
            <span className="hidden font-heading text-base font-bold text-heading sm:inline">Haulage AI</span>
          </NavLink>
          {LIVE_API_ENABLED ? (
            <span
              data-testid="live-api-badge"
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-600 dark:text-emerald-400"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE API CONNECTED
            </span>
          ) : (
            <span
              data-testid="demo-data-badge"
              className="rounded-full border border-dashed border-muted-foreground/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
            >
              Demo data
            </span>
          )}
          <div className="relative mx-auto hidden w-full max-w-md items-center gap-2 md:flex">
            <form onSubmit={onSearch} className="relative flex-1" role="search">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                data-testid="app-search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask Copilot (e.g. 'Where is the Delhi truck?')..."
                aria-label="Ask about your operation"
                className="h-9 w-full rounded-xl border border-border/80 bg-surface/70 pl-9 pr-14 text-sm text-foreground placeholder:text-muted-foreground focus:bg-background transition-colors"
              />
              <kbd className="human-kbd pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px]">
                ⌘K
              </kbd>
            </form>
            <button
              type="button"
              onClick={() => setCopilotOpen(true)}
              className="btn-tactile inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5" /> Copilot
            </button>
            <button
              type="button"
              onClick={() => setTourOpen(true)}
              className="btn-tactile-secondary hidden lg:inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface/80 px-3 py-1.5 text-xs font-semibold text-heading shrink-0"
              title="Launch guided interactive product tour"
            >
              <Compass className="h-3.5 w-3.5 text-primary" /> Product Tour
            </button>
            <button
              type="button"
              onClick={() => setLlmSettingsOpen(true)}
              className="btn-tactile-secondary hidden xl:inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface/80 px-3 py-1.5 text-xs font-semibold text-heading shrink-0"
              title="Configure OpenRouter API Key & LLM Fallback Cascade"
            >
              <Cpu className="h-3.5 w-3.5 text-primary" /> AI Models
            </button>
          </div>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" data-testid="app-notifications" aria-label="Notifications"
                  className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors hover:bg-accent">
                  <Bell className="h-4 w-4" />
                  <span className="badge-pop absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-status-human text-[9px] font-bold text-white">6</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Live Operational Alerts</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {["Breakdown near Beawar needs transshipment approval", "Rate Rs 74,500 closed via Voice AI (Hasmukhbhai)", "ORD-1042: weight conflict 14.2 t vs 14.5 t"].map((n) => (
                  <DropdownMenuItem key={n} className="text-xs" onClick={() => setCopilotOpen(true)}>{n}</DropdownMenuItem>
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
        <nav
          className="sticky top-16 hidden h-[calc(100vh-4rem)] w-52 shrink-0 space-y-0.5 overflow-y-auto border-r p-3 lg:block"
          aria-label="Sections"
        >
          <NavItems />
        </nav>
        <main className="min-w-0 flex-1 p-4 md:p-6 animate-fade-in">
          <Outlet />
        </main>

        {pathname === "/app" && <AgentFeed />}
      </div>

      {/* Floating Copilot Trigger */}
      <button
        type="button"
        onClick={() => setCopilotOpen(true)}
        className="btn-tactile fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-xl shadow-primary/25"
      >
        <span className="sonar-ping h-2 w-2 rounded-full bg-emerald-400" />
        <Sparkles className="h-3.5 w-3.5" />
        <span>Ask Copilot</span>
        <kbd className="hidden sm:inline-block rounded bg-primary-foreground/20 px-1.5 py-0.2 font-mono text-[9px] text-primary-foreground">⌘K</kbd>
      </button>

      {/* Copilot Drawer */}
      <CopilotDrawer open={copilotOpen} onClose={() => setCopilotOpen(false)} />

      {/* Guided Demo Walkthrough Tour Modal */}
      <DemoWalkthroughModal
        isOpen={tourOpen}
        onClose={() => setTourOpen(false)}
        onOpenCopilot={() => setCopilotOpen(true)}
      />

      {/* OpenRouter LLM Settings Modal */}
      <LLMSettingsModal
        isOpen={llmSettingsOpen}
        onClose={() => setLlmSettingsOpen(false)}
      />
    </div>
  );
};
