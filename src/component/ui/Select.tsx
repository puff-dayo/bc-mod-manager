import type {JSX} from 'preact';
import classNames from './classNames';

interface SelectProps extends Omit<JSX.SelectHTMLAttributes<HTMLSelectElement>, 'class' | 'className'> {
  className?: string;
  compact?: boolean;
}

export default function Select({className, compact = false, ...props}: SelectProps) {
  const hasWidthClass = className?.includes('w-') || className?.includes('w[');
  const sizeClass = compact
    ? 'min-h-8 px-2.5 py-1.5 text-[0.8125rem]'
    : 'min-h-9 px-3 py-2';

  return (
    <select
      {...props}
      className={classNames(
        !hasWidthClass && 'w-full',
        'rounded-lg border border-slate-300 bg-white text-slate-900 transition-[background,border-color] duration-150 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15',
        sizeClass,
        className,
      )}
    />
  );
}
