// Сердце избранного: контур #6B6873 → заливка #EE1D74.
export function HeartIcon({ on, size = 20 }: { on: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ display: 'block' }}>
      <path d="M12 20.5s-7.5-4.6-9.3-9.3C1.5 8 3.4 4.5 6.9 4.5c2 0 3.5 1.1 5.1 3 1.6-1.9 3.1-3 5.1-3 3.5 0 5.4 3.5 4.2 6.7-1.8 4.7-9.3 9.3-9.3 9.3z"
        fill={on ? 'var(--fav)' : 'none'} stroke={on ? 'var(--fav)' : 'var(--fav-off)'} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
