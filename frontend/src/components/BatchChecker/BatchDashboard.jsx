import React from "react";
import {
  UploadCloud,
  Search,
  SlidersHorizontal,
  ArrowUpRight,
  Layers,
  CheckCheck,
  Clock3,
  FileText,
  Pencil,
  ChevronRight,
  RefreshCw,
  X,
} from "lucide-react";
import BillingSummaryModal from "./BillingSummaryModal";
import { getApiUrl } from "../../apiConfig";

const fmt = (n) =>
  Number(n ?? 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const Icon = {
  Plus: ({ size = 18 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Trash: ({ size = 18 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
    </svg>
  ),
  CheckCircle: ({ size = 12 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22,4 12,14.01 9,11.01" />
    </svg>
  ),
  Circle: ({ size = 8 }) => (
    <svg width={size} height={size} viewBox="0 0 8 8">
      <circle cx="4" cy="4" r="4" fill="currentColor" />
    </svg>
  ),
  Calendar: ({ size = 14 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Receipt: ({ size = 14 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
      <path d="M16 8h-6M16 12h-6M16 16h-6" />
    </svg>
  ),
  TrendingUp: ({ size = 14 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  ArrowRight: ({ size = 14 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  Folder: ({ size = 14 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  ),
  Download: ({ size = 14 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
};

// Helper function to generate batch summary PNG and return base64 data (for ZIP)
async function generateBatchSummaryPNG({
  html2canvas,
  batchNumber,
  grossAmount,
  serviceFee,
  deductions,
  netAmount,
  billingMethod,
  cashDenominations,
  bankTransferAmounts,
  verifiedClaims,
}) {
  // Create a properly structured container with real DOM elements (not innerHTML)
  const container = document.createElement("div");
  container.style.cssText =
    "position: absolute; left: -10000px; top: 0; width: 560px;";

  // Create the card wrapper
  const card = document.createElement("div");
  card.style.cssText = `
    width: 560px;
    background: #ffffff;
    border-radius: 20px;
    border: 1px solid #dbeafe;
    overflow: hidden;
    font-family: 'Inter', -apple-system, sans-serif;
    box-shadow: 0 20px 60px rgba(14,58,110,0.14);
  `;

  // Create header
  const header = document.createElement("div");
  header.style.cssText = `
    padding: 24px 28px 20px;
    background: linear-gradient(135deg, #0f2448 0%, #0e3a6e 60%, #1e5fa8 100%);
  `;

  const headerTitle = document.createElement("div");
  headerTitle.style.cssText =
    "font-size: 11px; font-weight: 700; color: #7dd3fc; text-transform: uppercase; letter-spacing: 0.18em; margin-bottom: 6px;";
  headerTitle.textContent = "Billing Summary";

  const headerBatch = document.createElement("div");
  headerBatch.style.cssText =
    'font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.03em; font-family: "DM Mono", monospace;';
  headerBatch.textContent = batchNumber;

  const headerDate = document.createElement("div");
  headerDate.style.cssText =
    "font-size: 10px; color: #93c5fd; margin-top: 6px; font-weight: 500;";
  headerDate.textContent = new Date().toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  header.appendChild(headerTitle);
  header.appendChild(headerBatch);
  header.appendChild(headerDate);

  // Create financial summary section
  const financialSection = document.createElement("div");
  financialSection.style.cssText =
    "padding: 18px 28px; border-bottom: 1px solid #dbeafe;";
  financialSection.innerHTML = `
    <div style="font-size: 11px; font-weight: 700; color: #93c5fd; text-transform: uppercase; letter-spacing: 0.18em; margin-bottom: 8px;">Financial Summary</div>
    <div style="display: flex; justify-content: space-between; padding: 9px 0;">
      <span style="font-size: 12px; font-weight: 500; color: #64748b;">Gross Claims Amount</span>
      <span style="font-size: 13px; font-weight: 700; color: #0a1628; font-family: 'DM Mono', monospace;">₱${fmt(grossAmount)}</span>
    </div>
    <div style="height: 1px; background: #dbeafe; margin: 4px 0;"></div>
    <div style="display: flex; justify-content: space-between; padding: 9px 0;">
      <span style="font-size: 12px; font-weight: 500; color: #64748b;">Service Fee</span>
      <span style="font-size: 13px; font-weight: 700; color: #ef4444; font-family: 'DM Mono', monospace;">− ₱${fmt(serviceFee)}</span>
    </div>
    ${
      deductions && deductions.length > 0
        ? deductions
            .map(
              (d) => `
      <div style="display: flex; justify-content: space-between; padding: 9px 0;">
        <span style="font-size: 12px; font-weight: 500; color: #64748b;">${d.type || "Deduction"}</span>
        <span style="font-size: 13px; font-weight: 700; color: #f97316; font-family: 'DM Mono', monospace;">− ₱${fmt(d.amount)}</span>
      </div>
    `,
            )
            .join("")
        : ""
    }
    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 12px; border-top: 1.5px solid #bfdbfe;">
      <span style="font-size: 11px; font-weight: 700; color: #0f2448; text-transform: uppercase; letter-spacing: 0.1em;">Net Amount Due</span>
      <span style="font-size: 22px; font-weight: 800; color: #1c7a48; letter-spacing: -0.03em; font-family: 'DM Mono', monospace;">₱${fmt(netAmount)}</span>
    </div>
  `;

  // Create billing section (simplified)
  const billingSection = document.createElement("div");
  billingSection.style.cssText =
    "padding: 18px 28px; border-bottom: 1px solid #dbeafe;";

  let billingHTML =
    '<div style="font-size: 11px; font-weight: 700; color: #93c5fd; text-transform: uppercase; letter-spacing: 0.18em; margin-bottom: 14px;">Fund Allocation</div>';

  if (
    billingMethod !== "bank" &&
    cashDenominations &&
    Object.keys(cashDenominations).length > 0
  ) {
    const cashTotal = Object.entries(cashDenominations).reduce(
      (sum, [key, count]) => {
        const val = key.startsWith("c") ? Number(key.slice(1)) : Number(key);
        return sum + val * (count || 0);
      },
      0,
    );
    billingHTML += `<div style="padding: 14px 18px; border-radius: 12px; background: #eff6ff; border: 1px solid #bfdbfe;">
      <div style="font-size: 11px; font-weight: 700; color: #1e5fa8; margin-bottom: 8px;">Cash: ₱${fmt(cashTotal)}</div>
    </div>`;
  }

  if (billingMethod !== "cash") {
    const bankTotal = Array.isArray(bankTransferAmounts)
      ? bankTransferAmounts.reduce((s, v) => s + Number(v || 0), 0)
      : Number(bankTransferAmounts || 0);
    if (bankTotal > 0) {
      billingHTML += `<div style="padding: 14px 18px; border-radius: 12px; background: linear-gradient(135deg, #0f2448 0%, #0e3a6e 100%); border: 1px solid #1e5fa8; margin-top: 8px;">
        <div style="font-size: 11px; font-weight: 700; color: #7dd3fc; margin-bottom: 4px;">Bank Transfer</div>
        <div style="font-size: 15px; font-weight: 800; color: #ffffff; font-family: 'DM Mono', monospace;">₱${fmt(bankTotal)}</div>
      </div>`;
    }
  }

  billingSection.innerHTML = billingHTML;

  // Create claims section
  const claimsSection = document.createElement("div");
  claimsSection.style.cssText =
    "padding: 14px 28px; border-bottom: 1px solid #dbeafe;";
  claimsSection.innerHTML = `
    <div style="font-size: 11px; font-weight: 700; color: #93c5fd; text-transform: uppercase; letter-spacing: 0.18em; margin-bottom: 6px;">Verified Claims</div>
    <div style="font-size: 13px; font-weight: 800; color: #0f2448;">${verifiedClaims?.length || 0} ${(verifiedClaims?.length || 0) === 1 ? "Claim" : "Claims"}</div>
  `;

  // Create footer
  const footer = document.createElement("div");
  footer.style.cssText =
    "padding: 12px 28px; background: #f0f9ff; font-size: 10px; font-weight: 600; color: #93c5fd; text-align: center;";
  footer.textContent = `Generated ${new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}`;

  // Assemble the card
  card.appendChild(header);
  card.appendChild(financialSection);
  card.appendChild(billingSection);
  card.appendChild(claimsSection);
  card.appendChild(footer);
  container.appendChild(card);
  document.body.appendChild(container);

  try {
    // Wait for DOM to render
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Capture with html2canvas
    const canvas = await html2canvas(card, {
      backgroundColor: "#ffffff",
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: false,
      width: 560,
      height: card.scrollHeight,
    });

    // Return the base64 data URL
    return canvas.toDataURL("image/png", 0.92);
  } catch (error) {
    console.error("Error generating summary image:", error);
    throw error;
  } finally {
    // Clean up
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  }
}

export default function BatchDashboard({
  batches,
  setBatches,
  dashboard,
  fileCount,
  setFileCount,
  fileInputRef,
  isCreating,
  handleCreateAndUpload,
  handleDeleteBatch,
  handleUpdateBatchName,
  error,
  navigate,
  fetchBatches,
  nextBatchNumber: nextBatchNumberProp,
}) {
  // Use backend-calculated next batch number if available, otherwise calculate from visible batches
  const calculateNextBatchNumber = () => {
    // If backend provided next batch number, use it
    if (nextBatchNumberProp) return nextBatchNumberProp;

    // Otherwise scan visible batches
    let highest = 0;
    batches.forEach((batch) => {
      const match = batch.name?.match(/Batch #(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > highest) highest = num;
      }
    });

    const totalBatches = dashboard?.total_batches || batches.length;
    return Math.max(highest, totalBatches) + 1;
  };

  const nextBatchNumber = calculateNextBatchNumber();
  const autoBatchName = `Batch #${String(nextBatchNumber).padStart(3, "0")}`;

  const [customBatchName, setCustomBatchName] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [summaryBatch, setSummaryBatch] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState("date-desc");

  // ── Multi-select state ──
  const [selectedBatchIds, setSelectedBatchIds] = React.useState(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = React.useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = React.useState(false);

  const toggleBatchSelect = (id, e) => {
    e.stopPropagation();
    setSelectedBatchIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelectAll = (visible) => {
    const ids = visible.map((b) => b.id);
    const allSelected = ids.every((id) => selectedBatchIds.has(id));
    setSelectedBatchIds(allSelected ? new Set() : new Set(ids));
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      const idsArray = Array.from(selectedBatchIds);

      const response = await fetch(getApiUrl("/api/batches/bulk-delete"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_ids: idsArray }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || `Server returned ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Optimistic local filter — remove deleted batches from state
        const removeSet = new Set(idsArray);
        if (typeof setBatches === "function") {
          setBatches((prev) => prev.filter((b) => !removeSet.has(b.id)));
        } else {
          // Fallback to full refresh if setBatches is not available
          await fetchBatches(true);
        }

        // Clear selection and close modal
        setSelectedBatchIds(new Set());
        setShowBulkDeleteModal(false);

        console.log("✓", result.message);
      } else {
        throw new Error(result.message || "Failed to delete batches");
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
      alert(`Failed to delete batches: ${error.message}`);
      // Optionally refetch to ensure UI is in sync
      if (typeof fetchBatches === "function") {
        await fetchBatches(true);
      }
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleDownloadAllSummaries = async () => {
    if (selectedBatchIds.size === 0) return;

    setIsDownloadingAll(true);
    try {
      console.log(
        "Starting bulk download for batch IDs:",
        Array.from(selectedBatchIds),
      );

      // Call backend API to get batch summaries
      const response = await fetch(
        getApiUrl("/api/batches/bulk-download-summaries"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batch_ids: Array.from(selectedBatchIds) }),
        },
      );

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("API Result:", result);

      if (!result.success) {
        alert(result.message || "Failed to retrieve batch summaries");
        setIsDownloadingAll(false);
        return;
      }

      if (!result.summaries || result.summaries.length === 0) {
        alert(
          "None of the selected batches have billing summaries ready to download.",
        );
        setIsDownloadingAll(false);
        return;
      }

      console.log(
        `Generating ${result.summaries.length} summaries for ZIP file...`,
      );

      // Import required libraries
      const html2canvas = (await import("html2canvas")).default;
      const JSZip = (await import("jszip")).default;

      // Create a new ZIP file
      const zip = new JSZip();

      // Generate all summaries and add to ZIP
      let successCount = 0;
      for (let i = 0; i < result.summaries.length; i++) {
        const summary = result.summaries[i];

        console.log(
          `Processing ${i + 1}/${result.summaries.length}: ${summary.final_batch_number || summary.batch_number}`,
        );

        try {
          // Generate PNG data for this batch
          const pngData = await generateBatchSummaryPNG({
            html2canvas,
            finalBatchNumber: summary.final_batch_number,
            batchNumber:
              summary.name ||
              summary.final_batch_number ||
              summary.batch_number,
            grossAmount: summary.financial.gross_amount,
            serviceFee: summary.financial.service_fee,
            deductions: summary.financial.deductions,
            netAmount: summary.financial.net_amount,
            billingMethod: summary.billing.method,
            cashDenominations: summary.billing.cash_denominations,
            bankTransferAmounts: summary.billing.bank_transfer_amounts,
            totalPrepared: summary.billing.total_prepared,
            verifiedClaims: summary.verified_claims,
          });

          // Add to ZIP with a nice filename
          const filename = `${summary.final_batch_number || summary.batch_number}_${summary.name || "summary"}.png`;
          zip.file(filename, pngData.split(",")[1], { base64: true });
          successCount++;

          // Small delay between batches to prevent overwhelming the browser
          if (i < result.summaries.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        } catch (downloadError) {
          console.error(
            `Failed to generate summary for batch ${summary.final_batch_number || summary.batch_number}:`,
            downloadError,
          );
          // Continue with next batch even if one fails
        }
      }

      if (successCount === 0) {
        alert("Failed to generate any batch summaries. Please try again.");
        setIsDownloadingAll(false);
        return;
      }

      // Generate the ZIP file
      console.log(`Creating ZIP file with ${successCount} summaries...`);
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      // Download the ZIP file
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `batch-summaries-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (successCount < result.summaries.length) {
        alert(
          `Downloaded ${successCount} of ${result.summaries.length} batch summaries. Some summaries failed to generate.`,
        );
      } else {
        alert(
          `Successfully downloaded ${successCount} batch summar${successCount === 1 ? "y" : "ies"} as ZIP file!`,
        );
      }
    } catch (error) {
      console.error("Error downloading summaries:", error);
      alert("Failed to download summaries: " + error.message);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const displayBatchName = customBatchName ?? autoBatchName;

  // Dashboard statistics from backend
  const totalBatches = dashboard?.total_batches ?? batches.length;
  const completedBatches =
    dashboard?.completed_batches ??
    batches.filter((b) => getBatchStatus(b).group === "complete").length;
  const inProgressBatches =
    dashboard?.in_progress_batches ??
    batches.filter((b) => getBatchStatus(b).group === "active").length;
  const totalReceipts =
    dashboard?.total_receipts ??
    batches.reduce(
      (sum, b) => sum + (b.stats?.total ?? b.receipts?.length ?? 0),
      0,
    );

  // Filter and sort batches
  const filteredBatches = batches
    .filter((batch) => {
      if (
        statusFilter !== "all" &&
        getBatchStatus(batch).group !== statusFilter
      )
        return false;
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        (batch.name || "").toLowerCase().includes(query) ||
        (batch.final_batch_number || "").toLowerCase().includes(query) ||
        String(batch.id).toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return new Date(a.created_at) - new Date(b.created_at);
        case "name-asc":
          return (a.name || "").localeCompare(b.name || "");
        case "name-desc":
          return (b.name || "").localeCompare(a.name || "");
        case "items-desc":
          return (
            (b.stats?.total ?? b.receipts?.length ?? 0) -
            (a.stats?.total ?? a.receipts?.length ?? 0)
          );
        case "items-asc":
          return (
            (a.stats?.total ?? a.receipts?.length ?? 0) -
            (b.stats?.total ?? b.receipts?.length ?? 0)
          );
        case "date-desc":
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

  const allSelected =
    filteredBatches.length > 0 &&
    filteredBatches.every((b) => selectedBatchIds.has(b.id));

  return (
    <div className="bc-dashboard">
      <header className="bc-page-header">
        <div>
          <div className="bc-breadcrumb">
            Workspace <ChevronRight size={13} /> <span>Batch Checker</span>
          </div>
          <h1>
            Batch Checker<span className="bc-title-dot">.</span>
          </h1>
          <p>A clearer view of every receipt. A simpler way to verify.</p>
        </div>
        <button
          className="bc-button bc-button-primary"
          onClick={() => document.getElementById("batch-name")?.focus()}
        >
          <Icon.Plus size={16} /> New batch
        </button>
      </header>

      <div className="bc-overview" role="group" aria-label="Batch overview">
        {[
          {
            label: "Total batches",
            value: totalBatches,
            icon: Layers,
            note: "Your batch workspace",
            tone: "orange",
          },
          {
            label: "In progress",
            value: inProgressBatches,
            icon: Clock3,
            note: "Moving through verification",
            tone: "amber",
          },
          {
            label: "Completed",
            value: completedBatches,
            icon: CheckCheck,
            note: "Verification complete",
            tone: "green",
          },
          {
            label: "Total receipts",
            value: totalReceipts,
            icon: FileText,
            note: "Across all batches",
            tone: "blue",
          },
        ].map(({ label, value, icon: MetricIcon, note, tone }) => (
          <div className="bc-stat" key={label}>
            <div className="bc-stat-top">
              <span>{label}</span>
              <span className={`bc-stat-icon ${tone}`}>
                <MetricIcon size={17} />
              </span>
            </div>
            <strong>{value.toLocaleString()}</strong>
            <span className="bc-stat-note">{note}</span>
          </div>
        ))}
      </div>

      <aside className="bc-create-panel">
        <div className="bc-panel-heading">
          <span className="bc-icon-tile">
            <Icon.Plus size={19} />
          </span>
          <span className="bc-eyebrow">LET’S GET STARTED</span>
        </div>
        <h2>Create a new batch</h2>
        <p className="bc-description">
          Bring your receipts together.
          <br />
          We’ll help you take it from here.
        </p>
        {error && (
          <div className="bc-error" role="alert">
            {error}
            <button
              type="button"
              className="bc-button"
              onClick={() => fetchBatches()}
            >
              Try again
            </button>
          </div>
        )}
        <form onSubmit={(e) => handleCreateAndUpload(e, displayBatchName)}>
          <label className="bc-field-label" htmlFor="batch-name">
            Batch name
          </label>
          <div className="bc-name-field">
            <Icon.Folder size={17} />
            <input
              id="batch-name"
              value={displayBatchName}
              onChange={(e) => setCustomBatchName(e.target.value)}
              disabled={isCreating}
              required
            />
            <Pencil size={13} />
          </div>
          <p className="bc-field-hint">Auto-named for you. Make it your own.</p>
          <label className={`bc-upload ${fileCount ? "has-files" : ""}`}>
            <input
              type="file"
              multiple
              accept="image/*"
              ref={fileInputRef}
              disabled={isCreating}
              aria-label="Upload receipt images"
              onChange={(e) => setFileCount(e.target.files?.length || 0)}
            />
            <span className="bc-upload-icon">
              {fileCount ? <CheckCheck size={26} /> : <UploadCloud size={26} />}
            </span>
            <strong>
              {fileCount
                ? `${fileCount} receipt${fileCount === 1 ? "" : "s"} selected`
                : "Your receipts start here"}
            </strong>
            <span>
              {fileCount ? (
                "Click to change your selection"
              ) : (
                <>
                  <b>Click to upload</b> or drag and drop
                </>
              )}
            </span>
            <small>Receipt images · Select multiple files</small>
          </label>
          <button
            className="bc-button bc-button-primary bc-create-button"
            type="submit"
            disabled={isCreating || !fileCount}
          >
            {isCreating ? (
              <>
                <span className="spinner-modern" /> Creating batch…
              </>
            ) : (
              <>
                Create batch <ArrowUpRight size={16} />
              </>
            )}
          </button>
        </form>
        <div className="bc-workflow-guide">
          <span className="bc-eyebrow">FROM UPLOAD TO VERIFIED</span>
          <ol>
            {[
              ["Upload", "Add your receipt images"],
              ["Prepare", "Sort, crop and extract details"],
              ["Verify", "Check and finalize your batch"],
            ].map(([title, text], index) => (
              <li key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </aside>

      <section className="bc-library" aria-labelledby="batch-library-title">
        <div className="bc-library-heading">
          <div>
            <h2 id="batch-library-title">
              Your batches <span>{batches.length}</span>
            </h2>
            <p>Organized, up to date, and ready for your next step.</p>
          </div>
          <button
            className="bc-icon-button"
            aria-label="Refresh batches"
            title="Refresh batches"
            onClick={() => fetchBatches()}
          >
            <RefreshCw size={16} />
          </button>
        </div>
        <div
          className="bc-tabs"
          role="group"
          aria-label="Filter batches by status"
        >
          {[
            ["all", "All batches"],
            ["active", "In progress"],
            ["complete", "Completed"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={statusFilter === key ? "active" : ""}
              aria-pressed={statusFilter === key}
              onClick={() => setStatusFilter(key)}
            >
              {label}
              {key === "all" && <span>{batches.length}</span>}
            </button>
          ))}
        </div>
        <div className="bc-toolbar">
          <label className="bc-search">
            <Search size={16} />
            <input
              aria-label="Search batches"
              placeholder="Search batches…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="bc-icon-button"
                aria-label="Clear search"
                onClick={() => setSearchQuery("")}
              >
                <X size={14} />
              </button>
            )}
          </label>
          <label className="bc-sort">
            <SlidersHorizontal size={15} />
            <select
              aria-label="Sort batches"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="name-asc">Name: A–Z</option>
              <option value="name-desc">Name: Z–A</option>
              <option value="items-desc">Most receipts</option>
              <option value="items-asc">Fewest receipts</option>
            </select>
          </label>
        </div>
        {selectedBatchIds.size > 0 && (
          <div className="bc-selection-bar">
            <strong>{selectedBatchIds.size} selected</strong>
            <button
              className="bc-button"
              onClick={handleDownloadAllSummaries}
              disabled={isDownloadingAll}
            >
              <Icon.Download size={14} />
              {isDownloadingAll ? "Downloading…" : "Download"}
            </button>
            <button
              className="bc-button bc-danger"
              onClick={() => setShowBulkDeleteModal(true)}
            >
              <Icon.Trash size={14} /> Delete
            </button>
            <button
              className="bc-icon-button"
              aria-label="Clear selection"
              onClick={() => setSelectedBatchIds(new Set())}
            >
              <X size={15} />
            </button>
          </div>
        )}
        {filteredBatches.length ? (
          <>
            <div className="bc-list-header">
              <label>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => handleSelectAll(filteredBatches)}
                  aria-label="Select all visible batches"
                />{" "}
                Batch details
              </label>
              <span>Receipts</span>
              <span>Progress</span>
              <span>Status</span>
              <span />
            </div>
            <div className="bc-batch-list">
              {filteredBatches.map((batch) => (
                <BatchCard
                  key={batch.id}
                  batch={batch}
                  isSelected={selectedBatchIds.has(batch.id)}
                  onToggleSelect={(e) => toggleBatchSelect(batch.id, e)}
                  onClick={() => navigate(`/batch/${batch.id}`)}
                  onDelete={(e) => handleDeleteBatch(e, batch.id)}
                  onUpdateName={handleUpdateBatchName}
                  onViewSummary={(e) => {
                    e.stopPropagation();
                    setSummaryBatch(batch);
                  }}
                />
              ))}
            </div>
            <div className="bc-list-footer">
              <span>
                Showing {filteredBatches.length} of {batches.length} loaded
                batches
              </span>
              <span>
                <span className="bc-small-dot" /> All in one place
              </span>
            </div>
          </>
        ) : (
          <div className="bc-empty">
            <span className="bc-empty-icon">
              <Layers size={30} />
            </span>
            <h3>
              {batches.length
                ? "No matching batches"
                : "A fresh start for your receipts"}
            </h3>
            <p>
              {batches.length
                ? "Try another search or status filter."
                : "Create your first batch to start organizing and verifying your receipts."}
            </p>
            <button
              className="bc-button"
              onClick={() => {
                if (batches.length) {
                  setSearchQuery("");
                  setStatusFilter("all");
                } else document.getElementById("batch-name")?.focus();
              }}
            >
              {batches.length ? "Clear filters" : "Create your first batch"}{" "}
              <Icon.ArrowRight size={14} />
            </button>
          </div>
        )}
        {showBulkDeleteModal && (
          <div
            className="ort-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-delete-title"
          >
            <div className="glass-card bc-delete-dialog">
              <span className="bc-empty-icon bc-danger">
                <Icon.Trash size={25} />
              </span>
              <h3 id="bulk-delete-title">
                Delete {selectedBatchIds.size} batches?
              </h3>
              <p>
                This permanently removes the selected batches and all their
                receipts. This cannot be undone.
              </p>
              <div>
                <button
                  className="bc-button"
                  onClick={() => setShowBulkDeleteModal(false)}
                  disabled={isBulkDeleting}
                >
                  Cancel
                </button>
                <button
                  className="bc-button bc-button-destructive"
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                >
                  {isBulkDeleting ? "Deleting…" : "Delete batches"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Billing Summary Modal */}
        {summaryBatch &&
          (() => {
            const sd = summaryBatch.summary_data || {};
            const bd = summaryBatch.billing_data || {};

            // Build verified receipts list from actual receipt data
            const verifiedReceipts = summaryBatch.verified_claims || [];

            // Fallback: reconstruct financials from receipts if summary_data wasn't saved
            const grossFallback = verifiedReceipts.reduce(
              (s, r) => s + r.amount,
              0,
            );
            const feeFallback = Math.floor(grossFallback / 1000) * 10;

            const grossAmount = sd.gross_amount ?? grossFallback;
            const serviceFee = sd.service_fee ?? feeFallback;
            const deductions = sd.deductions || [];
            const totalDeductions = deductions.reduce(
              (s, d) => s + (Number(d.amount) || 0),
              0,
            );
            const netAmount =
              sd.net_amount ?? grossAmount - serviceFee - totalDeductions;

            const billingMethod = bd.method || "both";
            const cashDenoms = bd.cash_denominations || {};
            const bankAmt = bd.bank_transfer_amount || 0;
            const bankAmts = Array.isArray(bd.bank_transfer_amount)
              ? bd.bank_transfer_amount
              : bd.bank_transfer_amount
                ? [bd.bank_transfer_amount]
                : [];
            const totalPrepared = bd.total_prepared || netAmount;

            return (
              <BillingSummaryModal
                onClose={() => setSummaryBatch(null)}
                batchNumber={summaryBatch.batch_number}
                finalBatchNumber={summaryBatch.final_batch_number}
                grossAmount={grossAmount}
                serviceFee={serviceFee}
                deductions={deductions}
                netAmount={netAmount}
                billingMethod={billingMethod}
                cashDenominations={cashDenoms}
                bankTransferAmount={
                  Array.isArray(bankAmt)
                    ? bankAmts.reduce((s, v) => s + Number(v || 0), 0)
                    : bankAmt
                }
                bankTransferAmounts={bankAmts}
                totalPrepared={totalPrepared}
                verifiedClaims={verifiedReceipts}
              />
            );
          })()}
      </section>
    </div>
  );
}

function getBatchStatus(batch) {
  if (batch.checker_status === "billing_ready")
    return { label: "Completed", group: "complete", tone: "green" };
  if (["summarized", "finalized"].includes(batch.checker_status))
    return { label: "In review", group: "active", tone: "blue" };
  if (
    batch.checker_status === "processing" ||
    batch.receipts?.some((r) =>
      ["uploading", "processing"].includes(r.ocr_status),
    )
  )
    return { label: "Processing", group: "active", tone: "amber" };
  if ((batch.stats?.total ?? batch.receipts?.length ?? 0) > 0)
    return { label: "In progress", group: "active", tone: "orange" };
  return { label: "Draft", group: "active", tone: "neutral" };
}

function BatchCard({
  batch,
  onClick,
  onDelete,
  onUpdateName,
  onViewSummary,
  isSelected,
  onToggleSelect,
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState("");
  const total = batch.stats?.total ?? batch.receipts?.length ?? 0;
  const verified = batch.stats?.ocr_finished ?? 0;
  const progress = Math.min(100, Math.max(0, Number(batch.progress) || 0));
  const status = getBatchStatus(batch);
  const date = new Date(batch.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const saveName = () => {
    setIsEditing(false);
    if (editName.trim() && editName.trim() !== batch.name)
      onUpdateName(batch.id, editName.trim());
  };
  return (
    <article className={`bc-batch-row ${isSelected ? "selected" : ""}`}>
      <div className="bc-batch-identity">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          aria-label={`Select ${batch.name || "unnamed batch"}`}
        />
        <span className={`bc-folder-icon ${status.tone}`}>
          <Icon.Folder size={20} />
        </span>
        <div className="bc-batch-name">
          {isEditing ? (
            <input
              className="bc-inline-name"
              aria-label="Rename batch"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") setIsEditing(false);
              }}
              autoFocus
            />
          ) : (
            <div>
              <button className="bc-open-batch" onClick={onClick}>
                {batch.name || "Unnamed batch"}
              </button>
              <button
                className="bc-rename"
                aria-label={`Rename ${batch.name || "batch"}`}
                onClick={() => {
                  setEditName(batch.name || "");
                  setIsEditing(true);
                }}
              >
                <Pencil size={12} />
              </button>
            </div>
          )}
          <span>
            {date}
            {batch.final_batch_number && ` · ${batch.final_batch_number}`}
          </span>
          {batch.summary_data?.net_amount != null && (
            <small>₱{fmt(batch.summary_data.net_amount)} net total</small>
          )}
        </div>
      </div>
      <div className="bc-receipt-count">
        <strong>{total}</strong>
        <span>{verified} extracted</span>
      </div>
      <div className="bc-row-progress">
        <span>{progress}%</span>
        <div
          role="progressbar"
          aria-label={`${batch.name} progress`}
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <i style={{ width: `${progress}%` }} />
        </div>
      </div>
      <span className={`bc-status ${status.tone}`}>
        <i />
        {status.label}
      </span>
      <div className="bc-row-actions">
        {status.group === "complete" && (
          <button
            className="bc-icon-button"
            title="View summary"
            aria-label={`View summary for ${batch.name}`}
            onClick={onViewSummary}
          >
            <FileText size={15} />
          </button>
        )}
        <button
          className="bc-icon-button bc-delete"
          title="Delete batch"
          aria-label={`Delete ${batch.name}`}
          onClick={onDelete}
        >
          <Icon.Trash size={14} />
        </button>
        <button
          className="bc-icon-button"
          aria-label={`Open ${batch.name}`}
          onClick={onClick}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </article>
  );
}
