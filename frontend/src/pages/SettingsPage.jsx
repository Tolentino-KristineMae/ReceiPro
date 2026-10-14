import { useEffect, useRef, useState } from "react";
import {
  Users,
  Tags,
  Plus,
  Trash2,
  X,
  Info,
  AlertCircle,
  RefreshCw,
  Check,
  Settings2,
  ArrowUpRight,
  LoaderCircle,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import WorkspacePageHeader from "../components/WorkspacePageHeader";
import { getApiUrl } from "../apiConfig";
import "react-toastify/dist/ReactToastify.css";
import "./SettingsPage.css";

const resources = {
  account: {
    path: "/api/settings/accounts",
    property: "accounts",
    name: "Account",
  },
  deduction: {
    path: "/api/settings/deduction-types",
    property: "deduction_types",
    name: "Deduction type",
  },
};

async function readResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    const firstError = Object.values(data.errors || {}).flat()[0];
    throw new Error(
      firstError || data.message || "Unable to save changes. Please try again.",
    );
  }
  return data;
}

function DeleteConfirmation({ item, saving, onClose, onConfirm }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    dialogRef.current.showModal();
  }, []);
  return (
    <dialog
      ref={dialogRef}
      className="settings-confirm"
      aria-labelledby="settings-confirm-title"
      onCancel={(event) => {
        if (saving) event.preventDefault();
        else onClose();
      }}
    >
      <div className="settings-confirm-top">
        <span className="settings-delete-symbol">
          <Trash2 size={22} />
        </span>
        <button
          className="settings-icon-button"
          onClick={onClose}
          disabled={saving}
          aria-label="Close confirmation"
        >
          <X size={19} />
        </button>
      </div>
      <h2 id="settings-confirm-title">
        Remove {item.kind === "account" ? "account holder" : "deduction type"}?
      </h2>
      <p>
        Remove <strong>{item.label}</strong> from your workspace configuration.
        Existing transaction records will stay in your ledger.
      </p>
      <div className="settings-confirm-actions">
        <button
          className="settings-button secondary"
          onClick={onClose}
          disabled={saving}
        >
          Keep it
        </button>
        <button
          className="settings-button danger"
          onClick={onConfirm}
          disabled={saving}
        >
          {saving && <LoaderCircle className="settings-spinner" size={15} />}
          {saving ? "Removing…" : "Remove"}
        </button>
      </div>
    </dialog>
  );
}

