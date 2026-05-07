/**
 * 기본 Skeleton 블록 — 원하는 크기에 className으로 조절.
 * 예: <Skeleton className="h-4 w-32 rounded" />
 */
export function Skeleton({ className = "" }) {
  return (
    <div
      className={[
        "animate-pulse bg-slate-200 rounded",
        className,
      ].join(" ")}
    />
  );
}

/**
 * 분석 결과 카드 전체가 로딩될 때 쓰는 결과 스켈레톤.
 */
export function ResultSkeleton() {
  return (
    <div className="space-y-4 p-6">
      {/* 이미지 영역 */}
      <Skeleton className="h-64 w-full rounded-xl" />
      {/* 병변 리스트 */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-4 flex-1 rounded" />
          <Skeleton className="h-4 w-12 rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * 사이드바 메뉴 항목 스켈레톤.
 */
export function SidebarSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-full rounded-lg" />
      ))}
    </div>
  );
}