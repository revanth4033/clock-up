"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CardHoverValue = { open: boolean; setOpen: (open: boolean) => void };

const CardHoverContext = createContext<CardHoverValue | null>(null);

export function useCardHover() {
  return useContext(CardHoverContext);
}

/**
 * A dashboard card that reveals its info tooltip when hovered ANYWHERE on the
 * card (after ~200ms), not only on the small info icon. The tooltip stays
 * anchored to the icon and does not follow the cursor. Keyboard focus, tap, and
 * Escape are handled by the tooltip itself (see CardInfoTooltip).
 */
export function HoverCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };
  const handleEnter = () => {
    clearTimer();
    timer.current = setTimeout(() => setOpen(true), 200);
  };
  const handleLeave = () => {
    clearTimer();
    setOpen(false);
  };

  return (
    <CardHoverContext.Provider value={{ open, setOpen }}>
      <Card
        className={cn("gap-0 rounded-2xl", className)}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        {children}
      </Card>
    </CardHoverContext.Provider>
  );
}
