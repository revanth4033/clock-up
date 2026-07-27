"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";

import { cn } from "@/lib/utils";

/** Shared delay for a group of tooltips (hover opens after `delay`ms; focus and
 * press are immediate). */
function TooltipProvider({
  delay = 200,
  closeDelay = 0,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return (
    <TooltipPrimitive.Provider
      delay={delay}
      closeDelay={closeDelay}
      {...props}
    />
  );
}

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root {...props} />;
}

/** Renders a native `<button>`; Base UI wires hover / focus / press / Escape /
 * outside-press and sets `aria-describedby` to the popup automatically. */
function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  side = "top",
  sideOffset = 8,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<TooltipPrimitive.Positioner.Props, "side" | "sideOffset" | "align">) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        className="z-50 outline-none"
        side={side}
        sideOffset={sideOffset}
        collisionPadding={8}
      >
        {/* Inverted (dark-on-light / light-on-dark) surface so the tooltip reads
            as a distinct bubble against the light cards, with a pointer arrow. */}
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          role="tooltip"
          className={cn(
            "bg-foreground text-background data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 relative z-50 max-w-[260px] rounded-lg px-3 py-2 text-xs leading-relaxed shadow-lg duration-100 outline-none",
            className,
          )}
          {...props}
        >
          <TooltipPrimitive.Arrow className="data-[side=bottom]:-top-[5px] data-[side=left]:-right-[5px] data-[side=right]:-left-[5px] data-[side=top]:-bottom-[5px]">
            <div className="bg-foreground size-2.5 rotate-45 rounded-[2px]" />
          </TooltipPrimitive.Arrow>
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
