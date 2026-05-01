import http from 'node:http';
import { mkdir, readFile, rename, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const aiRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(aiRoot, '..');
const tasksRoot = path.join(aiRoot, 'tasks');
const kanbanFile = path.join(aiRoot, 'kanban', 'index.html');
const buildScript = path.join(aiRoot, 'scripts', 'build-kanban.mjs');
const port = Number(process.env.KANBAN_PORT || 4173);

const allowedStatuses = new Set(['todo', 'in-progress', 'review', 'qa', 'done', 'discarded']);

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

function sendText(res, status, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'content-type': contentType,
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 50_000) {
        req.destroy();
        reject(new Error('Request too large'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function runBuild() {
  const url = `${pathToFileURL(buildScript).href}?t=${Date.now()}`;
  return import(url);
}

function safeTaskPath(status, file) {
  if (!allowedStatuses.has(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  if (!/^[A-Za-z0-9._-]+\.md$/.test(file)) {
    throw new Error(`Invalid task filename: ${file}`);
  }

  return path.join(tasksRoot, status, file);
}

async function moveTask({ file, from, to }) {
  if (from === to) return { moved: false };

  const source = safeTaskPath(from, file);
  const target = safeTaskPath(to, file);

  await stat(source);
  await mkdir(path.dirname(target), { recursive: true });
  await rename(source, target);
  await runBuild();

  return { moved: true };
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://localhost:${port}`);

    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      const html = await readFile(kanbanFile, 'utf8');
      return sendText(res, 200, html, 'text/html; charset=utf-8');
    }

    if (req.method === 'POST' && url.pathname === '/api/move-task') {
      const body = await readRequestBody(req);
      const payload = JSON.parse(body);
      const result = await moveTask(payload);
      return sendJson(res, 200, { ok: true, ...result });
    }

    if (req.method === 'GET' && url.pathname.startsWith('/tasks/')) {
      const [, , status, ...fileParts] = url.pathname.split('/');
      const file = decodeURIComponent(fileParts.join('/'));
      const taskPath = safeTaskPath(status, file);
      const markdown = await readFile(taskPath, 'utf8');
      return sendText(res, 200, markdown, 'text/markdown; charset=utf-8');
    }

    return sendJson(res, 404, { ok: false, error: 'Not found' });
  } catch (error) {
    return sendJson(res, 400, { ok: false, error: error.message });
  }
});

await runBuild();

server.listen(port, () => {
  console.log(`Kanban running at http://localhost:${port}`);
  console.log('Drag cards between columns to move Markdown files between .ai/tasks folders.');
});
