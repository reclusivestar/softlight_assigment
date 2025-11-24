export type NodeType = "frame" | "group" | "rect" | "text" | "image" | "vector";

export interface UiLayout {
  position: "relative" | "absolute";
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  display?: "flex" | "block";
  flexDirection?: "row" | "column";
  justifyContent?: string;
  alignItems?: string;
  padding?: { top: number; right: number; bottom: number; left: number };
  gap?: number;
}

export interface UiStyle {
  background?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: string;
  boxShadow?: string;
  color?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number | string;
  letterSpacing?: number;
  textAlign?: "left" | "center" | "right" | "justify";
  textAlignVertical?: "TOP" | "CENTER" | "BOTTOM";
}

export interface UiNode {
  id: string;
  name: string;
  type: NodeType;
  children: UiNode[];
  layout: UiLayout;
  style: UiStyle;
  textContent?: string;
}

export type FigmaLayoutMode = "VERTICAL" | "HORIZONTAL" | "NONE" | undefined;

export interface FigmaBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FigmaPaint {
  type: string;
  visible?: boolean;
  opacity?: number;
  color?: { r: number; g: number; b: number; a?: number };
  gradientStops?: Array<{
    position: number;
    color: { r: number; g: number; b: number; a?: number };
  }>;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;

  // layout / geometry
  absoluteBoundingBox?: FigmaBounds;
  layoutMode?: FigmaLayoutMode;
  layoutPositioning?: "AUTO" | "ABSOLUTE";
  itemSpacing?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  primaryAxisAlignItems?: "MIN" | "MAX" | "CENTER" | "SPACE_BETWEEN";
  counterAxisAlignItems?: "MIN" | "MAX" | "CENTER";

  // styling
  fills?: FigmaPaint[];
  strokes?: FigmaPaint[];
  strokeWeight?: number;
  cornerRadius?: number;
  rectangleCornerRadii?: [number, number, number, number];
  effects?: any[];

  // text
  style?: {
    fontSize?: number;
    fontWeight?: number;
    fontFamily?: string;
    lineHeightPx?: number;
    letterSpacing?: number;
    textAlignHorizontal?: "LEFT" | "RIGHT" | "CENTER" | "JUSTIFIED";
    textAlignVertical?: "TOP" | "CENTER" | "BOTTOM";
  };
  characters?: string;

  // children
  children?: FigmaNode[];
}
