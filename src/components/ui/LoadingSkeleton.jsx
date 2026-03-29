export default function LoadingSkeleton({ rows = 3, card = false }) {
  if (card) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 animate-pulse h-40" />
    );
  }
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse h-16" />
      ))}
    </div>
  );
}