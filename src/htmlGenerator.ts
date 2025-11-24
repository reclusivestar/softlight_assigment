import type { UiNode } from "./types";
import { sanitizeId } from "./utils";

export function generateHtml(root: UiNode): string {
  const bodyMarkup = renderNode(root, 0);

  return `<!doctype html>
          <html>
            <head>
              <meta charset="utf-8" />
              <title>${escapeHtml(root.name)}</title>
              <link rel="stylesheet" href="styles.css" />
            </head>
            <body>
              <div class="root">
          ${bodyMarkup}
              </div>
            </body>
          </html>`;
}

function renderNode(node: UiNode, depth: number): string {
  const indent = "  ".repeat(depth + 2);
  const tag = node.type === "text" ? "p" : "div";
  const className = `node-${sanitizeId(node.id)}`;
  const dataName = escapeAttr(node.name);

  if (node.type === "text") {
    const text = escapeHtml(node.textContent || "");
    return `${indent}<${tag} class="${className}" data-name="${dataName}">${text}</${tag}>`;
  }

  const childrenHtml = node.children
    .map((child) => renderNode(child, depth + 1))
    .join("\n");

  if (!childrenHtml) {
    return `${indent}<${tag} class="${className}" data-name="${dataName}"></${tag}>`;
  }

  return `${indent}<${tag} class="${className}" data-name="${dataName}">
        ${childrenHtml}
        ${indent}</${tag}>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/"/g, "&quot;");
}
