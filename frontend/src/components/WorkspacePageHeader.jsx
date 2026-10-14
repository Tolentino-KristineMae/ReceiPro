import { ChevronRight, ReceiptText } from "lucide-react";
import "./WorkspacePageHeader.css";

export default function WorkspacePageHeader({
  title,
  description,
  eyebrow,
  actions,
}) {
  return (
    <>
      <header className="workspace-page-topbar">
        <div className="workspace-page-breadcrumb">
          <span>Workspace</span>
          <ChevronRight size={13} />
          <strong>{title}</strong>
        </div>
        <span className="workspace-page-badge">
          <ReceiptText size={14} />
          Receipt workspace
        </span>
      </header>
      <div className="workspace-page-intro">
        <div>
          <span className="workspace-page-eyebrow">{eyebrow}</span>
          <h1>
            {title}
            <span>.</span>
          </h1>
          <p>{description}</p>
        </div>
        {actions && <div className="workspace-page-actions">{actions}</div>}
      </div>
    </>
  );
}
