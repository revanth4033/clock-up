"use client";

import { useId } from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCardHover } from "./card-hover";

/**
 * Subtle info icon after a card title. The tooltip is controlled by the parent
 * HoverCard, so it opens when the whole card is hovered (200ms) while staying
 * anchored to this icon. The tooltip still handles keyboard focus (immediate),
 * touch tap, Escape and outside-press on its own; hover events from Base UI are
 * ignored so the card drives hovering. Base UI sets no ARIA on the popup, so
 * the trigger points at a persistent screen-reader-only description.
 */
export function CardInfoTooltip({
  text,
  label,
}: {
  text: string;
  label: string;
}) {
  const tooltipId = useId();
  const hover = useCardHover();
  const open = hover?.open ?? false;
  const setOpen = hover?.setOpen ?? (() => {});

  return (
    <>
      <Tooltip
        open={open}
        onOpenChange={(next, details) => {
          switch (details.reason) {
            case "trigger-focus": // keyboard focus in (open) / out (close)
            case "trigger-press": // touch tap
              setOpen(next);
              break;
            case "escape-key":
            case "outside-press":
              setOpen(false);
              break;
            // "trigger-hover": ignored — the whole card drives hovering.
          }
        }}
      >
        <TooltipTrigger
          aria-label={`About ${label}`}
          aria-describedby={tooltipId}
          className="text-muted-foreground/70 hover:text-foreground focus-visible:ring-ring/50 flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2"
        >
          <Info className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent>{text}</TooltipContent>
      </Tooltip>
      {/* Persistent screen-reader description referenced by aria-describedby. */}
      <span id={tooltipId} className="sr-only">
        {text}
      </span>
    </>
  );
}
