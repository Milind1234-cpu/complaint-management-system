import clsx from 'clsx'

export default function Card({ children, className, padding = 'p-6', ...rest }) {
  return (
    <div className={clsx('card', padding, className)} {...rest}>
      {children}
    </div>
  )
}
