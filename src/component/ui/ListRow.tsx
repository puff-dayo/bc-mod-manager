import type {ComponentChildren, JSX} from 'preact';
import classNames from './classNames';

interface ListRowProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'className'> {
  children: ComponentChildren;
  className?: string;
}

export default function ListRow({children, className, ...props}: ListRowProps) {
  return (
    <div {...props} className={classNames('border-t border-slate-200 px-4 py-4 transition-colors first:border-t-0 hover:bg-slate-50', className)}>
      {children}
    </div>
  );
}
