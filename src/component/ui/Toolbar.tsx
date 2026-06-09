import type {ComponentChildren, JSX} from 'preact';
import classNames from './classNames';

interface ToolbarProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'className'> {
  children: ComponentChildren;
  className?: string;
  inline?: boolean;
}

export default function Toolbar({children, className, inline = false, ...props}: ToolbarProps) {
  return (
    <div
      {...props}
      className={classNames(
        inline
          ? 'flex flex-wrap items-center gap-2.5'
          : 'mt-4 flex flex-wrap items-center gap-2.5 rounded-lg border border-bmm-border bg-bmm-surface p-3 shadow-bmm-card first:mt-0',
        className,
      )}
    >
      {children}
    </div>
  );
}
