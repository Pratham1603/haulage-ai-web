import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Seo } from "../components/Seo";
import { Logo } from "../components/site/Logo";
import { StatusTag, PlaceholderChip } from "../components/site/ui";
import { ThemeToggle } from "../theme";
import { useAuth, ROLES } from "../auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

const KPIS = [
  { label: "Active shipments", value: "42" },
  { label: "Exceptions open", value: "3" },
  { label: "Approvals pending", value: "2" },
  { label: "On-time this week", value: "96%" },
];

const ROWS = [
  { id: "LR-8844", lane: "Mumbai → Delhi", status: "ai", note: "POD received, invoice drafted" },
  { id: "LR-8839", lane: "Bhiwandi → Narela", status: "approval", note: "Rate above limit by Rs 1,200" },
  { id: "LR-8836", lane: "Delhi → Mumbai", status: "human", note: "Driver unreachable for 3 hours" },
];

const Dashboard = () => {
  const { session, logout, setRole } = useAuth();

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard">
      <Seo title="Dashboard - Haulage AI" description="Haulage AI control tower demo. Exceptions first, everything else handled." />
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-3 px-5 md:px-8">
          <Logo testId="app-logo" />
          <span className="rounded-full border bg-surface px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Demo
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Select value={session?.role} onValueChange={setRole}>
              <SelectTrigger data-testid="app-role-switcher" className="h-9 w-40 rounded-xl text-sm" aria-label="Switch role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r} data-testid={`app-role-${r.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ThemeToggle testId="app-theme-toggle" />
            <button
              type="button"
              data-testid="app-logout"
              onClick={logout}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1200px] px-5 py-10 md:px-8">
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">
          Control Tower <span className="text-muted-foreground">· {session?.role}</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Signed in as {session?.email}. Seeded mock data; the full dashboard arrives in the next build phase.{" "}
          <PlaceholderChip />
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="app-kpis">
          {KPIS.map((k) => (
            <div key={k.label} className="rounded-xl border bg-card p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</p>
              <p className="mt-1 font-heading text-3xl font-bold text-heading">{k.value}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">Placeholder</p>
            </div>
          ))}
        </div>
        <h2 className="mt-10 font-heading text-lg font-bold">Exceptions and approvals</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border bg-card shadow-sm" data-testid="app-exceptions">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b bg-surface">
                <th className="px-5 py-3 font-semibold text-heading">LR</th>
                <th className="px-5 py-3 font-semibold text-heading">Lane</th>
                <th className="px-5 py-3 font-semibold text-heading">Note</th>
                <th className="px-5 py-3 font-semibold text-heading">Status</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-5 py-3.5 font-medium">{r.id}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{r.lane}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{r.note}</td>
                  <td className="px-5 py-3.5">
                    <StatusTag variant={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Looking for the marketing site? <Link to="/" className="font-semibold text-heading underline-offset-4 hover:underline">Back to haulage.ai</Link>
        </p>
      </main>
    </div>
  );
};

export default Dashboard;
