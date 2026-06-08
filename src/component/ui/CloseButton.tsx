import type {JSX} from 'preact';
import classNames from './classNames';
import i18n from '../../i18n/i18n';

type CloseButtonVariant = 'app' | 'dialog' | 'modal';

interface CloseButtonProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'class' | 'className'> {
  className?: string;
  variant?: CloseButtonVariant;
}

export default function CloseButton({
                                      className,
                                      title,
                                      type = 'button',
                                      variant = 'modal',
                                      ...props
                                    }: CloseButtonProps) {
  const variantClass = variant === 'app' ? 'absolute right-4 top-4 z-[3]' : '';

  return (
    <button
      {...props}
      type={type}
      title={title ?? i18n('button-close')}
      className={classNames(
        'inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-2xl font-medium leading-none text-slate-500 transition-[background,color,transform] duration-150 hover:-translate-y-px hover:bg-red-50 hover:text-red-600',
        variantClass,
        className,
      )}
    >
      ×
    </button>
  );
}
