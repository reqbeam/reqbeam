import * as React from "react";
import { extractVariables, getVariableValue, hasVariable } from "../../core/envResolver";

export interface VariableHighlightInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
  rows?: number;
  environmentVariables?: Record<string, string>;
}

interface Suggestion {
  name: string;
  value: string;
}

export const VariableHighlightInput: React.FC<VariableHighlightInputProps> = ({
  value,
  onChange,
  placeholder,
  style,
  multiline = false,
  rows = 3,
  environmentVariables = {},
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const highlightRef = React.useRef<HTMLDivElement>(null);
  const [hoveredVariable, setHoveredVariable] = React.useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = React.useState<{ x: number; y: number } | null>(null);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [cursorPosition, setCursorPosition] = React.useState(0);
  const [suggestionPosition, setSuggestionPosition] = React.useState<{ x: number; y: number } | null>(null);

  // Get all available environment variables as suggestions
  const availableVariables = React.useMemo(() => {
    console.log("VariableHighlightInput - environmentVariables prop:", environmentVariables, "type:", typeof environmentVariables, "keys:", environmentVariables ? Object.keys(environmentVariables) : "null");
    if (!environmentVariables) {
      console.log("VariableHighlightInput - No environmentVariables prop");
      return [];
    }
    if (typeof environmentVariables !== "object") {
      console.log("VariableHighlightInput - environmentVariables is not an object:", typeof environmentVariables);
      return [];
    }
    const keys = Object.keys(environmentVariables);
    if (keys.length === 0) {
      console.log("VariableHighlightInput - environmentVariables object is empty");
      return [];
    }
    const vars = Object.entries(environmentVariables).map(([name, val]) => ({
      name,
      value: String(val || ""),
    }));
    console.log("VariableHighlightInput - Available variables:", vars.length, vars);
    return vars;
  }, [environmentVariables]);

  // Check if cursor is inside a {{ }} pattern
  const getCurrentVariableContext = React.useCallback((text: string, cursorPos: number) => {
    const beforeCursor = text.substring(0, cursorPos);
    const lastOpen = beforeCursor.lastIndexOf("{{");
    const lastClose = beforeCursor.lastIndexOf("}}");
    
    if (lastOpen > lastClose) {
      const afterOpen = text.substring(lastOpen + 2, cursorPos);
      const afterCursor = text.substring(cursorPos);
      const nextClose = afterCursor.indexOf("}}");
      
      if (nextClose === -1) {
        const varNameStart = afterOpen.trim();
        return {
          isInVariable: true,
          startPos: lastOpen,
          varNameStart,
          fullMatch: `{{${varNameStart}`,
        };
      }
    }
    
    return { isInVariable: false };
  }, []);

  // Calculate cursor position in pixels
  const getCursorPixelPosition = (input: HTMLInputElement | HTMLTextAreaElement, cursorPos: number): number => {
    // Use a more reliable method: create a temporary div with same styling
    const textBeforeCursor = input.value.substring(0, cursorPos);
    if (!textBeforeCursor) return 0;
    
    const style = window.getComputedStyle(input);
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.whiteSpace = 'pre';
    tempDiv.style.font = style.font;
    tempDiv.style.fontSize = style.fontSize;
    tempDiv.style.fontFamily = style.fontFamily;
    tempDiv.style.fontWeight = style.fontWeight;
    tempDiv.style.letterSpacing = style.letterSpacing;
    tempDiv.style.padding = '0';
    tempDiv.style.margin = '0';
    tempDiv.style.border = '0';
    tempDiv.textContent = textBeforeCursor;
    
    document.body.appendChild(tempDiv);
    const width = tempDiv.offsetWidth;
    document.body.removeChild(tempDiv);
    
    return width;
  };

  // Handle input changes
  const handleInput = (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.currentTarget.value;
    const cursorPos = e.currentTarget.selectionStart || 0;
    
    onChange(newValue);
    setCursorPosition(cursorPos);
    syncScroll();

    // Check if we should show suggestions when typing {{
    const beforeCursor = newValue.substring(0, cursorPos);
    const lastChar = beforeCursor.slice(-1);
    const lastTwoChars = beforeCursor.slice(-2);
    
    // Show suggestions when user types {{
    if (lastTwoChars === "{{") {
      console.log("Detected {{ - showing suggestions", availableVariables.length, "variables");
      if (availableVariables.length > 0) {
        setSuggestions(availableVariables);
        setShowSuggestions(true);
        setSelectedIndex(0);
        
        // Calculate position for suggestions dropdown at cursor position
        requestAnimationFrame(() => {
          if (inputRef.current) {
            const inputRect = inputRef.current.getBoundingClientRect();
            const cursorX = getCursorPixelPosition(inputRef.current, cursorPos);
            const paddingLeft = parseInt(window.getComputedStyle(inputRef.current).paddingLeft) || 0;
            
            setSuggestionPosition({
              x: inputRect.left + paddingLeft + cursorX,
              y: inputRect.bottom + 2,
            });
            console.log("Suggestion position set at cursor:", {
              x: inputRect.left + paddingLeft + cursorX,
              y: inputRect.bottom + 2,
            });
          }
        });
      } else {
        console.log("No variables available");
        setShowSuggestions(false);
      }
    } else {
      // Check if we're inside a {{...}} pattern (typing variable name)
      const context = getCurrentVariableContext(newValue, cursorPos);
      if (context.isInVariable) {
        const searchTerm = context.varNameStart.toLowerCase();
        const filtered = availableVariables.filter(v => 
          v.name.toLowerCase().includes(searchTerm)
        );
        
        console.log("Inside variable, filtering:", searchTerm, "found", filtered.length);
        if (filtered.length > 0) {
          setSuggestions(filtered);
          setShowSuggestions(true);
          setSelectedIndex(0);
          
          requestAnimationFrame(() => {
            if (inputRef.current) {
              const inputRect = inputRef.current.getBoundingClientRect();
              const cursorX = getCursorPixelPosition(inputRef.current, cursorPos);
              const paddingLeft = parseInt(window.getComputedStyle(inputRef.current).paddingLeft) || 0;
              
              setSuggestionPosition({
                x: inputRect.left + paddingLeft + cursorX,
                y: inputRect.bottom + 2,
              });
            }
          });
        } else {
          setShowSuggestions(false);
        }
      } else {
        // Not in variable context, hide suggestions
        if (showSuggestions) {
          setShowSuggestions(false);
        }
      }
    }
  };

  // Insert suggestion
  const insertSuggestion = (suggestion: Suggestion) => {
    if (!inputRef.current) return;
    
    const text = value;
    const cursorPos = cursorPosition;
    const context = getCurrentVariableContext(text, cursorPos);
    
    if (context.isInVariable) {
      const before = text.substring(0, context.startPos);
      const after = text.substring(cursorPos);
      const nextClose = after.indexOf("}}");
      
      if (nextClose !== -1) {
        const afterVar = text.substring(cursorPos + nextClose + 2);
        const newText = `${before}{{${suggestion.name}}}${afterVar}`;
        onChange(newText);
        
        setTimeout(() => {
          if (inputRef.current) {
            const newPos = before.length + suggestion.name.length + 4;
            if (inputRef.current instanceof HTMLInputElement) {
              inputRef.current.setSelectionRange(newPos, newPos);
            } else if (inputRef.current instanceof HTMLTextAreaElement) {
              inputRef.current.setSelectionRange(newPos, newPos);
            }
            setCursorPosition(newPos);
          }
        }, 0);
      } else {
        const after = text.substring(cursorPos);
        const newText = `${before}{{${suggestion.name}}}${after}`;
        onChange(newText);
        
        setTimeout(() => {
          if (inputRef.current) {
            const newPos = before.length + suggestion.name.length + 4;
            if (inputRef.current instanceof HTMLInputElement) {
              inputRef.current.setSelectionRange(newPos, newPos);
            } else if (inputRef.current instanceof HTMLTextAreaElement) {
              inputRef.current.setSelectionRange(newPos, newPos);
            }
            setCursorPosition(newPos);
          }
        }, 0);
      }
    }
    
    setShowSuggestions(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertSuggestion(suggestions[selectedIndex]);
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    }
  };

  // Parse text and create highlighted parts
  const parseText = (text: string) => {
    const parts: Array<{ text: string; isVariable: boolean; variableName?: string; isValid?: boolean }> = [];
    const regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          text: text.substring(lastIndex, match.index),
          isVariable: false,
        });
      }
      const varName = match[1].toLowerCase();
      const isValid = hasVariable(varName, environmentVariables);
      parts.push({
        text: match[0],
        isVariable: true,
        variableName: match[1],
        isValid,
      });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push({
        text: text.substring(lastIndex),
        isVariable: false,
      });
    }

    return parts.length > 0 ? parts : [{ text, isVariable: false }];
  };

  const parts = parseText(value);

  const baseStyle: React.CSSProperties = {
    width: "100%",
    padding: "2px 4px",
    fontSize: 12,
    fontFamily: multiline ? "monospace" : "var(--vscode-font-family)",
    backgroundColor: "var(--vscode-input-background)",
    color: "var(--vscode-input-foreground)",
    border: "1px solid var(--vscode-input-border, var(--vscode-editorGroup-border))",
    boxSizing: "border-box",
    ...style,
  };

  const highlightStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: baseStyle.padding,
    fontSize: baseStyle.fontSize,
    fontFamily: baseStyle.fontFamily,
    whiteSpace: multiline ? "pre-wrap" : "pre",
    wordWrap: multiline ? "break-word" : "normal",
    overflow: "hidden",
    pointerEvents: "none", // Base layer doesn't receive events
    zIndex: 1,
    color: "var(--vscode-input-foreground)", // Show normal text in foreground color
    border: "1px solid transparent",
    boxSizing: "border-box",
    lineHeight: multiline ? "1.5" : "normal",
    margin: 0, // Remove any margins
    display: "block", // Ensure block display
  };

  const validVariableStyle: (isHovering: boolean) => React.CSSProperties = (isHovering) => ({
    backgroundColor: "var(--vscode-textBlockQuote-background, rgba(138, 180, 248, 0.35))",
    color: "var(--vscode-textLink-foreground, #4fc3f7)",
    padding: 0, // Remove padding to avoid cursor offset
    margin: 0, // Remove margin
    borderRadius: "2px",
    fontWeight: 500,
    borderBottom: "1px solid var(--vscode-textLink-foreground, #4fc3f7)",
    cursor: "help",
    pointerEvents: isHovering ? "auto" : "none", // Only intercept when hovering
    position: "relative",
    zIndex: isHovering ? 3 : 1, // Above input only when hovering
    display: "inline", // Ensure inline display
    whiteSpace: "pre", // Preserve whitespace exactly
    boxDecorationBreak: "clone", // Ensure consistent rendering
  });

  const invalidVariableStyle: (isHovering: boolean) => React.CSSProperties = (isHovering) => ({
    backgroundColor: "var(--vscode-inputValidation-errorBackground, rgba(255, 0, 0, 0.2))",
    color: "var(--vscode-errorForeground, #f48771)",
    padding: 0, // Remove padding to avoid cursor offset
    margin: 0, // Remove margin
    borderRadius: "2px",
    fontWeight: 500,
    borderBottom: "2px wavy var(--vscode-errorForeground, #f48771)",
    cursor: "help",
    pointerEvents: isHovering ? "auto" : "none", // Only intercept when hovering
    position: "relative",
    zIndex: isHovering ? 3 : 1, // Above input only when hovering
    display: "inline", // Ensure inline display
    whiteSpace: "pre", // Preserve whitespace exactly
    boxDecorationBreak: "clone", // Ensure consistent rendering
  });

  const syncScroll = () => {
    if (inputRef.current && highlightRef.current) {
      if (multiline) {
        highlightRef.current.scrollTop = (inputRef.current as HTMLTextAreaElement).scrollTop;
      }
      highlightRef.current.scrollLeft = (inputRef.current as HTMLInputElement).scrollLeft;
    }
  };

  const handleVariableMouseEnter = (
    variableName: string,
    event: React.MouseEvent<HTMLSpanElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (containerRect) {
      setHoverPosition({
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top - 5,
      });
      setHoveredVariable(variableName.toLowerCase());
    }
  };

  const handleVariableMouseLeave = () => {
    setHoveredVariable(null);
    setHoverPosition(null);
  };

  React.useEffect(() => {
    syncScroll();
  }, [value, multiline]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const inputStyle: React.CSSProperties = {
    ...baseStyle,
    position: "relative",
    zIndex: 2,
    backgroundColor: "transparent",
    color: "transparent", // Make text transparent so only highlight layer shows
    caretColor: "var(--vscode-input-foreground)", // Keep caret visible
    outline: "none",
    pointerEvents: "auto", // Input must receive all events for typing
  };

  const tooltipStyle: React.CSSProperties = {
    position: "absolute",
    zIndex: 1000,
    backgroundColor: "var(--vscode-editor-hoverWidget-background, #252526)",
    color: "var(--vscode-editor-hoverWidget-foreground, #cccccc)",
    padding: "8px 12px",
    borderRadius: "4px",
    fontSize: "12px",
    fontFamily: "var(--vscode-font-family)",
    border: "1px solid var(--vscode-editor-hoverWidget-border, #454545)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
    pointerEvents: "none",
    whiteSpace: "pre",
    transform: hoverPosition ? `translate(${hoverPosition.x}px, ${hoverPosition.y}px) translate(-50%, -100%)` : undefined,
    display: hoveredVariable ? "block" : "none",
    maxWidth: "400px",
    wordBreak: "break-word",
  };

  const suggestionsStyle: React.CSSProperties = {
    position: "fixed", // Changed to fixed for better positioning
    zIndex: 10000, // Very high z-index to ensure it's on top
    backgroundColor: "var(--vscode-dropdown-background, #3c3c3c)",
    border: "1px solid var(--vscode-dropdown-border, #454545)",
    borderRadius: "4px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
    maxHeight: "200px",
    overflowY: "auto",
    minWidth: "250px",
    display: showSuggestions && suggestions.length > 0 && suggestionPosition ? "block" : "none",
    left: suggestionPosition?.x !== undefined ? `${suggestionPosition.x}px` : "0px",
    top: suggestionPosition?.y !== undefined ? `${suggestionPosition.y}px` : "0px",
  };

  const suggestionItemStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: "6px 12px",
    cursor: "pointer",
    backgroundColor: isSelected 
      ? "var(--vscode-list-activeSelectionBackground, #094771)" 
      : "transparent",
    color: isSelected 
      ? "var(--vscode-list-activeSelectionForeground, #ffffff)" 
      : "var(--vscode-foreground, #cccccc)",
    fontSize: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  });

  const [hoveredSpanIndex, setHoveredSpanIndex] = React.useState<number | null>(null);

  const renderHighlightedText = () => {
    return parts.map((part, index) => {
      if (part.isVariable) {
        const varName = part.variableName!;
        const varNameLower = varName.toLowerCase();
        const isValid = part.isValid ?? false;
        const value = isValid ? getVariableValue(varNameLower, environmentVariables) : null;
        const isHovering = hoveredSpanIndex === index;
        
        return (
          <span
            key={index}
            style={isValid ? validVariableStyle(isHovering) : invalidVariableStyle(isHovering)}
            onMouseEnter={(e) => {
              setHoveredSpanIndex(index);
              handleVariableMouseEnter(varNameLower, e);
            }}
            onMouseLeave={(e) => {
              setHoveredSpanIndex(null);
              handleVariableMouseLeave();
            }}
            onClick={(e) => {
              // Focus input when clicking on variable
              if (inputRef.current) {
                inputRef.current.focus();
                // Try to position cursor at end of variable
                const text = value;
                const regex = new RegExp(`\\{\\{\\s*${varName}\\s*\\}\\}`, 'g');
                let match;
                let lastMatchEnd = 0;
                while ((match = regex.exec(text)) !== null) {
                  if (match.index <= cursorPosition && regex.lastIndex >= cursorPosition) {
                    lastMatchEnd = regex.lastIndex;
                    break;
                  }
                }
                if (lastMatchEnd > 0 && inputRef.current instanceof HTMLInputElement) {
                  inputRef.current.setSelectionRange(lastMatchEnd, lastMatchEnd);
                } else if (lastMatchEnd > 0 && inputRef.current instanceof HTMLTextAreaElement) {
                  inputRef.current.setSelectionRange(lastMatchEnd, lastMatchEnd);
                }
              }
            }}
            title={isValid ? `Resolved: ${value}` : `Variable "${varName}" not found in environment`}
          >
            {part.text}
          </span>
        );
      }
      return <span key={index} style={{ display: "inline", whiteSpace: "pre" }}>{part.text}</span>;
    });
  };

  const inputProps = {
    ref: inputRef as React.RefObject<HTMLInputElement & HTMLTextAreaElement>,
    value,
    onChange: handleInput,
    onInput: handleInput,
    onKeyDown: handleKeyDown,
    onScroll: syncScroll,
    onSelect: (e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const target = e.currentTarget;
      setCursorPosition(target.selectionStart || 0);
    },
    placeholder,
    style: inputStyle,
  };

  if (multiline) {
    return (
      <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
        {hoveredVariable && hoverPosition && (
          <div style={tooltipStyle}>
            {hasVariable(hoveredVariable, environmentVariables) ? (
              <>
                <div style={{ marginBottom: "4px", fontWeight: 600 }}>
                  <span style={{ color: "var(--vscode-textLink-foreground, #4fc3f7)" }}>
                    {`{{${hoveredVariable}}}`}
                  </span>
                </div>
                <div style={{ fontSize: "11px", opacity: 0.9, marginTop: "4px" }}>
                  <strong>Value:</strong> <code style={{ 
                    backgroundColor: "var(--vscode-textCodeBlock-background, rgba(255, 255, 255, 0.1))",
                    padding: "2px 4px",
                    borderRadius: "2px"
                  }}>{getVariableValue(hoveredVariable, environmentVariables)}</code>
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: "4px", fontWeight: 600 }}>
                  <span style={{ color: "var(--vscode-errorForeground, #f48771)" }}>
                    {`{{${hoveredVariable}}}`}
                  </span>
                </div>
                <div style={{ fontSize: "11px", opacity: 0.9, marginTop: "4px", color: "var(--vscode-errorForeground, #f48771)" }}>
                  Variable not found in environment
                </div>
              </>
            )}
          </div>
        )}
        {showSuggestions && suggestions.length > 0 && suggestionPosition && (
          <div 
            style={suggestionsStyle}
            onMouseDown={(e) => e.preventDefault()} // Prevent input blur
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.name}
                style={suggestionItemStyle(index === selectedIndex)}
                onMouseEnter={() => setSelectedIndex(index)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  insertSuggestion(suggestion);
                }}
              >
                <div style={{ fontWeight: 500 }}>{`{{${suggestion.name}}}`}</div>
                <div style={{ fontSize: "11px", opacity: 0.8, wordBreak: "break-word" }}>
                  {suggestion.value || "(empty)"}
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={highlightRef} style={highlightStyle}>
          {renderHighlightedText()}
        </div>
        <textarea
          {...inputProps}
          rows={rows}
          style={{
            ...inputStyle,
            resize: "vertical",
            height: rows ? `${rows * 1.5}em` : "auto",
            minHeight: "60px",
          }}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {hoveredVariable && hoverPosition && (
        <div style={tooltipStyle}>
          {hasVariable(hoveredVariable, environmentVariables) ? (
            <>
              <div style={{ marginBottom: "4px", fontWeight: 600 }}>
                <span style={{ color: "var(--vscode-textLink-foreground, #4fc3f7)" }}>
                  {`{{${hoveredVariable}}}`}
                </span>
              </div>
              <div style={{ fontSize: "11px", opacity: 0.9, marginTop: "4px" }}>
                <strong>Value:</strong> <code style={{ 
                  backgroundColor: "var(--vscode-textCodeBlock-background, rgba(255, 255, 255, 0.1))",
                  padding: "2px 4px",
                  borderRadius: "2px"
                }}>{getVariableValue(hoveredVariable, environmentVariables)}</code>
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: "4px", fontWeight: 600 }}>
                <span style={{ color: "var(--vscode-errorForeground, #f48771)" }}>
                  {`{{${hoveredVariable}}}`}
                </span>
                </div>
              <div style={{ fontSize: "11px", opacity: 0.9, marginTop: "4px", color: "var(--vscode-errorForeground, #f48771)" }}>
                Variable not found in environment
              </div>
            </>
          )}
        </div>
      )}
      {showSuggestions && suggestions.length > 0 && suggestionPosition && (
        <div 
          style={suggestionsStyle}
          onMouseDown={(e) => e.preventDefault()} // Prevent input blur
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.name}
              style={suggestionItemStyle(index === selectedIndex)}
              onMouseEnter={() => setSelectedIndex(index)}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                insertSuggestion(suggestion);
              }}
            >
              <div style={{ fontWeight: 500 }}>{`{{${suggestion.name}}}`}</div>
              <div style={{ fontSize: "11px", opacity: 0.8, wordBreak: "break-word" }}>
                {suggestion.value || "(empty)"}
              </div>
            </div>
          ))}
        </div>
      )}
      <div ref={highlightRef} style={highlightStyle}>
        {renderHighlightedText()}
      </div>
      <input
        {...inputProps}
        type="text"
      />
    </div>
  );
};
