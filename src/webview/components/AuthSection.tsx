import * as React from "react";
import { RequestAuth, AuthType } from "../../types/models";

export interface AuthSectionProps {
  auth: RequestAuth | null;
  onChange: (auth: RequestAuth | null) => void;
  vscode: { postMessage: (msg: unknown) => void };
}

export const AuthSection: React.FC<AuthSectionProps> = ({
  auth,
  onChange,
  vscode,
}) => {
  const currentType: AuthType = auth?.type || "none";

  const handleTypeChange = (type: AuthType) => {
    if (type === "none") {
      onChange(null);
      return;
    }

    const newAuth: RequestAuth = {
      id: auth?.id || 0,
      requestId: auth?.requestId || 0,
      type,
      key: type === "apikey" ? auth?.key || "" : undefined,
      value: type === "apikey" || type === "bearer" ? auth?.value || "" : undefined,
      username: type === "basic" ? auth?.username || "" : undefined,
      password: type === "basic" ? auth?.password || "" : undefined,
      in_location: type === "apikey" ? (auth?.in_location || "header") : undefined,
      headerName: type === "header" ? auth?.headerName || "" : undefined,
      headerValue: type === "header" ? auth?.headerValue || "" : undefined,
    };
    onChange(newAuth);
  };

  const handleFieldChange = (field: keyof RequestAuth, value: string) => {
    if (!auth) return;
    onChange({
      ...auth,
      [field]: value,
    });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 8,
      }}
    >
      {/* Auth Type Selector */}
      <div>
        <label
          style={{
            display: "block",
            fontSize: 11,
            color: "var(--vscode-descriptionForeground)",
            marginBottom: 4,
          }}
        >
          Type:
        </label>
        <select
          value={currentType}
          onChange={(e) => handleTypeChange(e.target.value as AuthType)}
          style={{
            width: "100%",
            padding: "4px 8px",
            fontSize: 12,
            backgroundColor: "var(--vscode-input-background)",
            color: "var(--vscode-input-foreground)",
            border:
              "1px solid var(--vscode-input-border, var(--vscode-editorGroup-border))",
            borderRadius: 2,
          }}
        >
          <option value="none">No Auth</option>
          <option value="apikey">API Key</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth</option>
          <option value="header">Custom Header</option>
        </select>
      </div>

      {/* Dynamic Fields Based on Type */}
      {currentType === "apikey" && (
        <>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                color: "var(--vscode-descriptionForeground)",
                marginBottom: 4,
              }}
            >
              Key:
            </label>
            <input
              type="text"
              value={auth?.key || ""}
              onChange={(e) => handleFieldChange("key", e.target.value)}
              placeholder="API Key name (e.g., X-API-Key)"
              style={{
                width: "100%",
                padding: "4px 8px",
                fontSize: 12,
                backgroundColor: "var(--vscode-input-background)",
                color: "var(--vscode-input-foreground)",
                border:
                  "1px solid var(--vscode-input-border, var(--vscode-editorGroup-border))",
                borderRadius: 2,
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                color: "var(--vscode-descriptionForeground)",
                marginBottom: 4,
              }}
            >
              Value:
            </label>
            <input
              type="text"
              value={auth?.value || ""}
              onChange={(e) => handleFieldChange("value", e.target.value)}
              placeholder="API Key value"
              style={{
                width: "100%",
                padding: "4px 8px",
                fontSize: 12,
                backgroundColor: "var(--vscode-input-background)",
                color: "var(--vscode-input-foreground)",
                border:
                  "1px solid var(--vscode-input-border, var(--vscode-editorGroup-border))",
                borderRadius: 2,
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                color: "var(--vscode-descriptionForeground)",
                marginBottom: 4,
              }}
            >
              Add to:
            </label>
            <select
              value={auth?.in_location || "header"}
              onChange={(e) =>
                handleFieldChange("in_location", e.target.value)
              }
              style={{
                width: "100%",
                padding: "4px 8px",
                fontSize: 12,
                backgroundColor: "var(--vscode-input-background)",
                color: "var(--vscode-input-foreground)",
                border:
                  "1px solid var(--vscode-input-border, var(--vscode-editorGroup-border))",
                borderRadius: 2,
              }}
            >
              <option value="header">Header</option>
              <option value="query">Query Params</option>
            </select>
          </div>
        </>
      )}

      {currentType === "bearer" && (
        <div>
          <label
            style={{
              display: "block",
              fontSize: 11,
              color: "var(--vscode-descriptionForeground)",
              marginBottom: 4,
            }}
          >
            Token:
          </label>
          <input
            type="password"
            value={auth?.value || ""}
            onChange={(e) => handleFieldChange("value", e.target.value)}
            placeholder="Bearer token"
            style={{
              width: "100%",
              padding: "4px 8px",
              fontSize: 12,
              backgroundColor: "var(--vscode-input-background)",
              color: "var(--vscode-input-foreground)",
              border:
                "1px solid var(--vscode-input-border, var(--vscode-editorGroup-border))",
              borderRadius: 2,
            }}
          />
        </div>
      )}

      {currentType === "basic" && (
        <>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                color: "var(--vscode-descriptionForeground)",
                marginBottom: 4,
              }}
            >
              Username:
            </label>
            <input
              type="text"
              value={auth?.username || ""}
              onChange={(e) => handleFieldChange("username", e.target.value)}
              placeholder="Username"
              style={{
                width: "100%",
                padding: "4px 8px",
                fontSize: 12,
                backgroundColor: "var(--vscode-input-background)",
                color: "var(--vscode-input-foreground)",
                border:
                  "1px solid var(--vscode-input-border, var(--vscode-editorGroup-border))",
                borderRadius: 2,
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                color: "var(--vscode-descriptionForeground)",
                marginBottom: 4,
              }}
            >
              Password:
            </label>
            <input
              type="password"
              value={auth?.password || ""}
              onChange={(e) => handleFieldChange("password", e.target.value)}
              placeholder="Password"
              style={{
                width: "100%",
                padding: "4px 8px",
                fontSize: 12,
                backgroundColor: "var(--vscode-input-background)",
                color: "var(--vscode-input-foreground)",
                border:
                  "1px solid var(--vscode-input-border, var(--vscode-editorGroup-border))",
                borderRadius: 2,
              }}
            />
          </div>
        </>
      )}

      {currentType === "header" && (
        <>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                color: "var(--vscode-descriptionForeground)",
                marginBottom: 4,
              }}
            >
              Header Name:
            </label>
            <input
              type="text"
              value={auth?.headerName || ""}
              onChange={(e) => handleFieldChange("headerName", e.target.value)}
              placeholder="Header name (e.g., X-Custom-Auth)"
              style={{
                width: "100%",
                padding: "4px 8px",
                fontSize: 12,
                backgroundColor: "var(--vscode-input-background)",
                color: "var(--vscode-input-foreground)",
                border:
                  "1px solid var(--vscode-input-border, var(--vscode-editorGroup-border))",
                borderRadius: 2,
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                color: "var(--vscode-descriptionForeground)",
                marginBottom: 4,
              }}
            >
              Header Value:
            </label>
            <input
              type="text"
              value={auth?.headerValue || ""}
              onChange={(e) => handleFieldChange("headerValue", e.target.value)}
              placeholder="Header value"
              style={{
                width: "100%",
                padding: "4px 8px",
                fontSize: 12,
                backgroundColor: "var(--vscode-input-background)",
                color: "var(--vscode-input-foreground)",
                border:
                  "1px solid var(--vscode-input-border, var(--vscode-editorGroup-border))",
                borderRadius: 2,
              }}
            />
          </div>
        </>
      )}

      {/* Info Message */}
      {currentType !== "none" && (
        <div
          style={{
            padding: "8px 12px",
            backgroundColor: "var(--vscode-textBlockQuote-background)",
            border: "1px solid var(--vscode-textBlockQuote-border)",
            borderRadius: 4,
            fontSize: 11,
            color: "var(--vscode-descriptionForeground)",
          }}
        >
          {currentType === "apikey" &&
            (auth?.in_location === "query"
              ? "API Key will be added as a query parameter"
              : "API Key will be added as a header")}
          {currentType === "bearer" &&
            "Token will be sent as: Authorization: Bearer <token>"}
          {currentType === "basic" &&
            "Credentials will be base64 encoded and sent as: Authorization: Basic <encoded>"}
          {currentType === "header" &&
            "Custom header will be added to the request"}
        </div>
      )}
    </div>
  );
};

