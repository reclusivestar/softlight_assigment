// src/transformer.ts
import type { UiNode, UiLayout, UiStyle } from "./types";

export function figmaToUiTree(
  node: any,
  parentBox?: any,
  parentLayoutMode?: "VERTICAL" | "HORIZONTAL" | "NONE"
): UiNode {
  // ✅ You were missing this:
  const commonBase = {
    id: node.id as string,
    name: node.name as string,
  };

  const layout = extractLayout(node, parentBox, parentLayoutMode);
  const style = extractStyle(node);

  const children = (node.children || []).map((child: any) =>
    figmaToUiTree(
      child,
      node.absoluteBoundingBox || parentBox,
      node.layoutMode || parentLayoutMode
    )
  );

  switch (node.type) {
    case "TEXT":
      return {
        ...commonBase,
        type: "text",
        children: [],
        layout,
        style,
        textContent: node.characters ?? "",
      };
    case "RECTANGLE":
      return {
        ...commonBase,
        type: "rect",
        children,
        layout,
        style,
      };
    case "FRAME":
    case "COMPONENT":
    case "INSTANCE":
      return {
        ...commonBase,
        type: "frame",
        children,
        layout,
        style,
      };
    case "GROUP":
      return {
        ...commonBase,
        type: "group",
        children,
        layout,
        style,
      };
    default:
      return {
        ...commonBase,
        type: "frame",
        children,
        layout,
        style,
      };
  }
}

function extractLayout(
  node: any,
  parentBox?: any,
  parentLayoutMode?: "VERTICAL" | "HORIZONTAL" | "NONE"
): UiLayout {
  const box = node.absoluteBoundingBox;
  const layoutMode = node.layoutMode as
    | "VERTICAL"
    | "HORIZONTAL"
    | "NONE"
    | undefined;

  const layout: UiLayout = { position: "relative" };

  if (box) {
    layout.width = box.width;
    layout.height = box.height;
  }

  const isParentAutoLayout = parentLayoutMode && parentLayoutMode !== "NONE";
  const isAbsoluteChild = node.layoutPositioning === "ABSOLUTE";

  // 🔹 Decide if this node should use absolute coordinates
  // - If parent is NOT auto-layout → always use absolute (like your screen children)
  // - If parent IS auto-layout → only use absolute when Figma says so
  if (box && parentBox && (!isParentAutoLayout || isAbsoluteChild)) {
    layout.position = "absolute";
    layout.x = box.x - (parentBox.x ?? 0);
    layout.y = box.y - (parentBox.y ?? 0);
  }

  // 🔹 If THIS node is an auto-layout frame, also make it flex
  if (layoutMode && layoutMode !== "NONE") {
    layout.display = "flex";
    layout.flexDirection = layoutMode === "VERTICAL" ? "column" : "row";
    layout.gap = node.itemSpacing ?? 0;
    layout.padding = {
      top: node.paddingTop ?? 0,
      right: node.paddingRight ?? 0,
      bottom: node.paddingBottom ?? 0,
      left: node.paddingLeft ?? 0,
    };
  }

  return layout;
}

function extractStyle(node: any): UiStyle {
  const style: UiStyle = {};

  // fills → background OR text color
  const visibleFill = (node.fills || []).find((f: any) => f.visible !== false);
  const fillCss = visibleFill ? paintToCss(visibleFill) : undefined;

  // strokes
  const visibleStroke = (node.strokes || []).find(
    (s: any) => s.visible !== false
  );
  if (visibleStroke && node.strokeWeight) {
    const c = visibleStroke.color;
    const opacity = visibleStroke.opacity ?? c.a ?? 1;
    style.borderColor = rgbaFromColor(c, opacity);
    style.borderWidth = node.strokeWeight;
  }

  // corner radius
  if (typeof node.cornerRadius === "number") {
    style.borderRadius = `${node.cornerRadius}px`;
  } else if (Array.isArray(node.rectangleCornerRadii)) {
    const [tl, tr, br, bl] = node.rectangleCornerRadii;
    style.borderRadius = `${tl}px ${tr}px ${br}px ${bl}px`;
  }

  // shadows
  const shadow = (node.effects || []).find(
    (e: any) => e.type === "DROP_SHADOW"
  );
  if (shadow) {
    const c = shadow.color;
    const color = rgbaFromColor(c, c.a ?? 1);
    style.boxShadow = `${shadow.offset.x}px ${shadow.offset.y}px ${shadow.radius}px ${color}`;
  }

  // text-specific styles
  if (node.type === "TEXT") {
    const s = node.style || {};
    if (s.fontSize) style.fontSize = s.fontSize;
    if (s.fontWeight) style.fontWeight = s.fontWeight;
    if (s.fontFamily)
      style.fontFamily = `"${s.fontFamily}", system-ui, -apple-system, sans-serif`;
    if (s.lineHeightPx) style.lineHeight = s.lineHeightPx;
    if (typeof s.letterSpacing === "number")
      style.letterSpacing = s.letterSpacing;
    if (s.textAlignHorizontal) {
      style.textAlign = (s.textAlignHorizontal as string).toLowerCase() as
        | "left"
        | "right"
        | "center"
        | "justify";
    }

    // For text, treat fill as color instead of background
    if (visibleFill) {
      const c = visibleFill.color;
      const opacity = visibleFill.opacity ?? c.a ?? 1;
      style.color = rgbaFromColor(c, opacity);
    }
  } else if (fillCss) {
    // For non-text, treat fill as background
    style.background = fillCss;
  }

  return style;
}

// ---- helpers ----

function paintToCss(paint: any): string | undefined {
  if (!paint) return;

  if (paint.type === "SOLID") {
    const c = paint.color;
    const opacity = paint.opacity ?? c.a ?? 1;
    return rgbaFromColor(c, opacity);
  }

  if (paint.type === "GRADIENT_LINEAR") {
    const stops = paint.gradientStops;
    if (!stops || stops.length < 2) return;
    const toStop = (s: any) => {
      const c = s.color;
      const opacity = c.a ?? 1;
      const color = rgbaFromColor(c, opacity);
      const pos = Math.round(s.position * 100);
      return `${color} ${pos}%`;
    };
    const colors = stops.map(toStop).join(", ");
    // You can refine angle based on gradientTransform if you want
    return `linear-gradient(90deg, ${colors})`;
  }

  // Image, radial etc: TODO
  return;
}

function rgbaFromColor(
  c: { r: number; g: number; b: number; a?: number },
  opacity: number
): string {
  const r = Math.round(c.r * 255);
  const g = Math.round(c.g * 255);
  const b = Math.round(c.b * 255);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
