import fetch from "node-fetch";
import type { GetFileResponse } from "@figma/rest-api-spec";

const FIGMA_API_BASE = "https://api.figma.com/v1";

/**
 * Fetches Figma file based on file key
 */
export async function getFile(fileKey: string): Promise<GetFileResponse> {
  if (!process.env.FIGMA_TOKEN) {
    console.warn(
      "[warn] FIGMA_TOKEN not set. Create a .env file with FIGMA_TOKEN=your-token."
    );
  }

  const res = await fetch(`${FIGMA_API_BASE}/files/${fileKey}`, {
    headers: {
      "X-Figma-Token": process.env.FIGMA_TOKEN || "",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Figma API error ${res.status} ${res.statusText}: ${text}`);
  }

  // TS now knows this is a GetFileResponse
  return res.json() as Promise<GetFileResponse>;
}
