import type {ComponentChildren, JSX} from 'preact';
import classNames from './classNames';

interface ListProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'className'> {
  children: ComponentChildren;
  className?: string;
}

export default function List({children, className, ...props}: ListProps) {
  return (
    <div {...props} className={classNames('overflow-hidden rounded-lg border border-bmm-border bg-bmm-surface shadow-bmm-card', className)}>
      {children}
    </div>
  );
}
