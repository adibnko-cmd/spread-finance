// ═══════════════════════════════════════════════════════════════════
// SPREAD FINANCE — Composants UI atomiques
// Design System v1 — tous les composants de base
// ═══════════════════════════════════════════════════════════════════
import { forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

// ─────────────────────────────────────────────────────────────────
// BUTTON
// ─────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const buttonVariants = {
  primary:   'bg-blue text-white hover:bg-blue-dark border-transparent',
  secondary: 'bg-dark text-white hover:bg-black border-transparent',
  outline:   'bg-white text-dark border-dark hover:bg-gray-50',
  ghost:     'bg-transparent text-blue border-blue hover:bg-blue-light',
  danger:    'bg-danger text-white hover:opacity-90 border-transparent',
  success:   'bg-success text-white hover:opacity-90 border-transparent',
}

const buttonSizes = {
  sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
  md: 'h-10 px-4 text-xs rounded-lg gap-2',
  lg: 'h-12 px-6 text-sm rounded-xl gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-bold border-[1.5px] transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      )}
      {children}
    </button>
  )
)
Button.displayName = 'Button'

// ─────────────────────────────────────────────────────────────────
// BADGE
// ─────────────────────────────────────────────────────────────────
interface BadgeProps {
  variant?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'dark' | 'outline' | 'free' | 'premium' | 'soon'
  size?: 'sm' | 'md'
  children: React.ReactNode
  className?: string
}

const badgeVariants = {
  blue:    'bg-blue-light text-blue-dark',
  green:   'bg-success-light text-green-800',
  yellow:  'bg-warning-light text-yellow-800',
  red:     'bg-danger-light text-red-800',
  purple:  'bg-accent-light text-purple-800',
  dark:    'bg-dark text-white',
  outline: 'bg-transparent text-dark border-dark',
  free:    'bg-gray-100 text-gray-500',
  premium: 'bg-blue-light text-blue-dark',
  soon:    'bg-warning-light text-yellow-800',
}

export function Badge({ variant = 'blue', size = 'sm', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-bold border border-transparent rounded-full',
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
        badgeVariants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────────────────────────
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'dark' | 'blue'
  padding?: 'sm' | 'md' | 'lg'
}

export function Card({ variant = 'default', padding = 'md', className, children, ...props }: CardProps) {
  const variants = {
    default: 'bg-white border-gray-200',
    dark:    'bg-dark border-dark text-white',
    blue:    'bg-blue-light border-blue',
  }
  const paddings = { sm: 'p-3', md: 'p-4', lg: 'p-5' }

  return (
    <div
      className={cn(
        'rounded-xl border-[1.5px]',
        variants[variant],
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// INPUT
// ─────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  success?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, success, leftIcon, rightIcon, className, ...props }, ref) => {
    const borderColor = error ? '#F56751' : success ? '#36D399' : '#D0D0D0'
    const focusBorder = error ? '#F56751' : '#3183F7'

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-gray-800">
            {label}
          </label>
        )}
        <div
          className="flex items-center h-11 px-3 gap-2 rounded-xl transition-all"
          style={{ border: `1.5px solid ${borderColor}` }}
          onFocusCapture={e => (e.currentTarget.style.border = `1.5px solid ${focusBorder}`)}
          onBlurCapture={e => (e.currentTarget.style.border = `1.5px solid ${borderColor}`)}
        >
          {leftIcon && <span className="text-gray-400 flex-shrink-0">{leftIcon}</span>}
          <input
            ref={ref}
            className={cn(
              'flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-300',
              className
            )}
            {...props}
          />
          {rightIcon && <span className="text-gray-400 flex-shrink-0">{rightIcon}</span>}
        </div>
        {error   && <p className="text-[11px] font-medium" style={{ color: '#F56751' }}>{error}</p>}
        {success && <p className="text-[11px] font-medium" style={{ color: '#36D399' }}>{success}</p>}
        {hint && !error && !success && <p className="text-[11px] text-gray-400">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

// ─────────────────────────────────────────────────────────────────
// PROGRESS BAR
// ─────────────────────────────────────────────────────────────────
interface ProgressBarProps {
  value: number        // 0-100
  color?: string
  height?: number
  showLabel?: boolean
  label?: string
  className?: string
}

export function ProgressBar({
  value,
  color = '#3183F7',
  height = 6,
  showLabel = false,
  label,
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-xs font-semibold text-gray-700">{label}</span>}
          {showLabel && <span className="text-xs font-bold" style={{ color }}>{clamped}%</span>}
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden bg-gray-200"
        style={{ height }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clamped}%`, background: color }}
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// SPINNER
// ─────────────────────────────────────────────────────────────────
export function Spinner({ size = 16, color = '#3183F7' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke={color} strokeWidth="3" />
      <path className="opacity-80" fill={color} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────────────────────────
interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: number
  className?: string
}

function initials(name?: string | null): string {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

export function Avatar({ src, name, size = 36, className }: AvatarProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? 'Avatar'}
        width={size}
        height={size}
        className={cn('rounded-full object-cover', className)}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-white flex-shrink-0',
        className
      )}
      style={{ width: size, height: size, background: '#3183F7', fontSize: size * 0.33 }}
    >
      {initials(name)}
    </div>
  )
}
