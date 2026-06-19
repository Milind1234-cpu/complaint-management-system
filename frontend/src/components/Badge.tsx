import clsx from 'clsx'

const colorMap: Record<string, string> = {
  open:        'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved:    'bg-green-100 text-green-800',
  closed:      'bg-gray-100 text-gray-800',
  low:         'bg-slate-100 text-slate-700',
  medium:      'bg-orange-100 text-orange-700',
  high:        'bg-red-100 text-red-700',
  critical:    'bg-red-200 text-red-900 font-bold',
}

export default function Badge({ value }: { value: string }) {
  return (
    <span
      className={clsx(
        'inline-block px-2 py-0.5 rounded-full text-xs capitalize',
        colorMap[value] ?? 'bg-gray-100 text-gray-700',
      )}
    >
      {value.replace('_', ' ')}
    </span>
  )
}
