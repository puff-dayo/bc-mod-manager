import type {ComponentChildren, JSX} from 'preact';
import classNames from './classNames';

export type ButtonVariant = 'primary' | 'neutral' | 'danger' | 'success' | 'ghost';
export type ButtonSize = 'md' | 'sm';

interface ButtonProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'class' | 'className' | 'size'> {
  children: ComponentChildren;
  className?: string;
  icon?: ComponentChildren;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export default function Button({
                                 children,
                                 className,
                                 icon,
                                 size = 'md',
                                 type = 'button',
                                 variant = 'neutral',
                                 ...props
                               }: ButtonProps) {
  const variantClass = {
    primary: 'border-blue-600 bg-blue-600 text-white hover:bg-blue-800',
    neutral: 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
    danger: 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
    ghost: 'border-transparent bg-transparent px-1 text-blue-700 hover:bg-blue-50 hover:text-blue-900',
  }[variant];
  const sizeClass = size === 'sm'
    ? 'min-h-[1.875rem] px-2.5 py-1.5 text-[0.78125rem]'
    : 'min-h-9 px-3 py-2 text-[0.8125rem]';

  return (
    <button
      {...props}
      type={type}
      className={classNames(
        'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border text-center font-bold leading-tight tracking-normal transition-[background,border-color,color,transform] duration-150 hover:-translate-y-px active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0',
        variantClass,
        sizeClass,
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}
