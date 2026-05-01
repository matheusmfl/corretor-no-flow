import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const aiRoot = path.resolve(__dirname, '..');
const tasksRoot = path.join(aiRoot, 'tasks');
const outputFile = path.join(aiRoot, 'kanban', 'index.html');

const columns = [
  { id: 'todo', title: 'Todo' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
  { id: 'discarded', title: 'Discarded' },
];

function parseFrontmatter(markdown) {
  if (!markdown.startsWith('---')) return {};
  const end = markdown.indexOf('\n---', 3);
  if (end === -1) return {};
  const raw = markdown.slice(3, end).trim();
  return Object.fromEntries(
    raw
      .split(/\r?\n/)
      .map((line) => line.match(/^([^:]+):\s*(.*)$/))
      .filter(Boolean)
      .map((match) => [match[1].trim(), match[2].trim().replace(/^['"]|['"]$/g, '')]),
  );
}

function extractSection(markdown, heading) {
  const pattern = new RegExp(`^## ${heading}\\s*$([\\s\\S]*?)(?=^## |\\z)`, 'm');
  const match = markdown.match(pattern);
  if (!match) return '';
  return match[1]
    .trim()
    .replace(/^- \[ \] /gm, '')
    .replace(/^- /gm, '')
    .replace(/\n{2,}/g, '\n')
    .slice(0, 420);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function loadTasks() {
  const tasks = [];

  for (const column of columns) {
    const dir = path.join(tasksRoot, column.id);
    const files = await readdir(dir).catch(() => []);

    for (const file of files.filter((name) => name.endsWith('.md')).sort()) {
      const absolutePath = path.join(dir, file);
      const markdown = await readFile(absolutePath, 'utf8');
      const meta = parseFrontmatter(markdown);
      const title = meta.title || file.replace(/\.md$/, '');

      tasks.push({
        ...meta,
        id: meta.id || file.replace(/\.md$/, ''),
        title,
        status: column.id,
        file,
        href: `../tasks/${column.id}/${encodeURIComponent(file)}`,
        context: extractSection(markdown, 'Context'),
        objective: extractSection(markdown, 'Objective'),
        acceptance: extractSection(markdown, 'Acceptance Criteria'),
      });
    }
  }

  return tasks;
}

function renderTaskCard(task) {
  const area = task.area || 'product';
  const risk = task.risk || 'low';
  const complexity = task.complexity || 'low';
  const kind = task.kind || 'task';
  const lifecycle = task.lifecycle || 'open';
  const tdd = task.tdd_required === 'true';
  const body = task.objective || task.context || task.acceptance || 'Sem resumo.';

  return `
    <article
      class="task-card"
      draggable="true"
      data-file="${escapeHtml(task.file)}"
      data-status="${escapeHtml(task.status)}"
      data-title="${escapeHtml(`${task.id} ${task.title}`.toLowerCase())}"
      data-area="${escapeHtml(area)}"
      data-risk="${escapeHtml(risk)}"
      data-complexity="${escapeHtml(complexity)}"
      data-kind="${escapeHtml(kind)}"
      data-lifecycle="${escapeHtml(lifecycle)}"
    >
      <div class="task-card__topline">
        <span class="task-id">${escapeHtml(task.id)}</span>
        <span class="pill pill--${escapeHtml(risk)}">${escapeHtml(risk)}</span>
        <span class="pill pill--life-${escapeHtml(lifecycle)}">${escapeHtml(lifecycle)}</span>
      </div>
      <h3>${escapeHtml(task.title)}</h3>
      <p>${escapeHtml(body)}</p>
      <div class="task-meta">
        <span>${escapeHtml(area)}</span>
        <span>${escapeHtml(kind)}</span>
        <span>${escapeHtml(complexity)}</span>
        ${tdd ? '<span>TDD</span>' : ''}
      </div>
      <a href="/tasks/${task.status}/${encodeURIComponent(task.file)}" target="_blank" rel="noopener noreferrer">Abrir Markdown</a>
    </article>
  `;
}

function renderHtml(tasks) {
  const generatedAt = new Date().toLocaleString('pt-BR');
  const taskCount = tasks.length;
  const byStatus = Object.fromEntries(columns.map((column) => [
    column.id,
    tasks.filter((task) => task.status === column.id),
  ]));

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Corretor no Flow - Kanban</title>
    <style>
      :root {
        --bg: #f2efe8;
        --paper: #fffaf0;
        --ink: #231f1a;
        --muted: #71695e;
        --line: #ded4c4;
        --coal: #27302d;
        --ember: #b5472f;
        --gold: #d9a441;
        --green: #2f7d5c;
        --blue: #315d7d;
        --red: #a33a32;
        --shadow: 0 18px 45px rgba(63, 49, 35, 0.12);
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        min-height: 100vh;
        background:
          linear-gradient(90deg, rgba(35, 31, 26, 0.045) 1px, transparent 1px),
          linear-gradient(rgba(35, 31, 26, 0.035) 1px, transparent 1px),
          var(--bg);
        background-size: 28px 28px;
        color: var(--ink);
        font-family: "Georgia", "Times New Roman", serif;
      }

      header {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 24px;
        align-items: end;
        padding: 28px;
        border-bottom: 1px solid var(--line);
        background: rgba(255, 250, 240, 0.82);
        backdrop-filter: blur(10px);
        position: sticky;
        top: 0;
        z-index: 5;
      }

      h1 {
        margin: 0;
        font-size: clamp(28px, 4vw, 48px);
        line-height: 0.95;
        letter-spacing: 0;
      }

      .subtitle {
        margin: 10px 0 0;
        color: var(--muted);
        font: 14px/1.5 "Segoe UI", sans-serif;
      }

      .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: flex-end;
        max-width: 520px;
      }

      input,
      select {
        min-height: 38px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: var(--paper);
        color: var(--ink);
        padding: 8px 10px;
        font: 13px "Segoe UI", sans-serif;
      }

      input { width: min(260px, 100%); }

      main {
        display: grid;
        grid-template-columns: repeat(5, minmax(250px, 1fr));
        gap: 14px;
        padding: 18px;
        overflow-x: auto;
      }

      .column {
        min-height: calc(100vh - 180px);
        border: 1px solid var(--line);
        border-radius: 8px;
        background: rgba(255, 250, 240, 0.72);
        box-shadow: var(--shadow);
      }

      .column.is-drop-target {
        outline: 2px solid rgba(181, 71, 47, 0.42);
        outline-offset: 3px;
      }

      .column__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 13px 14px;
        border-bottom: 1px solid var(--line);
      }

      h2 {
        margin: 0;
        font: 700 13px "Segoe UI", sans-serif;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .count {
        min-width: 24px;
        border-radius: 999px;
        background: var(--coal);
        color: var(--paper);
        text-align: center;
        font: 700 12px/24px "Segoe UI", sans-serif;
      }

      .column__body {
        display: grid;
        gap: 10px;
        padding: 10px;
      }

      .task-card {
        border: 1px solid rgba(39, 48, 45, 0.14);
        border-radius: 7px;
        background: var(--paper);
        padding: 13px;
        box-shadow: 0 8px 20px rgba(63, 49, 35, 0.08);
        transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
      }

      .task-card.is-dragging {
        opacity: 0.5;
      }

      .task-card:hover {
        transform: translateY(-2px);
        border-color: rgba(181, 71, 47, 0.36);
        box-shadow: 0 14px 28px rgba(63, 49, 35, 0.14);
      }

      .task-card__topline,
      .task-meta {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
      }

      .task-id {
        color: var(--ember);
        font: 800 11px "Segoe UI", sans-serif;
        letter-spacing: 0.06em;
      }

      h3 {
        margin: 8px 0 7px;
        font-size: 18px;
        line-height: 1.1;
      }

      .task-card p {
        margin: 0;
        color: var(--muted);
        font: 13px/1.45 "Segoe UI", sans-serif;
      }

      .task-meta {
        margin-top: 12px;
      }

      .task-meta span,
      .pill {
        border-radius: 999px;
        padding: 3px 7px;
        background: #eee4d5;
        color: var(--muted);
        font: 700 10px "Segoe UI", sans-serif;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .pill--medium { background: #f4dfba; color: #7b4b13; }
      .pill--high { background: #f1c7bd; color: var(--red); }
      .pill--low { background: #dce9df; color: var(--green); }
      .pill--life-open { background: #e8edf2; color: var(--blue); }
      .pill--life-closed { background: #e0eadf; color: var(--green); }

      .task-card a {
        display: inline-flex;
        margin-top: 12px;
        color: var(--ember);
        font: 700 12px "Segoe UI", sans-serif;
        text-decoration: none;
      }

      .task-card a:hover { text-decoration: underline; }

      .empty {
        display: none;
        padding: 18px 12px;
        color: var(--muted);
        font: 13px "Segoe UI", sans-serif;
      }

      .is-hidden { display: none; }

      .server-note {
        display: none;
        grid-column: 1 / -1;
        border: 1px solid rgba(163, 58, 50, 0.28);
        border-radius: 8px;
        background: #f9dfd8;
        color: var(--red);
        padding: 12px 14px;
        font: 13px/1.4 "Segoe UI", sans-serif;
      }

      @media (max-width: 820px) {
        header {
          position: static;
          grid-template-columns: 1fr;
          padding: 20px;
        }

        .toolbar {
          justify-content: stretch;
        }

        input,
        select {
          flex: 1 1 150px;
        }
      }
    </style>
  </head>
  <body>
    <header>
      <div>
        <h1>Kanban<br />Pré-Venda V1</h1>
        <p class="subtitle">${taskCount} tasks lidas de <code>.ai/tasks</code>. Gerado em ${escapeHtml(generatedAt)}.</p>
      </div>
      <div class="toolbar" aria-label="Filtros">
        <input id="search" type="search" placeholder="Buscar task..." />
        <select id="area">
          <option value="">Todas as areas</option>
          ${[...new Set(tasks.map((task) => task.area).filter(Boolean))].sort().map((area) => `<option value="${escapeHtml(area)}">${escapeHtml(area)}</option>`).join('')}
        </select>
        <select id="risk">
          <option value="">Todos os riscos</option>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
        <select id="kind">
          <option value="">Todos os tipos</option>
          ${[...new Set(tasks.map((task) => task.kind).filter(Boolean))].sort().map((kind) => `<option value="${escapeHtml(kind)}">${escapeHtml(kind)}</option>`).join('')}
        </select>
        <select id="lifecycle">
          <option value="">Open e closed</option>
          <option value="open">open</option>
          <option value="closed">closed</option>
        </select>
      </div>
    </header>
    <main>
      <div class="server-note" id="server-note">
        Para mover cards entre pastas, abra este Kanban pelo servidor local:
        <code>node .ai/scripts/kanban-server.mjs</code>.
      </div>
      ${columns.map((column) => `
        <section class="column" data-column="${column.id}">
          <div class="column__header">
            <h2>${column.title}</h2>
            <span class="count" data-count="${column.id}">${byStatus[column.id].length}</span>
          </div>
          <div class="column__body">
            ${byStatus[column.id].map(renderTaskCard).join('')}
            <div class="empty">Nenhuma task visivel com estes filtros.</div>
          </div>
        </section>
      `).join('')}
    </main>
    <script>
      const search = document.querySelector('#search');
      const area = document.querySelector('#area');
      const risk = document.querySelector('#risk');
      const kind = document.querySelector('#kind');
      const lifecycle = document.querySelector('#lifecycle');
      const servedByKanbanServer = location.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(location.hostname);
      const serverNote = document.querySelector('#server-note');
      let draggedCard = null;

      if (!servedByKanbanServer) {
        serverNote.style.display = 'block';
      }

      function applyFilters() {
        const query = search.value.trim().toLowerCase();
        const selectedArea = area.value;
        const selectedRisk = risk.value;
        const selectedKind = kind.value;
        const selectedLifecycle = lifecycle.value;

        document.querySelectorAll('.column').forEach((column) => {
          let visible = 0;

          column.querySelectorAll('.task-card').forEach((card) => {
            const matchesQuery = !query || card.dataset.title.includes(query);
            const matchesArea = !selectedArea || card.dataset.area === selectedArea;
            const matchesRisk = !selectedRisk || card.dataset.risk === selectedRisk;
            const matchesKind = !selectedKind || card.dataset.kind === selectedKind;
            const matchesLifecycle = !selectedLifecycle || card.dataset.lifecycle === selectedLifecycle;
            const show = matchesQuery && matchesArea && matchesRisk && matchesKind && matchesLifecycle;
            card.classList.toggle('is-hidden', !show);
            if (show) visible += 1;
          });

          column.querySelector('.empty').style.display = visible === 0 ? 'block' : 'none';
          column.querySelector('.count').textContent = visible;
        });
      }

      [search, area, risk, kind, lifecycle].forEach((control) => control.addEventListener('input', applyFilters));

      document.querySelectorAll('.task-card').forEach((card) => {
        card.addEventListener('dragstart', (event) => {
          draggedCard = card;
          card.classList.add('is-dragging');
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('application/json', JSON.stringify({
            file: card.dataset.file,
            from: card.dataset.status,
          }));
        });

        card.addEventListener('dragend', () => {
          card.classList.remove('is-dragging');
          draggedCard = null;
          document.querySelectorAll('.column').forEach((column) => column.classList.remove('is-drop-target'));
        });
      });

      document.querySelectorAll('.column').forEach((column) => {
        column.addEventListener('dragover', (event) => {
          event.preventDefault();
          column.classList.add('is-drop-target');
        });

        column.addEventListener('dragleave', () => {
          column.classList.remove('is-drop-target');
        });

        column.addEventListener('drop', async (event) => {
          event.preventDefault();
          column.classList.remove('is-drop-target');

          const payload = JSON.parse(event.dataTransfer.getData('application/json'));
          const to = column.dataset.column;
          if (!payload.file || !payload.from || payload.from === to) return;

          if (!servedByKanbanServer) {
            alert('Abra pelo servidor local para mover arquivos: node .ai/scripts/kanban-server.mjs');
            return;
          }

          if (draggedCard) {
            column.querySelector('.column__body').prepend(draggedCard);
            draggedCard.dataset.status = to;
          }

          const response = await fetch('/api/move-task', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ file: payload.file, from: payload.from, to }),
          });

          if (!response.ok) {
            alert('Nao foi possivel mover a task.');
            location.reload();
            return;
          }

          applyFilters();
        });
      });
    </script>
  </body>
</html>
`;
}

const tasks = await loadTasks();
await writeFile(outputFile, renderHtml(tasks), 'utf8');
console.log(`Kanban generated with ${tasks.length} tasks at ${path.relative(process.cwd(), outputFile)}`);
