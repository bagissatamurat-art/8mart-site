// Значок человека — аватар, когда имя не указано (имя при входе не спрашиваем).
export function PersonIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.75" />
      <path d="M4.75 19.5c1.3-3.1 4-4.75 7.25-4.75s5.95 1.65 7.25 4.75" />
    </svg>
  );
}
