// src/index.ts
import "dotenv/config";
import fs from "fs";
import path from "path";
import { getFile } from "./figmaClient";
import { figmaToUiTree } from "./transformer";
import { generateHtml } from "./htmlGenerator";
import { generateCss } from "./cssGenerator";
import type { UiNode } from "./types";

function adjustRootFlowMargins(root: UiNode) {
  let prevBottom = 0;

  root.children.forEach((child, index) => {
    const y = child.layout.y ?? 0;
    const h = child.layout.height ?? 0;

    // distance from this child’s top to previous child’s bottom
    const margin = index === 0 ? y : Math.max(0, y - prevBottom);
    child.layout.marginTop = margin;

    prevBottom = y + h;
  });
}

const LOCAL_FILE = path.join(process.cwd(), "figma-file.json");

async function main() {
  console.log("🔍 Loading local Figma JSON from:", LOCAL_FILE);

  // Read the saved file
  const raw = fs.readFileSync(LOCAL_FILE, "utf-8");
  const file = JSON.parse(raw);

  const page = file.document.children[0];
  const frameNode = findFirstFrame(page);
  if (!frameNode) throw new Error("No FRAME nodes found.");

  console.log(`🎯 Using frame: ${frameNode.name}`);

  const uiTree = figmaToUiTree(frameNode, frameNode.absoluteBoundingBox);
  adjustRootFlowMargins(uiTree);

  const html = generateHtml(uiTree);
  const css = generateCss(uiTree);

  const outDir = path.join(process.cwd(), "output");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  fs.writeFileSync(path.join(outDir, "index.html"), html);
  fs.writeFileSync(path.join(outDir, "styles.css"), css);

  console.log("✅ Generated output/index.html and output/styles.css");
}

function findFirstFrame(node: any): any | null {
  if (node.type === "FRAME") return node;
  if (!node.children) return null;
  for (const child of node.children) {
    const found = findFirstFrame(child);
    if (found) return found;
  }
  return null;
}

// async function main() {
//   const [, , fileKey, frameNameArg] = process.argv;

//   if (!fileKey) {
//     console.error("Usage: npm start <FIGMA_FILE_KEY> [FRAME_NAME]");
//     process.exit(1);
//   }

//   console.log(`Fetching Figma file: ${fileKey}`);
//   const file = await getFile(fileKey);
// fs.writeFileSync("figma-file.json", JSON.stringify(file, null, 2), "utf-8");

//   const pages = file.document.children || [];
//   if (!pages.length) throw new Error("No pages found in Figma file.");

//   const page = pages[0];

//   let frameNode;
//   if (frameNameArg) {
//     frameNode = findFrameByName(page, frameNameArg);
//     if (!frameNode) {
//       console.warn(
//         `Frame '${frameNameArg}' not found. Falling back to first FRAME in file.`
//       );
//     }
//   }

//   if (!frameNode) {
//     frameNode = findFirstFrame(page);
//     if (!frameNode) throw new Error("No FRAME nodes found in file.");
//   }

//   console.log(`Using frame: ${frameNode.name} (${frameNode.id})`);

// const uiTree = figmaToUiTree(
//   frameNode,
//   frameNode.absoluteBoundingBox,
//   /* isRoot */ true,
//   /* parentIsRoot */ false
// );

//   const html = generateHtml(uiTree);
//   const css = generateCss(uiTree);

//   const outDir = path.join(process.cwd(), "output");
//   if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

//   fs.writeFileSync(path.join(outDir, "index.html"), html, "utf-8");
//   fs.writeFileSync(path.join(outDir, "styles.css"), css, "utf-8");

//   console.log("Generated output/index.html and output/styles.css");
// }

// function findFrameByName(root: any, name: string): any | undefined {
//   if (root.type === "FRAME" && root.name === name) return root;
//   if (!root.children) return undefined;
//   for (const child of root.children) {
//     const found = findFrameByName(child, name);
//     if (found) return found;
//   }
//   return undefined;
// }

// function findFirstFrame(root: any): any | undefined {
//   if (root.type === "FRAME") return root;
//   if (!root.children) return undefined;
//   for (const child of root.children) {
//     const found = findFirstFrame(child);
//     if (found) return found;
//   }
//   return undefined;
// }

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
