"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CollapsibleProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

function Collapsible({
  open: controlledOpen,
  onOpenChange,
  children,
  className,
}: CollapsibleProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = controlledOpen ?? internalOpen;

  const toggle = React.useCallback(() => {
    const next = !isOpen;
    setInternalOpen(next);
    onOpenChange?.(next);
  }, [isOpen, onOpenChange]);

  return (
    <CollapsibleContext.Provider value={{ isOpen, toggle }}>
      <div className={cn("", className)}>{children}</div>
    </CollapsibleContext.Provider>
  );
}

interface CollapsibleContextValue {
  isOpen: boolean;
  toggle: () => void;
}

const CollapsibleContext = React.createContext<CollapsibleContextValue>({
  isOpen: false,
  toggle: () => {},
});

function useCollapsible() {
  return React.useContext(CollapsibleContext);
}

interface CollapsibleTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

function CollapsibleTrigger({
  className,
  children,
  onClick,
  ...props
}: CollapsibleTriggerProps) {
  const { toggle, isOpen } = useCollapsible();

  return (
    <button
      aria-expanded={isOpen}
      className={cn("flex w-full items-center", className)}
      onClick={(e) => {
        toggle();
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {}

function CollapsibleContent({
  className,
  children,
  ...props
}: CollapsibleContentProps) {
  const { isOpen } = useCollapsible();
  const contentRef = React.useRef<HTMLDivElement>(null);

  return (
    <div
      ref={contentRef}
      aria-hidden={!isOpen}
      inert={!isOpen ? true : undefined}
      className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
