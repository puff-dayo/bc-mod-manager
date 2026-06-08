import type {ComponentChildren, JSX} from 'preact';
import classNames from './classNames';

interface ModalBackdropProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'className'> {
  children: ComponentChildren;
  className?: string;
}

export default function ModalBackdrop({children, className, ...props}: ModalBackdropProps) {
  return (
    <div {...props}
         className={classNames('fixed inset-0 flex items-center justify-center bg-slate-900/55 p-4', className)}>
      {children}
    </div>
  );
}
