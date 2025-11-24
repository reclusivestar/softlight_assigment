import type { UiNode } from "./types";
import { sanitizeId } from "./utils";

export function generateCss(root: UiNode): string {
  const rules: string[] = [];
  let firstFrame = true;

  function visit(node: UiNode) {
    const selector = `.node-${sanitizeId(node.id)}`;
    const cssDeclarations: string[] = [];

    const { layout, style } = node;

    // --- Layout / Position / Size ---
    addPositionRules(layout, cssDeclarations);
    addFlexRules(layout, cssDeclarations);
    addPaddingRule(layout, cssDeclarations);
    addSizeRules(layout, cssDeclarations);

    // --- Text container alignment (vertical centering for TEXT) ---
    addTextBoxAlignment(node, layout, style, cssDeclarations);

    // --- Visual styles (background, border, font, etc.) ---
    addVisualStyleRules(style, cssDeclarations);

    // Debug: outline the very first node (top frame)
    if (firstFrame) {
      cssDeclarations.push(`outline: 1px solid;`);
      firstFrame = false;
    }

    rules.push(`${selector} {\n  ${cssDeclarations.join("\n  ")}\n}`);

    node.children.forEach(visit);
  }

  visit(root);

  const base = `html, body {
      margin: 0;
      padding: 0;
      height: 100%;
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #ffffff;
    }

    /* Reset default paragraph margin so text boxes match Figma more closely */
    p {
      margin: 0;
    }

    /* Root acts as a viewport-sized scroll container */
    .root {
      max-height: 100vh;
      overflow: auto;
    }`;

  return base + "\n\n" + rules.join("\n\n");
}

/* ------------------------
 * Layout helpers
 * ------------------------ */

function addPositionRules(layout: UiNode["layout"], cssDeclarations: string[]) {
  cssDeclarations.push(`position: ${layout.position};`);

  if (layout.position === "absolute") {
    if (layout.x != null) cssDeclarations.push(`left: ${layout.x}px;`);
    if (layout.y != null) cssDeclarations.push(`top: ${layout.y}px;`);
  }
}

function addFlexRules(layout: UiNode["layout"], cssDeclarations: string[]) {
  if (!layout.display) return;

  cssDeclarations.push(`display: ${layout.display};`);

  if (layout.flexDirection) {
    cssDeclarations.push(`flex-direction: ${layout.flexDirection};`);
  }
  if (layout.gap != null) {
    cssDeclarations.push(`gap: ${layout.gap}px;`);
  }
  if (layout.justifyContent) {
    cssDeclarations.push(`justify-content: ${layout.justifyContent};`);
  }
  if (layout.alignItems) {
    cssDeclarations.push(`align-items: ${layout.alignItems};`);
  }
}

function addPaddingRule(layout: UiNode["layout"], cssDeclarations: string[]) {
  if (!layout.padding) return;

  const { top, right, bottom, left } = layout.padding;
  cssDeclarations.push(`padding: ${top}px ${right}px ${bottom}px ${left}px;`);
}

function addSizeRules(layout: UiNode["layout"], cssDeclarations: string[]) {
  if (layout.width != null) {
    cssDeclarations.push(`width: ${layout.width}px;`);
  }
  if (layout.height != null) {
    cssDeclarations.push(`height: ${layout.height}px;`);
  }
}

/**
 * Vertical centering for text boxes with Figma's vertical align CENTER.
 * We model those as flex containers so the <p> content is centered.
 */
function addTextBoxAlignment(
  node: UiNode,
  layout: UiNode["layout"],
  style: UiNode["style"],
  cssDeclarations: string[]
) {
  const isAbsolutelyPositionedTextBox =
    node.type === "text" &&
    layout.position === "absolute" &&
    layout.height != null &&
    style.textAlignVertical === "CENTER";

  if (!isAbsolutelyPositionedTextBox) return;

  // Turn the text box into a flex container
  cssDeclarations.push(`display: flex;`);
  cssDeclarations.push(`align-items: center;`);

  // Horizontal alignment mirrors Figma's textAlign
  if (style.textAlign === "center") {
    cssDeclarations.push(`justify-content: center;`);
  } else if (style.textAlign === "right") {
    cssDeclarations.push(`justify-content: flex-end;`);
  } else {
    cssDeclarations.push(`justify-content: flex-start;`);
  }
}

/* ------------------------
 * Style helpers
 * ------------------------ */

function addVisualStyleRules(
  style: UiNode["style"],
  cssDeclarations: string[]
) {
  if (style.background) {
    cssDeclarations.push(`background: ${style.background};`);
  }

  if (style.borderColor && style.borderWidth != null) {
    cssDeclarations.push(
      `border: ${style.borderWidth}px solid ${style.borderColor};`
    );
  }

  if (style.borderRadius) {
    cssDeclarations.push(`border-radius: ${style.borderRadius};`);
  }

  if (style.boxShadow) {
    cssDeclarations.push(`box-shadow: ${style.boxShadow};`);
  }

  if (style.color) {
    cssDeclarations.push(`color: ${style.color};`);
  }

  if (style.fontFamily) {
    cssDeclarations.push(`font-family: ${style.fontFamily};`);
  }

  if (style.fontSize) {
    cssDeclarations.push(`font-size: ${style.fontSize.toFixed(2)}px;`);
  }

  if (style.fontWeight) {
    cssDeclarations.push(`font-weight: ${style.fontWeight};`);
  }

  if (style.lineHeight) {
    cssDeclarations.push(formatLineHeight(style.lineHeight));
  }

  if (style.letterSpacing != null) {
    cssDeclarations.push(`letter-spacing: ${style.letterSpacing}px;`);
  }

  if (style.textAlign) {
    cssDeclarations.push(`text-align: ${style.textAlign};`);
  }
}

function formatLineHeight(value: number | string): string {
  if (typeof value === "number") {
    return `line-height: ${value}px;`;
  }
  return `line-height: ${value};`;
}
