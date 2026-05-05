"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type AccordionContextValue = {
  value: string | null;
  onValueChange: (value: string | null) => void;
  collapsible: boolean;
};

const AccordionContext = React.createContext<AccordionContextValue>({
  value: null,
  onValueChange: () => { },
  collapsible: false,
});

type AccordionItemContextValue = {
  value: string;
  isOpen: boolean;
  onToggle: () => void;
};

const AccordionItemContext = React.createContext<AccordionItemContextValue>({
  value: "",
  isOpen: false,
  onToggle: () => { },
});

// ---------------------------------------------------------------------------
// Accordion Root
// ---------------------------------------------------------------------------

type AccordionProps = {
  type?: "single";
  collapsible?: boolean;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
};

function Accordion({
  type = "single",
  collapsible = false,
  value: controlledValue,
  defaultValue,
  onValueChange,
  className,
  children,
}: AccordionProps) {
  const [internalValue, setInternalValue] = React.useState<string | null>(
    defaultValue ?? null
  );

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleValueChange = React.useCallback(
    (newValue: string | null) => {
      setInternalValue(newValue);
      if (onValueChange && newValue) {
        onValueChange(newValue);
      }
    },
    [onValueChange]
  );

  return (
    <AccordionContext.Provider
      value={{ value: value ?? null, onValueChange: handleValueChange, collapsible }}
    >
      <div className={cn("w-full", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Accordion Item
// ---------------------------------------------------------------------------

type AccordionItemProps = {
  value: string;
  className?: string;
  children: React.ReactNode;
};

function AccordionItem({ value, className, children }: AccordionItemProps) {
  const { value: selectedValue, onValueChange, collapsible } = React.useContext(AccordionContext);
  const isOpen = selectedValue === value;

  const onToggle = React.useCallback(() => {
    if (isOpen && collapsible) {
      onValueChange(null);
    } else if (!isOpen) {
      onValueChange(value);
    }
  }, [isOpen, collapsible, onValueChange, value]);

  return (
    <AccordionItemContext.Provider value={{ value, isOpen, onToggle }}>
      <div className={cn(className)}>{children}</div>
    </AccordionItemContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Accordion Trigger
// ---------------------------------------------------------------------------

type AccordionTriggerProps = {
  className?: string;
  children: React.ReactNode;
};

function AccordionTrigger({ className, children }: AccordionTriggerProps) {
  const { isOpen, onToggle } = React.useContext(AccordionItemContext);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      className={cn(
        "flex w-full items-center text-left transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 rounded-2xl",
        className
      )}
    >
      {children}
      <ChevronDown
        className={cn(
          "shrink-0 text-slate-400 transition-transform duration-300 ease-in-out",
          isOpen ? "rotate-180" : "rotate-0"
        )}
        size={20}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Accordion Content  –  pure-CSS height animation
// ---------------------------------------------------------------------------

type AccordionContentProps = {
  className?: string;
  children: React.ReactNode;
};

function AccordionContent({ className, children }: AccordionContentProps) {
    const { isOpen } = React.useContext(AccordionItemContext);

    return (
        <div
            style={{
                display: "grid",
                gridTemplateRows: isOpen ? "1fr" : "0fr",
                transition: "grid-template-rows 280ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
        >
            {/* Inner wrapper must have overflow: hidden to hide overflowing content */}
            <div style={{ overflow: "hidden" }}>
                <div className={cn(className)}>{children}</div>
            </div>
        </div>
    );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
