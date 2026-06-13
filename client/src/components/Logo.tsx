interface LogoProps {
  size?: number
  showText?: boolean
  className?: string
}

export default function Logo({ size = 40, showText = true, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className="rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-extrabold select-none shrink-0"
        style={{ width: size, height: size, fontSize: size * 0.35 }}
      >
        CS
      </div>
      {showText && (
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          ChatSphere
        </h1>
      )}
    </div>
  )
}
