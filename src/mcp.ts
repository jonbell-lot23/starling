/**
 * MCP integration stubs for Figma and Glean.
 * These will be replaced with real MCP calls once servers are configured.
 */

export interface FigmaFrame {
  id: string;
  name: string;
  pageUrl: string;
}

// --- Figma MCP (stubbed) ---

export async function figma_createPage(fileUrl: string, pageName: string): Promise<string> {
  console.log(`  [figma-stub] Would create page "${pageName}" in ${fileUrl}`);
  return `page-${Date.now()}`;
}

export async function figma_createFrame(pageId: string, frameName: string, content: string): Promise<FigmaFrame> {
  console.log(`  [figma-stub] Would create frame "${frameName}" on page ${pageId}`);
  return {
    id: `frame-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: frameName,
    pageUrl: `https://figma.com/file/stub/${pageId}`,
  };
}

export async function figma_updateFrame(frameId: string, changes: string): Promise<void> {
  console.log(`  [figma-stub] Would update frame ${frameId}: ${changes.slice(0, 80)}...`);
}

export async function figma_addAnnotation(frameId: string, text: string): Promise<void> {
  console.log(`  [figma-stub] Would annotate frame ${frameId}: ${text.slice(0, 60)}...`);
}

// --- Glean MCP (stubbed) ---

export async function glean_search(query: string): Promise<string[]> {
  console.log(`  [glean-stub] Would search Glean for: "${query}"`);
  return [
    `[Glean stub] Internal doc result for "${query}" — design patterns and prior art`,
    `[Glean stub] Previous research on "${query}" — user research findings`,
  ];
}

// --- Web search (stubbed) ---

export async function web_search(query: string): Promise<string[]> {
  console.log(`  [web-stub] Would search web for: "${query}"`);
  return [
    `[Web stub] Competitor A approaches "${query}" with progressive disclosure`,
    `[Web stub] Competitor B uses a wizard-style flow for "${query}"`,
    `[Web stub] Industry trend: simplified onboarding for "${query}"`,
  ];
}
