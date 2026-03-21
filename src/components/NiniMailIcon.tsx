type NiniMailIconProps = {
  className?: string
  title?: string
}

export function NiniMailIcon({ className = '', title = 'NiniCode email icon' }: NiniMailIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={title}
      className={`nini-mail-icon ${className}`.trim()}
    >
      <defs>
        <linearGradient id="niniMailBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFB347" />
          <stop offset="62%" stopColor="#FF7A1A" />
          <stop offset="100%" stopColor="#C9521A" />
        </linearGradient>
      </defs>

      <rect x="2" y="4" width="20" height="16" rx="2" fill="url(#niniMailBody)" stroke="#1A0F08" strokeWidth="1.8" />
      <path d="M2.9 6.2L12 13.1L21.1 6.2" fill="none" stroke="#1A0F08" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.9 17.8L9.2 12.6M21.1 17.8L14.8 12.6" fill="none" stroke="#1A0F08" strokeWidth="1.8" strokeLinecap="round" />

      <rect x="9.3" y="8.3" width="5.4" height="7.2" rx="0.8" fill="#FBF3E3" stroke="#1A0F08" strokeWidth="1.1" />
      <path d="M10.3 14.1V9.7L13.7 14.1V9.7" fill="none" stroke="#1A0F08" strokeWidth="1.05" strokeLinecap="square" />
    </svg>
  )
}