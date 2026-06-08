import type {ComponentChildren, JSX} from 'preact';
import classNames from './classNames';

type StatCardVariant = 'primary' | 'success' | 'neutral' | 'warning' | 'danger';

interface StatCardProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'className'> {
  className?: string;
  label: ComponentChildren;
  value: ComponentChildren;
  variant?: StatCardVariant;
}

export default function StatCard({className, label, value, variant = 'neutral', ...props}: StatCardProps) {
  const variantClass = {
    primary: 'border-blue-200 border-l-blue-600 bg-blue-50',
    success: 'border-emerald-200 border-l-emerald-600 bg-emerald-50',
    neutral: 'border-slate-200 border-l-slate-500 bg-white',
    warning: 'border-amber-200 border-l-amber-600 bg-amber-50',
    danger: 'border-red-200 border-l-red-600 bg-red-50',
  }[variant];

  return (
    <div {...props} className={classNames('rounded-lg border border-l-4 px-4 py-3', variantClass, className)}>
      <div className="text-2xl font-bold leading-none tracking-normal text-slate-900">{value}</div>
      <div className="mt-1.5 text-[0.8125rem] font-semibold text-slate-500">{label}</div>
    </div>
  );
}
