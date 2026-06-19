import clsx from 'clsx'
import { forwardRef } from 'react'

const Input = forwardRef(function Input({ label, error, className, ...rest }, ref) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <input
        ref={ref}
        className={clsx('input-field', error && 'border-red-400 focus:ring-red-400', className)}
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
})

export default Input