function SettingsSection({
  icon: SectionIcon,
  title,
  description,
  count,
  children,
  id,
}) {
  return (
    <section className="settings-panel" id={id} aria-labelledby={`${id}-title`}>
      <div className="settings-panel-heading">
        <span className="settings-section-icon">
          <SectionIcon size={19} strokeWidth={1.7} />
        </span>
        <div>
          <h2 id={`${id}-title`}>
            {title}
            <span className="settings-count">{count}</span>
          </h2>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const [accounts, setAccounts] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);
  const [saving, setSaving] = useState(false);
  const [accountForm, setAccountForm] = useState({ name: "", code: "" });
  const [deductionForm, setDeductionForm] = useState({ label: "", key: "" });
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all(
      Object.values(resources).map((resource) =>
        fetch(getApiUrl(resource.path)).then(readResponse),
      ),
    )
      .then(([accountData, deductionData]) => {
        if (!active) return;
        setAccounts(accountData.accounts || []);
        setDeductions(deductionData.deduction_types || []);
      })
      .catch(() => {
        if (active)
          setLoadError(
            "We couldn’t load your settings. Please check your connection and try again.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reload]);

  const retry = () => {
    setLoadError("");
    setLoading(true);
    setReload((value) => value + 1);
  };
  const mutate = async (kind, method, body, key) => {
    const resource = resources[kind];
    setSaving(true);
    try {
      const response = await fetch(
        getApiUrl(
          resource.path + (key != null ? `/${encodeURIComponent(key)}` : ""),
        ),
        {
          method,
          headers: { "Content-Type": "application/json" },
          ...(body ? { body: JSON.stringify(body) } : {}),
        },
      );
      const data = await readResponse(response);
      if (kind === "account") setAccounts(data[resource.property] || []);
      else setDeductions(data[resource.property] || []);
      toast.success(
        `${resource.name} ${method === "POST" ? "added" : "removed"}.`,
      );
      return true;
    } catch (error) {
      toast.error(
        error.message === "Failed to fetch"
          ? "Unable to connect. Your changes haven’t been saved."
          : error.message,
      );
      return false;
    } finally {
      setSaving(false);
    }
  };
  const addAccount = async (event) => {
    event.preventDefault();
    if (
      await mutate("account", "POST", {
        name: accountForm.name.trim(),
        short_code: accountForm.code.trim().toUpperCase(),
      })
    )
      setAccountForm({ name: "", code: "" });
  };
  const addDeduction = async (event) => {
    event.preventDefault();
    if (
      await mutate("deduction", "POST", {
        label: deductionForm.label.trim(),
        key: deductionForm.key.trim().toLowerCase(),
      })
    )
      setDeductionForm({ label: "", key: "" });
  };
  const confirmDelete = async () => {
    if (await mutate(confirmation.kind, "DELETE", null, confirmation.key))
      setConfirmation(null);
  };
  const unavailable = loading || !!loadError || saving;

  return (
    <div className="settings-page page">
      <WorkspacePageHeader
        title="Settings"
        eyebrow="A WORKSPACE THAT WORKS FOR YOU"
        description="Keep your people and transaction categories neatly organized."
      />
      <div className="settings-overview">
        <div>
          <Settings2 size={18} />
          <span>Workspace configuration</span>
        </div>
        <span>
          <Check size={14} />
          Changes save when you add or remove an item
        </span>
      </div>
      {loadError && (
        <div className="settings-load-error" role="alert">
          <AlertCircle size={18} />
          <p>{loadError}</p>
          <button className="settings-button secondary" onClick={retry}>
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}
      <div className="settings-content-grid">
        <SettingsSection
          icon={Users}
          title="Account holders"
          description="People who receive and manage payments."
          count={loading || loadError ? "—" : accounts.length}
          id="account-holders"
        >
          <div className="settings-list" aria-busy={loading}>
            {loading ? (
              <div className="settings-empty" role="status">
                <LoaderCircle className="settings-spinner" size={20} />
                <p>Loading account holders…</p>
              </div>
            ) : loadError ? (
              <div className="settings-empty">
                <Users size={25} />
                <p>Account holders are unavailable.</p>
              </div>
            ) : accounts.length ? (
              accounts.map((account) => (
                <div className="settings-list-row" key={account.name}>
                  <span className="settings-account-avatar">
                    {account.short_code}
                  </span>
                  <div className="settings-row-copy">
                    <strong>{account.name}</strong>
                    <span>
                      Account holder <i>·</i> {account.short_code}
                    </span>
                  </div>
                  <button
                    className="settings-icon-button"
                    aria-label={`Remove account ${account.name}`}
                    onClick={() =>
                      setConfirmation({
                        kind: "account",
                        key: account.name,
                        label: account.name,
                      })
                    }
                    disabled={saving}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            ) : (
              <div className="settings-empty">
                <Users size={25} />
                <h3>Your people, all in one place</h3>
                <p>Add an account holder to get started.</p>
              </div>
            )}
          </div>
          <form className="settings-add-form" onSubmit={addAccount}>
            <div className="settings-form-title">
              <Plus size={15} />
              <h3>Add an account holder</h3>
            </div>
            <div className="settings-field-row account-fields">
              <div>
                <label htmlFor="account-name">Full name</label>
                <input
                  id="account-name"
                  placeholder="e.g. Alex Santos"
                  value={accountForm.name}
                  onChange={(event) =>
                    setAccountForm((form) => ({
                      ...form,
                      name: event.target.value,
                    }))
                  }
                  disabled={unavailable}
                  required
                />
              </div>
              <div>
                <label htmlFor="account-code">Short code</label>
                <input
                  id="account-code"
                  className="settings-code-input"
                  placeholder="ALX"
                  minLength={3}
                  maxLength={3}
                  value={accountForm.code}
                  onChange={(event) =>
                    setAccountForm((form) => ({
                      ...form,
                      code: event.target.value.toUpperCase(),
                    }))
                  }
                  disabled={unavailable}
                  required
                />
              </div>
            </div>
            <div className="settings-form-footer">
              <span>A short code identifies each person.</span>
              <button
                className="settings-button primary"
                disabled={
                  unavailable ||
                  !accountForm.name.trim() ||
                  accountForm.code.trim().length !== 3
                }
              >
                <Plus size={15} />
                Add account
              </button>
            </div>
          </form>
        </SettingsSection>
        <SettingsSection
          icon={Tags}
          title="Deduction types"
          description="Clear categories for every deduction."
          count={loading || loadError ? "—" : deductions.length}
          id="deduction-types"
        >
          <div className="settings-list" aria-busy={loading}>
            {loading ? (
              <div className="settings-empty" role="status">
                <LoaderCircle className="settings-spinner" size={20} />
                <p>Loading deduction types…</p>
              </div>
            ) : loadError ? (
              <div className="settings-empty">
                <Tags size={25} />
                <p>Deduction types are unavailable.</p>
              </div>
            ) : deductions.length ? (
              deductions.map((deduction) => (
                <div className="settings-list-row" key={deduction.key}>
                  <span className="settings-deduction-icon">
                    <Tags size={17} />
                  </span>
                  <div className="settings-row-copy">
                    <strong>{deduction.label}</strong>
                    <span className="settings-key">{deduction.key}</span>
                  </div>
                  <button
                    className="settings-icon-button"
                    aria-label={`Remove deduction ${deduction.label}`}
                    onClick={() =>
                      setConfirmation({
                        kind: "deduction",
                        key: deduction.key,
                        label: deduction.label,
                      })
                    }
                    disabled={saving}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            ) : (
              <div className="settings-empty">
                <Tags size={25} />
                <h3>Give every deduction a place</h3>
                <p>Add your first category below.</p>
              </div>
            )}
          </div>
          <form className="settings-add-form" onSubmit={addDeduction}>
            <div className="settings-form-title">
              <Plus size={15} />
              <h3>Add a deduction type</h3>
            </div>
            <div className="settings-field-row">
              <div>
                <label htmlFor="deduction-label">Display label</label>
                <input
                  id="deduction-label"
                  placeholder="e.g. Utility bills"
                  value={deductionForm.label}
                  onChange={(event) =>
                    setDeductionForm((form) => ({
                      ...form,
                      label: event.target.value,
                    }))
                  }
                  disabled={unavailable}
                  required
                />
              </div>
              <div>
                <label htmlFor="deduction-key">System key</label>
                <input
                  id="deduction-key"
                  className="settings-code-input"
                  placeholder="utility_bills"
                  value={deductionForm.key}
                  onChange={(event) =>
                    setDeductionForm((form) => ({
                      ...form,
                      key: event.target.value
                        .toLowerCase()
                        .replace(/\s+/g, "_"),
                    }))
                  }
                  disabled={unavailable}
                  required
                />
              </div>
            </div>
            <div className="settings-form-footer">
              <span>Use a unique key for each category.</span>
              <button
                className="settings-button primary"
                disabled={
                  unavailable ||
                  !deductionForm.label.trim() ||
                  !deductionForm.key.trim()
                }
              >
                <Plus size={15} />
                Add type
              </button>
            </div>
          </form>
        </SettingsSection>
      </div>
      <aside className="settings-note">
        <span>
          <Info size={18} />
        </span>
        <div>
          <h2>A little consistency goes a long way.</h2>
          <p>
            Use recognizable names and labels to make receipt verification and
            transaction categorization easier.
          </p>
        </div>
        <ArrowUpRight size={19} aria-hidden="true" />
      </aside>
      <footer className="settings-page-footer">
        Your workspace, thoughtfully organized.
      </footer>
      {confirmation && (
        <DeleteConfirmation
          item={confirmation}
          saving={saving}
          onClose={() => setConfirmation(null)}
          onConfirm={confirmDelete}
        />
      )}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar
        theme="light"
      />
    </div>
  );
}
