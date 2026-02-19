"use client";

import React, { useState } from "react";

interface JsonViewerProps {
    data: unknown;
}

export default function JsonViewer({ data }: JsonViewerProps) {
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

    const togglePath = (path: string) => {
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    };

    return (
        <div className="json-viewer" id="json-viewer">
            <div className="json-viewer-header">
                <span>📄 Structured JSON Output</span>
                <span className="json-viewer-size">
                    {JSON.stringify(data, null, 2).length.toLocaleString()} chars
                </span>
            </div>
            <div className="json-viewer-body">
                <pre className="json-tree">
                    {renderJson(data, "", collapsed, togglePath, 0)}
                </pre>
            </div>
        </div>
    );
}

function renderJson(
    value: unknown,
    path: string,
    collapsed: Set<string>,
    toggle: (path: string) => void,
    depth: number
): React.JSX.Element {
    if (value === null || value === undefined) {
        return <span className="json-null">null</span>;
    }

    if (typeof value === "boolean") {
        return <span className="json-bool">{value ? "true" : "false"}</span>;
    }

    if (typeof value === "number") {
        return <span className="json-number">{value}</span>;
    }

    if (typeof value === "string") {
        return <span className="json-string">&quot;{value}&quot;</span>;
    }

    if (Array.isArray(value)) {
        if (value.length === 0) return <span className="json-bracket">{"[]"}</span>;

        const isCollapsed = collapsed.has(path);
        const indent = "  ".repeat(depth);
        const innerIndent = "  ".repeat(depth + 1);

        return (
            <>
                <span
                    className="json-toggle"
                    onClick={() => toggle(path)}
                    role="button"
                    tabIndex={0}
                >
                    {isCollapsed ? "▶" : "▼"}
                </span>
                <span className="json-bracket">[</span>
                {isCollapsed ? (
                    <span className="json-collapsed" onClick={() => toggle(path)}>
                        {" "}{value.length} items...
                    </span>
                ) : (
                    <>
                        {"\n"}
                        {value.map((item, idx) => (
                            <span key={idx}>
                                {innerIndent}
                                {renderJson(item, `${path}[${idx}]`, collapsed, toggle, depth + 1)}
                                {idx < value.length - 1 ? "," : ""}
                                {"\n"}
                            </span>
                        ))}
                        {indent}
                    </>
                )}
                <span className="json-bracket">]</span>
            </>
        );
    }

    if (typeof value === "object") {
        const entries = Object.entries(value as Record<string, unknown>);
        if (entries.length === 0) return <span className="json-bracket">{"{}"}</span>;

        const isCollapsed = collapsed.has(path);
        const indent = "  ".repeat(depth);
        const innerIndent = "  ".repeat(depth + 1);

        return (
            <>
                <span
                    className="json-toggle"
                    onClick={() => toggle(path)}
                    role="button"
                    tabIndex={0}
                >
                    {isCollapsed ? "▶" : "▼"}
                </span>
                <span className="json-bracket">{"{"}</span>
                {isCollapsed ? (
                    <span className="json-collapsed" onClick={() => toggle(path)}>
                        {" "}{entries.length} keys...
                    </span>
                ) : (
                    <>
                        {"\n"}
                        {entries.map(([key, val], idx) => (
                            <span key={key}>
                                {innerIndent}
                                <span className="json-key">&quot;{key}&quot;</span>
                                <span className="json-colon">: </span>
                                {renderJson(val, `${path}.${key}`, collapsed, toggle, depth + 1)}
                                {idx < entries.length - 1 ? "," : ""}
                                {"\n"}
                            </span>
                        ))}
                        {indent}
                    </>
                )}
                <span className="json-bracket">{"}"}</span>
            </>
        );
    }

    return <span>{String(value)}</span>;
}
