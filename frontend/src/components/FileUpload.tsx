"use client";

import { useCallback, useRef, useState } from "react";

interface FileUploadProps {
    onFileSelect: (file: File | null) => void;
    selectedFile: File | null;
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function FileUpload({ onFileSelect, selectedFile }: FileUploadProps) {
    const [dragging, setDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const validateAndSelect = useCallback(
        (file: File) => {
            setError(null);

            if (!file.name.toLowerCase().endsWith(".vcf")) {
                setError(`Invalid file type: "${file.name}". Only .vcf files are supported.`);
                onFileSelect(null);
                return;
            }

            if (file.size > MAX_FILE_SIZE_BYTES) {
                const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
                setError(
                    `File too large (${sizeMB} MB). Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`
                );
                onFileSelect(null);
                return;
            }

            if (file.size === 0) {
                setError("File is empty. Please upload a valid VCF file.");
                onFileSelect(null);
                return;
            }

            onFileSelect(file);
        },
        [onFileSelect]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragging(false);
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                validateAndSelect(files[0]);
            }
        },
        [validateAndSelect]
    );

    const handleClick = () => {
        if (!selectedFile) {
            inputRef.current?.click();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            validateAndSelect(files[0]);
        }
    };

    const handleReset = (e: React.MouseEvent) => {
        e.stopPropagation();
        onFileSelect(null);
        setError(null);
        // Reset the input so the same file can be re-selected
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    const className = [
        "upload-zone",
        dragging ? "dragging" : "",
        selectedFile ? "has-file" : "",
        error ? "has-error" : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div>
            <div
                className={className}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
                role="button"
                tabIndex={0}
                id="vcf-upload-zone"
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".vcf"
                    onChange={handleInputChange}
                    style={{ display: "none" }}
                    id="vcf-file-input"
                />

                <div className="upload-icon">
                    {error ? "❌" : selectedFile ? "✅" : "🧬"}
                </div>

                <div className="upload-text">
                    {selectedFile ? (
                        <>
                            <h3>File Selected</h3>
                            <div className="upload-filename">
                                📄 {selectedFile.name}
                                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                                </span>
                                <button
                                    className="upload-reset-btn"
                                    onClick={handleReset}
                                    id="upload-reset-btn"
                                >
                                    ↻ Change
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <h3>Drop your VCF file here</h3>
                            <p>or click to browse · Supports VCF v4.2</p>
                            <p className="upload-limit">Max size: {MAX_FILE_SIZE_MB} MB</p>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <div className="upload-error" id="upload-error">
                    <span className="upload-error-icon">⚠️</span>
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
