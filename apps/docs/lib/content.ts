import { readFile } from "node:fs/promises";
import path from "node:path";

const contentDir = path.join(process.cwd(), "content", "components");

export async function readComponentDoc(slug: string): Promise<string | null> {
  try {
    return await readFile(path.join(contentDir, `${slug}.mdx`), "utf8");
  } catch {
    return null;
  }
}
