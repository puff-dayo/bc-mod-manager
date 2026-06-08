import type {ComponentChildren, JSX} from 'preact';
import classNames from './classNames';

type AlertVariant = 'danger' | 'success';

interface AlertProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'className'> {
  children: ComponentChildren;
  className?: string;
  variant?: AlertVariant;
}

export default function Alert({children, className, variant = 'danger', ...props}: AlertProps) {
  const variantClass = {
    danger: 'border-red-200 bg-red-50 text-red-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  }[variant];

  return (
    <div
      {...props}
      className={classNames('mb-4 rounded-lg border px-3.5 py-3 text-sm font-semibold', variantClass, className)}
    >
      {children}
    </div>
  );
}
