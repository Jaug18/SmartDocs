import React, { createContext, useState, useContext, ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils/utils';
import { PanelRightClose, PanelLeftClose } from 'lucide-react';
import { Button } from './button';

// Define posibles estados del sidebar
type SidebarState = 'expanded' | 'collapsed';

// Contexto para el sidebar
type SidebarContextValue = {
  state: SidebarState;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar debe ser usado dentro de SidebarProvider');
  }
  return context;
}

// Props para el provider
interface SidebarProviderProps {
  children: ReactNode;
  defaultState?: SidebarState;
}

// Provider del sidebar
export function SidebarProvider({
  children,
  defaultState = 'expanded',
}: SidebarProviderProps) {
  const [state, setState] = useState<SidebarState>(defaultState);

  const toggleSidebar = () => {
    setState(state === 'expanded' ? 'collapsed' : 'expanded');
  };

  return (
    <SidebarContext.Provider value={{ state, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

// Componente principal del sidebar
export const Sidebar = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { state } = useSidebar();

    return (
      <aside
        ref={ref}
        className={cn(
          'relative min-h-screen h-full border-r transition-all duration-300 ease-in-out overflow-hidden',
          state === 'expanded' ? 'w-80' : 'w-8', // Reducido a solo 32px cuando está colapsado
          className
        )}
        {...props}
      >
        <div className={cn(
          "h-full overflow-y-auto overflow-x-hidden transition-all duration-300 flex flex-col",
          state === 'collapsed' ? "sidebar-collapsed" : ""
        )}>
          {children}
        </div>
      </aside>
    );
  }
);
Sidebar.displayName = 'Sidebar';

// Componente para el botón que activa/desactiva el sidebar
export function SidebarToggleButton() {
  const { state, toggleSidebar } = useSidebar();

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleSidebar}
      className="hover:bg-sidebar-accent/20 h-7 w-7 p-0"
      title={state === 'expanded' ? "Contraer panel lateral" : "Expandir panel lateral"}
    >
      {state === 'expanded' ? 
        <PanelRightClose className="h-4 w-4" /> : 
        <PanelLeftClose className="h-4 w-4" />}
    </Button>
  );
}

// Componente para el contenido que se adapta al sidebar
export function SidebarInset({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { state } = useSidebar();

  return (
    <main
      className={cn(
        'flex-1 overflow-y-auto transition-all duration-300',
        state === 'collapsed' ? 'ml-8' : 'ml-0', // Ajustado a 32px también
        className
      )}
      {...props}
    >
      {children}
    </main>
  );
}

// Componente para secciones en el sidebar
interface SidebarSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export function SidebarSection({ title, className, children, ...props }: SidebarSectionProps) {
  const { state } = useSidebar();
  
  return (
    <div className={cn('py-2', className)} {...props}>
      {title && state === 'expanded' && 
        <h3 className="px-4 text-xs uppercase text-sidebar-foreground/50 mb-2">{title}</h3>
      }
      <div className="sidebar-section-content">{children}</div>
    </div>
  );
}
