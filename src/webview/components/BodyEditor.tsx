import * as React from "react";

export interface BodyEditorProps {
  body: string;
  onChange: (body: string) => void;
}

export const BodyEditor: React.FC<BodyEditorProps> = ({ body, onChange }) => {
  return (
    <textarea
      style={{
        width: "100%",
        height: 160,
        resize: "vertical",
        fontFamily: "monospace",
        fontSize: 12,
        backgroundColor: "var(--vscode-input-background)",
        color: "var(--vscode-input-foreground)",
        border: "1px solid var(--vscode-input-border, var(--vscode-editorGroup-border))",
        boxSizing: "border-box",
        padding: 6,
      }}
      value={body}
      onChange={(e) => onChange(e.target.value)}
      placeholder='Raw body or JSON, variables as {{name}}'
    />
  );
};


