import type {
  UiNode,
  UiLayout,
  UiStyle,
  FigmaBounds,
  FigmaNode,
  FigmaLayoutMode,
  FigmaPaint,
} from "./types";

/**
 * Map a raw Figma node type to our UiNode type.
 */
function mapNodeType(figmaType: string): UiNode["type"] {
  switch (figmaType) {
    case "TEXT":
      return "text";
    case "RECTANGLE":
      return "rect";
    case "GROUP":
      return "group";
    case "FRAME":
    case "COMPONENT":
    case "INSTANCE":
    default:
      return "frame";
  }
}

/**
 * Entrypoint: convert a Figma node tree → UiNode tree.
 */
export function figmaToUiTree(
  figmaNode: FigmaNode,
  parentBounds?: FigmaBounds,
  parentLayoutMode?: FigmaLayoutMode
): UiNode {
  const nodeType = mapNodeType(figmaNode.type);

  const layout = extractLayout(figmaNode, parentBounds, parentLayoutMode);
  const style = extractStyle(figmaNode);

  const base: Omit<UiNode, "children" | "textContent" | "type"> = {
    id: figmaNode.id,
    name: figmaNode.name,
    layout,
    style,
  };

  // Text nodes are leaves
  if (nodeType === "text") {
    return {
      ...base,
      type: "text",
      children: [],
      textContent: figmaNode.characters ?? "",
    };
  }

  const nextParentBounds = figmaNode.absoluteBoundingBox ?? parentBounds;
  const nextParentLayoutMode =
    (figmaNode.layoutMode as FigmaLayoutMode) ?? parentLayoutMode;

  const children: UiNode[] = (figmaNode.children ?? [])
    .slice()
    .sort((a, b) => {
      const ay = a.absoluteBoundingBox?.y ?? 0;
      const by = b.absoluteBoundingBox?.y ?? 0;
      return ay - by;
    })
    .map((child) =>
      figmaToUiTree(child, nextParentBounds, nextParentLayoutMode)
    );

  return {
    ...base,
    type: nodeType,
    children,
  };
}

/**
 * Extracts layout information (position, size, flex) into UiLayout.
 */
export function extractLayout(
  figmaNode: FigmaNode,
  parentBounds?: FigmaBounds,
  parentLayoutMode?: FigmaLayoutMode
): UiLayout {
  const bounds = figmaNode.absoluteBoundingBox;
  const autoLayoutMode = figmaNode.layoutMode as FigmaLayoutMode;

  const layout: UiLayout = {
    position: "relative",
  };

  // Base size
  if (bounds) {
    layout.width = bounds.width;
    layout.height = bounds.height;
  }

  const parentIsAuto = isAutoLayout(parentLayoutMode);
  const isAutoContainer = isAutoLayout(autoLayoutMode);
  const isAbsolutelyPositioned = figmaNode.layoutPositioning === "ABSOLUTE";

  // Absolute positioning relative to parent bounds
  if (bounds && parentBounds && (!parentIsAuto || isAbsolutelyPositioned)) {
    layout.position = "absolute";
    layout.x = bounds.x - parentBounds.x;
    layout.y = bounds.y - parentBounds.y;
  }

  // Auto-layout containers → flex
  if (isAutoContainer) {
    applyAutoLayoutConfig(layout, figmaNode);
  }

  return layout;
}

/**
 * Whether a Figma layout mode represents auto-layout.
 */
function isAutoLayout(mode: FigmaLayoutMode): boolean {
  return !!mode && mode !== "NONE";
}

/**
 * Apply flexbox-related properties for Figma auto-layout containers.
 */
function applyAutoLayoutConfig(layout: UiLayout, figmaNode: FigmaNode) {
  const mode = figmaNode.layoutMode as FigmaLayoutMode;

  layout.display = "flex";
  layout.flexDirection = mode === "VERTICAL" ? "column" : "row";
  layout.gap = figmaNode.itemSpacing ?? 0;

  layout.padding = {
    top: figmaNode.paddingTop ?? 0,
    right: figmaNode.paddingRight ?? 0,
    bottom: figmaNode.paddingBottom ?? 0,
    left: figmaNode.paddingLeft ?? 0,
  };

  const primary = figmaNode.primaryAxisAlignItems;
  const counter = figmaNode.counterAxisAlignItems;

  if (primary) layout.justifyContent = mapPrimaryAlign(primary);
  if (counter) layout.alignItems = mapCounterAlign(counter);
}

function mapPrimaryAlign(
  value: "MIN" | "MAX" | "CENTER" | "SPACE_BETWEEN"
): string {
  switch (value) {
    case "MIN":
      return "flex-start";
    case "MAX":
      return "flex-end";
    case "CENTER":
      return "center";
    case "SPACE_BETWEEN":
      return "space-between";
    default:
      return "flex-start";
  }
}

function mapCounterAlign(value: "MIN" | "MAX" | "CENTER"): string {
  switch (value) {
    case "MIN":
      return "flex-start";
    case "MAX":
      return "flex-end";
    case "CENTER":
      return "center";
    default:
      return "stretch";
  }
}

