import clsx from 'clsx'

const config = {
  open:        { dot: 'bg-blue-500',  text: 'text-blue-800',  bg: 'bg-blue-50',  label: 'Open' },
  in_progress: { dot: 'bg-amber-500', text: 'text-amber-800', bg: 'bg-amber-50', label: 'In Progress' },
  resolved:    { dot: 'bg-green-500', text: 'text-green-800', bg: 'bg-green-50', label: 'Resolved' },
  closed:      { dot: 'bg-gray-400',  text: 'text-gray-700',  bg: 'bg-gray-100', label: 'Closed' },
}

export default function StatusBadge({ status }) {
  const c = config[status] ?? { dot: 'bg-gray-400', text: 'text-gray-700', bg: 'bg-gray-100', label: status }
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium', c.bg, c.text)}>
      <span className={clsx('w-2 h-2 rounded-full', c.dot)} />
      {c.label}
    </span>
  )
}
