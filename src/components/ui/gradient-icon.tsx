"use client";

import React, { useEffect, useRef } from "react";

type GradientStop = { offset: string; color: string; opacity?: number };

export type GradientIconProps = {
  // Accept any React component that renders an SVG (e.g., lucide-react icons)
  Icon: React.ComponentType<any>;
  className?: string;
  // Optional custom gradient id (useful if you need to target with CSS/tests)
  gradientId?: string;
  // Optional customize gradient direction
  x1?: string;
  y1?: string;
  x2?: string;
  y2?: string;
  // Optional customize stops
  stops?: GradientStop[];
};

// Default to header gradient: from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E]
const DEFAULT_STOPS: GradientStop[] = [
  { offset: "0%", color: "#4F7DFF" },
  { offset: "50%", color: "#8B5CF6" },
  { offset: "100%", color: "#F6B51E" },
];

export function GradientIcon({
  Icon,
  className,
  gradientId,
  x1 = "0%",
  y1 = "0%",
  x2 = "100%",
  y2 = "0%",
  stops = DEFAULT_STOPS,
}: GradientIconProps) {
  // Create a colon-free, URL-safe id
  const idRef = useRef<string>(gradientId || `gi-${Math.random().toString(36).slice(2)}`);
  const id = idRef.current;
  const containerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const svg = root.querySelector('svg');
    if (!svg) return;

    // Ensure a <defs><linearGradient/></defs> exists inside this svg
    let defs = svg.querySelector("defs");
    if (!defs) {
      defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      svg.insertBefore(defs, svg.firstChild);
    }

    let linear = svg.querySelector(`#${CSS.escape(id)}`) as SVGLinearGradientElement | null;
    if (!linear) {
      linear = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
      linear.setAttribute("id", id);
      defs.appendChild(linear);
    }

    // Set direction. For multi-path icons, align gradient in user space (entire svg) for consistency
    // Try to read viewBox to compute a stable coordinate system
    const vb = svg.getAttribute("viewBox");
    if (vb) {
      const parts = vb.split(/\s+/).map(Number);
      // viewBox: minX minY width height
      const vbWidth = parts[2] ?? 24;
      const vbHeight = parts[3] ?? 24;
      linear.setAttribute("gradientUnits", "userSpaceOnUse");
      linear.setAttribute("x1", "0");
      linear.setAttribute("y1", String(vbHeight / 2));
      linear.setAttribute("x2", String(vbWidth));
      linear.setAttribute("y2", String(vbHeight / 2));
    } else {
      // Fallback to objectBoundingBox with provided props
      linear.setAttribute("x1", x1);
      linear.setAttribute("y1", y1);
      linear.setAttribute("x2", x2);
      linear.setAttribute("y2", y2);
    }

    // Clear previous stops and rebuild
    while (linear.firstChild) linear.removeChild(linear.firstChild);
    stops.forEach((s) => {
      const stop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      stop.setAttribute("offset", s.offset);
      stop.setAttribute("stop-color", s.color);
      if (typeof s.opacity === "number") stop.setAttribute("stop-opacity", String(s.opacity));
      linear!.appendChild(stop);
    });

    // Apply gradient STROKE only. Do not modify fills to keep icons from becoming solid.
    // Apply to the svg element itself (covers children that inherit stroke)
    (svg as SVGElement).setAttribute("stroke", `url(#${id})`);

    svg.querySelectorAll<SVGElement>(
      '[stroke="currentColor"], path[stroke], circle[stroke], rect[stroke], line[stroke], polyline[stroke], polygon[stroke]'
    ).forEach((el) => {
      el.setAttribute("stroke", `url(#${id})`);
    });
    // Do NOT touch fill attributes; respect existing fill="none" on lucide icons
  }, [Icon, id, x1, y1, x2, y2, JSON.stringify(stops)]);

  // Note: We keep color unset and rely on our mutation to swap currentColor users to gradient paint
  return (
    <span ref={containerRef}>
      <Icon className={className} />
    </span>
  );
}

export default GradientIcon;