/**
 * Extracts visual style (fills, strokes, text styles, shadows) into UiStyle.
 */
function extractStyle(figmaNode: FigmaNode): UiStyle {
  const style: UiStyle = {};

  // Fills
  const fillPaint = firstVisiblePaint(figmaNode.fills);
  const fillCss = fillPaint ? paintToCss(fillPaint) : undefined;

  // Stroke → border
  const strokePaint = firstVisiblePaint(figmaNode.strokes);
  if (strokePaint && figmaNode.strokeWeight) {
    const color = strokePaint.color!;
    const opacity = strokePaint.opacity ?? color.a ?? 1;
    style.borderColor = rgbaFromColor(color, opacity);
    style.borderWidth = figmaNode.strokeWeight;
  }

  // Corner radius
  applyCornerRadius(style, figmaNode);

  // Drop shadow
  applyDropShadow(style, figmaNode);

  // Text vs non-text
  if (figmaNode.type === "TEXT") {
    applyTextStyle(style, figmaNode, fillPaint);
  } else if (fillCss) {
    style.background = fillCss;
  }

  return style;
}

/**
 * First visible paint in an array (fills or strokes).
 */
function firstVisiblePaint(paints?: FigmaPaint[]): FigmaPaint | undefined {
  return (paints ?? []).find((paint) => paint.visible !== false);
}

/**
 * Apply corner radius styles from Figma node.
 */
function applyCornerRadius(style: UiStyle, figmaNode: FigmaNode) {
  if (typeof figmaNode.cornerRadius === "number") {
    style.borderRadius = `${figmaNode.cornerRadius}px`;
    return;
  }

  if (Array.isArray(figmaNode.rectangleCornerRadii)) {
    const [topLeft, topRight, bottomRight, bottomLeft] =
      figmaNode.rectangleCornerRadii;
    style.borderRadius = `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`;
  }
}

/**
 * Apply drop-shadow from Figma node effects.
 */
function applyDropShadow(style: UiStyle, figmaNode: FigmaNode) {
  const shadow = (figmaNode.effects || []).find(
    (effect: any) => effect.type === "DROP_SHADOW"
  );
  if (!shadow) return;

  const color = shadow.color;
  const rgba = rgbaFromColor(color, color.a ?? 1);
  style.boxShadow = `${shadow.offset.x}px ${shadow.offset.y}px ${shadow.radius}px ${rgba}`;
}

/**
 * Apply text-specific style (font, alignment, color) for TEXT nodes.
 */
function applyTextStyle(
  style: UiStyle,
  figmaNode: FigmaNode,
  fillPaint?: FigmaPaint
) {
  const textStyle = figmaNode.style ?? {};

  if (textStyle.fontSize) style.fontSize = textStyle.fontSize;
  if (textStyle.fontWeight) style.fontWeight = textStyle.fontWeight;
  if (textStyle.fontFamily) {
    style.fontFamily = `"${textStyle.fontFamily}", system-ui, -apple-system, sans-serif`;
  }
  if (textStyle.lineHeightPx) {
    style.lineHeight = textStyle.lineHeightPx;
  }
  if (typeof textStyle.letterSpacing === "number") {
    style.letterSpacing = textStyle.letterSpacing;
  }

  if (textStyle.textAlignHorizontal) {
    style.textAlign = textStyle.textAlignHorizontal.toLowerCase() as
      | "left"
      | "right"
      | "center"
      | "justify";
  }

  if (textStyle.textAlignVertical) {
    style.textAlignVertical = textStyle.textAlignVertical;
  }

  // For text, fill becomes text color
  if (fillPaint && fillPaint.color) {
    const color = fillPaint.color;
    const opacity = fillPaint.opacity ?? color.a ?? 1;
    style.color = rgbaFromColor(color, opacity);
  }
}

/**
 * Convert a Figma paint to a CSS color/gradient string.
 */
function paintToCss(paint: FigmaPaint): string | undefined {
  if (paint.type === "SOLID" && paint.color) {
    const color = paint.color;
    const opacity = paint.opacity ?? color.a ?? 1;
    return rgbaFromColor(color, opacity);
  }

  if (paint.type === "GRADIENT_LINEAR" && paint.gradientStops) {
    if (paint.gradientStops.length < 2) return;

    const stops = paint.gradientStops
      .map((stop) => {
        const color = stop.color;
        const opacity = color.a ?? 1;
        const rgba = rgbaFromColor(color, opacity);
        const position = Math.round(stop.position * 100);
        return `${rgba} ${position}%`;
      })
      .join(", ");

    // Angle could be improved via gradientTransform, but 90deg is fine for now
    return `linear-gradient(90deg, ${stops})`;
  }

  // TODO: IMAGE, RADIAL, etc.
  return;
}

/**
 * Convert Figma color + opacity → CSS rgba string.
 */
function rgbaFromColor(
  color: { r: number; g: number; b: number; a?: number },
  opacity: number
): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
