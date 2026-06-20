import { useState } from 'react'
import { Star } from 'lucide-react'

const SIZE_MAP = {
  sm: 14,
  md: 20,
  lg: 28,
}

/**
 * StarRating component
 * Props:
 *   value     {number}   0–5, current selected value
 *   onChange  {function} called with new rating (1–5) when clicked
 *   readOnly  {boolean}  if true, no hover/click interaction
 *   size      {string}   'sm' | 'md' | 'lg', default 'md'
 */
export default function StarRating({ value = 0, onChange, readOnly = false, size = 'md' }) {
  const [hovered, setHovered] = useState(0)
  const px = SIZE_MAP[size] ?? SIZE_MAP.md

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = readOnly ? star <= value : star <= (hovered || value)
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(star)}
            onMouseEnter={() => !readOnly && setHovered(star)}
            onMouseLeave={() => !readOnly && setHovered(0)}
            className={[
              'transition-colors focus:outline-none',
              readOnly
                ? 'cursor-default'
                : 'cursor-pointer hover:scale-110',
            ].join(' ')}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            aria-pressed={star <= value}
          >
            <Star
              size={px}
              className={filled ? 'text-amber-400' : 'text-gray-300'}
              fill={filled ? 'currentColor' : 'none'}
            />
          </button>
        )
      })}
    </div>
  )
}
