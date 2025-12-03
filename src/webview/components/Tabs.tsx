import * as React from "react";

export interface TabsProps {
  tabs: { id: string; label: string }[];
  activeId: string;
  onChange: (id: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeId, onChange }) => {
  return (
    <div style={{ display: "flex", borderBottom: "1px solid var(--vscode-editorGroup-border)" }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            padding: "4px 10px",
            border: "none",
            borderBottom:
              activeId === tab.id
                ? "2px solid var(--vscode-button-background)"
                : "2px solid transparent",
            background: "transparent",
            color: "inherit",
            cursor: "pointer",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};


