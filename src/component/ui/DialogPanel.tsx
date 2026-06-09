import type {ComponentChildren, JSX} from 'preact';
import classNames from '@/component/ui/classNames';

interface DialogPanelProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'className'> {
  children: ComponentChildren;
  className?: string;
}

export default function DialogPanel({children, className, ...props}: DialogPanelProps) {
  return (
    <div
      {...props}
      className={classNames(
        'flex w-[min(92vw,460px)] max-h-[min(90vh,860px)] flex-col overflow-hidden rounded-lg border border-white/70 bg-bmm-surface p-5 shadow-bmm-panel ring-1 ring-slate-950/5',
        className,
      )}
    >
      {children}
    </div>
  );
}
