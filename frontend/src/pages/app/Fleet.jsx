import { Seo } from "../../components/Seo";
import { StatusTag } from "../../components/site/ui";
import { Panel } from "../../components/app/bits";
import { useMock } from "../../mock/store";

const Fleet = () => {
  const { fleet } = useMock();
  return (
    <div data-testid="fleet-page">
      <Seo title="Fleet - Haulage AI" description="Fleet table and utilisation demo." />
      <h1 className="font-heading text-xl font-bold sm:text-2xl">Fleet</h1>
      <p className="mt-1 text-sm text-muted-foreground">Trucks, drivers and utilisation. Fake truck numbers, demo data.</p>

      <div className="mt-5 overflow-x-auto rounded-xl border bg-card shadow-sm" data-testid="fleet-table">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b bg-surface">
              {["Truck", "Driver", "Location", "Status", "Utilisation", "Next free"].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold text-heading">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fleet.map((t) => (
              <tr key={t.truck} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium text-heading">{t.truck}</td>
                <td className="px-4 py-3 text-muted-foreground">{t.driver}</td>
                <td className="px-4 py-3 text-muted-foreground">{t.location}</td>
                <td className="px-4 py-3"><StatusTag variant={t.status} /></td>
                <td className="px-4 py-3 text-muted-foreground">{t.utilisation}%</td>
                <td className="px-4 py-3 text-muted-foreground">{t.nextFree}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Panel title="Utilisation this week (km loaded / km total)" testId="utilisation-chart" className="mt-5">
        <div className="space-y-3">
          {fleet.map((t) => (
            <div key={t.truck} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-xs font-medium text-heading">{t.truck}</span>
              <div className="h-4 flex-1 overflow-hidden rounded-full bg-border">
                <div className="h-full rounded-full bg-status-ai transition-all" style={{ width: `${t.utilisation}%` }} />
              </div>
              <span className="w-10 text-right text-xs text-muted-foreground">{t.utilisation}%</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground">Placeholder chart, demo data.</p>
      </Panel>
    </div>
  );
};

export default Fleet;
