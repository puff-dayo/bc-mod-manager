import type {ComponentChildren, JSX} from 'preact';
import classNames from '@/component/ui/classNames';

interface ToolbarPrimaryProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'className'> {
  children: ComponentChildren;
  className?: string;
}

export default function ToolbarPrimary({children, className, ...props}: ToolbarPrimaryProps) {
  return (
    <div {...props} className={classNames('min-w-[260px] flex-1', className)}>
      {children}
    </div>
  );
}
