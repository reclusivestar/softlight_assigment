// src/figmaClient.ts
import fetch from "node-fetch";

const FIGMA_API_BASE = "https://api.figma.com/v1";

if (!process.env.FIGMA_TOKEN) {
  console.warn(
    "[warn] FIGMA_TOKEN not set. Create a .env file with FIGMA_TOKEN=your-token."
  );
}

export async function getFile(fileKey: string): Promise<any> {
  const res = await fetch(`${FIGMA_API_BASE}/files/${fileKey}`, {
    headers: {
      "X-Figma-Token": process.env.FIGMA_TOKEN || "",
    },
  });


console.log('Plan tier:', res.headers.get('x-figma-plan-tier')); // "starter", "pro", "org", "enterprise", "student"
console.log('Rate limit type:', res.headers.get('x-figma-rate-limit-type')); // "low" or "high"
console.log('Retry:', res.headers.get("retry-after"))

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Figma API error ${res.status} ${res.statusText}: ${text}`
    );
  }

  return res.json();
}
