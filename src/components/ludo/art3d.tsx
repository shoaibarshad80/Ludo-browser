'use client'

// ============================================================
// Art3D — premium generated 3D assets for the home lobby.
// Each asset is a cut-out transparent WebP (objects rendered on
// pure black, background flood-removed, see scripts/cut_menu_assets.py).
// Menu-only: these stay still, so a soft CSS drop-shadow is safe
// here (unlike the animated board pawns).
// ============================================================

const BASE = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/3d`

export function Art3D({
  name,
  size = 32,
  className = '',
  shadow = true,
  style,
}: {
  name: string
  /** width in px; height follows the asset's own aspect ratio */
  size?: number
  className?: string
  shadow?: boolean
  style?: React.CSSProperties
}) {
  return (
    <img
      src={`${BASE}/${name}.webp`}
      alt=""
      aria-hidden
      draggable={false}
      width={size}
      height={size}
      loading="eager"
      className={`pointer-events-none select-none ${className}`}
      style={{
        width: size,
        height: 'auto',
        filter: shadow ? 'drop-shadow(0 3px 5px rgba(6,3,16,0.5))' : undefined,
        ...style,
      }}
    />
  )
}

export const Coin3D = ({ size = 26 }: { size?: number }) => <Art3D name="coin" size={size} />
export const Gem3D = ({ size = 24 }: { size?: number }) => <Art3D name="gem" size={size} />
export const Chest3D = ({ size = 30 }: { size?: number }) => <Art3D name="chest" size={size} />
export const Trophy3D = ({ size = 30 }: { size?: number }) => <Art3D name="trophy" size={size} />
export const Dice3D = ({ size = 34 }: { size?: number }) => <Art3D name="dice" size={size} />
export const Pawn2x3D = ({ size = 64 }: { size?: number }) => <Art3D name="pawn2" size={size} />
export const Pawn4x3D = ({ size = 64 }: { size?: number }) => <Art3D name="pawn4" size={size} />
export const Robot3D = ({ size = 64 }: { size?: number }) => <Art3D name="robot" size={size} />
export const Crown3D = ({ size = 40 }: { size?: number }) => <Art3D name="crown" size={size} />
export const Gift3D = ({ size = 26 }: { size?: number }) => <Art3D name="gift" size={size} />
