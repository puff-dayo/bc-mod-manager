import type {JSX} from 'preact';
import classNames from './classNames';

interface TextareaProps extends Omit<JSX.TextareaHTMLAttributes<HTMLTextAreaElement>, 'class' | 'className'> {
  className?: string;
}

export default function Textarea({className, ...props}: TextareaProps) {
  return (
    <textarea
      {...props}
      className={classNames(
        'min-h-9 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 transition-[background,border-color] duration-150 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15',
        className,
      )}
    />
  );
}
