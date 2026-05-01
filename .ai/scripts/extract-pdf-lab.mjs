import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const aiRoot = path.resolve(__dirname, '..');
const defaultInputDir = path.join(aiRoot, 'pdf-lab', 'input');
const defaultOutputDir = path.join(aiRoot, 'pdf-lab', 'output');

function parseArgs(argv) {
  const args = {
    inputDir: defaultInputDir,
    outputDir: defaultOutputDir,
    outputName: null,
    product: 'auto',
    insurer: null,
    variant: null,
    maxPages: null,
    format: 'both',
    includeItems: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === '--help' || arg === '-h') args.help = true;
    else if (arg === '--input-dir') args.inputDir = path.resolve(next), i += 1;
    else if (arg === '--output-dir') args.outputDir = path.resolve(next), i += 1;
    else if (arg === '--output-name') args.outputName = next, i += 1;
    else if (arg === '--product') args.product = next, i += 1;
    else if (arg === '--insurer') args.insurer = next, i += 1;
    else if (arg === '--variant') args.variant = next, i += 1;
    else if (arg === '--max-pages') args.maxPages = Number(next), i += 1;
    else if (arg === '--format') args.format = next, i += 1;
    else if (arg === '--include-items') args.includeItems = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function usage() {
  return `
PDF extraction lab

Usage:
  npm run pdf:extract -- --output-name auto_porto_seguro_reduzido --insurer porto_seguro --variant reduzido

Options:
  --input-dir <path>       Folder containing PDFs. Default: .ai/pdf-lab/input
  --output-dir <path>      Folder for generated files. Default: .ai/pdf-lab/output
  --output-name <name>     Output base name. Default: product_insurer_variant_timestamp
  --product <name>         Product tag. Default: auto
  --insurer <name>         Insurer tag, e.g. porto_seguro
  --variant <name>         PDF variant tag, e.g. reduzido, extendido, vidros_full
  --max-pages <number>     Limit extracted pages.
  --format <json|md|both>  Output format. Default: both
  --include-items          Include positioned text items in JSON.
`;
}

function slug(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function buildOutputName(args) {
  if (args.outputName) return slug(args.outputName);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 13);
  return [args.product, args.insurer, args.variant, stamp].map(slug).filter(Boolean).join('_');
}

function textItemsToLines(items) {
  const rows = new Map();

  for (const item of items) {
    if (!item.str.trim()) continue;
    const yBucket = Math.round(item.y / 3) * 3;
    const row = rows.get(yBucket) ?? [];
    row.push(item);
    rows.set(yBucket, row);
  }

  return Array.from(rows.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([, row]) => row.sort((a, b) => a.x - b.x).map((item) => item.str).join(' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

async function extractPdf(filePath, args) {
  const buffer = await readFile(filePath);
  const data = new Uint8Array(buffer);
  const pdf = await pdfjsLib.getDocument({
    data,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;

  const pageLimit = args.maxPages ? Math.min(pdf.numPages, args.maxPages) : pdf.numPages;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const items = content.items
      .filter((item) => 'str' in item)
      .map((item) => ({
        str: item.str,
        x: Number(item.transform?.[4] ?? 0),
        y: Number(item.transform?.[5] ?? 0),
        width: Number(item.width ?? 0),
        height: Number(item.height ?? 0),
      }));

    const text = items.map((item) => item.str).join(' ').replace(/\s+/g, ' ').trim();
    const lines = textItemsToLines(items);

    pages.push({
      pageNumber,
      width: viewport.width,
      height: viewport.height,
      charCount: text.length,
      wordCount: text ? text.split(/\s+/).length : 0,
      text,
      lines,
      ...(args.includeItems ? { items } : {}),
    });
  }

  const rawText = pages.map((page) => page.text).join('\n\n');

  return {
    fileName: path.basename(filePath),
    filePath,
    totalPages: pdf.numPages,
    extractedPages: pageLimit,
    charCount: rawText.length,
    wordCount: rawText ? rawText.split(/\s+/).length : 0,
    rawText,
    pages,
  };
}

function renderMarkdown(payload) {
  const files = payload.files;
  const toc = files.map((file, index) => `${index + 1}. ${file.fileName} - ${file.extractedPages}/${file.totalPages} paginas`).join('\n');

  return `# PDF Extraction - ${payload.caseName}

## Metadata

- Product: ${payload.product || '-'}
- Insurer: ${payload.insurer || '-'}
- Variant: ${payload.variant || '-'}
- Generated at: ${payload.generatedAt}
- Input directory: \`${payload.inputDir}\`
- Files: ${files.length}

## Files

${toc}

${files.map((file) => `## ${file.fileName}

- Total pages: ${file.totalPages}
- Extracted pages: ${file.extractedPages}
- Words: ${file.wordCount}
- Characters: ${file.charCount}

### Raw Text

\`\`\`txt
${file.rawText}
\`\`\`

### Lines By Page

${file.pages.map((page) => `#### Page ${page.pageNumber}

\`\`\`txt
${page.lines.join('\n')}
\`\`\``).join('\n\n')}
`).join('\n\n')}
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage().trim());
    return;
  }

  if (!['json', 'md', 'both'].includes(args.format)) {
    throw new Error('--format must be json, md, or both');
  }

  await mkdir(args.inputDir, { recursive: true });
  await mkdir(args.outputDir, { recursive: true });

  const pdfs = (await readdir(args.inputDir))
    .filter((file) => file.toLowerCase().endsWith('.pdf'))
    .sort();

  if (pdfs.length === 0) {
    throw new Error(`No PDFs found in ${args.inputDir}`);
  }

  const caseName = buildOutputName(args);
  const files = [];

  for (const pdf of pdfs) {
    files.push(await extractPdf(path.join(args.inputDir, pdf), args));
  }

  const payload = {
    caseName,
    product: args.product,
    insurer: args.insurer,
    variant: args.variant,
    generatedAt: new Date().toISOString(),
    inputDir: args.inputDir,
    maxPages: args.maxPages,
    files,
  };

  const written = [];

  if (args.format === 'json' || args.format === 'both') {
    const jsonPath = path.join(args.outputDir, `${caseName}.json`);
    await writeFile(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    written.push(jsonPath);
  }

  if (args.format === 'md' || args.format === 'both') {
    const mdPath = path.join(args.outputDir, `${caseName}.md`);
    await writeFile(mdPath, renderMarkdown(payload), 'utf8');
    written.push(mdPath);
  }

  console.log(`Extracted ${pdfs.length} PDF(s).`);
  for (const file of written) console.log(`- ${path.relative(process.cwd(), file)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
