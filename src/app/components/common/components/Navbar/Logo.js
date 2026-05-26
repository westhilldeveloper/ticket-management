'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function Logo() {
  return (
    <div className="ml-4 lg:ml-0">
      <Link href="/dashboard" className="block">
        <div className="relative h-14 w-full mt-4 flex items-center justify-center">
          <Image
            src="/images/finLogo.png"
            alt="Logo"
            fill
            className="object-cover"
          />
        </div>
        <p className="text-xs font-bold text-gray-500 w-28 mt-1"></p>
      </Link>
    </div>
  )
}