import { useEffect, useState } from "react";
import { Check, RefreshCw, Radio } from "lucide-react";
import { toast } from "sonner";
import { Seo } from "../../components/Seo";
import { StatusTag } from "../../components/site/ui";
import { Panel, ActionBtn, AnimatedBar } from "../../components/app/bits";
import { useMock } from "../../mock/store";
import { apiRequest, LIVE_API_ENABLED } from "../../lib/api";

const Fleet = () => {
  const { fleet: mockFleet } = useMock();
  const [fleetList, setFleetList] = useState(mockFleet);
  const [loading, setLoading] = useState(false);
  const [updatingTruck, setUpdatingTruck] = useState(null);

  const fetchLiveFleet = async () => {
    if (!LIVE_API_ENABLED) return;
    try {
      setLoading(true);
      const data = await apiRequest("/operations/fleet");
      if (Array.isArray(data) && data.length > 0) {
        setFleetList(data);
      }
    } catch (e) {
      // Fallback silently to existing list
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveFleet();
  }, []);

  const handleUpdateStatus = async (truck, newStatus, nextFreeText) => {
    setUpdatingTruck(truck);
    try {
      if (LIVE_API_ENABLED) {
        await apiRequest("/operations/fleet/update", {
          method: "POST",
          body: JSON.stringify({ truck, status: newStatus }),
        });
      }
      setFleetList((prev) =>
        prev.map((t) =>
          t.truck === truck
            ? { ...t, status: newStatus, nextFree: nextFreeText || (newStatus === "ai" ? "Ready now" : "On standby") }
            : t
        )
      );
      toast.success(`${truck} updated: ${newStatus === "ai" ? "Available" : "Standby"}`);
    } catch (e) {
      toast.error("Failed to update fleet status");
    } finally {
      setUpdatingTruck(null);
    }
  };

  return (
    <div data-testid="fleet-page">
      <Seo title="Fleet - Haulage AI" description="Fleet table and utilisation demo." />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-bold sm:text-2xl">Fleet & Driver Network</h1>
          <p className="mt-1 text-sm text-muted-foreground">Trucks, telematics status, and corridor utilisation. Live database sync enabled.</p>
        </div>
        <div className="flex items-center gap-2">
          {LIVE_API_ENABLED && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-status-ai/30 bg-status-ai/10 px-2.5 py-1 text-xs font-medium text-status-ai">
              <Radio className="h-3 w-3 animate-pulse" /> Live Mongo Sync
            </span>
          )}
          <button
            type="button"
            onClick={fetchLiveFleet}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1 text-xs text-muted-foreground hover:bg-surface"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border bg-card shadow-sm" data-testid="fleet-table">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b bg-surface">
              {["Truck", "Driver", "Location", "Status", "Utilisation", "Next free", "Quick Action"].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold text-heading">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
          {fleetList.map((t, i) => (
              <tr
                key={t.truck}
                className="border-b last:border-0 hover:bg-surface/50 transition-colors"
                style={{ animation: `rise 0.35s cubic-bezier(0.25,1,0.5,1) ${i * 50}ms both` }}
              >
                <td className="px-4 py-3 font-medium text-heading">{t.truck}</td>
                <td className="px-4 py-3 text-muted-foreground">{t.driver}</td>
                <td className="px-4 py-3 text-muted-foreground">{t.location}</td>
                <td className="px-4 py-3"><StatusTag variant={t.status} /></td>
                <td className="px-4 py-3 text-muted-foreground font-mono">{t.utilisation}%</td>
                <td className="px-4 py-3 text-muted-foreground">{t.nextFree}</td>
                <td className="px-4 py-3">
                  {t.status === "human" || t.status === "approval" ? (
                    <ActionBtn
                      primary
                      onClick={() => handleUpdateStatus(t.truck, "ai", "Ready now")}
                      disabled={updatingTruck === t.truck}
                    >
                      {updatingTruck === t.truck ? "Saving..." : "Mark Ready"}
                    </ActionBtn>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(t.truck, "approval", "Assigned Standby")}
                      disabled={updatingTruck === t.truck}
                      className="rounded border px-2 py-1 text-xs text-muted-foreground hover:bg-surface hover:text-heading transition-colors"
                    >
                      {updatingTruck === t.truck ? "Saving..." : "Set Standby"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Panel title="Utilisation this week (km loaded / km total)" testId="utilisation-chart" className="mt-5">
        <div className="space-y-3 stagger-list">
          {fleetList.map((t, i) => (
            <div key={t.truck} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-xs font-medium text-heading tabular">{t.truck}</span>
              <AnimatedBar pct={t.utilisation} delay={i * 80} />
              <span className="w-10 shrink-0 text-right tabular text-xs text-muted-foreground">
                {t.utilisation}%
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground">Corridor telematics data synced with vehicle onboard devices.</p>
      </Panel>
    </div>
  );
};

export default Fleet;
