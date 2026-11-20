import { cn } from '@/lib/utils/cn';

export type AuthTab = 'login' | 'register';

type AuthTabsProps = {
  activeTab: AuthTab;
  onChange: (tab: AuthTab) => void;
};

const tabs: Array<{ id: AuthTab; label: string }> = [
  { id: 'login', label: 'Login' },
  { id: 'register', label: 'Register' },
];

export function AuthTabs({ activeTab, onChange }: AuthTabsProps) {
  return (
    <div className="border-b border-outline-variant/60">
      <div className="flex gap-8">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                'relative cursor-pointer pb-3.5 font-label text-xs font-bold uppercase tracking-[0.2em] transition-colors',
                isActive ? 'text-primary' : 'text-on-surface-variant hover:text-primary',
              )}
              aria-pressed={isActive}
            >
              {tab.label}
              <span
                className={cn(
                  'absolute inset-x-0 -bottom-px h-0.5 bg-primary transition-transform duration-200',
                  isActive ? 'scale-x-100' : 'scale-x-0',
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
