import type {ComponentChildren} from 'preact';
import classNames from './ui/classNames';

export interface AppLauncherItem {
  id: string;
  label: ComponentChildren;
  onClick: () => void;
}

interface AppLauncherProps {
  items: AppLauncherItem[];
  onToggle: () => void;
  open: boolean;
  title: string;
}

export default function AppLauncher({items, onToggle, open, title}: AppLauncherProps) {
  const openOffsets = ['translate-y-0', 'translate-y-11', 'translate-y-[5.5rem]'];

  return (
    <div className="fixed right-12 top-5 z-50">
      <button
        type="button"
        className={classNames(
          'flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-[1.75rem] font-medium leading-none text-white shadow-lg transition-[transform,background] duration-200 hover:-translate-y-0.5 hover:bg-slate-800',
          open && 'rotate-45',
        )}
        onClick={onToggle}
        title={title}
        aria-expanded={open}
        aria-label={title}
      >
        +
      </button>

      <div className="relative mt-2.5">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={classNames(
              'absolute right-0 top-0 min-h-9 w-max min-w-[9.75rem] origin-top-right whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[0.8125rem] font-semibold text-white shadow-lg transition-[opacity,transform,background] duration-150 hover:bg-slate-800',
              open
                ? classNames('pointer-events-auto scale-100 opacity-100', openOffsets[index] ?? openOffsets[0])
                : 'pointer-events-none -translate-y-2 scale-95 opacity-0',
            )}
            onClick={item.onClick}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
