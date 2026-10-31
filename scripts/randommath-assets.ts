import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Page } from "playwright";

// Rasterize the original loaded figure, including SVG images, without persisting source-page HTML.
export async function importRandomMathDiagram(page: Page, source: string): Promise<string> {
  const key = createHash("sha256").update(source).digest("hex");
  const directory = "src/assets/solution-diagrams";
  const pointer = join(directory, `${key}.png.asset.json`);
  if (existsSync(pointer)) return JSON.parse(readFileSync(pointer, "utf8")).url;
  const images = page.locator("img");
  let image;
  for (let index = 0; index < await images.count(); index++) {
    const candidate = images.nth(index);
    const matches = await candidate.evaluate((element, url) => element instanceof HTMLImageElement && element.src === url, source);
    if (matches) { image = candidate; break; }
  }
  if (!image) throw new Error("diagram absent from verified source page");
  await image.scrollIntoViewIfNeeded();
  await image.evaluate(async element => {
    if (!(element instanceof HTMLImageElement)) throw new Error("not an image");
    await element.decode();
    if (!element.naturalWidth || !element.naturalHeight) throw new Error("diagram failed to load");
  });
  const temporary = mkdtempSync(join(tmpdir(), "randommath-diagram-"));
  try {
    const file = join(temporary, `${key}.png`);
    await image.screenshot({ path: file, timeout: 15000 });
    const output = execFileSync("lovable-assets", ["create", "--file", file, "--filename", `${key}.png`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    const asset = JSON.parse(output);
    if (typeof asset.url !== "string" || !asset.url.startsWith("/__l5e/assets-v1/")) throw new Error("asset upload returned no valid URL");
    mkdirSync(directory, { recursive: true });
    writeFileSync(pointer, output);
    return asset.url;
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}