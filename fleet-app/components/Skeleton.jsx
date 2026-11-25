"use client";

/**
 * Skeleton loader komponente.
 *
 * Upotreba:
 *   import Skeleton from "@/components/Skeleton";
 *
 *   <Skeleton.Table rows={6} cols={5} />
 *   <Skeleton.Cards count={4} />
 *   <Skeleton.Stat />
 *   <Skeleton.Text width="60%" />
 *   <Skeleton.List rows={3} />
 *   <Skeleton.Form fields={6} />
 */

export function SkeletonBlock({ width = "100%", height = 14, radius = 6, style = {} }) {
  return (
    <span
      className="skeleton-block"
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}

export function SkeletonText({ width = "60%", height = 12 }) {
  return <SkeletonBlock width={width} height={height} />;
}

export function SkeletonStat() {
  return (
    <div className="stat" style={{ pointerEvents: "none" }}>
      <div className="skeleton-block" style={{ width: "55%", height: 10, marginBottom: 10 }} />
      <div className="skeleton-block" style={{ width: "30%", height: 26 }} />
    </div>
  );
}

export function SkeletonTable({ rows = 6, cols = 5 }) {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-head" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton-block" style={{ height: 11, width: `${60 + (i % 3) * 10}%` }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="skeleton-table-row" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="skeleton-block"
              style={{ height: 12, width: `${50 + ((r + c) % 4) * 12}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4 }) {
  return (
    <div className="grid-stats">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStat key={i} />
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 3 }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-list-row">
          <div className="skeleton-block" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="skeleton-block" style={{ width: "40%", height: 12 }} />
            <div className="skeleton-block" style={{ width: "70%", height: 10 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonForm({ fields = 6 }) {
  return (
    <div className="form-grid">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="form-field">
          <div className="skeleton-block" style={{ width: "40%", height: 10, marginBottom: 6 }} />
          <div className="skeleton-block" style={{ width: "100%", height: 38, borderRadius: 8 }} />
        </div>
      ))}
    </div>
  );
}

const Skeleton = {
  Block: SkeletonBlock,
  Text: SkeletonText,
  Stat: SkeletonStat,
  Table: SkeletonTable,
  Cards: SkeletonCards,
  List: SkeletonList,
  Form: SkeletonForm,
};

export default Skeleton;