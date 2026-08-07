import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const docsDir = path.join(process.cwd(), "content/docs");
const forbiddenPatterns = [
  { label: "12API brand", pattern: /\b12API\b/i },
  { label: "12ai domain", pattern: /\b(?:api|doc)\.12ai\.org\b/i },
  { label: "12ai site", pattern: /https?:\/\/12ai\.org\b/i }
];
const files = await listFiles(docsDir);
const failures = [];

for (const file of files) {
  if (!file.endsWith(".mdx")) {
    continue;
  }

  const content = await readFile(file, "utf8");
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    for (const rule of forbiddenPatterns) {
      if (rule.pattern.test(line)) {
        failures.push({
          file: path.relative(process.cwd(), file).replaceAll("\\", "/"),
          line: index + 1,
          rule: rule.label
        });
      }
    }
  });
}

if (failures.length > 0) {
  console.error("Source identity remains in public documentation:");
  failures.forEach((failure) => {
    console.error(`- ${failure.file}:${failure.line} (${failure.rule})`);
  });
  process.exitCode = 1;
} else {
  console.log(`Source identity check passed for ${files.length} documentation files.`);
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const output = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      output.push(...(await listFiles(fullPath)));
    } else {
      output.push(fullPath);
    }
  }

  return output;
}
