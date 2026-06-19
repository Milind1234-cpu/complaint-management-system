import clsx from 'clsx'

const colorMap = {
  // ticket status
  open:        'bg-blue-100 text-blue-800',
  in_progress: 'bg-amber-100 text-amber-800',
  resolved:    'bg-green-100 text-green-800',
  closed:      'bg-gray-100 text-gray-700',
  // priority
  low:         'bg-slate-100 text-slate-700',
  medium:      'bg-orange-100 text-orange-700',
  high:        'bg-red-100 text-red-700',
  urgent:      'bg-red-200 text-red-900 font-bold',
  // roles
  admin:       'bg-purple-100 text-purple-800',
  staff:       'bg-blue-100 text-blue-800',
  customer:    'bg-gray-100 text-gray-700',
}

export default function Badge({ value, className }) {
  return (
    <span
      className={clsx(
        'inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
        colorMap[value] ?? 'bg-gray-100 text-gray-700',
        className,
      )}
    >
      {(value ?? '').replace(/_/g, ' ')}
    </span>
  )
}
