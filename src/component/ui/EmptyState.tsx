import type {ComponentChildren, JSX} from 'preact';
import classNames from './classNames';

interface EmptyStateProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'className' | 'title'> {
  children?: ComponentChildren;
  className?: string;
  description?: ComponentChildren;
  title: ComponentChildren;
}

export default function EmptyState({children, className, description, title, ...props}: EmptyStateProps) {
  return (
    <div {...props} className={classNames('px-4 py-11 text-center text-slate-500', className)}>
      <div className="text-base font-bold text-slate-800">{title}</div>
      {description && <div className="mt-1.5 text-sm">{description}</div>}
      {children}
    </div>
  );
}
