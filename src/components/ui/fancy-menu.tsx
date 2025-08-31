"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

// Premium-styled dropdown menu to visually match Fancy Select

const Menu = DropdownMenuPrimitive.Root;
const MenuTrigger = DropdownMenuPrimitive.Trigger;

const MenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 8, align = "start", ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      align={align}
      className={cn(
        // surface to match Fancy Select
        "z-50 min-w-[12rem] rounded-2xl border bg-white font-sans text-[#2a2a2a] shadow-[0_8px_24px_rgba(0,0,0,0.12)]",
        "dark:bg-[#0f0f0f] dark:text-gray-200 dark:border-[#2a2a2a]",
        // padding and animation
        "p-2 will-change-[transform,opacity]",
        // suppress outlines/rings
        "focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 outline-none ring-0",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
MenuContent.displayName = "MenuContent";

const MenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn("px-2 pb-1 pt-2 text-xs font-semibold text-[#2a2a2a] dark:text-gray-200", className)}
    {...props}
  />
));
MenuLabel.displayName = "MenuLabel";

const MenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-lg px-2 py-2 text-sm font-sans font-medium",
      "text-[#2a2a2a] dark:text-gray-200",
      "data-[highlighted]:bg-gray-50 data-[highlighted]:dark:bg-[#202020]",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      // suppress outlines/rings
      "focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 outline-none ring-0",
      className
    )}
    {...props}
  />
));
MenuItem.displayName = "MenuItem";

const MenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-2 h-px bg-gray-100 dark:bg-[#2a2a2a]", className)}
    {...props}
  />
));
MenuSeparator.displayName = "MenuSeparator";

export {
  Menu as Root,
  MenuTrigger as Trigger,
  MenuContent as Content,
  MenuItem as Item,
  MenuSeparator as Separator,
  MenuLabel as Label,
};
