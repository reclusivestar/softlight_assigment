// src/figmaClient.ts
import fetch from "node-fetch";

const FIGMA_API_BASE = "https://api.figma.com/v1";

export async function getFile(fileKey: string) {
  const res = await fetch(`${FIGMA_API_BASE}/files/${fileKey}`, {
    headers: {
      "X-Figma-Token": process.env.FIGMA_TOKEN || "",
    },
  });

  if (!res.ok) {
    throw new Error(`Figma API error: ${res.status} ${res.statusText}`);
  }

  return res.json(); // typed as any here, you can add types from Figma OpenAPI
}
