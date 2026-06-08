import type {ComponentChildren, JSX} from 'preact';
import classNames from './classNames';

export type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

interface BadgeProps extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'class' | 'className'> {
  children: ComponentChildren;
  className?: string;
  variant?: BadgeVariant;
}

export default function Badge({children, className, variant = 'neutral', ...props}: BadgeProps) {
  const variantClass = {
    neutral: 'border-slate-200 bg-slate-100 text-slate-800',
    primary: 'border-blue-200 bg-blue-50 text-blue-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    danger: 'border-red-200 bg-red-50 text-red-800',
  }[variant];

  return (
    <span
      {...props}
      className={classNames(
        'inline-flex items-center whitespace-nowrap rounded-full border px-2 py-1 text-[0.71875rem] font-bold leading-none',
        variantClass,
        className,
      )}
    >
      {children}
    </span>
  );
}
