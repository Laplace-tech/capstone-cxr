import { useRef, useState } from "react";
import { UploadCloud, FileImage, X } from "lucide-react";
import Button from "../common/Button";

const ACCEPTED = ["image/png", "image/jpeg", "image/jpg"];
const MAX_MB = 10;

export default function DragAndDropZone({ onFileSelect }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");

  function validate(file) {
    if (!ACCEPTED.includes(file.type))
      return "PNG 또는 JPEG 이미지만 업로드할 수 있어요.";
    if (file.size > MAX_MB * 1024 * 1024)
      return `파일 크기는 ${MAX_MB}MB 이하여야 해요.`;
    return null;
  }

  function handleFile(file) {
    const err = validate(file);
    if (err) { setError(err); return; }
    setError("");
    setPreview({ name: file.name, url: URL.createObjectURL(file) });
    onFileSelect?.(file);
  }

  function onDragOver(e) { e.preventDefault(); setDragging(true); }
  function onDragLeave() { setDragging(false); }
  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }
  function onInputChange(e) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }
  function clearPreview() {
    setPreview(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
    onFileSelect?.(null);
  }

  return (
    <div className="w-full">
      {!preview ? (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            borderRadius: "16px",
            border: `2px dashed ${dragging ? "#3b82f6" : "#cbd5e1"}`,
            padding: "48px",
            textAlign: "center",
            cursor: "pointer",
            background: dragging ? "#eff6ff" : "#f8fafc",
            transition: "all 0.2s",
          }}
        >
          <UploadCloud style={{ width: 48, height: 48, color: dragging ? "#3b82f6" : "#94a3b8" }} />
          <div>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#334155", margin: 0 }}>
              이미지를 여기에 드래그하거나{" "}
              <span style={{ color: "#2563eb", textDecoration: "underline" }}>파일 선택</span>
            </p>
            <p style={{ marginTop: "4px", fontSize: "12px", color: "#94a3b8", margin: "4px 0 0 0" }}>
              PNG, JPEG · 최대 {MAX_MB}MB
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            style={{ display: "none" }}
            onChange={onInputChange}
          />
        </div>
      ) : (
        <div style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid #e2e8f0", background: "#f8fafc" }}>
          <img src={preview.url} alt="미리보기" style={{ width: "100%", maxHeight: "288px", objectFit: "contain" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: "white", borderTop: "1px solid #f1f5f9" }}>
            <FileImage style={{ width: 16, height: 16, color: "#3b82f6", flexShrink: 0 }} />
            <span style={{ fontSize: "12px", color: "#475569", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preview.name}</span>
            <button onClick={clearPreview} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }} aria-label="파일 제거">
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>
      )}
      {error && (
        <p style={{ marginTop: "8px", fontSize: "12px", color: "#ef4444" }}>⚠ {error}</p>
      )}
    </div>
  );
}