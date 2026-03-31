/**
 * 분석 상태(idle / uploading / queued / processing / completed / failed)를
 * 색상 뱃지로 표시하는 컴포넌트.
 */
const config = {
  idle: {
    label: "대기",
    className: "bg-slate-100 text-slate-500",
  },
  uploading: {
    label: "업로드 중",
    className: "bg-blue-50 text-blue-600",
  },
  queued: {
    label: "분석 대기",
    className: "bg-amber-50 text-amber-600",
  },
  processing: {
    label: "분석 중",
    className: "bg-violet-50 text-violet-600 animate-pulse",
  },
  completed: {
    label: "완료",
    className: "bg-emerald-50 text-emerald-600",
  },
  failed: {
    label: "실패",
    className: "bg-red-50 text-red-600",
  },
};

export default function StatusBadge({ status, className = "" }) {
  const { label, className: base } = config[status] ?? config.idle;
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        base,
        className,
      ].join(" ")}
    >
      {/* 점 인디케이터 */}
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}