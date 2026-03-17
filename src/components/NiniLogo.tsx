type NiniLogoProps = {
  size?: number
  shadowOffset?: number
  borderWidth?: number
  inset?: number
  className?: string
}

export function NiniLogo({
  size = 72,
  shadowOffset = 6,
  borderWidth = 4,
  inset = 8,
  className = '',
}: NiniLogoProps) {
  return (
    <div
      className={`nini-logo ${className}`.trim()}
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderWidth,
        boxShadow: `${shadowOffset}px ${shadowOffset}px 0 #1A0F08`,
      }}
    >
      <div
        className="nini-logo__inner"
        style={{
          inset,
        }}
      />
      <span className="nini-logo__text">NINI</span>
    </div>
  )
}