// Алерт: danger (раскупили), warning (зависит от филиала), success (прогресс до бесплатной доставки).
// action — кнопка справа (desktop) или в строке текста (compact, mobile 02).
import s from './ui.module.css';

export function Alert({ tone = 'danger', children, action, compact }: {
  tone?: 'danger' | 'warning' | 'success'; children: React.ReactNode;
  action?: { label: string; onClick: () => void }; compact?: boolean;
}) {
  const btn = action && <button type="button" className={s.alertAction} onClick={action.onClick}>{action.label}</button>;
  return (
    <div className={`${s.alert} ${s[`alert_${tone}`]} ${action && !compact ? s.alertSplit : ''} ${compact ? s.alertCompact : ''}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <span className={s.alertMain}>
        <span className={s.alertIcon} aria-hidden>{tone === 'success' ? '' : '!'}</span>
        <span>{children}{compact && btn && <> {btn}</>}</span>
      </span>
      {!compact && btn}
    </div>
  );
}
