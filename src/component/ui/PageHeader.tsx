import type {ComponentChildren, JSX} from 'preact';
import classNames from './classNames';

interface PageHeaderProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'className' | 'title'> {
  actions?: ComponentChildren;
  className?: string;
  subtitle?: ComponentChildren;
  title: ComponentChildren;
}

export default function PageHeader({actions, className, subtitle, title, ...props}: PageHeaderProps) {
  return (
    <div
      {...props}
      className={classNames(
        'mb-4 flex flex-col gap-4 pr-0 sm:flex-row sm:items-start sm:justify-between sm:pr-12',
        className,
      )}
    >
      <div>
        <h1 className="m-0 text-[1.625rem] font-bold leading-tight tracking-normal text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[0.9375rem] text-slate-500">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
