export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'cyan', // 'cyan' | 'danger' | 'safe' | 'warning'
  percentage
}) {
  const variantStyles = {
    cyan: {
      color: 'var(--accent-sky)',
      bg: 'rgba(2, 132, 199, 0.1)',
      border: 'rgba(2, 132, 199, 0.25)',
      barColor: 'var(--accent-blue)'
    },
    danger: {
      color: 'var(--threat-danger)',
      bg: 'var(--threat-danger-bg)',
      border: 'var(--threat-danger-border)',
      barColor: 'var(--threat-danger)'
    },
    safe: {
      color: 'var(--threat-safe)',
      bg: 'var(--threat-safe-bg)',
      border: 'var(--threat-safe-border)',
      barColor: 'var(--threat-safe)'
    },
    warning: {
      color: 'var(--threat-warning)',
      bg: 'var(--threat-warning-bg)',
      border: 'var(--threat-warning-border)',
      barColor: 'var(--threat-warning)'
    }
  };

  const style = variantStyles[variant] || variantStyles.cyan;

  return (
    <div className="stat-card" style={{ borderTop: `2px solid ${style.color}` }}>
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        <div
          className="stat-card-icon-box"
          style={{
            backgroundColor: style.bg,
            border: `1px solid ${style.border}`,
            color: style.color
          }}
        >
          {Icon && <Icon size={16} />}
        </div>
      </div>

      <div className="stat-card-value">{value}</div>

      {percentage !== undefined && (
        <div className="stat-ratio-bar">
          <div
            className="stat-ratio-fill"
            style={{
              width: `${Math.min(100, Math.max(0, percentage))}%`,
              backgroundColor: style.barColor
            }}
          />
        </div>
      )}

      {subtitle && (
        <div className="stat-card-footer">
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
}
