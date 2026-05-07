// apps/frontend/src/components/upload/DragAndDropZone.jsx

import { useEffect, useRef, useState } from "react";
import { UploadCloud, FileImage, X } from "lucide-react";

const ACCEPTED = ["image/png", "image/jpeg", "image/jpg"];
const MAX_MB = 10;

export default function DragAndDropZone({ onFileSelect, disabled = false }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (preview?.url) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  function validate(file) {
    if (!ACCEPTED.includes(file.type)) {
      return "PNG 또는 JPEG 이미지만 업로드할 수 있습니다.";
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      return `파일 크기는 ${MAX_MB}MB 이하여야 합니다.`;
    }
    return null;
  }

  function handleFile(file) {
    if (disabled) return;

    const validationError = validate(file);
    if (validationError) {
      setError(validationError);
      onFileSelect?.(null);
      return;
    }

    if (preview?.url) URL.revokeObjectURL(preview.url);

    setError("");
    setPreview({ name: file.name, url: URL.createObjectURL(file) });
    onFileSelect?.(file);
  }

  function onDragOver(event) {
    event.preventDefault();
    if (!disabled) setDragging(true);
  }

  function onDragLeave() {
    setDragging(false);
  }

  function onDrop(event) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function onInputChange(event) {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
  }

  function clearPreview(event) {
    event.stopPropagation();
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
    onFileSelect?.(null);
  }

  return (
    <div className="upload-zone-wrapper">
      {!preview ? (
        <div
          className={`upload-zone ${dragging ? "dragging" : ""} ${disabled ? "disabled" : ""}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <UploadCloud className="upload-icon" />
          <div>
            <p className="upload-title">
              이미지를 여기에 드래그하거나 <span>파일 선택</span>
            </p>
            <p className="upload-help">PNG, JPEG · 최대 {MAX_MB}MB</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            className="hidden-input"
            onChange={onInputChange}
            disabled={disabled}
          />
        </div>
      ) : (
        <div className="preview-card">
          <img src={preview.url} alt="선택한 X-ray 미리보기" />
          <div className="preview-meta">
            <FileImage className="preview-icon" />
            <span title={preview.name}>{preview.name}</span>
            <button type="button" onClick={clearPreview} aria-label="파일 제거" disabled={disabled}>
              <X />
            </button>
          </div>
        </div>
      )}
      {error && <p className="upload-error">⚠ {error}</p>}
    </div>
  );
}
