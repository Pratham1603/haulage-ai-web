import { Seo } from "../../components/Seo";
import { StatusTag } from "../../components/site/ui";
import { Panel, ActionBtn, ResolvedNote } from "../../components/app/bits";
import { useMock } from "../../mock/store";

const AGING = [
  { k: "0-30 days", v: "Rs 8.2L" },
  { k: "30-60 days", v: "Rs 3.1L" },
  { k: "60+ days", v: "Rs 1.4L" },
];

const REMINDERS = [
  { t: "Day 1 · polite email reminder", tag: "ai" },
  { t: "Day 7 · WhatsApp with UPI payment link", tag: "ai" },
  { t: "Day 14 · Hindi call from Voice AI (attempt 2)", tag: "ai" },
  { t: "Day 21 · escalated to your team", tag: "human" },
];

const Finance = () => {
  const { invoices, resolveInvoice } = useMock();
  return (
    <div data-testid="finance-page">
      <Seo title="Finance - Haulage AI" description="Invoice audit and collections demo with evidence-linked flags." />
      <h1 className="font-heading text-xl font-bold sm:text-2xl">Finance</h1>
      <p className="mt-1 text-sm text-muted-foreground">Every flag links to its evidence. Demo data.</p>

      <Panel title="Invoice audit" testId="invoice-audit" className="mt-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b bg-surface">
                {["Invoice line", "Contract rate", "Actual", "Variance", "Evidence", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold text-heading">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className={`border-b last:border-0 ${inv.variance !== "—" ? "bg-status-approval/5" : ""}`} data-testid={`invoice-${inv.id}`}>
                  <td className="px-4 py-3">
                    <span className="font-medium text-heading">{inv.id}</span>
                    <span className="block text-xs text-muted-foreground">{inv.line}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.contract}</td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.actual}</td>
                  <td className="px-4 py-3 font-medium text-heading">{inv.variance}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground underline-offset-2">{inv.evidence}</td>
                  <td className="px-4 py-3"><StatusTag variant={inv.tag} /></td>
                  <td className="px-4 py-3">
                    {inv.resolved ? (
                      <span className="text-xs font-medium text-status-ai">{inv.resolved}</span>
                    ) : inv.tag !== "ai" ? (
                      <div className="flex gap-2">
                        <ActionBtn primary testId={`invoice-${inv.id}-approve`} onClick={() => resolveInvoice(inv.id, "approve")}>Approve correction</ActionBtn>
                        <ActionBtn testId={`invoice-${inv.id}-dispute`} onClick={() => resolveInvoice(inv.id, "dispute")}>Dispute</ActionBtn>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          INV-2211: carrier claims 5 hours of detention at Bhiwandi; gate timestamps show 2 hours beyond free time. Variance Rs 3,600.
        </p>
      </Panel>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Receivables aging" testId="receivables">
          <div className="grid grid-cols-3 gap-3">
            {AGING.map((a) => (
              <div key={a.k} className="rounded-xl border bg-surface p-4 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{a.k}</p>
                <p className="mt-1 font-heading text-lg font-bold text-heading">{a.v}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-muted-foreground">Placeholder figures.</p>
        </Panel>
        <Panel title="Reminder sequence · Gupta Trading Co. Rs 1.4L" testId="reminder-sequence">
          <ol className="space-y-2">
            {REMINDERS.map((r) => (
              <li key={r.t} className="flex items-center justify-between gap-2 rounded-lg border bg-surface px-3 py-2.5">
                <span className="text-xs font-medium text-heading">{r.t}</span>
                <StatusTag variant={r.tag} />
              </li>
            ))}
          </ol>
          <p className="mt-2 text-[10px] text-muted-foreground">Escalates after two failed attempts. Reminders follow your approved template and tone.</p>
        </Panel>
      </div>
    </div>
  );
};

export default Finance;
