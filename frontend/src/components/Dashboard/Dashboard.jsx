import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  ReceiptText,
  CheckCheck,
  Clock3,
  Layers,
  Search,
  CalendarDays,
  ChevronRight,
  FileText,
  X,
  Copy,
  Download,
  CircleCheck,
  AlertCircle,
} from "lucide-react";
import "./Dashboard.css";

const batchName = (batch) =>
  batch.final_batch_number || batch.name || `Batch #${batch.id}`;
const isClaimed = (receipt) =>
  ["verified", "matched"].includes(receipt.match_status);
const batchStatuses = {
  open: ["Open", "neutral"],
  claiming: ["Claiming", "amber"],
  verified: ["Verified", "green"],
  finalized: ["Finalized", "green"],
  summarized: ["Summarized", "blue"],
  billing_ready: ["Billing ready", "green"],
};
const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};

function BatchSummary({ batch, onClose }) {
  const dialogRef = useRef(null);
  const [copyStatus, setCopyStatus] = useState("");
  useEffect(() => {
    dialogRef.current.showModal();
  }, []);
  const total = batch.stats?.total ?? batch.receipts?.length ?? 0;
  const verified = batch.stats?.verified ?? 0;
  const financial = batch.summary_data || {};
  const claims = batch.verified_claims || [];
  const money = (value) =>
    `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  const text = [
    `Batch: ${batchName(batch)}`,
    `Created: ${formatDate(batch.created_at)}`,
    `Status: ${batch.checker_status || "open"}`,
    "",
    `Total receipts: ${total}`,
    `Verified: ${verified}`,
    `Pending: ${Math.max(0, total - verified)}`,
    ...(financial.gross_amount != null
      ? [
          "",
          `Gross amount: ${money(financial.gross_amount)}`,
          `Service fee: ${money(financial.service_fee)}`,
          `Net amount: ${money(financial.net_amount)}`,
        ]
      : []),
    ...(claims.length
      ? [
          "",
          `Verified claims (${claims.length})`,
          ...claims.map(
            (claim, index) =>
              `${index + 1}. ${claim.account_holder || "Unassigned"} — ${money(claim.amount)} (${claim.reference || "No reference"})`,
          ),
        ]
      : []),
  ].join("\n");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Summary copied.");
    } catch {
      setCopyStatus("Copy unavailable. You can download the summary instead.");
    }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${batchName(batch).replace(/[^a-z0-9_-]/gi, "-")}-summary.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <dialog
      className="dashboard-summary"
      ref={dialogRef}
      aria-labelledby="summary-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      <div className="summary-heading">
        <div>
          <span className="eyebrow">BATCH DETAILS</span>
          <h2 id="summary-title">{batchName(batch)}</h2>
        </div>
        <button
          className="dash-icon-button"
          onClick={onClose}
          aria-label="Close summary"
        >
          <X size={19} />
        </button>
      </div>
      <pre>{text}</pre>
      <p role="status" className="summary-copy-status">
        {copyStatus}
      </p>
      <div className="summary-actions">
        <button className="dash-button secondary" onClick={copy}>
          <Copy size={15} />
          Copy summary
        </button>
        <button className="dash-button primary" onClick={download}>
          <Download size={15} />
          Download
        </button>
      </div>
    </dialog>
  );
}

export default function Dashboard({
  receipts = [],
  batches = [],
  activeBatchCount = null,
  batchesLoading = false,
  receiptsLoading = false,
  dataError = "",
  onNavigate,
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activityDays, setActivityDays] = useState(7);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const now = new Date();
  const monthReceipts = receipts.filter((receipt) => {
    const date = new Date(receipt.created_at);
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  });
  const claimed = monthReceipts.filter(isClaimed).length;
  const unclaimed = monthReceipts.length - claimed;
  const activeBatches = activeBatchCount ?? batches.filter((batch) =>
    ["open", "claiming", "verified"].includes(batch.checker_status),
  ).length;
  const completion = monthReceipts.length
    ? Math.round((claimed / monthReceipts.length) * 100)
    : 0;
  const metrics = [
    {
      label: "Total receipts",
      value: monthReceipts.length,
      note: "Uploaded this month",
      icon: ReceiptText,
      color: "sage",
      path: "/batch",
    },
    {
      label: "Claimed receipts",
      value: claimed,
      note: "Verified & matched",
      icon: CheckCheck,
      color: "green",
      path: "/transactions",
    },
    {
      label: "Unclaimed receipts",
      value: unclaimed,
      note: "Awaiting a match",
      icon: Clock3,
      color: "amber",
      path: "/batch",
    },
    {
      label: "Active batches",
      value: activeBatches,
      note: "Open, claiming & verified",
      icon: Layers,
      color: "blue",
      path: "/batch",
    },
  ];
  const activity = Array.from({ length: activityDays }, (_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - activityDays + 1 + index,
    );
    const nextDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1,
    );
    const daily = receipts.filter((receipt) => {
      const created = new Date(receipt.created_at);
      return created >= date && created < nextDay;
    });
    return {
      date,
      total: daily.length,
      claimed: daily.filter(isClaimed).length,
    };
  });
  const maximum = Math.max(4, ...activity.map((day) => day.total));
  const activityTotal = activity.reduce((total, day) => total + day.total, 0);
  const filteredBatches = [...batches]
    .filter(
      (batch) =>
        batchName(batch).toLowerCase().includes(query.trim().toLowerCase()) &&
        (statusFilter === "all" || batch.checker_status === statusFilter),
    )
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const loading = receiptsLoading || batchesLoading;
  const number = (value) => value.toLocaleString("en-PH");

  return (
    <div className="dashboard page">
      <header className="dashboard-topbar">
        <div className="dashboard-breadcrumb">
          <span>Workspace</span>
          <ChevronRight size={13} />
          <strong>Overview</strong>
        </div>
        <div className="topbar-right">
          <span className="workspace-tag">
            <span /> Receipt workspace
          </span>
          <span className="dashboard-avatar" aria-hidden="true">
            RP
          </span>
        </div>
      </header>
      <div className="dashboard-intro">
        <div>
          <span className="eyebrow">YOUR WORKSPACE, AT A GLANCE</span>
          <h1>
            A little clarity. A lot of progress<span>.</span>
          </h1>
          <p>Welcome back. Here’s what’s happening with your receipts.</p>
        </div>
        <button
          className="dash-button primary"
          onClick={() => onNavigate("/batch")}
        >
          <Plus size={17} />
          New batch
        </button>
      </div>
      {dataError && (
        <div className="dashboard-data-error" role="alert">
          <AlertCircle size={17} />
          <span>{dataError} Totals may be incomplete.</span>
        </div>
      )}
      <div className="overview-label">
        <h2>
          Overview <span>This month</span>
        </h2>
        <span className="dashboard-date">
          <CalendarDays size={14} />
          {now.toLocaleDateString("en-PH", { month: "long", year: "numeric" })}
        </span>
      </div>
      <section className="dashboard-metrics" aria-label="Workspace statistics">
        {metrics.map(
          ({ label, value, note, icon: MetricIcon, color, path }, index) => (
            <button
              className={`metric-card ${index === 0 ? "featured" : ""}`}
              key={label}
              onClick={() => onNavigate(path)}
            >
              <div className="metric-top">
                <span>{label}</span>
                <span className={`metric-icon ${color}`}>
                  <MetricIcon size={18} strokeWidth={1.7} />
                </span>
              </div>
              <strong className="metric-value">
                {(index === 3 ? batchesLoading : receiptsLoading)
                  ? "—"
                  : number(value)}
              </strong>
              <div className="metric-bottom">
                <span>
                  <i className={`metric-dot ${color}`} />
                  {note}
                </span>
                <ArrowUpRight size={16} />
              </div>
            </button>
          ),
        )}
      </section>
      <div className="dashboard-insights">
        <section
          className="dashboard-panel activity-panel"
          aria-labelledby="activity-title"
        >
          <div className="panel-heading">
            <div>
              <h2 id="activity-title">Receipt activity</h2>
              <p>Your uploads and matched receipts over time</p>
            </div>
            <select
              className="dash-select"
              value={activityDays}
              onChange={(event) => setActivityDays(Number(event.target.value))}
              aria-label="Receipt activity period"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
            </select>
          </div>
          <div className="activity-summary">
            <strong>{receiptsLoading ? "—" : number(activityTotal)}</strong>
            <span>receipts uploaded</span>
            <div className="chart-legend">
              <span>
                <i className="legend-dot green" />
                Claimed
              </span>
              <span>
                <i className="legend-dot pale" />
                Unclaimed
              </span>
            </div>
          </div>
          <div
            className="activity-chart"
            role="img"
            aria-label={
              receiptsLoading
                ? "Loading receipt activity"
                : `${activityTotal} uploads over the last ${activityDays} days. ${activity.map((day) => `${day.date.toLocaleDateString("en-PH", { month: "short", day: "numeric" })}: ${day.total} uploaded, ${day.claimed} claimed`).join(". ")}`
            }
          >
            <div className="chart-scale">
              {[maximum, Math.round(maximum / 2), 0].map((tick, index) => (
                <span key={index}>{tick}</span>
              ))}
            </div>
            <div className="chart-plot">
              <div className="chart-grid">
                <i />
                <i />
                <i />
              </div>
              <div className="chart-columns">
                {activity.map((day) => (
                  <div className="chart-column" key={day.date.toISOString()}>
                    <div
                      className="chart-track"
                      title={`${formatDate(day.date)}: ${day.total} receipts, ${day.claimed} claimed`}
                    >
                      <div
                        className="chart-bar"
                        style={{ height: `${(day.total / maximum) * 100}%` }}
                      >
                        <div
                          className="chart-bar-claimed"
                          style={{
                            height: `${day.total ? (day.claimed / day.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span>
                      {day.date.toLocaleDateString(
                        "en-PH",
                        activityDays === 7
                          ? { weekday: "short" }
                          : { day: "numeric", month: "short" },
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="chart-footnote">
            <span>
              {formatDate(activity[0].date)} — {formatDate(now)}
            </span>
            <span>
              {receiptsLoading
                ? "Loading activity…"
                : activityTotal
                  ? "Every receipt, accounted for."
                  : "Upload receipts to see your activity."}
            </span>
          </div>
        </section>
        <section
          className="dashboard-panel status-panel"
          aria-labelledby="status-title"
        >
          <div className="panel-heading">
            <div>
              <h2 id="status-title">Receipt status</h2>
              <p>A clearer picture of this month</p>
            </div>
            <span className="panel-icon">
              <CheckCheck size={18} />
            </span>
          </div>
          <div
            className="status-donut"
            style={{ "--completion": `${completion}%` }}
            role="img"
            aria-label={
              receiptsLoading
                ? "Loading receipt status"
                : `${completion}% claimed, ${claimed} claimed and ${unclaimed} unclaimed receipts`
            }
          >
            <div>
              <strong>{receiptsLoading ? "—" : `${completion}%`}</strong>
              <span>claimed receipts</span>
            </div>
          </div>
          <div className="status-breakdown">
            <span>
              <i className="legend-dot green" />
              Claimed<strong>{receiptsLoading ? "—" : number(claimed)}</strong>
            </span>
            <span>
              <i className="legend-dot pale" />
              Unclaimed
              <strong>{receiptsLoading ? "—" : number(unclaimed)}</strong>
            </span>
          </div>
          <div className="status-tip">
            <CircleCheck size={16} />
            <p>
              {receiptsLoading
                ? "Loading your receipt totals…"
                : monthReceipts.length
                  ? `${unclaimed ? `${number(unclaimed)} receipts still need a match.` : "All receipts are matched. Nicely organized."}`
                  : "Your next organized month starts with one receipt."}
            </p>
          </div>
        </section>
      </div>
      <section
        className="dashboard-panel batches-panel"
        aria-labelledby="batches-title"
      >
        <div className="panel-heading">
          <div>
            <h2 id="batches-title">
              Recent batches{" "}
              <span className="count-pill">{batches.length}</span>
            </h2>
            <p>A home for every receipt. Pick up where you left off.</p>
          </div>
          <button
            className="dash-text-button"
            onClick={() => onNavigate("/batch")}
          >
            View all batches <ArrowRight size={15} />
          </button>
        </div>
        <div className="batch-toolbar">
          <label className="batch-search">
            <Search size={16} />
            <input
              type="search"
              placeholder="Search batches…"
              aria-label="Search batches"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <select
            className="dash-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter batches by status"
          >
            <option value="all">All statuses</option>
            {Object.entries(batchStatuses).map(([key, [label]]) => (
              <option value={key} key={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {batchesLoading ? (
          <div className="batch-empty" role="status">
            <div className="skeleton" style={{ width: "80%", height: 14 }} />
            <p>Loading your batches…</p>
          </div>
        ) : filteredBatches.length ? (
          <>
            <div className="batch-table-scroll">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th scope="col">Batch name</th>
                    <th scope="col">Created</th>
                    <th scope="col">Receipts</th>
                    <th scope="col">Verification</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBatches.slice(0, 5).map((batch) => {
                    const [status, color] = batchStatuses[
                      batch.checker_status
                    ] || [
                      batch.checker_status?.replace(/_/g, " ") || "Open",
                      "neutral",
                    ];
                    const total =
                      batch.stats?.total ?? batch.receipts?.length ?? 0;
                    const verified = batch.stats?.verified ?? 0;
                    const progress = total
                      ? Math.min(100, Math.round((verified / total) * 100))
                      : 0;
                    return (
                      <tr key={batch.id}>
                        <td>
                          <button
                            className="batch-name"
                            onClick={() => onNavigate(`/batch/${batch.id}`)}
                          >
                            <span className="batch-file-icon">
                              <Layers size={17} />
                            </span>
                            <span>
                              {batchName(batch)}
                              <small>Receipt batch</small>
                            </span>
                          </button>
                        </td>
                        <td>{formatDate(batch.created_at)}</td>
                        <td>{number(total)}</td>
                        <td>
                          <div className="verification-cell">
                            <div className="verification-track">
                              <span style={{ width: `${progress}%` }} />
                            </div>
                            <span>{progress}%</span>
                          </div>
                        </td>
                        <td>
                          <span className={`batch-status ${color}`}>
                            <i />
                            {status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="dash-icon-button"
                            onClick={() => setSelectedBatch(batch)}
                            aria-label={`View summary for ${batchName(batch)}`}
                            title="View batch summary"
                          >
                            <FileText size={17} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="batch-table-footer">
              <span>
                Showing {Math.min(5, filteredBatches.length)} of{" "}
                {filteredBatches.length} batches
              </span>
              <span>Organized. Verified. In control.</span>
            </div>
          </>
        ) : (
          <div className="batch-empty">
            <span className="empty-icon">
              <Layers size={25} strokeWidth={1.5} />
            </span>
            <h3>
              {query || statusFilter !== "all"
                ? "No matching batches"
                : "A fresh start for your receipts"}
            </h3>
            <p>
              {query || statusFilter !== "all"
                ? "Try a different name or status to find your batch."
                : "Create your first batch to upload, organize, and verify receipts."}
            </p>
            <button
              className="dash-button secondary"
              onClick={() => {
                if (query || statusFilter !== "all") {
                  setQuery("");
                  setStatusFilter("all");
                } else onNavigate("/batch");
              }}
            >
              {query || statusFilter !== "all"
                ? "Clear filters"
                : "Create a batch"}
              <ArrowRight size={15} />
            </button>
          </div>
        )}
      </section>
      <footer className="dashboard-footer">
        <span>
          <ReceiptText size={13} /> A little less admin. A little more room to
          grow.
        </span>
        <span>Made for an organized everyday.</span>
      </footer>
      {loading && (
        <span className="sr-only" role="status">
          Loading dashboard data
        </span>
      )}
      {selectedBatch && (
        <BatchSummary
          batch={selectedBatch}
          onClose={() => setSelectedBatch(null)}
        />
      )}
    </div>
  );
}
