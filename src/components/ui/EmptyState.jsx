export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
      {description && <p className="text-xs text-muted-foreground mb-4 max-w-xs">{description}</p>}
      {action && action}
    </div>
  );
}