// src/cssGenerator.ts
import type { UiNode } from "./types";

export function generateCss(root: UiNode): string {
  const rules: string[] = [];
  let isFirst = true;

  function visit(node: UiNode) {
    const isHomeIndicator = node.name.toLowerCase().includes("home indicator");
    const selector = `.node-${sanitizeId(node.id)}`;
    const decls: string[] = [];

    const { layout, style } = node;

    // Layout
    decls.push(`position: ${layout.position};`);
    if (layout.position === "absolute") {
      if (layout.x != null) decls.push(`left: ${layout.x}px;`);
      if (layout.y != null) decls.push(`top: ${layout.y}px;`);
    }
    if (layout.display) {
      decls.push(`display: ${layout.display};`);
      if (layout.flexDirection)
        decls.push(`flex-direction: ${layout.flexDirection};`);
      if (layout.gap != null) decls.push(`gap: ${layout.gap}px;`);
    }

    if (layout.width != null) decls.push(`width: ${layout.width}px;`);
    if (layout.height != null) decls.push(`height: ${layout.height}px;`);

    // Style
    if (style.background) decls.push(`background: ${style.background};`);
    if (style.borderColor && style.borderWidth != null) {
      decls.push(`border: ${style.borderWidth}px solid ${style.borderColor};`);
    }
    if (style.borderRadius) decls.push(`border-radius: ${style.borderRadius};`);
    if (style.boxShadow) decls.push(`box-shadow: ${style.boxShadow};`);
    if (style.color) decls.push(`color: ${style.color};`);
    if (style.fontFamily) decls.push(`font-family: ${style.fontFamily};`);
    if (style.fontSize)
      decls.push(`font-size: ${style.fontSize.toFixed(2)}px;`);
    if (style.fontWeight) decls.push(`font-weight: ${style.fontWeight};`);
    if (style.lineHeight) {
      decls.push(
        typeof style.lineHeight === "number"
          ? `line-height: ${style.lineHeight}px;`
          : `line-height: ${style.lineHeight};`
      );
    }
    if (style.letterSpacing != null)
      decls.push(`letter-spacing: ${style.letterSpacing}px;`);
    if (style.textAlign) decls.push(`text-align: ${style.textAlign};`);

    // Debug: add a border to the first node (top frame)
    if (isFirst) {
      decls.push(`outline: 1px solid red;`);
      isFirst = false;
    }

    rules.push(`${selector} {\n  ${decls.join("\n  ")}\n}`);

    node.children.forEach(visit);
  }

  visit(root);

  const base = `html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #ffffff;
}

.root {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
}`;

  return base + "\n\n" + rules.join("\n\n");
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_");
}
