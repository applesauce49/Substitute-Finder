export function SettingsRow({ label, description, children }) {
  return (
    <div
      className="d-flex justify-content-between align-items-center py-3"
      style={{
        borderBottom: "1px solid #eee"
      }}
    >
      <div className="me-3 flex-grow-1">
        <div className="fw-normal">{label}</div>
        {description && (
          <div className="text-muted small">{description}</div>
        )}
      </div>

      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  );
}