import type {ComponentChildren, JSX} from 'preact';
import classNames from './classNames';

interface DialogPanelProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'className'> {
  children: ComponentChildren;
  className?: string;
}

export default function DialogPanel({children, className, ...props}: DialogPanelProps) {
  return (
    <div
      {...props}
      className={classNames(
        'flex w-[min(92vw,460px)] max-h-[min(90vh,860px)] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-2xl',
        className,
      )}
    >
      {children}
    </div>
  );
}
