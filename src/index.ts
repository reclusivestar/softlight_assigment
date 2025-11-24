import "dotenv/config";
import fs from "fs";
import path from "path";
import { getFile } from "./figmaClient";
import { figmaToUiTree } from "./transformer";
import { generateHtml } from "./htmlGenerator";
import { generateCss } from "./cssGenerator";
import type { GetFileResponse } from "@figma/rest-api-spec";

async function main() {
  const args = process.argv.slice(2);
  const fileKey = args[0];
  const frameNameArg = args[1];

  if (!fileKey) {
    console.error("Usage: npm start <FIGMA_FILE_KEY> [FRAME_NAME]");
    process.exit(1);
  }

  console.log(`Fetching from Figma API: ${fileKey}`);
  const file: GetFileResponse = await getFile(fileKey);

  const page = file.document.children[0];
  if (!page) throw new Error("No pages found in the Figma document.");

  let frameNode =
    frameNameArg != null ? findFrameByName(page, frameNameArg) : null;

  if (!frameNode) {
    frameNode = findFirstFrame(page);
    if (!frameNode) throw new Error("No FRAME nodes found.");
    if (frameNameArg) {
      console.warn(
        `⚠️ Frame '${frameNameArg}' not found. Using first FRAME instead.`
      );
    }
  }

  console.log(`Using frame: ${frameNode.name}`);

  const uiTree = figmaToUiTree(
    frameNode,
    frameNode.absoluteBoundingBox,
    frameNode.layoutMode
  );

  const html = generateHtml(uiTree);
  const css = generateCss(uiTree);

  const outDir = path.join(process.cwd(), "output");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  fs.writeFileSync(path.join(outDir, "index.html"), html);
  fs.writeFileSync(path.join(outDir, "styles.css"), css);

  console.log("Generated output/index.html and output/styles.css");
}

function findFrameByName(root: any, name: string): any | null {
  if (root.type === "FRAME" && root.name === name) return root;
  if (!root.children) return null;
  for (const child of root.children) {
    const found = findFrameByName(child, name);
    if (found) return found;
  }
  return null;
}

function findFirstFrame(root: any): any | null {
  if (root.type === "FRAME") return root;
  if (!root.children) return null;
  for (const c of root.children) {
    const found = findFirstFrame(c);
    if (found) return found;
  }
  return null;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
