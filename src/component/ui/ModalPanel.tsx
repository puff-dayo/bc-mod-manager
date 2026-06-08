import type {ComponentChildren, JSX} from 'preact';
import classNames from './classNames';

interface ModalPanelProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'className' | 'title'> {
  actions?: ComponentChildren;
  children: ComponentChildren;
  className?: string;
  footer?: ComponentChildren;
  subtitle?: ComponentChildren;
  title?: ComponentChildren;
}

export default function ModalPanel({actions, children, className, footer, subtitle, title, ...props}: ModalPanelProps) {
  return (
    <div
      {...props}
      className={classNames(
        'flex w-[min(92vw,860px)] max-h-[min(90vh,860px)] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl',
        className,
      )}
    >
      {(title || subtitle || actions) && (
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div>
            {title && <h2 className="m-0 text-xl font-bold leading-tight text-slate-900">{title}</h2>}
            {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      {footer && <div className="border-t border-slate-200 bg-slate-50 px-5 py-3.5">{footer}</div>}
    </div>
  );
}
