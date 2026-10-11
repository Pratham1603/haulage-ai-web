import { useState } from "react";
import { Mail, FileText } from "lucide-react";
import { Seo } from "../../components/Seo";
import { StatusTag } from "../../components/site/ui";
import { Panel, Conf, ActionBtn, ResolvedNote } from "../../components/app/bits";
import { useMock, ORD_1042_FIELDS } from "../../mock/store";

const Hl = ({ children }) => <mark className="rounded bg-status-ai/15 px-0.5 text-heading">{children}</mark>;

const OrderDetail = () => {
  const { orders, resolveOrder } = useMock();
  const order = orders.find((o) => o.id === "ORD-1042");
  const [weight, setWeight] = useState("14.2 t");
  const [edited, setEdited] = useState(false);

  return (
    <Panel title="ORD-1042 · Email and extracted fields" testId="order-detail" className="mt-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border bg-surface p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Mail className="h-3 w-3" /> Original email · meera@aaravconsumer.example
          </p>
          <p className="mt-3 text-xs font-semibold text-heading">Order: 18 pallets to Narela, Thursday pickup</p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Hi team, please book <Hl>18 pallets</Hl> of packaged goods from <Hl>Bhiwandi WH-3</Hl> to{" "}
            <Hl>Gupta Trading Co., Narela</Hl>. Pickup window <Hl>Thursday 08:00-12:00</Hl>. Vehicle: <Hl>32 ft MXL</Hl>.
            Regards, Meera — <Hl>Aarav Consumer Products</Hl>
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <FileText className="h-3.5 w-3.5" /> order-1042.xlsx · invoice-2211.pdf attached
          </p>
        </div>
        <div>
          <ul className="space-y-2">
            {ORD_1042_FIELDS.map((f) => (
              <li
                key={f.k}
                className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${f.low ? "border-status-human/50 bg-status-human/5" : "bg-surface"}`}
              >
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{f.k}</p>
                  {f.low ? (
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        value={weight}
                        data-testid="order-1042-weight-input"
                        onChange={(e) => { setWeight(e.target.value); setEdited(true); }}
                        aria-label="Weight field, low confidence, editable"
                        className="h-8 w-24 rounded-lg border bg-background px-2 text-xs font-medium text-foreground"
                      />
                      <span className="text-[10px] text-status-human">conflict: invoice 14.2 t vs Excel 14.5 t</span>
                    </div>
                  ) : (
                    <p className="text-xs font-medium text-heading">{f.v}</p>
                  )}
                </div>
                <div className="text-right">
                  <Conf pct={f.conf} />
                  <p className="mt-0.5 text-[9px] text-muted-foreground">source: {f.src}</p>
                </div>
              </li>
            ))}
          </ul>
          {order?.tag === "ai" ? (
            <ResolvedNote>Created in TMS</ResolvedNote>
          ) : order?.tag === "human" ? (
            <p className="mt-3 text-xs font-medium text-status-human">Escalated to a human.</p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <ActionBtn primary testId="order-1042-approve" onClick={() => resolveOrder("ORD-1042", "approve")}>
                Approve and create in TMS{edited ? ` (weight ${weight})` : ""}
              </ActionBtn>
              <ActionBtn testId="order-1042-escalate" onClick={() => resolveOrder("ORD-1042", "escalate")}>Escalate</ActionBtn>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
};

const Orders = () => {
  const { orders } = useMock();
  return (
    <div data-testid="orders-page">
      <Seo title="Orders - Haulage AI" description="Email-to-TMS order intake demo with confidence-scored extraction." />
      <h1 className="font-heading text-xl font-bold sm:text-2xl">Orders</h1>
      <p className="mt-1 text-sm text-muted-foreground">Emails, WhatsApp messages and Excel sheets become validated orders. Demo data.</p>
      <div className="mt-5 overflow-x-auto rounded-xl border bg-card shadow-sm" data-testid="orders-table">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b bg-surface">
              {["Order", "Customer", "Route", "Source", "Confidence", "Status"].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold text-heading">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b last:border-0" data-testid={`order-row-${o.id}`}>
                <td className="px-4 py-3 font-medium text-heading">{o.id}</td>
                <td className="px-4 py-3 text-muted-foreground">{o.customer}</td>
                <td className="px-4 py-3 text-muted-foreground">{o.route}</td>
                <td className="px-4 py-3 text-muted-foreground">{o.source}</td>
                <td className="px-4 py-3"><Conf pct={o.confidence} /></td>
                <td className="px-4 py-3"><StatusTag variant={o.tag} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <OrderDetail />
    </div>
  );
};

export default Orders;
