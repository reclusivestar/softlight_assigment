// src/types.ts

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
    marginTop?: number;
      bottom?: number; 
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
