/**
 * @param {"sm"|"md"|"lg"} size
 * @param {string} label  스크린리더용 텍스트
 */
const sizes = {
  sm: "w-4 h-4 border-2",
  md: "w-7 h-7 border-2",
  lg: "w-10 h-10 border-[3px]",
};

export default function Spinner({ size = "md", label = "로딩 중...", className = "" }) {
  return (
    <span role="status" aria-label={label} className={`inline-block ${className}`}>
      <span
        className={[
          "block rounded-full border-slate-200 border-t-blue-600 animate-spin",
          sizes[size],
        ].join(" ")}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}