import type {ComponentChildren, JSX} from 'preact';
import classNames from './classNames';

interface FormPanelProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'className' | 'title'> {
  children: ComponentChildren;
  className?: string;
  title?: ComponentChildren;
}

export default function FormPanel({children, className, title, ...props}: FormPanelProps) {
  return (
    <div {...props} className={classNames('rounded-lg border border-slate-200 bg-slate-50 p-4', className)}>
      {title && <h3 className="mb-4 text-base font-bold tracking-normal text-slate-900">{title}</h3>}
      {children}
    </div>
  );
}
