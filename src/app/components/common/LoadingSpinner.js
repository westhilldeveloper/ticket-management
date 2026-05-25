import Image from 'next/image'

export default function LoadingSpinner({ size = 'medium' }) {
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-20 h-20',
    large: 'w-32 h-32',
  }

  const iconSizes = {
    small: 28,
    medium: 48,
    large: 72,
  }

  return (
    <div className="flex justify-center items-center">
      <div className="relative">
        {/* Rotating gradient ring */}
        <div
          className={`${sizeClasses[size]} rounded-full border-4 border-transparent animate-spin`}
          style={{
            background: `conic-gradient(from 0deg, #3b82f6, #a855f7, #ec4899, #3b82f6) border-box`,
            mask: `linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)`,
            WebkitMask: `linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)`,
            WebkitMaskComposite: 'destination-out',
            maskComposite: 'exclude',
          }}
        />
        
        {/* Logo in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="animate-pulse"
            style={{
              width: iconSizes[size],
              height: iconSizes[size],
            }}
          >
            <Image
              src="/images/finLogo.png"
              alt="Loading"
              width={iconSizes[size]}
              height={iconSizes[size]}
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  )
}