import { Controller, Get, Header, Query } from '@nestjs/common';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

@Controller('test-ui')
export class TestUiController {
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderProjectsPage(): string {
    return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Marketing Service - Projects</title>
    <style>
      :root {
        --bg: #f4f7fb;
        --panel: #ffffff;
        --text: #121826;
        --muted: #5d687c;
        --border: #d8dfeb;
        --accent: #1d4fff;
        --accent-soft: #edf2ff;
        --shadow: 0 16px 40px rgba(15, 27, 58, 0.08);
        --danger: #b42318;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: linear-gradient(180deg, #f6f8fc 0%, #eef3f9 100%);
        color: var(--text);
        font: 15px/1.5 ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .wrap {
        max-width: 1180px;
        margin: 0 auto;
        padding: 24px;
        display: grid;
        gap: 16px;
      }
      .panel {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 20px;
        box-shadow: var(--shadow);
      }
      .hero, .content { padding: 24px 28px; }
      .hero-top, .project-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }
      h1 { margin: 0 0 8px; font-size: 34px; }
      h2 { margin: 0 0 12px; }
      p { margin: 0; color: var(--muted); }
      button, a.btn {
        appearance: none;
        border: 0;
        border-radius: 999px;
        padding: 12px 18px;
        background: var(--accent);
        color: white;
        font: inherit;
        font-weight: 800;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .btn.secondary {
        background: var(--accent-soft);
        color: var(--accent);
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }
      .stat {
        padding: 16px;
        border: 1px solid var(--border);
        border-radius: 16px;
        background: #fafcff;
      }
      .stat strong {
        display: block;
        font-size: 26px;
        line-height: 1.1;
        margin-bottom: 6px;
      }
      .projects {
        display: grid;
        gap: 14px;
      }
      .project-card {
        display: grid;
        gap: 14px;
        padding: 18px;
        border: 1px solid var(--border);
        border-radius: 18px;
        background: #fcfdff;
      }
      .project-top h3 {
        margin: 0 0 6px;
        font-size: 22px;
        line-height: 1.25;
      }
      .project-meta {
        color: var(--muted);
        font-size: 13px;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .chip {
        padding: 8px 10px;
        border-radius: 999px;
        background: #eef3ff;
        color: #2347a0;
        font-size: 12px;
        font-weight: 800;
      }
      .empty {
        padding: 28px;
        border: 1px dashed var(--border);
        border-radius: 18px;
        color: var(--muted);
        background: #fafcff;
      }
      .error {
        color: var(--danger);
        font-weight: 700;
        min-height: 24px;
      }
      pre {
        margin: 0;
        padding: 16px;
        border-radius: 16px;
        background: #101828;
        color: #eef2ff;
        min-height: 120px;
        overflow: auto;
        white-space: pre-wrap;
        overflow-wrap: break-word;
      }
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(9, 15, 28, 0.4);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }
      .modal-backdrop.open { display: flex; }
      .modal {
        width: min(560px, 100%);
        background: #fff;
        border: 1px solid var(--border);
        border-radius: 24px;
        box-shadow: 0 24px 60px rgba(9, 15, 28, 0.22);
        padding: 24px;
        display: grid;
        gap: 16px;
      }
      label {
        display: grid;
        gap: 6px;
        color: var(--muted);
        font-weight: 700;
      }
      input {
        width: 100%;
        padding: 12px 14px;
        border: 1px solid var(--border);
        border-radius: 14px;
        font: inherit;
        color: var(--text);
        background: #fff;
      }
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        flex-wrap: wrap;
      }
      @media (max-width: 760px) {
        .hero-top, .project-top { flex-direction: column; }
        .stats { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="panel hero">
        <div class="hero-top">
          <div>
            <h1>Projects</h1>
            <p>Главная страница теперь начинается с проектов. Внутри проекта уже живут статьи и весь editorial workflow.</p>
          </div>
          <button onclick="openCreateProjectModal()">New project</button>
        </div>
      </section>

      <section class="panel content">
        <div class="stats">
          <div class="stat"><strong id="projectCount">0</strong><span>Projects</span></div>
          <div class="stat"><strong id="articlesCount">0</strong><span>Articles total</span></div>
          <div class="stat"><strong id="activeCount">0</strong><span>Projects with articles</span></div>
        </div>
      </section>

      <section class="panel content">
        <h2>Available projects</h2>
        <div id="error" class="error"></div>
        <div id="projects" class="projects"></div>
      </section>

      <section class="panel content">
        <h2>Output</h2>
        <pre id="output">Ready.</pre>
      </section>
    </div>

    <div id="projectModalBackdrop" class="modal-backdrop" onclick="closeCreateProjectModal(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <div>
          <h2 style="margin:0 0 8px;">Create project</h2>
          <p>Нужно только название. Project ID backend сгенерит сам.</p>
        </div>
        <label>
          Project name
          <input id="projectName" placeholder="Например, Reinforce Content" />
        </label>
        <div id="modalError" class="error"></div>
        <div class="modal-actions">
          <button class="btn secondary" onclick="closeCreateProjectModal()">Cancel</button>
          <button id="createProjectBtn" onclick="createProject()">Create project</button>
        </div>
      </div>
    </div>

    <script>
      let currentProjects = [];
      let currentArticleCounts = new Map();

      function escapeHtml(value) {
        return String(value ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      function renderOutput(data) {
        document.getElementById('output').textContent =
          typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      }

      async function request(url, options) {
        const response = await fetch(url, options);
        const payload = await response.json();
        renderOutput(payload);
        if (!response.ok) {
          throw new Error(payload?.message || 'Request failed');
        }
        return payload;
      }

      function formatDate(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(date);
      }

      function openCreateProjectModal() {
        document.getElementById('projectModalBackdrop').classList.add('open');
        document.getElementById('modalError').textContent = '';
        document.getElementById('projectName').value = '';
        setTimeout(() => document.getElementById('projectName').focus(), 0);
      }

      function closeCreateProjectModal(event) {
        if (event && event.target !== event.currentTarget) return;
        document.getElementById('projectModalBackdrop').classList.remove('open');
      }

      async function createProject() {
        const name = document.getElementById('projectName').value.trim();
        const error = document.getElementById('modalError');
        const button = document.getElementById('createProjectBtn');
        error.textContent = '';

        if (!name) {
          error.textContent = 'Project name is required.';
          return;
        }

        button.disabled = true;
        try {
          const created = await request('/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
          });

          closeCreateProjectModal();
          window.location.href = '/test-ui/project?projectId=' + encodeURIComponent(created.id);
        } catch (err) {
          error.textContent = err instanceof Error ? err.message : String(err);
        } finally {
          button.disabled = false;
        }
      }

      async function loadProjects() {
        document.getElementById('error').textContent = '';
        const projects = await request('/projects');
        currentProjects = Array.isArray(projects) ? projects : [];

        const articleLists = await Promise.all(
          currentProjects.map((project) =>
            request('/articles?projectId=' + encodeURIComponent(project.id)).catch(() => []),
          ),
        );

        currentArticleCounts = new Map(
          currentProjects.map((project, index) => [project.id, Array.isArray(articleLists[index]) ? articleLists[index].length : 0]),
        );

        renderProjects();
      }

      function renderProjects() {
        const root = document.getElementById('projects');
        const totalArticles = Array.from(currentArticleCounts.values()).reduce((sum, count) => sum + count, 0);
        const activeProjects = Array.from(currentArticleCounts.values()).filter((count) => count > 0).length;

        document.getElementById('projectCount').textContent = String(currentProjects.length);
        document.getElementById('articlesCount').textContent = String(totalArticles);
        document.getElementById('activeCount').textContent = String(activeProjects);

        if (!currentProjects.length) {
          root.innerHTML = '<div class="empty">Проектов пока нет. Нажми <strong>New project</strong> и создай первый.</div>';
          return;
        }

        root.innerHTML = currentProjects.map((project) => {
          const articleCount = currentArticleCounts.get(project.id) || 0;
          return \`
            <article class="project-card">
              <div class="project-top">
                <div>
                  <h3>\${escapeHtml(project.name)}</h3>
                  <div class="project-meta">Project ID: \${escapeHtml(project.id)} · Updated: \${escapeHtml(formatDate(project.updatedAt))}</div>
                </div>
                <a class="btn" href="/test-ui/project?projectId=\${escapeHtml(project.id)}">Open project</a>
              </div>
              <div class="chips">
                <span class="chip">Articles: \${escapeHtml(String(articleCount))}</span>
                <span class="chip">Created: \${escapeHtml(formatDate(project.createdAt))}</span>
              </div>
            </article>
          \`;
        }).join('');
      }

      loadProjects().catch((error) => {
        document.getElementById('error').textContent = error instanceof Error ? error.message : String(error);
      });
    </script>
  </body>
</html>`;
  }

  @Get('project')
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderProjectPage(@Query('projectId') projectId = 'project_123'): string {
    return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Marketing Service - Project</title>
    <style>
      :root {
        --bg: #f4f7fb;
        --panel: #ffffff;
        --text: #121826;
        --muted: #5d687c;
        --border: #d8dfeb;
        --accent: #1d4fff;
        --accent-soft: #edf2ff;
        --shadow: 0 16px 40px rgba(15, 27, 58, 0.08);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: linear-gradient(180deg, #f6f8fc 0%, #eef3f9 100%);
        color: var(--text);
        font: 15px/1.5 ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .wrap {
        max-width: 1180px;
        margin: 0 auto;
        padding: 24px;
        display: grid;
        gap: 16px;
      }
      .panel {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 20px;
        box-shadow: var(--shadow);
      }
      .hero, .content { padding: 24px 28px; }
      .hero-top, .article-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }
      h1 { margin: 0 0 8px; font-size: 34px; }
      h2 { margin: 0 0 12px; }
      p { margin: 0; color: var(--muted); }
      label {
        display: grid;
        gap: 6px;
        color: var(--muted);
        font-weight: 700;
      }
      input {
        width: 240px;
        padding: 12px 14px;
        border: 1px solid var(--border);
        border-radius: 14px;
        font: inherit;
        color: var(--text);
        background: #fff;
      }
      button, a.btn {
        appearance: none;
        border: 0;
        border-radius: 999px;
        padding: 12px 18px;
        background: var(--accent);
        color: white;
        font: inherit;
        font-weight: 800;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .btn.secondary {
        background: var(--accent-soft);
        color: var(--accent);
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }
      .week-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 16px;
      }
      .week-title {
        display: grid;
        gap: 4px;
      }
      .week-title strong {
        font-size: 20px;
        line-height: 1.2;
      }
      .week-nav {
        display: flex;
        gap: 10px;
      }
      .week-nav button {
        min-width: 48px;
        padding: 12px 0;
      }
      .week-board {
        display: grid;
        grid-template-columns: 180px repeat(7, minmax(0, 1fr));
        gap: 10px;
        align-items: start;
      }
      .week-corner,
      .week-column-head,
      .week-row-head,
      .week-cell {
        border: 1px solid var(--border);
        border-radius: 18px;
        background: linear-gradient(180deg, #fcfdff 0%, #f6f9ff 100%);
      }
      .week-corner {
        min-height: 88px;
        padding: 16px;
        display: flex;
        align-items: end;
        color: var(--muted);
        font-weight: 800;
      }
      .week-column-head {
        min-height: 88px;
        padding: 14px 12px;
        display: grid;
        align-content: space-between;
      }
      .week-column-head.is-today {
        border-color: #b7c8ff;
        background: linear-gradient(180deg, #eef3ff 0%, #e4ecff 100%);
        box-shadow: inset 0 0 0 1px rgba(29, 79, 255, 0.12);
      }
      .week-column-head small {
        color: var(--muted);
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .week-column-head strong {
        font-size: 30px;
        line-height: 1;
      }
      .week-column-head span {
        color: var(--muted);
        font-size: 12px;
        font-weight: 700;
      }
      .week-row-head {
        min-height: 116px;
        padding: 16px;
        display: grid;
        align-content: center;
        gap: 6px;
      }
      .week-row-head strong {
        font-size: 18px;
        line-height: 1.2;
      }
      .week-row-head span {
        color: var(--muted);
        font-size: 12px;
        font-weight: 700;
      }
      .week-cell {
        height: 116px;
        padding: 8px;
        display: grid;
        align-content: start;
        gap: 4px;
        overflow: hidden;
        text-decoration: none;
        color: inherit;
        transition: transform 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
      }
      .week-cell.is-today {
        border-color: #c9d5ff;
      }
      .week-cell:hover {
        border-color: #b7c8ff;
        box-shadow: 0 10px 22px rgba(29, 79, 255, 0.08);
        transform: translateY(-1px);
      }
      .week-cell-scroll {
        display: grid;
        align-content: start;
        gap: 4px;
        overflow: auto;
        min-height: 0;
      }
      .week-cell-placeholder {
        color: #8b97ad;
        font-size: 12px;
        font-weight: 700;
      }
      .week-publication-more {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 5px 7px;
        border-radius: 10px;
        background: #f3f6fb;
        border: 1px dashed #cfd8e8;
        color: #5d687c;
        font-size: 10px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      .week-publication {
        --pub-bg: #eaf0ff;
        --pub-border: #cfdbff;
        --pub-text: #173b93;
        --pub-time: #35507d;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 5px 7px;
        min-width: 0;
        border-radius: 10px;
        background: var(--pub-bg);
        border: 1px solid var(--pub-border);
      }
      .week-publication.is-published {
        opacity: 0.42;
        filter: grayscale(0.15);
      }
      .week-publication-language {
        color: var(--pub-text);
        font-size: 10px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        white-space: nowrap;
      }
      .week-publication-time {
        color: var(--pub-time);
        font-size: 10px;
        font-weight: 800;
        white-space: nowrap;
      }
      .stat {
        padding: 16px;
        border: 1px solid var(--border);
        border-radius: 16px;
        background: #fafcff;
      }
      .stat strong {
        display: block;
        font-size: 26px;
        line-height: 1.1;
        margin-bottom: 6px;
      }
      .cards {
        display: grid;
        gap: 14px;
      }
      .article-card {
        display: grid;
        gap: 14px;
        padding: 18px;
        border: 1px solid var(--border);
        border-radius: 18px;
        background: #fcfdff;
      }
      .article-flag {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border-radius: 999px;
        border: 1px solid var(--flag-border, #cfdbff);
        background: var(--flag-bg, #eaf0ff);
        color: var(--flag-text, #173b93);
        font-size: 12px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      .article-flag-dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: currentColor;
        flex: 0 0 auto;
      }
      .article-top h3 {
        margin: 0 0 6px;
        font-size: 22px;
        line-height: 1.25;
      }
      .article-meta {
        color: var(--muted);
        font-size: 13px;
      }
      .article-excerpt {
        color: var(--muted);
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .chip {
        padding: 8px 10px;
        border-radius: 999px;
        background: #eef3ff;
        color: #2347a0;
        font-size: 12px;
        font-weight: 800;
      }
      .card-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .empty {
        padding: 28px;
        border: 1px dashed var(--border);
        border-radius: 18px;
        color: var(--muted);
        background: #fafcff;
      }
      .error {
        color: #b42318;
        font-weight: 700;
        min-height: 24px;
      }
      pre {
        margin: 0;
        padding: 16px;
        border-radius: 16px;
        background: #101828;
        color: #eef2ff;
        min-height: 120px;
        overflow: auto;
        white-space: pre-wrap;
        overflow-wrap: break-word;
      }
      @media (max-width: 840px) {
        .week-board {
          grid-template-columns: 140px repeat(7, minmax(120px, 1fr));
          overflow-x: auto;
          padding-bottom: 4px;
        }
        .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      @media (max-width: 640px) {
        .hero-top, .article-top { flex-direction: column; }
        .week-header {
          flex-direction: column;
          align-items: flex-start;
        }
        .stats { grid-template-columns: 1fr; }
        input { width: 100%; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="panel hero">
        <div class="hero-top">
          <div>
            <h1>Project Dashboard</h1>
            <p>Здесь живут все статьи проекта. Можно продолжить уже созданный workflow или завести новый article.</p>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <a class="btn secondary" href="/test-ui">All projects</a>
            <a class="btn" id="newArticleBtn" href="/test-ui/new?projectId=${escapeHtml(projectId)}">New article</a>
          </div>
        </div>
      </section>

      <section class="panel content">
        <div class="week-header">
          <div class="week-title">
            <strong>Current Week</strong>
            <span id="weekRange" style="color:var(--muted);font-weight:700;"></span>
          </div>
          <div class="week-nav">
            <button class="btn secondary" onclick="shiftWeek(-1)" aria-label="Previous week">←</button>
            <button class="btn secondary" onclick="shiftWeek(1)" aria-label="Next week">→</button>
          </div>
        </div>
        <div id="weekGrid" class="week-board"></div>
      </section>

      <section class="panel content">
        <div class="stats">
          <div class="stat"><strong id="articleCount">0</strong><span>Articles</span></div>
          <div class="stat"><strong id="draftCount">0</strong><span>Drafts</span></div>
          <div class="stat"><strong id="approvedAdaptationCount">0</strong><span>Approved adaptations</span></div>
          <div class="stat"><strong id="approvedTranslationCount">0</strong><span>Approved translations</span></div>
        </div>
      </section>

      <section class="panel content">
        <h2>Articles</h2>
        <div id="error" class="error"></div>
        <div id="articles" class="cards"></div>
      </section>

      <section class="panel content">
        <h2>Output</h2>
        <pre id="output">Ready.</pre>
      </section>
    </div>

    <script>
      const currentProjectId = ${JSON.stringify(projectId)};
      const weekDayLabels = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
      const monthLabels = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
      const adaptationChannels = [
        { id: 'channel_telegram', label: 'Telegram', hint: 'Adaptation' },
        { id: 'channel_x', label: 'X', hint: 'Adaptation' },
        { id: 'channel_discord', label: 'Discord', hint: 'Adaptation' },
      ];
      const articleColorThemes = [
        { bg: '#eaf0ff', border: '#cfdbff', text: '#173b93', time: '#35507d' },
        { bg: '#ebfff4', border: '#c9f0d9', text: '#117a43', time: '#2e6a4a' },
        { bg: '#fff3e8', border: '#ffd7b3', text: '#b54708', time: '#8f4a14' },
        { bg: '#f5edff', border: '#dcc9ff', text: '#6f42c1', time: '#6b4ea0' },
        { bg: '#e8fbff', border: '#bdebf5', text: '#0c6b7a', time: '#2d6670' },
        { bg: '#fff0f5', border: '#ffc9dc', text: '#b42363', time: '#8f3f62' },
      ];
      let currentWeekStart = startOfWeek(new Date());
      let currentProjectArticles = [];
      let currentPublicationsByArticle = new Map();

      function escapeHtml(value) {
        return String(value ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      function renderOutput(data) {
        document.getElementById('output').textContent =
          typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      }

      async function request(url) {
        const response = await fetch(url);
        const payload = await response.json();
        renderOutput(payload);

        if (!response.ok) {
          throw new Error(payload?.message || 'Request failed');
        }

        return payload;
      }

      function formatDate(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(date);
      }

      function formatTime(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(date);
      }

      function languageLabel(language) {
        const normalized = String(language || '').toLowerCase();
        if (normalized === 'ru') return 'Русский';
        if (normalized === 'en') return 'Английский';
        if (normalized === 'es') return 'Испанский';
        return normalized.toUpperCase();
      }

      function languageCode(language) {
        return String(language || '').toUpperCase();
      }

      function hashString(value) {
        let hash = 0;
        const input = String(value || '');
        for (let index = 0; index < input.length; index += 1) {
          hash = ((hash << 5) - hash) + input.charCodeAt(index);
          hash |= 0;
        }
        return Math.abs(hash);
      }

      function articleTheme(articleId) {
        return articleColorThemes[hashString(articleId) % articleColorThemes.length];
      }

      function startOfWeek(date) {
        const value = new Date(date);
        value.setHours(0, 0, 0, 0);
        const day = value.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        value.setDate(value.getDate() + diff);
        return value;
      }

      function addDays(date, days) {
        const value = new Date(date);
        value.setDate(value.getDate() + days);
        return value;
      }

      function dateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
      }

      function isSameDay(a, b) {
        return a.getFullYear() === b.getFullYear() &&
          a.getMonth() === b.getMonth() &&
          a.getDate() === b.getDate();
      }

      function formatWeekRange(start) {
        const end = addDays(start, 6);
        const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

        if (sameMonth) {
          return start.getDate() + '–' + end.getDate() + ' ' + monthLabels[start.getMonth()];
        }

        return start.getDate() + ' ' + monthLabels[start.getMonth()] + ' – ' +
          end.getDate() + ' ' + monthLabels[end.getMonth()];
      }

      function buildDayChannelUrl(channelId, dayDate) {
        return '/test-ui/day?projectId=' + encodeURIComponent(currentProjectId) +
          '&channelId=' + encodeURIComponent(channelId) +
          '&date=' + encodeURIComponent(dateKey(dayDate));
      }

      function renderWeekDashboard() {
        const root = document.getElementById('weekGrid');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        document.getElementById('weekRange').textContent = formatWeekRange(currentWeekStart);
        const headers = Array.from({ length: 7 }, (_, index) => {
          const dayDate = addDays(currentWeekStart, index);
          const isToday = isSameDay(dayDate, today);
          return \`
            <article class="week-column-head \${isToday ? 'is-today' : ''}">
              <small>\${weekDayLabels[index]}</small>
              <strong>\${dayDate.getDate()}</strong>
              <span>\${monthLabels[dayDate.getMonth()]}</span>
            </article>
          \`;
        }).join('');

        const rows = adaptationChannels.map((channel) => {
          const cells = Array.from({ length: 7 }, (_, index) => {
            const dayDate = addDays(currentWeekStart, index);
            const isToday = isSameDay(dayDate, today);
            const publications = plannedPublicationsForCell(channel.id, dayDate);
            const visiblePublications = publications.length > 3 ? publications.slice(0, 2) : publications;
            const hiddenCount = publications.length > 3 ? publications.length - 2 : 0;
            const content = publications.length
              ? visiblePublications.map((item) =>
                  '<div class="week-publication ' + (item.isPublished ? 'is-published' : '') + '" style="' +
                    '--pub-bg:' + item.theme.bg + ';' +
                    '--pub-border:' + item.theme.border + ';' +
                    '--pub-text:' + item.theme.text + ';' +
                    '--pub-time:' + item.theme.time + ';' +
                  '">' +
                      '<span class="week-publication-language">' + escapeHtml(languageCode(item.targetLanguage)) + '</span>' +
                      '<span class="week-publication-time">' + escapeHtml(formatTime(item.publishAt)) + '</span>' +
                  '</div>'
                ).join('') +
                (hiddenCount > 0
                  ? '<div class="week-publication-more">ещё ' + escapeHtml(String(hiddenCount)) + '</div>'
                  : '')
              : '<span class="week-cell-placeholder">—</span>';

            return \`
              <a class="week-cell \${isToday ? 'is-today' : ''}" href="\${buildDayChannelUrl(channel.id, dayDate)}">
                <div class="week-cell-scroll">\${content}</div>
              </a>
            \`;
          }).join('');

          return \`
            <div class="week-row-head">
              <strong>\${channel.label}</strong>
              <span>\${channel.hint}</span>
            </div>
            \${cells}
          \`;
        }).join('');

        root.innerHTML = '<div class="week-corner">Channels</div>' + headers + rows;
      }

      function plannedPublicationsForCell(channelId, dayDate) {
        const items = [];

        for (const article of currentProjectArticles) {
          const intents = Array.isArray(article?.releasePlanSnapshot?.publicationIntents)
            ? article.releasePlanSnapshot.publicationIntents
            : [];
          const intent = intents.find((item) => item && item.channelId === channelId);
          const plans = Array.isArray(intent?.translations) ? intent.translations : [];

          for (const plan of plans) {
            const publishAt = plan?.publishNow
              ? new Date()
              : (plan?.scheduledAt ? new Date(plan.scheduledAt) : null);

            if (!publishAt || Number.isNaN(publishAt.getTime())) {
              continue;
            }

            if (!isSameDay(publishAt, dayDate)) {
              continue;
            }

            items.push({
              articleId: article.id,
              channelId,
              targetLanguage: plan.targetLanguage,
              publishAt,
              theme: articleTheme(article.id),
              isPublished: publicationStateFor(article.id, channelId, plan.targetLanguage) === 'published',
            });
          }
        }

        items.sort((a, b) => a.publishAt.getTime() - b.publishAt.getTime());
        return items;
      }

      function publicationStateFor(articleId, channelId, targetLanguage) {
        const publications = currentPublicationsByArticle.get(articleId) || [];
        const match = publications.find((item) =>
          item &&
          item.channelId === channelId &&
          String(item.targetLanguage || '').toLowerCase() === String(targetLanguage || '').toLowerCase(),
        );

        return match?.status || null;
      }

      function shiftWeek(direction) {
        currentWeekStart = addDays(currentWeekStart, direction * 7);
        renderWeekDashboard();
      }

      function nextStepUrl(article) {
        if (article.approvedTranslationCount > 0) {
          return '/test-ui/publishing?articleId=' + encodeURIComponent(article.id);
        }

        if (article.approvedAdaptationCount > 0) {
          return '/test-ui/translations?articleId=' + encodeURIComponent(article.id);
        }

        return '/test-ui/review?articleId=' + encodeURIComponent(article.id);
      }

      function renderArticles(items) {
        const root = document.getElementById('articles');

        if (!Array.isArray(items) || items.length === 0) {
          root.innerHTML = '<div class="empty">У проекта пока нет статей. Нажми <strong>New article</strong> и запусти первый workflow.</div>';
          document.getElementById('articleCount').textContent = '0';
          document.getElementById('draftCount').textContent = '0';
          document.getElementById('approvedAdaptationCount').textContent = '0';
          document.getElementById('approvedTranslationCount').textContent = '0';
          return;
        }

        document.getElementById('articleCount').textContent = String(items.length);
        document.getElementById('draftCount').textContent = String(items.filter((item) => item.status === 'draft').length);
        document.getElementById('approvedAdaptationCount').textContent = String(items.reduce((sum, item) => sum + item.approvedAdaptationCount, 0));
        document.getElementById('approvedTranslationCount').textContent = String(items.reduce((sum, item) => sum + item.approvedTranslationCount, 0));

        root.innerHTML = items.map((article) => \`
          <article class="article-card">
            <div class="article-top">
              <div>
                <div class="article-flag" style="
                  --flag-bg: \${escapeHtml(articleTheme(article.id).bg)};
                  --flag-border: \${escapeHtml(articleTheme(article.id).border)};
                  --flag-text: \${escapeHtml(articleTheme(article.id).text)};
                ">
                  <span class="article-flag-dot"></span>
                  <span>Article Color</span>
                </div>
                <h3>\${escapeHtml(article.originalTitle)}</h3>
                <div class="article-meta">Article ID: \${escapeHtml(article.id)} · Updated: \${escapeHtml(formatDate(article.updatedAt))}</div>
              </div>
              <a class="btn" href="\${escapeHtml(nextStepUrl(article))}">Open workflow</a>
            </div>
            <div class="article-excerpt">\${escapeHtml(article.originalExcerpt)}</div>
            <div class="chips">
              <span class="chip">Language: \${escapeHtml(String(article.originalLanguage).toUpperCase())}</span>
              <span class="chip">Adaptations: \${escapeHtml(String(article.adaptationCount))}</span>
              <span class="chip">Approved adaptations: \${escapeHtml(String(article.approvedAdaptationCount))}</span>
              <span class="chip">Translations: \${escapeHtml(String(article.translationCount))}</span>
              <span class="chip">Approved translations: \${escapeHtml(String(article.approvedTranslationCount))}</span>
              <span class="chip">Versions: \${escapeHtml(String(article.versionCount))}</span>
            </div>
            <div class="card-actions">
              <a class="btn secondary" href="/articles/\${escapeHtml(article.id)}" target="_blank" rel="noreferrer">Open JSON</a>
              <a class="btn secondary" href="/test-ui/new?projectId=\${escapeHtml(article.projectId)}">New article for this project</a>
            </div>
          </article>
        \`).join('');
      }

      async function loadProject() {
        document.getElementById('error').textContent = '';
        document.getElementById('newArticleBtn').href = '/test-ui/new?projectId=' + encodeURIComponent(currentProjectId);

        try {
          const articles = await request('/articles?projectId=' + encodeURIComponent(currentProjectId));
          currentProjectArticles = Array.isArray(articles) ? articles : [];
          const publicationLists = await Promise.all(
            currentProjectArticles.map((article) =>
              request('/publishing/articles/' + encodeURIComponent(article.id)).catch(() => []),
            ),
          );
          currentPublicationsByArticle = new Map(
            currentProjectArticles.map((article, index) => [
              article.id,
              Array.isArray(publicationLists[index]) ? publicationLists[index] : [],
            ]),
          );
          renderArticles(articles);
          renderWeekDashboard();
        } catch (error) {
          document.getElementById('error').textContent = error instanceof Error ? error.message : String(error);
        }
      }

      loadProject().catch((error) => {
        document.getElementById('error').textContent = error instanceof Error ? error.message : String(error);
      });
      renderWeekDashboard();
    </script>
  </body>
</html>`;
  }

  @Get('day')
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderDayChannelPage(
    @Query('projectId') projectId = 'project_123',
    @Query('channelId') channelId = 'channel_telegram',
    @Query('date') date = '',
  ): string {
    return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Marketing Service - Day Schedule</title>
    <style>
      :root {
        --bg: #f4f7fb;
        --panel: #ffffff;
        --text: #121826;
        --muted: #5d687c;
        --border: #d8dfeb;
        --accent: #1d4fff;
        --accent-soft: #edf2ff;
        --shadow: 0 16px 40px rgba(15, 27, 58, 0.08);
        --danger: #b42318;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: linear-gradient(180deg, #f6f8fc 0%, #eef3f9 100%);
        color: var(--text);
        font: 15px/1.5 ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .wrap {
        max-width: 1180px;
        margin: 0 auto;
        padding: 24px;
        display: grid;
        gap: 16px;
      }
      .panel {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 20px;
        box-shadow: var(--shadow);
      }
      .hero, .content {
        padding: 24px 28px;
      }
      .hero-top, .layout {
        display: grid;
        gap: 16px;
      }
      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }
      h1 {
        margin: 0 0 8px;
        font-size: 34px;
      }
      h2 {
        margin: 0 0 10px;
      }
      p {
        margin: 0;
        color: var(--muted);
      }
      a.btn, button {
        appearance: none;
        border: 0;
        border-radius: 999px;
        padding: 12px 18px;
        background: var(--accent);
        color: white;
        font: inherit;
        font-weight: 800;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .btn.secondary {
        background: var(--accent-soft);
        color: var(--accent);
      }
      .summary {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }
      .stat {
        padding: 16px;
        border: 1px solid var(--border);
        border-radius: 16px;
        background: #fafcff;
      }
      .stat strong {
        display: block;
        font-size: 24px;
        line-height: 1.1;
        margin-bottom: 6px;
      }
      .grid {
        display: grid;
        grid-template-columns: minmax(0, 1.4fr) 320px;
        gap: 16px;
        align-items: start;
      }
      .posts {
        display: grid;
        gap: 14px;
      }
      .post-card {
        display: grid;
        gap: 14px;
        padding: 18px;
        border: 1px solid var(--border);
        border-radius: 18px;
        background: #fcfdff;
      }
      .post-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }
      .post-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      .badge.lang {
        background: var(--badge-bg, #eaf0ff);
        border: 1px solid var(--badge-border, #cfdbff);
        color: var(--badge-text, #173b93);
      }
      .badge.status {
        background: #f3f6fb;
        border: 1px solid #d8dfeb;
        color: #35507d;
      }
      .badge.status.is-published {
        background: #eefbf3;
        border-color: #c8edd8;
        color: #117a43;
      }
      .badge.status.is-scheduled {
        background: #f7f8fe;
        border-color: #d7defa;
        color: #35507d;
      }
      .badge.status.is-publishing {
        background: #fff8e8;
        border-color: #ffe1a6;
        color: #b54708;
      }
      .badge.status.is-failed {
        background: #fff3f1;
        border-color: #f6c7c0;
        color: #b42318;
      }
      .post-title {
        margin: 0;
        font-size: 22px;
        line-height: 1.25;
      }
      .post-copy {
        color: var(--muted);
      }
      .post-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .post-preview {
        padding: 14px 16px;
        border-radius: 16px;
        border: 1px solid var(--border);
        background: #fff;
        color: #23314e;
        white-space: pre-wrap;
        overflow-wrap: break-word;
      }
      .sidebar {
        position: sticky;
        top: 24px;
        display: grid;
        gap: 12px;
      }
      .info-list {
        display: grid;
        gap: 10px;
      }
      .info-row {
        display: grid;
        gap: 4px;
      }
      .info-row span {
        color: var(--muted);
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .info-row strong {
        font-size: 18px;
        line-height: 1.3;
      }
      .empty {
        padding: 28px;
        border: 1px dashed var(--border);
        border-radius: 18px;
        color: var(--muted);
        background: #fafcff;
      }
      .error {
        color: var(--danger);
        font-weight: 700;
        min-height: 24px;
      }
      button[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }
      pre {
        margin: 0;
        padding: 16px;
        border-radius: 16px;
        background: #101828;
        color: #eef2ff;
        min-height: 120px;
        overflow: auto;
        white-space: pre-wrap;
        overflow-wrap: break-word;
      }
      @media (max-width: 960px) {
        .grid {
          grid-template-columns: 1fr;
        }
        .sidebar {
          position: static;
        }
        .summary {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 640px) {
        .summary {
          grid-template-columns: 1fr;
        }
        .topbar, .post-head {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="panel hero">
        <div class="hero-top">
          <div class="topbar">
            <a class="btn secondary" href="/test-ui/project?projectId=${escapeHtml(projectId)}">← Back to project dashboard</a>
            <a class="btn secondary" href="/test-ui/new?projectId=${escapeHtml(projectId)}">New article</a>
          </div>
          <div>
            <h1>Публикации за день</h1>
            <p>Отдельный экран для конкретного дня и соцсети. Здесь показаны все посты, которые должны выйти в этот день по выбранному каналу.</p>
          </div>
        </div>
      </section>

      <section class="panel content">
        <div class="summary">
          <div class="stat"><strong id="plannedCount">0</strong><span>Публикаций</span></div>
          <div class="stat"><strong id="publishedCount">0</strong><span>Опубликовано</span></div>
          <div class="stat"><strong id="scheduledCount">0</strong><span>Запланировано</span></div>
          <div class="stat"><strong id="failedCount">0</strong><span>Ошибок</span></div>
        </div>
      </section>

      <div class="grid">
        <section class="panel content">
          <h2 id="sectionTitle">Загрузка...</h2>
          <div id="error" class="error"></div>
          <div id="posts" class="posts"></div>
        </section>

        <aside class="panel content sidebar">
          <div class="info-list">
            <div class="info-row">
              <span>Project ID</span>
              <strong id="projectValue">${escapeHtml(projectId)}</strong>
            </div>
            <div class="info-row">
              <span>Канал</span>
              <strong id="channelValue">—</strong>
            </div>
            <div class="info-row">
              <span>День</span>
              <strong id="dayValue">—</strong>
            </div>
          </div>
          <button class="btn secondary" onclick="loadDaySchedule()">Refresh</button>
          <pre id="output">Ready.</pre>
        </aside>
      </div>
    </div>

    <script>
      const projectId = ${JSON.stringify(projectId)};
      const channelId = ${JSON.stringify(channelId)};
      const dateKey = ${JSON.stringify(date)};
      const adaptationChannels = [
        { id: 'channel_telegram', label: 'Telegram' },
        { id: 'channel_x', label: 'X' },
        { id: 'channel_discord', label: 'Discord' },
      ];
      const articleColorThemes = [
        { bg: '#eaf0ff', border: '#cfdbff', text: '#173b93', time: '#35507d' },
        { bg: '#ebfff4', border: '#c9f0d9', text: '#117a43', time: '#2e6a4a' },
        { bg: '#fff3e8', border: '#ffd7b3', text: '#b54708', time: '#8f4a14' },
        { bg: '#f5edff', border: '#dcc9ff', text: '#6f42c1', time: '#6b4ea0' },
        { bg: '#e8fbff', border: '#bdebf5', text: '#0c6b7a', time: '#2d6670' },
        { bg: '#fff0f5', border: '#ffc9dc', text: '#b42363', time: '#8f3f62' },
      ];
      let currentPosts = [];

      function escapeHtml(value) {
        return String(value ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      function hashString(value) {
        let hash = 0;
        const input = String(value || '');
        for (let index = 0; index < input.length; index += 1) {
          hash = ((hash << 5) - hash) + input.charCodeAt(index);
          hash |= 0;
        }
        return Math.abs(hash);
      }

      function articleTheme(articleId) {
        return articleColorThemes[hashString(articleId) % articleColorThemes.length];
      }

      function parseDateKey(value) {
        if (!value) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return today;
        }
        const [year, month, day] = String(value).split('-').map(Number);
        const parsed = new Date(year, (month || 1) - 1, day || 1);
        parsed.setHours(0, 0, 0, 0);
        return parsed;
      }

      function isSameDay(a, b) {
        return a.getFullYear() === b.getFullYear() &&
          a.getMonth() === b.getMonth() &&
          a.getDate() === b.getDate();
      }

      function formatDate(value) {
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(date);
      }

      function formatDateTime(value) {
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(date);
      }

      function formatTime(value) {
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(date);
      }

      function languageLabel(language) {
        const normalized = String(language || '').toLowerCase();
        if (normalized === 'ru') return 'Русский';
        if (normalized === 'en') return 'Английский';
        if (normalized === 'es') return 'Испанский';
        return normalized.toUpperCase();
      }

      function channelLabel(channel) {
        return adaptationChannels.find((item) => item.id === channel)?.label || channel;
      }

      function previewStatus(publication, publishAt) {
        if (!publication) {
          return {
            label: 'Будет опубликовано ' + formatDateTime(publishAt),
            className: 'is-scheduled',
          };
        }

        if (publication.status === 'published') {
          return {
            label: 'Опубликовано' + (publication.publishedAt ? ' · ' + formatDateTime(publication.publishedAt) : ''),
            className: 'is-published',
          };
        }

        if (publication.status === 'publishing') {
          return {
            label: 'Публикуем сейчас',
            className: 'is-publishing',
          };
        }

        if (publication.status === 'failed') {
          return {
            label: 'Ошибка публикации',
            className: 'is-failed',
          };
        }

        return {
          label: 'Будет опубликовано ' + formatDateTime(publication.publishAt || publishAt),
          className: 'is-scheduled',
        };
      }

      function renderOutput(data) {
        document.getElementById('output').textContent =
          typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      }

      async function request(url) {
        const response = await fetch(url);
        const payload = await response.json();
        renderOutput(payload);

        if (!response.ok) {
          throw new Error(payload?.message || 'Request failed');
        }

        return payload;
      }

      async function post(url, body) {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: body ? JSON.stringify(body) : '{}',
        });
        const payload = await response.json();
        renderOutput(payload);

        if (!response.ok) {
          throw new Error(payload?.message || 'Request failed');
        }

        return payload;
      }

      function collectPosts(articles, publicationMap, selectedDate) {
        const items = [];

        for (const article of articles) {
          const intents = Array.isArray(article?.releasePlanSnapshot?.publicationIntents)
            ? article.releasePlanSnapshot.publicationIntents
            : [];
          const intent = intents.find((item) => item && item.channelId === channelId);
          const plans = Array.isArray(intent?.translations) ? intent.translations : [];
          const publications = publicationMap.get(article.id) || [];

          for (const plan of plans) {
            const publishAt = plan?.publishNow
              ? new Date()
              : (plan?.scheduledAt ? new Date(plan.scheduledAt) : null);

            if (!publishAt || Number.isNaN(publishAt.getTime())) {
              continue;
            }

            if (!isSameDay(publishAt, selectedDate)) {
              continue;
            }

            const publication = publications.find((item) =>
              item &&
              item.channelId === channelId &&
              String(item.targetLanguage || '').toLowerCase() === String(plan.targetLanguage || '').toLowerCase(),
            ) || null;

            items.push({
              articleId: article.id,
              articleTitle: article.originalTitle || 'Без названия',
              articleExcerpt: article.originalExcerpt || '',
              adaptationCount: article.adaptationCount || 0,
              targetLanguage: plan.targetLanguage,
              publishAt,
              publication,
              status: previewStatus(publication, publishAt),
              theme: articleTheme(article.id),
            });
          }
        }

        items.sort((a, b) => a.publishAt.getTime() - b.publishAt.getTime());
        return items;
      }

      function renderStats(items) {
        document.getElementById('plannedCount').textContent = String(items.length);
        document.getElementById('publishedCount').textContent = String(items.filter((item) => item.publication?.status === 'published').length);
        document.getElementById('scheduledCount').textContent = String(items.filter((item) => !item.publication || item.publication.status === 'scheduled').length);
        document.getElementById('failedCount').textContent = String(items.filter((item) => item.publication?.status === 'failed').length);
      }

      function renderPosts(items, selectedDate) {
        const root = document.getElementById('posts');
        document.getElementById('sectionTitle').textContent =
          channelLabel(channelId) + ' · ' + formatDate(selectedDate);
        document.getElementById('channelValue').textContent = channelLabel(channelId);
        document.getElementById('dayValue').textContent = formatDate(selectedDate);
        renderStats(items);

        if (!items.length) {
          root.innerHTML = '<div class="empty">На этот день для этого канала пока ничего не запланировано.</div>';
          return;
        }

        root.innerHTML = items.map((item) => {
          const preview = item.articleExcerpt || item.articleTitle;
          const canCancel = item.publication
            ? item.publication.status !== 'published' && item.publication.status !== 'publishing'
            : true;
          return \`
            <article class="post-card">
              <div class="post-head">
                <div>
                  <h3 class="post-title">\${escapeHtml(item.articleTitle)}</h3>
                  <p class="post-copy">Статья \${escapeHtml(item.articleId)} · публикация в \${escapeHtml(formatTime(item.publishAt))}</p>
                </div>
                <div class="post-meta">
                  <span class="badge lang" style="
                    --badge-bg: \${escapeHtml(item.theme.bg)};
                    --badge-border: \${escapeHtml(item.theme.border)};
                    --badge-text: \${escapeHtml(item.theme.text)};
                  ">\${escapeHtml(languageLabel(item.targetLanguage))}</span>
                  <span class="badge status \${escapeHtml(item.status.className)}">\${escapeHtml(item.status.label)}</span>
                </div>
              </div>
              <div class="post-preview">\${escapeHtml(preview)}</div>
              <div class="post-actions">
                <a class="btn secondary" href="/test-ui/review?articleId=\${escapeHtml(item.articleId)}">Open workflow</a>
                <a class="btn secondary" href="/articles/\${escapeHtml(item.articleId)}" target="_blank" rel="noreferrer">Open JSON</a>
                \${canCancel
                  ? '<button class="btn secondary" onclick="cancelPublication(\\'' + escapeHtml(item.articleId) + '\\', \\'' + escapeHtml(channelId) + '\\', \\'' + escapeHtml(item.targetLanguage) + '\\')">Cancel publication</button>'
                  : ''}
              </div>
            </article>
          \`;
        }).join('');
      }

      async function cancelPublication(articleId, selectedChannelId, targetLanguage) {
        if (!articleId || !selectedChannelId || !targetLanguage) return;

        try {
          await post('/publishing/cancel-planned', {
            articleId,
            channelId: selectedChannelId,
            targetLanguage,
          });
          await loadDaySchedule();
        } catch (error) {
          document.getElementById('error').textContent = error instanceof Error ? error.message : String(error);
        }
      }

      async function loadDaySchedule() {
        document.getElementById('error').textContent = '';
        const selectedDate = parseDateKey(dateKey);

        try {
          const articles = await request('/articles?projectId=' + encodeURIComponent(projectId));
          const publicationLists = await Promise.all(
            (Array.isArray(articles) ? articles : []).map((article) =>
              request('/publishing/articles/' + encodeURIComponent(article.id)).catch(() => []),
            ),
          );
          const publicationMap = new Map(
            (Array.isArray(articles) ? articles : []).map((article, index) => [
              article.id,
              Array.isArray(publicationLists[index]) ? publicationLists[index] : [],
            ]),
          );
          currentPosts = collectPosts(Array.isArray(articles) ? articles : [], publicationMap, selectedDate);
          renderPosts(currentPosts, selectedDate);
        } catch (error) {
          document.getElementById('error').textContent = error instanceof Error ? error.message : String(error);
        }
      }

      loadDaySchedule().catch((error) => {
        document.getElementById('error').textContent = error instanceof Error ? error.message : String(error);
      });
    </script>
  </body>
</html>`;
  }

  @Get('new')
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderCreatePage(@Query('projectId') projectId = 'project_123'): string {
    return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Marketing Service - Create Article</title>
    <style>
      :root {
        --bg: #f4f7fb;
        --panel: #ffffff;
        --text: #121826;
        --muted: #5d687c;
        --border: #d8dfeb;
        --accent: #1d4fff;
        --accent-soft: #edf2ff;
        --shadow: 0 16px 40px rgba(15, 27, 58, 0.08);
        --danger: #b42318;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: linear-gradient(180deg, #f6f8fc 0%, #eef3f9 100%);
        color: var(--text);
        font: 15px/1.5 ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .wrap {
        max-width: 1100px;
        margin: 0 auto;
        padding: 24px;
        display: grid;
        gap: 16px;
      }
      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .topbar a {
        color: var(--accent);
        font-weight: 800;
        text-decoration: none;
      }
      .panel {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 20px;
        box-shadow: var(--shadow);
      }
      .hero, .content { padding: 24px 28px; }
      .hero h1 { margin: 0 0 8px; font-size: 34px; }
      .hero p { margin: 0; color: var(--muted); }
      .grid {
        display: grid;
        grid-template-columns: 1.2fr 0.8fr;
        gap: 16px;
      }
      .stack { display: grid; gap: 16px; }
      label {
        display: grid;
        gap: 6px;
        color: var(--muted);
        font-weight: 700;
      }
      input, textarea {
        width: 100%;
        padding: 12px 14px;
        border: 1px solid var(--border);
        border-radius: 14px;
        font: inherit;
        color: var(--text);
        background: #fff;
      }
      textarea {
        min-height: 420px;
        resize: vertical;
      }
      .modal textarea {
        min-height: 160px;
      }
      button {
        appearance: none;
        border: 0;
        border-radius: 999px;
        padding: 12px 18px;
        background: var(--accent);
        color: white;
        font: inherit;
        font-weight: 800;
        cursor: pointer;
      }
      button[disabled] {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .sub {
        margin: 0 0 14px;
        color: var(--muted);
      }
      .channels {
        display: grid;
        gap: 12px;
      }
      .check {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 14px;
        padding: 18px;
        border: 1px solid var(--border);
        border-radius: 16px;
        background: #fafbff;
      }
      .check-head {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: start;
        gap: 14px;
      }
      .check-main {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        min-width: 0;
      }
      .check input {
        width: auto;
        margin: 0;
      }
      .note {
        padding: 14px 16px;
        border-radius: 16px;
        background: #f7faff;
        border: 1px solid #dce7ff;
        color: #35507d;
      }
      .error {
        color: var(--danger);
        font-weight: 700;
        min-height: 24px;
      }
      .channel-copy {
        display: grid;
        gap: 4px;
      }
      .channel-copy strong {
        color: var(--text);
        display: block;
        font-size: 18px;
        line-height: 1.2;
      }
      .channel-copy span {
        color: var(--muted);
        font-size: 13px;
        line-height: 1.35;
      }
      .schedule-controls {
        display: grid;
        gap: 8px;
      }
      .toggle-inline {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--muted);
        font-size: 13px;
        font-weight: 700;
      }
      .toggle-inline input {
        width: auto;
        margin: 0;
      }
      .schedule-row {
        display: grid;
        gap: 6px;
        min-width: 200px;
        color: var(--muted);
        font-size: 12px;
        font-weight: 800;
      }
      .schedule-row input {
        padding: 10px 12px;
      }
      .schedule-row input:disabled {
        background: #f3f6fb;
        color: #8b97ad;
      }
      .translation-box {
        display: grid;
        gap: 10px;
        padding: 14px;
        border: 1px solid #dce4f2;
        border-radius: 16px;
        background: #fff;
      }
      .translation-box h3 {
        margin: 0;
        font-size: 14px;
        color: var(--text);
      }
      .translation-list {
        display: grid;
        gap: 12px;
      }
      .translation-row {
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
        align-items: start;
        padding: 12px;
        border: 1px solid #e9eef7;
        border-radius: 14px;
        background: #fcfdff;
      }
      .translation-toggle {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        color: var(--text);
        font-weight: 700;
      }
      .translation-toggle input {
        width: auto;
        margin: 4px 0 0;
      }
      .translation-toggle span {
        font-size: 16px;
        line-height: 1.2;
      }
      .translation-copy {
        display: grid;
        gap: 4px;
      }
      .translation-copy small {
        color: var(--muted);
        font-size: 12px;
        font-weight: 600;
      }
      .translation-schedule {
        padding-left: 34px;
      }
      .modal-actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .mini-btn {
        appearance: none;
        border: 1px solid var(--border);
        background: #fff;
        color: var(--muted);
        border-radius: 999px;
        padding: 8px 12px;
        font: inherit;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
      }
      .mini-btn.danger {
        color: var(--danger);
        border-color: #efc1ba;
        background: #fff7f6;
      }
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 21, 34, 0.46);
        display: grid;
        place-items: center;
        padding: 24px;
      }
      .modal {
        width: min(560px, 100%);
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 24px;
        box-shadow: var(--shadow);
        padding: 24px;
        display: grid;
        gap: 14px;
      }
      .modal-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }
      .modal-head h3 {
        margin: 0 0 6px;
        font-size: 24px;
      }
      .modal-head p {
        margin: 0;
        color: var(--muted);
      }
      .ghosted {
        display: none !important;
      }
      pre {
        margin: 0;
        padding: 18px;
        min-height: 240px;
        overflow: auto;
        border-radius: 18px;
        background: #0f1522;
        color: #d8e1f4;
        font: 13px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace;
      }
      @media (max-width: 960px) {
        .grid { grid-template-columns: 1fr; }
      }
      @media (max-width: 780px) {
        .check-head {
          grid-template-columns: 1fr;
        }
        .adaptation-row {
          grid-template-columns: 1fr;
        }
        .schedule-block {
          max-width: none;
        }
        .translation-row {
          padding: 10px;
        }
        .schedule-row {
          min-width: 0;
        }
        .modal-actions {
          justify-content: flex-start;
        }
        .translation-schedule {
          padding-left: 34px;
        }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="panel hero">
        <div class="topbar">
          <a href="/test-ui/project?projectId=${escapeHtml(projectId)}">← Back to project</a>
          <span style="color:var(--muted);font-weight:700;">Project: ${escapeHtml(projectId)}</span>
        </div>
        <h1>Страница 1. Утвердить лонгрид</h1>
        <p>Сначала фиксируем исходную статью. Затем галочками выбираем каналы, для которых нужно запустить adaptation.</p>
      </section>

      <div class="grid">
        <section class="panel content">
          <div class="stack">
            <label>
              Project ID
              <input id="projectId" value="${escapeHtml(projectId)}" />
            </label>

            <label>
              Язык исходника
              <input id="language" value="ru" />
            </label>

            <label>
              Исходный лонгрид
              <textarea id="content" placeholder="Вставь исходную статью"></textarea>
            </label>
          </div>
        </section>

        <section class="panel content">
          <h2 style="margin:0 0 8px;">Куда делаем adaptation</h2>
          <p class="sub" style="margin:0 0 14px;">Для каждого канала можно задать время публикации adaptation и отдельно спланировать переводы на английский и испанский.</p>

          <div id="channelList" class="channels"></div>

          <div class="note" style="margin-top: 16px;">
            После нажатия кнопки мы создадим статью, создадим adaptation для выбранных каналов и переведем тебя на экран генерации.
          </div>

          <div style="margin-top: 18px;">
            <button id="submitBtn" onclick="submitWorkflow()">Approve</button>
          </div>

          <div id="error" class="error" style="margin-top: 12px;"></div>

          <div style="margin-top: 16px;">
            <pre id="output">Ready.</pre>
          </div>
        </section>
      </div>
    </div>

    <div id="typeModalBackdrop" class="modal-backdrop ghosted">
      <div class="modal">
        <div class="modal-head">
          <div>
            <h3>Редактирование prompt</h3>
            <p>Здесь можно поменять только правило адаптации для уже встроенного канала.</p>
          </div>
          <button type="button" class="secondary" onclick="closeTypeModal()">Close</button>
        </div>

        <label>
          Канал
          <input id="typeName" readonly />
        </label>

        <label>
          Prompt / правило адаптации
          <textarea id="typePrompt" placeholder="Например: Сделай 1 короткий пост, до 20 слов, без хештегов."></textarea>
        </label>

        <div class="modal-actions">
          <button type="button" onclick="saveType()">Save prompt</button>
          <button type="button" class="secondary" onclick="closeTypeModal()">Cancel</button>
        </div>
        <div id="typeError" class="error"></div>
      </div>
    </div>

    <script>
      const CUSTOM_TYPES_KEY = 'ms:test-ui-adaptation-overrides';
      const DEFAULT_TYPES = [
        {
          channelId: 'channel_telegram',
          displayName: 'Telegram',
          promptInstructions: '',
          builtIn: true,
        },
        {
          channelId: 'channel_x',
          displayName: 'X',
          promptInstructions: '',
          builtIn: true,
        },
        {
          channelId: 'channel_discord',
          displayName: 'Discord',
          promptInstructions: '',
          builtIn: true,
        },
      ];
      function localizationOptions() {
        const originalLanguage = (document.getElementById('language')?.value || 'ru').trim().toLowerCase() || 'ru';
        const options = [
          { language: originalLanguage, label: languageLabel(originalLanguage), isOriginal: true },
          { language: 'en', label: 'English', isOriginal: false },
          { language: 'es', label: 'Spanish', isOriginal: false },
        ];

        return options.filter(
          (option, index, list) => list.findIndex((item) => item.language === option.language) === index,
        );
      }
      let editingTypeId = null;

      function languageLabel(language) {
        if (language === 'ru') return 'Russian';
        if (language === 'en') return 'English';
        if (language === 'es') return 'Spanish';
        return language.toUpperCase();
      }

      function builtInPrompt(channelId) {
        if (channelId === 'channel_telegram') {
          return [
            'Rewrite the provided long-form article into a Telegram post in the same language.',
            'Preserve the core meaning and factual accuracy.',
            'Make it concise, readable, and engaging for Telegram.',
            'Return exactly 3 sentences.',
            'The output must be substantially shorter than the original article.',
            'Each sentence should carry one key idea only.',
            'Use a strong opening hook.',
            'Keep the tone expert and clear.',
            'Do not use hashtags.',
            'Do not use emojis unless they are absolutely necessary.',
            'Do not produce bullet points or lists.',
            'Return only the final post text with no commentary.',
          ].join(' ');
        }

        if (channelId === 'channel_x') {
          return [
            'Rewrite the provided long-form article into a post for X in the same language.',
            'Preserve the core meaning and factual accuracy.',
            'Return exactly 1 sentence.',
            'Use no more than 15 words.',
            'Make it sharp, compact, and readable as a social post.',
            'Do not use hashtags.',
            'Do not use emojis.',
            'Return only the final post text with no commentary.',
          ].join(' ');
        }

        if (channelId === 'channel_discord') {
          return [
            'Rewrite the provided long-form article into a Discord post in the same language.',
            'Preserve the core meaning and factual accuracy.',
            'Return no more than 2 sentences.',
            'Explain everything as simply as possible.',
            'Use very plain words and short phrases.',
            'Make it understandable immediately for a non-expert reader.',
            'Do not use jargon unless absolutely necessary.',
            'Do not use hashtags.',
            'Do not use emojis.',
            'Return only the final post text with no commentary.',
          ].join(' ');
        }

        return '';
      }

      function escapeHtml(value) {
        return String(value)
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#39;');
      }

      function loadCustomTypes() {
        try {
          const raw = localStorage.getItem(CUSTOM_TYPES_KEY);
          const parsed = raw ? JSON.parse(raw) : [];
          if (!Array.isArray(parsed)) return [];

          const allowedIds = new Set(DEFAULT_TYPES.map((type) => type.channelId));
          return parsed.filter(
            (item) => item && typeof item.channelId === 'string' && allowedIds.has(item.channelId),
          );
        } catch {
          return [];
        }
      }

      function saveCustomTypes(types) {
        localStorage.setItem(CUSTOM_TYPES_KEY, JSON.stringify(types));
      }

      function allTypes() {
        const stored = new Map(loadCustomTypes().map((type) => [type.channelId, type]));
        return DEFAULT_TYPES.map((type) => {
          const override = stored.get(type.channelId);
          return {
            ...type,
            promptInstructions: override?.promptInstructions ?? type.promptInstructions,
          };
        });
      }

      function currentSelectedIds() {
        return new Set(
          allTypes()
            .filter((type) => document.getElementById('channel_' + type.channelId)?.checked)
            .map((type) => type.channelId),
        );
      }

      function selectedChannels() {
        return allTypes().filter((type) => {
          const checkbox = document.getElementById('channel_' + type.channelId);
          return checkbox?.checked;
        });
      }

      function formatDateTimeLocal(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
      }

      function defaultScheduleValue() {
        const date = new Date();
        date.setHours(date.getHours() + 1, 0, 0, 0);
        return formatDateTimeLocal(date);
      }

      function currentTranslationStates() {
        return new Map(
          allTypes().map((type) => [
            type.channelId,
            Object.fromEntries(
              localizationOptions().map((option) => [
                option.language,
                {
                  enabled: Boolean(document.getElementById('translation_' + type.channelId + '_' + option.language)?.checked),
                  publishNow: Boolean(
                    document.getElementById('translation_now_' + type.channelId + '_' + option.language)?.checked,
                  ),
                  scheduledAt:
                    document.getElementById('translation_schedule_' + type.channelId + '_' + option.language)?.value ||
                    defaultScheduleValue(),
                },
              ]),
            ),
          ]),
        );
      }

      function syncTranslationAvailability(channelId, language) {
        const channelCheckbox = document.getElementById('channel_' + channelId);
        const translationCheckbox = document.getElementById('translation_' + channelId + '_' + language);
        const translationInput = document.getElementById('translation_schedule_' + channelId + '_' + language);
        const publishNowCheckbox = document.getElementById('translation_now_' + channelId + '_' + language);

        if (!translationCheckbox || !translationInput || !publishNowCheckbox) {
          return;
        }

        const channelEnabled = Boolean(channelCheckbox?.checked);
        translationCheckbox.disabled = !channelEnabled;
        publishNowCheckbox.disabled = !channelEnabled || !translationCheckbox.checked;
        translationInput.disabled = !channelEnabled || !translationCheckbox.checked || publishNowCheckbox.checked;
      }

      function syncAllTranslationAvailability(channelId) {
        for (const option of localizationOptions()) {
          syncTranslationAvailability(channelId, option.language);
        }
      }

      function renderTypeList(selectedIds, translationStates) {
        const list = document.getElementById('channelList');
        const types = allTypes();
        const localization = localizationOptions();
        const chosen = selectedIds ?? new Set(types.map((type) => type.channelId));
        const translations = translationStates ?? new Map();

        list.innerHTML = types.map((type) => {
          const description = type.promptInstructions
            ? 'Prompt overridden'
            : 'Built-in social adaptation rules';
          const checked = chosen.has(type.channelId) ? 'checked' : '';
          const translationMarkup = localization.map((option) => {
            const state = translations.get(type.channelId)?.[option.language] ?? {
              enabled: option.isOriginal,
              publishNow: false,
              scheduledAt: defaultScheduleValue(),
            };
            const translationChecked = state.enabled ? 'checked' : '';
            const translationNowChecked = state.publishNow ? 'checked' : '';
            const meta = option.isOriginal ? 'Original adaptation language' : 'Localized translation';
            return \`
              <div class="translation-row">
                <label class="translation-toggle">
                  <input
                    id="translation_\${type.channelId}_\${option.language}"
                    type="checkbox"
                    \${translationChecked}
                    onchange="syncTranslationAvailability('\${type.channelId}', '\${option.language}')"
                  />
                  <div class="translation-copy">
                    <span>\${escapeHtml(option.label)}</span>
                    <small>\${escapeHtml(meta)}</small>
                  </div>
                </label>
                <div class="schedule-controls translation-schedule">
                  <label class="toggle-inline">
                    <input
                      id="translation_now_\${type.channelId}_\${option.language}"
                      type="checkbox"
                      \${translationNowChecked}
                      onchange="syncTranslationAvailability('\${type.channelId}', '\${option.language}')"
                    />
                    <span>Publish now</span>
                  </label>
                  <label class="schedule-row">
                    <input
                      id="translation_schedule_\${type.channelId}_\${option.language}"
                      type="datetime-local"
                      value="\${escapeHtml(state.scheduledAt)}"
                    />
                  </label>
                </div>
              </div>
            \`;
          }).join('');

          return \`
            <div class="check">
              <div class="check-head">
                <label class="check-main">
                  <input id="channel_\${type.channelId}" type="checkbox" \${checked} onchange="syncAllTranslationAvailability('\${type.channelId}')" />
                  <div class="channel-copy">
                    <strong>\${escapeHtml(type.displayName)}</strong>
                    <span>\${escapeHtml(description)}</span>
                  </div>
                </label>
                <div class="modal-actions">
                  <button type="button" class="mini-btn" onclick="openEditTypeModal('\${type.channelId}')">Edit</button>
                </div>
              </div>
              <div class="translation-box">
                <h3>Localization</h3>
                <div class="translation-list">\${translationMarkup}</div>
              </div>
            </div>
          \`;
        }).join('');

        for (const type of types) {
          for (const option of localization) {
            syncTranslationAvailability(type.channelId, option.language);
          }
        }
      }

      function openEditTypeModal(channelId) {
        const type = allTypes().find((item) => item.channelId === channelId);
        if (!type) return;

        editingTypeId = channelId;
        document.getElementById('typeName').value = type.displayName || '';
        document.getElementById('typePrompt').value =
          type.promptInstructions || builtInPrompt(channelId);
        document.getElementById('typeError').textContent = '';
        document.getElementById('typeModalBackdrop').classList.remove('ghosted');
      }

      function closeTypeModal() {
        document.getElementById('typeModalBackdrop').classList.add('ghosted');
        document.getElementById('typeError').textContent = '';
        document.getElementById('typeName').value = '';
        document.getElementById('typePrompt').value = '';
        editingTypeId = null;
      }

      function saveType() {
        const error = document.getElementById('typeError');
        const promptInstructions = document.getElementById('typePrompt').value.trim();
        const selectedIds = currentSelectedIds();
        const translationStates = currentTranslationStates();
        error.textContent = '';

        if (!editingTypeId) {
          error.textContent = 'Не выбран канал для редактирования.';
          return;
        }

        const baseType = DEFAULT_TYPES.find((type) => type.channelId === editingTypeId);
        if (!baseType) {
          error.textContent = 'Можно редактировать только встроенные каналы.';
          return;
        }

        const builtIn = builtInPrompt(editingTypeId);
        const nextTypes = loadCustomTypes().filter((type) => type.channelId !== editingTypeId);

        if (promptInstructions && promptInstructions !== builtIn) {
          nextTypes.push({
            channelId: editingTypeId,
            displayName: baseType.displayName,
            promptInstructions,
            builtIn: true,
          });
        }

        saveCustomTypes(nextTypes);
        closeTypeModal();
        renderTypeList(selectedIds, translationStates);
      }

      function render(data) {
        document.getElementById('output').textContent =
          typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      }

      function escapeHtml(value) {
        return String(value)
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#39;');
      }

      async function request(url, options) {
        const res = await fetch(url, options);
        const text = await res.text();
        let payload;
        try {
          payload = text ? JSON.parse(text) : {};
        } catch {
          payload = text;
        }

        render({
          status: res.status,
          ok: res.ok,
          url,
          payload,
        });

        if (!res.ok) {
          throw new Error(payload?.message || 'Request failed');
        }

        return payload;
      }

      async function submitWorkflow() {
        const error = document.getElementById('error');
        const submitBtn = document.getElementById('submitBtn');
        error.textContent = '';

        const channels = selectedChannels();
        if (channels.length === 0) {
          error.textContent = 'Выбери хотя бы один канал.';
          return;
        }

        const publicationIntents = [];
        for (const channel of channels) {
          const translationPlans = [];
          for (const option of localizationOptions()) {
            const translationCheckbox = document.getElementById('translation_' + channel.channelId + '_' + option.language);
            if (!translationCheckbox?.checked) {
              continue;
            }

            const translationPublishNow = Boolean(
              document.getElementById('translation_now_' + channel.channelId + '_' + option.language)?.checked,
            );
            const translationValue =
              document.getElementById('translation_schedule_' + channel.channelId + '_' + option.language)?.value?.trim();
            let translationScheduledAtIso = null;

            if (!translationPublishNow) {
              if (!translationValue) {
                error.textContent = 'Выбери дату и время перевода ' + option.label + ' для ' + channel.displayName + '.';
                return;
              }

              const translationDate = new Date(translationValue);
              if (Number.isNaN(translationDate.getTime())) {
                error.textContent = 'Некорректная дата перевода ' + option.label + ' для ' + channel.displayName + '.';
                return;
              }

              translationScheduledAtIso = translationDate.toISOString();
            }

            translationPlans.push({
              targetLanguage: option.language,
              publishNow: translationPublishNow,
              scheduledAt: translationScheduledAtIso,
            });
          }

          publicationIntents.push({
            channelId: channel.channelId,
            displayName: channel.displayName,
            translations: translationPlans,
          });
        }

        submitBtn.disabled = true;

        try {
          const article = await request('/articles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId: document.getElementById('projectId').value.trim(),
              content: document.getElementById('content').value.trim(),
              language: document.getElementById('language').value.trim(),
              releasePlanSnapshot: {
                source: 'test-ui',
                publicationIntents,
              },
            }),
          });

          const articleId = article.id;
          for (const channel of channels) {
            const adaptation = await request('/articles/' + encodeURIComponent(articleId) + '/adaptations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                channelId: channel.channelId,
                displayName: channel.displayName,
                promptInstructions: channel.promptInstructions || builtInPrompt(channel.channelId) || null,
              }),
            });
          }

          window.location.href = '/test-ui/review?articleId=' + encodeURIComponent(articleId);
        } catch (e) {
          error.textContent = e instanceof Error ? e.message : 'Не удалось создать workflow';
          submitBtn.disabled = false;
        }
      }

      renderTypeList();
    </script>
  </body>
</html>`;
  }

  @Get('review')
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderReviewPage(): string {
    return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Marketing Service - Review Adaptations</title>
    <style>
      :root {
        --bg: #f4f7fb;
        --panel: #ffffff;
        --text: #121826;
        --muted: #5d687c;
        --border: #d8dfeb;
        --accent: #1d4fff;
        --accent-soft: #edf2ff;
        --success: #0f8b4c;
        --success-soft: #e8f8ef;
        --warning: #9a6700;
        --warning-soft: #fff5d6;
        --shadow: 0 16px 40px rgba(15, 27, 58, 0.08);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: linear-gradient(180deg, #f6f8fc 0%, #eef3f9 100%);
        color: var(--text);
        font: 15px/1.5 ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .wrap {
        max-width: 1280px;
        margin: 0 auto;
        padding: 24px;
        display: grid;
        gap: 16px;
      }
      .panel, .hero, .card {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 20px;
        box-shadow: var(--shadow);
      }
      .hero, .panel { padding: 24px 28px; }
      .hero h1 { margin: 0 0 8px; font-size: 32px; }
      .hero p { margin: 0; color: var(--muted); }
      .layout {
        display: grid;
        grid-template-columns: 1fr 420px;
        gap: 16px;
        align-items: start;
      }
      .cards {
        display: grid;
        gap: 16px;
      }
      .card {
        padding: 20px;
      }
      .status-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-height: 48px;
        margin-bottom: 14px;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 8px 12px;
        min-width: 122px;
        border-radius: 999px;
        font-weight: 800;
      }
      .badge.pending {
        background: var(--warning-soft);
        color: var(--warning);
      }
      .badge.generated, .badge.edited, .badge.approved {
        background: var(--success-soft);
        color: var(--success);
      }
      .hidden {
        display: none !important;
      }
      textarea {
        width: 100%;
        min-height: 220px;
        height: 220px;
        padding: 12px 14px;
        border: 1px solid var(--border);
        border-radius: 14px;
        font: inherit;
        color: var(--text);
        background: #fff;
        resize: vertical;
        white-space: pre-wrap;
        overflow-wrap: break-word;
        word-break: break-word;
        line-height: 1.55;
      }
      .stage {
        position: relative;
        min-height: 220px;
      }
      .placeholder {
        position: absolute;
        inset: 0;
        padding: 18px;
        border-radius: 14px;
        border: 1px dashed var(--border);
        background:
          radial-gradient(circle at top right, rgba(29, 79, 255, 0.08), transparent 30%),
          linear-gradient(180deg, #fbfcff 0%, #f4f8ff 100%);
        color: var(--muted);
        display: grid;
        align-content: center;
        gap: 16px;
        overflow: hidden;
      }
      .placeholder::after {
        content: "";
        position: absolute;
        inset: 0;
        transform: translateX(-100%);
        background: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.7) 50%,
          rgba(255, 255, 255, 0) 100%
        );
        animation: shimmer 1.8s infinite;
      }
      .placeholder-title {
        font-size: 15px;
        font-weight: 700;
        letter-spacing: 0.01em;
      }
      .placeholder-lines {
        display: grid;
        gap: 10px;
      }
      .placeholder-line {
        height: 12px;
        border-radius: 999px;
        background: linear-gradient(90deg, #dde8ff 0%, #eef4ff 100%);
      }
      .placeholder-line:nth-child(1) { width: 82%; }
      .placeholder-line:nth-child(2) { width: 91%; }
      .placeholder-line:nth-child(3) { width: 67%; }
      .placeholder-meta {
        display: flex;
        gap: 8px;
      }
      .placeholder-dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: #83a0ff;
        animation: pulse 1.2s infinite ease-in-out;
      }
      .placeholder-dot:nth-child(2) { animation-delay: 0.15s; }
      .placeholder-dot:nth-child(3) { animation-delay: 0.3s; }
      .control-panel {
        align-self: start;
        position: sticky;
        top: 24px;
      }
      button {
        appearance: none;
        border: 0;
        border-radius: 999px;
        padding: 12px 18px;
        background: var(--accent);
        color: white;
        font: inherit;
        font-weight: 800;
        cursor: pointer;
      }
      button.secondary {
        background: var(--accent-soft);
        color: var(--accent);
      }
      button[disabled] {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 16px;
      }
      .card-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 14px;
      }
      .meta {
        display: grid;
        gap: 10px;
      }
      .meta-line {
        min-height: 30px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
      .meta-line strong {
        flex: 0 0 auto;
      }
      .meta-value {
        min-width: 140px;
        text-align: right;
        color: var(--muted);
        font-weight: 700;
      }
      pre {
        margin: 16px 0 0;
        padding: 18px;
        height: 300px;
        overflow: auto;
        border-radius: 18px;
        background: #0f1522;
        color: #d8e1f4;
        font: 13px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace;
      }
      @keyframes shimmer {
        100% {
          transform: translateX(100%);
        }
      }
      @keyframes pulse {
        0%, 100% {
          opacity: 0.35;
          transform: scale(0.9);
        }
        50% {
          opacity: 1;
          transform: scale(1);
        }
      }
      @media (max-width: 1024px) {
        .layout { grid-template-columns: 1fr; }
        .control-panel {
          position: static;
        }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="hero">
        <h1>Страница 2. Генерация adaptation</h1>
        <p>После загрузки страницы генерация стартует автоматически для выбранных каналов. Пока текст не готов, показывается плейсхолдер.</p>
      </section>

      <div class="layout">
        <section class="cards" id="cards"></section>

        <aside class="panel control-panel">
          <h2 style="margin:0 0 10px;">Управление</h2>
          <div class="meta">
            <div class="meta-line"><strong>Article ID:</strong> <span id="articleIdLabel" class="meta-value"></span></div>
            <div class="meta-line"><strong>Adaptations:</strong> <span id="adaptationCount" class="meta-value">0</span></div>
            <div class="meta-line"><strong>Ready:</strong> <span id="readyCount" class="meta-value">0</span></div>
          </div>

          <div class="actions">
            <button id="approveAllBtn" onclick="approveAll()" disabled>Approve adaptation</button>
            <button class="secondary" onclick="refreshArticle()">Refresh</button>
          </div>

          <pre id="output">Ready.</pre>
        </aside>
      </div>
    </div>

    <script>
      const params = new URLSearchParams(window.location.search);
      const articleId = params.get('articleId');
      const generatingAdaptations = new Set();
      let currentArticle = null;

      function render(data) {
        document.getElementById('output').textContent =
          typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      }

      function escapeHtml(value) {
        return String(value)
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#39;');
      }

      async function request(url, options, config) {
        const shouldRender = config?.renderResponse ?? true;
        const res = await fetch(url, options);
        const text = await res.text();
        let payload;
        try {
          payload = text ? JSON.parse(text) : {};
        } catch {
          payload = text;
        }

        if (shouldRender) {
          render({
            status: res.status,
            ok: res.ok,
            url,
            payload,
          });
        }

        if (!res.ok) {
          throw new Error(payload?.message || 'Request failed');
        }

        return payload;
      }

      function cardKey(adaptationId) {
        return 'adaptation_' + adaptationId;
      }

      function renderCards(adaptations) {
        const cards = document.getElementById('cards');
        cards.innerHTML = adaptations.map((adaptation) => {
          const key = cardKey(adaptation.id);
          return \`
            <article class="card" id="\${key}Card">
              <div class="status-row">
                <h2 style="margin:0;">\${escapeHtml(adaptation.displayName)}</h2>
                <span id="\${key}Status" class="badge pending">pending</span>
              </div>
              <div class="stage">
                <div id="\${key}Placeholder" class="placeholder">
                  <div class="placeholder-title">Генерируем adaptation для \${escapeHtml(adaptation.displayName)}...</div>
                  <div class="placeholder-lines">
                    <div class="placeholder-line"></div>
                    <div class="placeholder-line"></div>
                    <div class="placeholder-line"></div>
                  </div>
                  <div class="placeholder-meta">
                    <span class="placeholder-dot"></span>
                    <span class="placeholder-dot"></span>
                    <span class="placeholder-dot"></span>
                  </div>
                </div>
                <textarea id="\${key}Content" class="hidden"></textarea>
              </div>
              <div class="card-actions">
                <button id="\${key}EditorBtn" class="secondary hidden" onclick="openEditor('\${adaptation.id}')">Open editor</button>
              </div>
            </article>
          \`;
        }).join('');
      }

      function setAdaptationStatus(adaptation, status) {
        const key = cardKey(adaptation.id);
        const badge = document.getElementById(key + 'Status');

        if (!badge) return;

        badge.textContent = status;
        badge.className = 'badge ' + status;
      }

      function setAdaptationContent(adaptation, content) {
        const key = cardKey(adaptation.id);
        const placeholder = document.getElementById(key + 'Placeholder');
        const textarea = document.getElementById(key + 'Content');
        const editorBtn = document.getElementById(key + 'EditorBtn');

        if (content) {
          placeholder.classList.add('hidden');
          textarea.classList.remove('hidden');
          textarea.value = content;
          editorBtn.classList.remove('hidden');
        } else {
          placeholder.classList.remove('hidden');
          textarea.classList.add('hidden');
          editorBtn.classList.add('hidden');
        }
      }

      function openEditor(adaptationId) {
        const adaptation = Array.isArray(currentArticle?.adaptations)
          ? currentArticle.adaptations.find((item) => item.id === adaptationId)
          : null;
        if (!adaptation) return;

        const params = new URLSearchParams({
          articleId,
          adaptationId: adaptation.id,
          channelId: adaptation.channelId,
        });

        window.open(
          '/test-ui/editor?' + params.toString(),
          '_blank',
          'popup=yes,width=900,height=820,resizable=yes,scrollbars=yes',
        );
      }

      async function startGeneration(adaptation) {
        generatingAdaptations.add(adaptation.id);
        setAdaptationStatus(adaptation, 'pending');
        setAdaptationContent(adaptation, '');

        await request(
          '/articles/' + encodeURIComponent(articleId) +
          '/adaptations/' + encodeURIComponent(adaptation.id) +
          '/generate',
          { method: 'POST' },
        );

        generatingAdaptations.delete(adaptation.id);
      }

      async function refreshArticle() {
        const article = await request(
          '/articles/' + encodeURIComponent(articleId),
          undefined,
          { renderResponse: false },
        );
        currentArticle = article;
        const adaptations = Array.isArray(article.adaptations) ? article.adaptations : [];
        renderCards(adaptations);

        let readyToApprove = true;
        let readyCount = 0;

        for (const adaptation of adaptations) {
          setAdaptationStatus(adaptation, adaptation.status || 'pending');
          setAdaptationContent(adaptation, adaptation.adaptedContent || '');

          if (['generated', 'edited', 'approved'].includes(adaptation.status)) {
            readyCount += 1;
          } else {
            readyToApprove = false;
          }
        }

        document.getElementById('adaptationCount').textContent = String(adaptations.length);
        document.getElementById('readyCount').textContent = String(readyCount);
        document.getElementById('approveAllBtn').disabled = !readyToApprove;
        return article;
      }

      async function approveAll() {
        const article = await refreshArticle();
        const adaptations = Array.isArray(article.adaptations) ? article.adaptations : [];

        for (const adaptation of adaptations) {
          if (!adaptation || adaptation.status === 'approved') continue;

          await request(
            '/articles/' + encodeURIComponent(articleId) +
            '/adaptations/' + encodeURIComponent(adaptation.id) +
            '/approve',
            { method: 'POST' },
          );
        }

        window.location.href =
          '/test-ui/translations?articleId=' +
          encodeURIComponent(articleId);
      }

      async function boot() {
        document.getElementById('articleIdLabel').textContent = articleId || 'missing';

        const article = await refreshArticle();
        const adaptations = Array.isArray(article.adaptations) ? article.adaptations : [];
        const generationTasks = [];

        for (const adaptation of adaptations) {
          if (adaptation && adaptation.status !== 'pending') {
            continue;
          }

          generationTasks.push(
            startGeneration(adaptation).catch((error) => {
              render({ adaptationId: adaptation.id, generationError: String(error) });
            }),
          );
        }

        setInterval(refreshArticle, 2500);
        await Promise.allSettled(generationTasks);
        await refreshArticle();
      }

      boot().catch((error) => render(String(error)));
    </script>
  </body>
</html>`;
  }

  @Get('translations')
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderTranslationsPage(): string {
    return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Marketing Service - Generate Translations</title>
    <style>
      :root {
        --bg: #f4f7fb;
        --panel: #ffffff;
        --text: #121826;
        --muted: #5d687c;
        --border: #d8dfeb;
        --accent: #1d4fff;
        --accent-soft: #edf2ff;
        --success: #0f8b4c;
        --success-soft: #e8f8ef;
        --warning: #9a6700;
        --warning-soft: #fff5d6;
        --shadow: 0 16px 40px rgba(15, 27, 58, 0.08);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: linear-gradient(180deg, #f6f8fc 0%, #eef3f9 100%);
        color: var(--text);
        font: 15px/1.5 ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .wrap {
        max-width: 1280px;
        margin: 0 auto;
        padding: 24px;
        display: grid;
        gap: 16px;
      }
      .panel, .hero, .card {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 20px;
        box-shadow: var(--shadow);
      }
      .hero, .panel { padding: 24px 28px; }
      .hero h1 { margin: 0 0 8px; font-size: 32px; }
      .hero p { margin: 0; color: var(--muted); }
      .layout {
        display: grid;
        grid-template-columns: 1fr 420px;
        gap: 16px;
        align-items: start;
      }
      .cards {
        display: grid;
        gap: 16px;
      }
      .card {
        padding: 20px;
      }
      .status-row, .translation-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 14px;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 8px 12px;
        min-width: 122px;
        border-radius: 999px;
        font-weight: 800;
      }
      .badge.pending {
        background: var(--warning-soft);
        color: var(--warning);
      }
      .badge.generated, .badge.edited, .badge.approved {
        background: var(--success-soft);
        color: var(--success);
      }
      textarea {
        width: 100%;
        min-height: 180px;
        height: 180px;
        padding: 12px 14px;
        border: 1px solid var(--border);
        border-radius: 14px;
        font: inherit;
        color: var(--text);
        background: #fff;
        resize: vertical;
        white-space: pre-wrap;
        overflow-wrap: break-word;
        word-break: break-word;
        line-height: 1.55;
      }
      .stage {
        position: relative;
        min-height: 180px;
      }
      .placeholder {
        position: absolute;
        inset: 0;
        padding: 18px;
        border-radius: 14px;
        border: 1px dashed var(--border);
        background:
          radial-gradient(circle at top right, rgba(29, 79, 255, 0.08), transparent 30%),
          linear-gradient(180deg, #fbfcff 0%, #f4f8ff 100%);
        color: var(--muted);
        display: grid;
        align-content: center;
        gap: 16px;
        overflow: hidden;
      }
      .placeholder::after {
        content: "";
        position: absolute;
        inset: 0;
        transform: translateX(-100%);
        background: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.7) 50%,
          rgba(255, 255, 255, 0) 100%
        );
        animation: shimmer 1.8s infinite;
      }
      .placeholder-title {
        font-size: 15px;
        font-weight: 700;
        letter-spacing: 0.01em;
      }
      .placeholder-lines {
        display: grid;
        gap: 10px;
      }
      .placeholder-line {
        height: 12px;
        border-radius: 999px;
        background: linear-gradient(90deg, #dde8ff 0%, #eef4ff 100%);
      }
      .placeholder-line:nth-child(1) { width: 82%; }
      .placeholder-line:nth-child(2) { width: 91%; }
      .placeholder-line:nth-child(3) { width: 67%; }
      .placeholder-meta {
        display: flex;
        gap: 8px;
      }
      .placeholder-dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: #83a0ff;
        animation: pulse 1.2s infinite ease-in-out;
      }
      .placeholder-dot:nth-child(2) { animation-delay: 0.15s; }
      .placeholder-dot:nth-child(3) { animation-delay: 0.3s; }
      .translation-block {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid var(--border);
        display: grid;
        gap: 12px;
      }
      .translation-head h3 {
        margin: 0;
        font-size: 16px;
      }
      .translation-note {
        margin: 0;
        color: var(--muted);
        font-size: 13px;
      }
      .publish-note {
        margin: 6px 0 0;
        color: var(--success);
        font-size: 12px;
        font-weight: 700;
      }
      .control-panel {
        align-self: start;
        position: sticky;
        top: 24px;
      }
      button {
        appearance: none;
        border: 0;
        border-radius: 999px;
        padding: 12px 18px;
        background: var(--accent);
        color: white;
        font: inherit;
        font-weight: 800;
        cursor: pointer;
      }
      button.secondary {
        background: var(--accent-soft);
        color: var(--accent);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 16px;
      }
      .meta {
        display: grid;
        gap: 10px;
      }
      .meta-line {
        min-height: 30px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
      .meta-line strong {
        flex: 0 0 auto;
      }
      .meta-value {
        min-width: 140px;
        text-align: right;
        color: var(--muted);
        font-weight: 700;
      }
      .hidden {
        display: none !important;
      }
      pre {
        margin: 16px 0 0;
        padding: 18px;
        height: 300px;
        overflow: auto;
        border-radius: 18px;
        background: #0f1522;
        color: #d8e1f4;
        font: 13px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace;
      }
      @keyframes shimmer {
        100% { transform: translateX(100%); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 0.35; transform: scale(0.9); }
        50% { opacity: 1; transform: scale(1); }
      }
      @media (max-width: 1024px) {
        .layout { grid-template-columns: 1fr; }
        .control-panel { position: static; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="hero">
        <h1>Страница 3. Генерация translations</h1>
        <p>После approve adaptation переводы стартуют уже на отдельной странице. Пока перевод не готов, показывается плейсхолдер.</p>
      </section>

      <div class="layout">
        <section class="cards" id="cards"></section>

        <aside class="panel control-panel">
          <h2 style="margin:0 0 10px;">Управление</h2>
          <div class="meta">
            <div class="meta-line"><strong>Article ID:</strong> <span id="articleIdLabel" class="meta-value"></span></div>
            <div class="meta-line"><strong>Adaptations:</strong> <span id="adaptationCount" class="meta-value">0</span></div>
          </div>

          <div class="actions">
            <button id="approvePublishBtn" onclick="goToPublishingStep()">Approve translations and publish</button>
            <button class="secondary" onclick="refreshArticle()">Refresh</button>
            <button class="secondary" onclick="goBack()">Back to adaptations</button>
          </div>

          <pre id="output">Ready.</pre>
        </aside>
      </div>
    </div>

    <script>
      const params = new URLSearchParams(window.location.search);
      const articleId = params.get('articleId');
      const generatingTranslations = new Set();
      const publishedLocalizations = new Map();
      let currentArticle = null;

      function render(data) {
        document.getElementById('output').textContent =
          typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      }

      function escapeHtml(value) {
        return String(value)
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#39;');
      }

      async function request(url, options, config) {
        const shouldRender = config?.renderResponse ?? true;
        const res = await fetch(url, options);
        const text = await res.text();
        let payload;
        try {
          payload = text ? JSON.parse(text) : {};
        } catch {
          payload = text;
        }

        if (shouldRender) {
          render({
            status: res.status,
            ok: res.ok,
            url,
            payload,
          });
        }

        if (!res.ok) {
          throw new Error(payload?.message || 'Request failed');
        }

        return payload;
      }

      function cardKey(adaptationId) {
        return 'adaptation_' + adaptationId;
      }

      function publishKey(adaptationId, targetLanguage) {
        return adaptationId + ':' + targetLanguage;
      }

      function languageLabel(language) {
        if (language === 'ru') return 'Russian';
        if (language === 'en') return 'English';
        if (language === 'es') return 'Spanish';
        return String(language || '').toUpperCase();
      }

      function formatDateTime(value) {
        if (!value) return 'not scheduled';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(date);
      }

      function formatPlanTiming(plan) {
        if (plan?.publishNow) {
          return 'Now';
        }

        return formatDateTime(plan?.scheduledAt);
      }

      function formatPlanTiming(plan) {
        if (plan?.publishNow) {
          return 'Now';
        }

        return formatDateTime(plan?.scheduledAt);
      }

      function publicationPlanFor(adaptation, article) {
        const intents = Array.isArray(article?.releasePlanSnapshot?.publicationIntents)
          ? article.releasePlanSnapshot.publicationIntents
          : [];

        const channelPlan = intents.find((item) => item && item.channelId === adaptation.channelId);
        return Array.isArray(channelPlan?.translations) ? channelPlan.translations : [];
      }

      function isOriginalLanguagePlan(language, article) {
        return language === article?.original?.language;
      }

      function renderCards(adaptations) {
        const cards = document.getElementById('cards');
        cards.innerHTML = adaptations.map((adaptation) => {
          const key = cardKey(adaptation.id);
          const translationPlans = publicationPlanFor(adaptation, currentArticle);
          const translationMarkup = translationPlans.map((plan) => {
            const translation = Array.isArray(adaptation.translations)
              ? adaptation.translations.find((item) => item.targetLanguage === plan.targetLanguage)
              : null;
            const originalPlan = isOriginalLanguagePlan(plan.targetLanguage, currentArticle);
            const status = originalPlan
              ? 'ready'
              : (translation?.status || 'not started');
            const content = originalPlan
              ? adaptation.adaptedContent
              : (translation?.translatedContent || '');
            const published = publishedLocalizations.get(publishKey(adaptation.id, plan.targetLanguage));
            const publishMarkup = published
              ? '<p class="publish-note">Published to Telegram · message #' + escapeHtml(String(published.messageId)) + '</p>'
              : '';
            return \`
              <div class="translation-block">
                <div class="translation-head">
                  <div>
                    <h3>\${escapeHtml(languageLabel(plan.targetLanguage))}</h3>
                    <p class="translation-note">
                      Publish at: \${escapeHtml(formatPlanTiming(plan))}
                    </p>
                    \${publishMarkup}
                  </div>
                  <span id="\${key}TranslationStatus_\${plan.targetLanguage}" class="badge \${status === 'not started' || status === 'pending' ? 'pending' : 'generated'}">\${escapeHtml(status)}</span>
                </div>
                <div class="stage">
                  <div id="\${key}TranslationPlaceholder_\${plan.targetLanguage}" class="placeholder \${content ? 'hidden' : ''}">
                    <div class="placeholder-title">\${originalPlan ? 'Используем approved adaptation как локализацию...' : 'Генерируем translation для ' + escapeHtml(adaptation.displayName) + '...'}</div>
                    <div class="placeholder-lines">
                      <div class="placeholder-line"></div>
                      <div class="placeholder-line"></div>
                      <div class="placeholder-line"></div>
                    </div>
                    <div class="placeholder-meta">
                      <span class="placeholder-dot"></span>
                      <span class="placeholder-dot"></span>
                      <span class="placeholder-dot"></span>
                    </div>
                  </div>
                  <textarea id="\${key}TranslationContent_\${plan.targetLanguage}" class="\${content ? '' : 'hidden'}" readonly>\${escapeHtml(content || '')}</textarea>
                </div>
              </div>
            \`;
          }).join('');

          return \`
            <article class="card" id="\${key}Card">
              <div class="status-row">
                <h2 style="margin:0;">\${escapeHtml(adaptation.displayName)}</h2>
                <span id="\${key}Status" class="badge approved">\${adaptation.status}</span>
              </div>
              <div class="stage">
                <textarea id="\${key}Content" readonly>\${escapeHtml(adaptation.adaptedContent || '')}</textarea>
              </div>
              \${translationMarkup}
            </article>
          \`;
        }).join('');
      }

      function setTranslationStatus(adaptationId, targetLanguage, status) {
        const key = cardKey(adaptationId);
        const badge = document.getElementById(key + 'TranslationStatus_' + targetLanguage);
        if (!badge) return;

        if (status === 'not started') {
          badge.textContent = status;
          badge.className = 'badge pending';
          return;
        }

        badge.textContent = status;
        badge.className = 'badge ' + status;
      }

      function setTranslationContent(adaptationId, targetLanguage, content) {
        const key = cardKey(adaptationId);
        const placeholder = document.getElementById(key + 'TranslationPlaceholder_' + targetLanguage);
        const textarea = document.getElementById(key + 'TranslationContent_' + targetLanguage);
        if (!placeholder || !textarea) return;

        if (content) {
          placeholder.classList.add('hidden');
          textarea.classList.remove('hidden');
          textarea.value = content;
        } else {
          placeholder.classList.remove('hidden');
          textarea.classList.add('hidden');
        }
      }

      async function refreshArticle() {
        const article = await request(
          '/articles/' + encodeURIComponent(articleId),
          undefined,
          { renderResponse: false },
        );
        currentArticle = article;
        const adaptations = Array.isArray(article.adaptations)
          ? article.adaptations.filter((item) => item.status === 'approved')
          : [];

        renderCards(adaptations);

        for (const adaptation of adaptations) {
          const plans = publicationPlanFor(adaptation, article);
          for (const plan of plans) {
            const translation = Array.isArray(adaptation.translations)
              ? adaptation.translations.find((item) => item.targetLanguage === plan.targetLanguage)
              : null;

            if (isOriginalLanguagePlan(plan.targetLanguage, article)) {
              setTranslationStatus(adaptation.id, plan.targetLanguage, 'ready');
              setTranslationContent(adaptation.id, plan.targetLanguage, adaptation.adaptedContent || '');
              continue;
            }

            if (translation) {
              setTranslationStatus(adaptation.id, plan.targetLanguage, translation.status || 'pending');
              setTranslationContent(adaptation.id, plan.targetLanguage, translation.translatedContent || '');
            } else {
              setTranslationStatus(
                adaptation.id,
                plan.targetLanguage,
                generatingTranslations.has(adaptation.id + ':' + plan.targetLanguage) ? 'pending' : 'not started',
              );
              setTranslationContent(adaptation.id, plan.targetLanguage, '');
            }
          }
        }

        document.getElementById('adaptationCount').textContent = String(adaptations.length);
        return article;
      }

      async function ensureTranslation(adaptation, targetLanguage) {
        const existingTranslation = Array.isArray(adaptation.translations)
          ? adaptation.translations.find((item) => item.targetLanguage === targetLanguage)
          : null;

        if (existingTranslation) {
          return existingTranslation.id;
        }

        const created = await request(
          '/articles/' + encodeURIComponent(articleId) +
          '/adaptations/' + encodeURIComponent(adaptation.id) +
          '/translations',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetLanguage }),
          },
          { renderResponse: false },
        );

        return created.id;
      }

      async function startTranslationGeneration() {
        const article = await refreshArticle();
        const adaptations = Array.isArray(article.adaptations)
          ? article.adaptations.filter((item) => item.status === 'approved')
          : [];
        const translationJobs = [];

        for (const adaptation of adaptations) {
          const plans = publicationPlanFor(adaptation, article);
          for (const plan of plans) {
            if (isOriginalLanguagePlan(plan.targetLanguage, article)) {
              continue;
            }

            const translation = Array.isArray(adaptation.translations)
              ? adaptation.translations.find((item) => item.targetLanguage === plan.targetLanguage)
              : null;

            if (translation && translation.status !== 'pending') {
              continue;
            }

            const translationId = await ensureTranslation(adaptation, plan.targetLanguage);
            generatingTranslations.add(adaptation.id + ':' + plan.targetLanguage);
            setTranslationStatus(adaptation.id, plan.targetLanguage, 'pending');
            setTranslationContent(adaptation.id, plan.targetLanguage, '');

            translationJobs.push(
              request(
                '/articles/' + encodeURIComponent(articleId) +
                '/adaptations/' + encodeURIComponent(adaptation.id) +
                '/translations/' + encodeURIComponent(translationId) +
                '/generate',
                { method: 'POST' },
                { renderResponse: false },
              )
                .catch((error) => {
                  render({ adaptationId: adaptation.id, targetLanguage: plan.targetLanguage, translationError: String(error) });
                })
                .finally(() => {
                  generatingTranslations.delete(adaptation.id + ':' + plan.targetLanguage);
                }),
            );
          }
        }

        await refreshArticle();
        void Promise.allSettled(translationJobs).then(() => refreshArticle());
      }

      function goToPublishingStep() {
        window.location.href =
          '/test-ui/publishing?articleId=' + encodeURIComponent(articleId);
      }

      function goBack() {
        window.location.href =
          '/test-ui/review?articleId=' + encodeURIComponent(articleId);
      }

      async function boot() {
        document.getElementById('articleIdLabel').textContent = articleId || 'missing';
        setInterval(refreshArticle, 2500);
        await startTranslationGeneration();
      }

      boot().catch((error) => render(String(error)));
    </script>
  </body>
</html>`;
  }

  @Get('publishing')
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderPublishingPage(): string {
    return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Marketing Service - Publish to Telegram</title>
    <style>
      :root {
        --bg: #f4f7fb;
        --panel: #ffffff;
        --text: #121826;
        --muted: #5d687c;
        --border: #d8dfeb;
        --accent: #1d4fff;
        --accent-soft: #edf2ff;
        --success: #0f8b4c;
        --success-soft: #e8f8ef;
        --warning: #9a6700;
        --warning-soft: #fff5d6;
        --danger: #b42318;
        --danger-soft: #fff0ed;
        --shadow: 0 16px 40px rgba(15, 27, 58, 0.08);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: linear-gradient(180deg, #f6f8fc 0%, #eef3f9 100%);
        color: var(--text);
        font: 15px/1.5 ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .wrap {
        max-width: 1120px;
        margin: 0 auto;
        padding: 24px;
        display: grid;
        gap: 16px;
      }
      .panel, .hero {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 20px;
        box-shadow: var(--shadow);
        padding: 24px 28px;
      }
      .hero h1 {
        margin: 0 0 8px;
        font-size: 32px;
      }
      .hero p {
        margin: 0;
        color: var(--muted);
      }
      .layout {
        display: grid;
        grid-template-columns: 1fr 340px;
        gap: 16px;
        align-items: start;
      }
      .status-list {
        display: grid;
        gap: 12px;
      }
      .status-card {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 18px;
        box-shadow: var(--shadow);
        padding: 18px 20px;
        display: grid;
        gap: 12px;
      }
      .status-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .status-head h3 {
        margin: 0;
        font-size: 18px;
      }
      .status-subtitle {
        margin: 4px 0 0;
        color: var(--muted);
        font-size: 13px;
        font-weight: 700;
      }
      .meta-line {
        color: var(--muted);
        font-size: 13px;
      }
      .status-summary {
        color: var(--text);
        font-size: 14px;
        font-weight: 800;
      }
      .status-summary.scheduled {
        color: var(--warning);
      }
      .status-summary.published {
        color: var(--success);
      }
      .status-summary.failed {
        color: var(--danger);
      }
      .empty-state {
        background: var(--panel);
        border: 1px dashed var(--border);
        border-radius: 18px;
        padding: 28px;
        color: var(--muted);
        font-weight: 700;
      }
      .preview-box {
        min-height: 96px;
        padding: 14px 16px;
        border-radius: 16px;
        border: 1px solid var(--border);
        background: #f8fbff;
        color: var(--text);
        font-size: 14px;
        line-height: 1.55;
        white-space: pre-wrap;
        overflow-wrap: break-word;
      }
      .publish-result {
        color: var(--text);
        font-size: 13px;
      }
      .publish-error {
        color: var(--danger);
        font-size: 13px;
        font-weight: 700;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 8px 12px;
        min-width: 122px;
        border-radius: 999px;
        font-weight: 800;
      }
      .badge.pending, .badge.publishing {
        background: var(--warning-soft);
        color: var(--warning);
      }
      .badge.published, .badge.ready {
        background: var(--success-soft);
        color: var(--success);
      }
      .badge.failed {
        background: var(--danger-soft);
        color: var(--danger);
      }
      .meta {
        display: grid;
        gap: 10px;
      }
      .meta-row {
        min-height: 30px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
      .meta-value {
        color: var(--muted);
        font-weight: 700;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 16px;
      }
      button {
        appearance: none;
        border: 0;
        border-radius: 999px;
        padding: 12px 18px;
        background: var(--accent);
        color: white;
        font: inherit;
        font-weight: 800;
        cursor: pointer;
      }
      button.secondary {
        background: var(--accent-soft);
        color: var(--accent);
      }
      pre {
        margin: 16px 0 0;
        padding: 18px;
        height: 300px;
        overflow: auto;
        border-radius: 18px;
        background: #0f1522;
        color: #d8e1f4;
        font: 13px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace;
      }
      @media (max-width: 1024px) {
        .layout { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="hero">
        <h1>Страница 4. Publication Queue</h1>
        <p>Здесь мы подтверждаем planned localizations и создаем реальные публикации в backend. Если у локализации стоит отложенное время, сервер сам отправит ее в нужный канал позже.</p>
      </section>

      <div class="layout">
        <section id="statusList" class="status-list"></section>

        <aside class="panel">
          <h2 style="margin:0 0 10px;">Управление</h2>
          <div class="meta">
            <div class="meta-row"><strong>Article ID:</strong> <span id="articleIdLabel" class="meta-value"></span></div>
            <div class="meta-row"><strong>Total:</strong> <span id="totalCount" class="meta-value">0</span></div>
            <div class="meta-row"><strong>Published:</strong> <span id="publishedCount" class="meta-value">0</span></div>
            <div class="meta-row"><strong>Failed:</strong> <span id="failedCount" class="meta-value">0</span></div>
          </div>
          <div class="actions">
            <button class="secondary" onclick="refreshStatuses()">Refresh</button>
            <button class="secondary" onclick="goBack()">Back to translations</button>
            <button class="secondary" onclick="goToProjectDashboard()">Back to project dashboard</button>
          </div>
          <pre id="output">Ready.</pre>
        </aside>
      </div>
    </div>

    <script>
      const params = new URLSearchParams(window.location.search);
      const articleId = params.get('articleId');
      let currentArticle = null;
      let currentPublications = [];

      function render(data) {
        document.getElementById('output').textContent =
          typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      }

      function escapeHtml(value) {
        return String(value)
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#39;');
      }

      async function request(url, options, config) {
        const shouldRender = config?.renderResponse ?? true;
        const res = await fetch(url, options);
        const text = await res.text();
        let payload;
        try {
          payload = text ? JSON.parse(text) : {};
        } catch {
          payload = text;
        }

        if (shouldRender) {
          render({
            status: res.status,
            ok: res.ok,
            url,
            payload,
          });
        }

        if (!res.ok) {
          throw new Error(payload?.message || 'Request failed');
        }

        return payload;
      }

      function publishKey(adaptationId, targetLanguage) {
        return adaptationId + ':' + targetLanguage;
      }

      function languageLabel(language) {
        if (language === 'ru') return 'Russian';
        if (language === 'en') return 'English';
        if (language === 'es') return 'Spanish';
        return String(language || '').toUpperCase();
      }

      function formatDateTime(value) {
        if (!value) return 'not scheduled';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(date);
      }

      function formatHumanDateTime(value) {
        if (!value) return 'без даты';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat('ru-RU', {
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit',
        }).format(date);
      }

      function formatPlanTiming(plan) {
        if (plan?.publishNow) {
          return 'Now';
        }

        return formatDateTime(plan?.scheduledAt);
      }

      function publicationPlanFor(adaptation, article) {
        const intents = Array.isArray(article?.releasePlanSnapshot?.publicationIntents)
          ? article.releasePlanSnapshot.publicationIntents
          : [];
        const channelPlan = intents.find((item) => item && item.channelId === adaptation.channelId);
        return Array.isArray(channelPlan?.translations) ? channelPlan.translations : [];
      }

      function isOriginalLanguagePlan(language, article) {
        return language === article?.original?.language;
      }

      function publishableItems(article) {
        const adaptations = Array.isArray(article?.adaptations)
          ? article.adaptations.filter(
              (item) =>
                item.status === 'approved' &&
                (item.channelId === 'channel_telegram' || item.channelId === 'channel_discord'),
            )
          : [];

        return adaptations.flatMap((adaptation) =>
          publicationPlanFor(adaptation, article).map((plan) => ({
            adaptation,
            plan,
            key: publishKey(adaptation.id, plan.targetLanguage),
          })),
        );
      }

      function adaptationForPublication(publication) {
        const adaptations = Array.isArray(currentArticle?.adaptations)
          ? currentArticle.adaptations
          : [];
        return adaptations.find((item) => item.id === publication.adaptationId) || null;
      }

      function previewTextForPublication(publication) {
        const adaptation = adaptationForPublication(publication);
        if (!adaptation) {
          return 'Контент локализации пока не найден.';
        }

        const articleLanguage = currentArticle?.original?.language;
        if (publication.targetLanguage === articleLanguage) {
          return adaptation.adaptedContent || 'Контент adaptation пока пустой.';
        }

        const translations = Array.isArray(adaptation.translations) ? adaptation.translations : [];
        const translation = translations.find((item) => item.targetLanguage === publication.targetLanguage);
        return translation?.translatedContent || 'Перевод пока не найден.';
      }

      function shortPreview(text) {
        const normalized = String(text || '').trim();
        if (!normalized) {
          return 'Пустая публикация.';
        }

        if (normalized.length <= 220) {
          return normalized;
        }

        return normalized.slice(0, 217) + '...';
      }

      function statusSummary(publication) {
        if (publication.status === 'published') {
          const publishedAt = publication.publishedAt ? formatDateTime(publication.publishedAt) : 'только что';
          return {
            className: 'published',
            text: 'Опубликовано' + (publishedAt ? ' · ' + publishedAt : ''),
          };
        }

        if (publication.status === 'failed') {
          return {
            className: 'failed',
            text: 'Ошибка публикации',
          };
        }

        if (publication.status === 'publishing') {
          return {
            className: 'scheduled',
            text: 'Публикуем сейчас',
          };
        }

        return {
          className: 'scheduled',
          text: 'Будет опубликовано ' + formatHumanDateTime(publication.publishAt),
        };
      }

      function renderStatuses() {
        const list = document.getElementById('statusList');
        const items = Array.isArray(currentPublications) ? currentPublications : [];

        if (items.length === 0) {
          list.innerHTML = '<div class="empty-state">Публикации для этой статьи пока не созданы.</div>';
          document.getElementById('totalCount').textContent = '0';
          document.getElementById('publishedCount').textContent = '0';
          document.getElementById('failedCount').textContent = '0';
          return;
        }

        list.innerHTML = items.map((publication) => {
          const adaptation = adaptationForPublication(publication);
          const summary = statusSummary(publication);
          const badgeClass =
            publication.status === 'published'
              ? 'published'
              : publication.status === 'failed'
                ? 'failed'
                : publication.status === 'ready'
                  ? 'ready'
                  : (publication.status === 'publishing' ? 'publishing' : 'pending');
          const resultMarkup = publication.telegramMessageId
            ? '<div class="publish-result">' +
                escapeHtml(
                  publication.channelId === 'channel_discord'
                    ? 'Discord delivery confirmed'
                    : 'Telegram message #' + String(publication.telegramMessageId),
                ) +
              '</div>'
            : '';
          const errorMarkup = publication.errorMessage
            ? '<div class="publish-error">' + escapeHtml(publication.errorMessage) + '</div>'
            : '';
          const previewText = shortPreview(previewTextForPublication(publication));

          return \`
            <article class="status-card">
              <div class="status-head">
                <div>
                  <h3>\${escapeHtml(publication.displayName)} · \${escapeHtml(languageLabel(publication.targetLanguage))}</h3>
                  <p class="status-subtitle">\${escapeHtml(adaptation?.channelId || publication.channelId)}</p>
                </div>
                <span class="badge \${badgeClass}">\${escapeHtml(publication.status)}</span>
              </div>
              <div class="status-summary \${summary.className}">\${escapeHtml(summary.text)}</div>
              <div class="preview-box">\${escapeHtml(previewText)}</div>
              \${resultMarkup}
              \${errorMarkup}
            </article>
          \`;
        }).join('');

        const publishedCount = currentPublications.filter((item) => item.status === 'published').length;
        const failedCount = currentPublications.filter((item) => item.status === 'failed').length;

        document.getElementById('totalCount').textContent = String(currentPublications.length);
        document.getElementById('publishedCount').textContent = String(publishedCount);
        document.getElementById('failedCount').textContent = String(failedCount);
      }

      async function refreshArticle() {
        currentArticle = await request(
          '/articles/' + encodeURIComponent(articleId),
          undefined,
          { renderResponse: false },
        );
        return currentArticle;
      }

      async function refreshPublications() {
        currentPublications = await request(
          '/publishing/articles/' + encodeURIComponent(articleId),
          undefined,
          { renderResponse: false },
        );
        renderStatuses();
        return currentPublications;
      }

      async function ensureApprovedTranslation(articleIdValue, adaptation, plan) {
        if (isOriginalLanguagePlan(plan.targetLanguage, currentArticle)) {
          return null;
        }

        const translation = Array.isArray(adaptation.translations)
          ? adaptation.translations.find((item) => item.targetLanguage === plan.targetLanguage)
          : null;

        if (!translation) {
          throw new Error(
            'Translation ' + plan.targetLanguage + ' is not generated for ' + adaptation.displayName,
          );
        }

        if (translation.status !== 'approved') {
          await request(
            '/articles/' + encodeURIComponent(articleIdValue) +
            '/adaptations/' + encodeURIComponent(adaptation.id) +
            '/translations/' + encodeURIComponent(translation.id) +
            '/approve',
            { method: 'POST' },
            { renderResponse: false },
          );
        }
      }

      async function schedulePublications() {
        const article = await refreshArticle();
        const items = publishableItems(article);

        for (const item of items) {
          try {
            await ensureApprovedTranslation(articleId, item.adaptation, item.plan);
            await request(
              item.adaptation.channelId === 'channel_discord'
                ? '/publishing/discord/schedule'
                : '/publishing/telegram/schedule',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  articleId,
                  adaptationId: item.adaptation.id,
                  targetLanguage: item.plan.targetLanguage,
                  publishAt: item.plan.publishNow
                    ? new Date().toISOString()
                    : item.plan.scheduledAt,
                }),
              },
              { renderResponse: false },
            );
          } catch (error) {
            render({
              schedulingError: error instanceof Error ? error.message : String(error),
              adaptationId: item.adaptation.id,
              targetLanguage: item.plan.targetLanguage,
            });
          }
        }

        await refreshPublications();
        render('Publications scheduled.');
      }

      function goBack() {
        window.location.href =
          '/test-ui/translations?articleId=' + encodeURIComponent(articleId);
      }

      function goToProjectDashboard() {
        const projectId = currentArticle?.projectId;
        if (!projectId) {
          return;
        }

        window.location.href =
          '/test-ui/project?projectId=' + encodeURIComponent(projectId);
      }

      async function refreshStatuses() {
        await refreshArticle();
        await refreshPublications();
      }

      async function boot() {
        document.getElementById('articleIdLabel').textContent = articleId || 'missing';
        await refreshArticle();
        await schedulePublications();
        setInterval(refreshStatuses, 2500);
      }

      boot().catch((error) => render(String(error)));
    </script>
  </body>
</html>`;
  }

  @Get('editor')
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderEditorPage(): string {
    return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Marketing Service - Edit Adaptation</title>
    <style>
      :root {
        --bg: #f4f7fb;
        --panel: #ffffff;
        --text: #121826;
        --muted: #5d687c;
        --border: #d8dfeb;
        --accent: #1d4fff;
        --accent-soft: #edf2ff;
        --success: #0f8b4c;
        --success-soft: #e8f8ef;
        --danger: #b42318;
        --shadow: 0 16px 40px rgba(15, 27, 58, 0.08);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: linear-gradient(180deg, #f6f8fc 0%, #eef3f9 100%);
        color: var(--text);
        font: 15px/1.5 ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .wrap {
        max-width: 1080px;
        margin: 0 auto;
        padding: 24px;
        display: grid;
        gap: 16px;
      }
      .panel {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 20px;
        box-shadow: var(--shadow);
        padding: 24px 28px;
        min-width: 0;
      }
      .hero h1 {
        margin: 0 0 8px;
        font-size: 32px;
      }
      .hero p {
        margin: 0;
        color: var(--muted);
      }
      .hero-top {
        display: flex;
        align-items: flex-start;
        gap: 16px;
      }
      .hero-copy {
        min-width: 0;
      }
      .meta {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin-top: 16px;
      }
      .meta-box {
        padding: 14px 16px;
        border: 1px solid var(--border);
        border-radius: 16px;
        background: #fafcff;
      }
      .meta-box strong {
        display: block;
        margin-bottom: 6px;
      }
      .meta-box span {
        color: var(--muted);
        font-weight: 700;
      }
      textarea {
        width: 100%;
        min-height: 420px;
        padding: 16px 18px;
        border: 1px solid var(--border);
        border-radius: 16px;
        font: inherit;
        color: var(--text);
        background: transparent;
        resize: vertical;
        white-space: pre-wrap;
        overflow-wrap: break-word;
        word-break: break-word;
        line-height: 1.6;
      }
      .toolbar {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }
      .editor-shell {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 380px;
        gap: 16px;
        align-items: start;
      }
      .editor-shell > * {
        min-width: 0;
      }
      .editor-main {
        min-width: 0;
      }
      .content-stage {
        position: relative;
        min-width: 0;
        min-height: 420px;
      }
      .content-stage textarea {
        position: relative;
        z-index: 2;
      }
      .content-highlight {
        position: absolute;
        inset: 0;
        z-index: 1;
        overflow: hidden;
        border: 1px solid var(--border);
        border-radius: 16px;
        background: #fff;
        pointer-events: none;
      }
      .content-highlight-inner {
        min-height: 100%;
        padding: 16px 18px;
        font: inherit;
        line-height: 1.6;
        white-space: pre-wrap;
        overflow-wrap: break-word;
        word-break: break-word;
        color: transparent;
      }
      .content-highlight mark {
        background: #d8e6ff;
        color: transparent;
        border-radius: 6px;
        box-shadow: 0 0 0 1px rgba(29, 79, 255, 0.08);
      }
      .editor-sidebar {
        position: sticky;
        top: 24px;
        display: grid;
        gap: 16px;
        align-content: start;
      }
      .sidebar-actions {
        display: grid;
        gap: 12px;
        align-content: start;
      }
      .sidebar-actions button {
        width: 100%;
        justify-content: center;
      }
      .toolbar {
        display: grid;
        gap: 10px;
      }
      .ai-panel {
        padding: 16px;
        border: 1px solid var(--border);
        border-radius: 16px;
        background: #f9fbff;
        display: grid;
        gap: 12px;
      }
      .ai-panel h3 {
        margin: 0;
        font-size: 18px;
      }
      .ai-panel p {
        margin: 0;
        color: var(--muted);
      }
      .ai-prompt {
        width: 100%;
        min-height: 110px;
      }
      .selection-preview {
        min-height: 52px;
        padding: 12px 14px;
        border: 1px dashed var(--border);
        border-radius: 14px;
        background: #fff;
        color: var(--muted);
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        word-break: break-word;
      }
      .version-strip {
        margin: 0 0 16px;
        padding: 16px 18px;
        border: 1px solid var(--border);
        border-radius: 16px;
        background: #fafcff;
        display: grid;
        gap: 12px;
      }
      .version-strip h3 {
        margin: 0;
        font-size: 18px;
      }
      .version-strip p {
        margin: 0;
        color: var(--muted);
      }
      .version-list {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .version-dot {
        width: 44px;
        height: 44px;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: #fff;
        color: var(--muted);
        font-weight: 800;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
      }
      .version-dot:hover {
        transform: translateY(-1px);
      }
      .version-dot.current {
        background: var(--accent);
        border-color: var(--accent);
        color: #fff;
        box-shadow: 0 8px 20px rgba(29, 79, 255, 0.18);
      }
      .version-dot.preview {
        border-color: #9a6700;
        background: #fff7df;
        color: #9a6700;
      }
      .version-dot.active {
        outline: 3px solid #121826;
        outline-offset: 2px;
      }
      .version-dot.approved {
        box-shadow: inset 0 0 0 2px #0f8b4c;
      }
      .version-caption {
        min-height: 20px;
        font-size: 13px;
        color: var(--muted);
        font-weight: 700;
      }
      .version-tag {
        border-radius: 999px;
        background: #edf7ff;
        color: #23639b;
        font-size: 11px;
        font-weight: 800;
        padding: 4px 8px;
        display: inline-flex;
        align-items: center;
      }
      .actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      button {
        appearance: none;
        border: 0;
        border-radius: 999px;
        padding: 12px 18px;
        background: var(--accent);
        color: white;
        font: inherit;
        font-weight: 800;
        cursor: pointer;
      }
      button.secondary {
        background: var(--accent-soft);
        color: var(--accent);
      }
      button[disabled] {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .status {
        display: inline-flex;
        align-items: center;
        padding: 8px 12px;
        border-radius: 999px;
        background: var(--success-soft);
        color: var(--success);
        font-weight: 800;
      }
      .ghost {
        visibility: hidden;
        pointer-events: none;
      }
      .gone {
        display: none !important;
      }
      .mode-banner {
        margin: 0 0 12px;
        padding: 12px 14px;
        min-height: 72px;
        border-radius: 14px;
        border: 1px solid #d9e5ff;
        background: #f4f8ff;
        color: #2c4f92;
        font-weight: 700;
      }
      pre {
        margin: 0;
        padding: 18px;
        height: 220px;
        overflow: auto;
        border-radius: 18px;
        background: #0f1522;
        color: #d8e1f4;
        font: 13px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        word-break: break-word;
      }
      @media (max-width: 860px) {
        .hero-top {
          flex-direction: column;
          align-items: stretch;
        }
        .meta {
          grid-template-columns: 1fr;
        }
        .editor-shell {
          grid-template-columns: 1fr;
        }
        .editor-sidebar {
          position: static;
        }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="panel hero">
        <div class="hero-top">
          <button id="backBtn" class="secondary" onclick="goBack()">Back</button>
          <div class="hero-copy">
            <h1>Редактор adaptation</h1>
            <p>Здесь можно вручную поправить готовую adaptation, сохранить изменения и вернуться к экрану review.</p>
          </div>
        </div>
        <div class="meta">
          <div class="meta-box"><strong>Article ID</strong><span id="articleIdLabel">-</span></div>
          <div class="meta-box"><strong>Channel</strong><span id="channelLabel">-</span></div>
          <div class="meta-box"><strong>Status</strong><span id="statusLabel">-</span></div>
        </div>
      </section>

      <section class="panel">
        <div class="version-strip">
          <h3>Versions</h3>
          <p>Текущая версия выделена синим. Если выбрать другую цифру, окно перейдет в preview mode.</p>
          <div id="versionList" class="version-list"></div>
          <div id="versionCaption" class="version-caption"></div>
        </div>

        <div class="editor-shell">
          <div class="editor-main">
            <div class="content-stage">
              <div id="contentHighlight" class="content-highlight" aria-hidden="true">
                <div id="contentHighlightInner" class="content-highlight-inner"></div>
              </div>
              <textarea id="content" wrap="soft"></textarea>
            </div>
          </div>

          <aside class="editor-sidebar">
            <div id="modeBanner" class="mode-banner gone"></div>
            <div class="sidebar-actions">
              <button id="usePreviewBtn" class="secondary ghost" onclick="usePreviewAsCurrent()">Use preview as current</button>
              <button id="saveBtn" onclick="save()">Save changes</button>
            </div>

            <div id="aiPanel" class="ai-panel">
              <h3>AI fix selection</h3>
              <p>Выдели курсором фрагмент в тексте слева, опиши что тебе не нравится, и DeepSeek создаст новую версию adaptation.</p>
              <div>
                <strong>Instruction for DeepSeek</strong>
                <textarea id="aiPrompt" class="ai-prompt" placeholder="Например: сделай эту мысль мягче, убери кликбейт, сократи, сделай формулировку точнее"></textarea>
              </div>
              <div class="actions" style="margin-top:0;">
                <button id="aiReviseBtn" class="secondary" onclick="reviseSelectionWithAi()">AI fix selection</button>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section class="panel">
        <pre id="output">Ready.</pre>
      </section>
    </div>

    <script>
      const params = new URLSearchParams(window.location.search);
      const articleId = params.get('articleId');
      const adaptationId = params.get('adaptationId');
      const channelId = params.get('channelId');
      let currentAdaptation = null;
      let isPreviewMode = false;
      let previewVersionId = null;
      let persistedSelectionStart = 0;
      let persistedSelectionEnd = 0;

      function formatVersionTime(value) {
        if (!value) return '';

        try {
          return new Date(value).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });
        } catch {
          return String(value);
        }
      }

      function escapeHtml(value) {
        return String(value)
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#39;');
      }

      function clampSelectionRange(text) {
        const length = text.length;
        persistedSelectionStart = Math.max(0, Math.min(persistedSelectionStart, length));
        persistedSelectionEnd = Math.max(0, Math.min(persistedSelectionEnd, length));

        if (persistedSelectionEnd < persistedSelectionStart) {
          persistedSelectionEnd = persistedSelectionStart;
        }
      }

      function renderPersistentSelection() {
        const textarea = document.getElementById('content');
        const highlightInner = document.getElementById('contentHighlightInner');
        const highlight = document.getElementById('contentHighlight');
        const text = textarea.value || '';

        clampSelectionRange(text);

        const start = persistedSelectionStart;
        const end = persistedSelectionEnd;
        const before = escapeHtml(text.slice(0, start));
        const middle = escapeHtml(text.slice(start, end));
        const after = escapeHtml(text.slice(end));

        highlightInner.innerHTML = middle
          ? before + '<mark>' + middle + '</mark>' + after
          : before + after;

        highlight.scrollTop = textarea.scrollTop;
        highlight.scrollLeft = textarea.scrollLeft;
      }

      function rememberSelection() {
        const textarea = document.getElementById('content');
        persistedSelectionStart = textarea.selectionStart;
        persistedSelectionEnd = textarea.selectionEnd;
        renderPersistentSelection();
      }

      function clearPersistentSelection() {
        persistedSelectionStart = 0;
        persistedSelectionEnd = 0;
        renderPersistentSelection();
      }

      function hasUnsavedChanges() {
        if (!currentAdaptation || isPreviewMode) return false;

        const textarea = document.getElementById('content');
        return textarea.value !== (currentAdaptation.adaptedContent || '');
      }

      function syncSaveAvailability() {
        const saveBtn = document.getElementById('saveBtn');
        if (!saveBtn) return;

        saveBtn.disabled = !hasUnsavedChanges();
      }

      function renderVersionList(adaptation) {
        const list = document.getElementById('versionList');
        const caption = document.getElementById('versionCaption');
        const versions = Array.isArray(adaptation.versions) ? [...adaptation.versions] : [];

        versions.sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());

        if (versions.length === 0) {
          list.innerHTML = '';
          caption.textContent = 'У этой adaptation пока нет сохраненных версий.';
          return;
        }

        const previewedVersion = isPreviewMode ? findVersion(previewVersionId) : null;

        list.innerHTML = versions.map((version, index) => {
          const isCurrent = adaptation.selectedVersionId === version.id;
          const isApproved = adaptation.approvedVersionId === version.id;
          const isPreview = previewVersionId === version.id && isPreviewMode;
          const classNames = ['version-dot'];
          const isOpenNow = isPreviewMode ? isPreview : isCurrent;

          if (isCurrent) classNames.push('current');
          if (isApproved) classNames.push('approved');
          if (isPreview) classNames.push('preview');
          if (isOpenNow) classNames.push('active');

          return \`
            <button
              type="button"
              class="\${classNames.join(' ')}"
              onclick="\${isCurrent ? 'returnToCurrentVersion()' : 'previewVersion(\\'' + escapeHtml(version.id) + '\\')'}"
              title="Version \${index + 1}"
            >
              \${index + 1}
            </button>
          \`;
        }).join('');

        if (previewedVersion) {
          caption.innerHTML =
            'Previewing <span class="version-tag">v' +
            String(versions.findIndex((item) => item.id === previewedVersion.id) + 1) +
            '</span> • ' +
            escapeHtml(previewedVersion.kind) +
            ' • ' +
            escapeHtml(formatVersionTime(previewedVersion.createdAt));
        } else {
          const currentVersion = findVersion(adaptation.selectedVersionId);
          caption.innerHTML = currentVersion
            ? 'Current <span class="version-tag">v' +
              String(versions.findIndex((item) => item.id === currentVersion.id) + 1) +
              '</span> • ' +
              escapeHtml(currentVersion.kind) +
              ' • ' +
              escapeHtml(formatVersionTime(currentVersion.createdAt))
            : 'Current version selected.';
        }
      }

      function findVersion(versionId) {
        const versions = Array.isArray(currentAdaptation?.versions) ? currentAdaptation.versions : [];
        return versions.find((item) => item.id === versionId) ?? null;
      }

      function previewVersion(versionId) {
        const version = findVersion(versionId);
        if (!version) return;

        isPreviewMode = true;
        previewVersionId = version.id;
        document.getElementById('content').value = version.content;
        clearPersistentSelection();
        if (currentAdaptation) {
          renderVersionList(currentAdaptation);
        }
        syncEditorMode();
        updateSelectionPreview();
        setMessage('Это preview версии. Если она подходит, нажми Use preview as current.', 'success');
      }

      function syncEditorMode() {
        const content = document.getElementById('content');
        const saveBtn = document.getElementById('saveBtn');
        const aiPanel = document.getElementById('aiPanel');
        const aiReviseBtn = document.getElementById('aiReviseBtn');
        const usePreviewBtn = document.getElementById('usePreviewBtn');
        const banner = document.getElementById('modeBanner');

        content.readOnly = isPreviewMode;

        if (isPreviewMode) {
          saveBtn.classList.add('gone');
          aiPanel.classList.add('gone');
          aiReviseBtn.classList.add('gone');
          usePreviewBtn.classList.remove('ghost');
          banner.classList.remove('gone');
          banner.classList.remove('ghost');
          banner.textContent = 'Preview mode: эта версия открыта только для просмотра. Нажми Use preview as current, если хочешь сделать ее рабочей. Чтобы вернуться к текущей версии без выбора, нажми сверху на синий кружок текущей версии.';
        } else {
          saveBtn.classList.remove('gone');
          aiPanel.classList.remove('gone');
          aiReviseBtn.classList.remove('gone');
          usePreviewBtn.classList.add('ghost');
          banner.classList.add('gone');
          banner.classList.add('ghost');
          banner.textContent = '';
        }

        syncSaveAvailability();
      }

      async function usePreviewAsCurrent() {
        if (!previewVersionId) return;
        await selectVersion(previewVersionId);
      }

      function returnToCurrentVersion() {
        if (!currentAdaptation) return;

        isPreviewMode = false;
        previewVersionId = null;
        document.getElementById('content').value = currentAdaptation.adaptedContent || '';
        clearPersistentSelection();
        renderVersionList(currentAdaptation);
        syncEditorMode();
        updateSelectionPreview();
        setMessage('Возврат к текущей версии.', 'success');
      }

      function selectedFragment() {
        const textarea = document.getElementById('content');
        clampSelectionRange(textarea.value || '');
        return textarea.value.slice(persistedSelectionStart, persistedSelectionEnd);
      }

      function updateSelectionPreview() {
        rememberSelection();
      }

      function render(data) {
        document.getElementById('output').textContent =
          typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      }

      function setMessage() {}

      async function request(url, options, config) {
        const shouldRender = config?.renderResponse ?? true;
        const res = await fetch(url, options);
        const text = await res.text();
        let payload;
        try {
          payload = text ? JSON.parse(text) : {};
        } catch {
          payload = text;
        }

        if (shouldRender) {
          render({
            status: res.status,
            ok: res.ok,
            url,
            payload,
          });
        }

        if (!res.ok) {
          throw new Error(payload?.message || 'Request failed');
        }

        return payload;
      }

      function applyAdaptation(article) {
        const adaptations = Array.isArray(article.adaptations) ? article.adaptations : [];
        const adaptation = adaptations.find((item) => item.id === adaptationId);

        if (!adaptation) {
          throw new Error('Adaptation not found');
        }

        currentAdaptation = adaptation;
        isPreviewMode = false;
        previewVersionId = null;

        document.getElementById('articleIdLabel').textContent = articleId || '-';
        document.getElementById('channelLabel').textContent = adaptation.displayName || channelId || '-';
        document.getElementById('statusLabel').textContent = adaptation.status || '-';
        document.getElementById('content').value = adaptation.adaptedContent || '';
        clearPersistentSelection();
        renderVersionList(adaptation);
        syncEditorMode();
        updateSelectionPreview();
        syncSaveAvailability();
      }

      async function reloadAdaptation() {
        setMessage('', '');
        const article = await request(
          '/articles/' + encodeURIComponent(articleId),
          undefined,
          { renderResponse: false },
        );
        applyAdaptation(article);
      }

      async function save() {
        const saveBtn = document.getElementById('saveBtn');

        if (isPreviewMode) {
          setMessage('В preview-режиме редактирование отключено. Сначала нажми Use preview as current или Return to current.', 'error');
          return;
        }

        saveBtn.disabled = true;
        setMessage('', '');

        try {
          await request(
            '/articles/' + encodeURIComponent(articleId) +
            '/adaptations/' + encodeURIComponent(adaptationId) +
            '/edit',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                adaptedContent: document.getElementById('content').value,
              }),
            },
          );

          await reloadAdaptation();
          setMessage('Изменения сохранены.', 'success');

          if (window.opener && typeof window.opener.refreshArticle === 'function') {
            window.opener.refreshArticle().catch(() => {});
          }
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'Не удалось сохранить изменения.', 'error');
        } finally {
          saveBtn.disabled = false;
        }
      }

      async function selectVersion(versionId) {
        setMessage('', '');

        try {
          await request(
            '/articles/' + encodeURIComponent(articleId) +
            '/adaptations/' + encodeURIComponent(adaptationId) +
            '/select-version',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ versionId }),
            },
          );

          await reloadAdaptation();
          isPreviewMode = false;
          previewVersionId = null;
          syncEditorMode();
          clearPersistentSelection();
          syncSaveAvailability();
          setMessage('Текущая версия переключена.', 'success');

          if (window.opener && typeof window.opener.refreshArticle === 'function') {
            window.opener.refreshArticle().catch(() => {});
          }
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'Не удалось переключить версию.', 'error');
        }
      }

      async function reviseSelectionWithAi() {
        const reviseBtn = document.getElementById('aiReviseBtn');
        const textarea = document.getElementById('content');
        const instruction = document.getElementById('aiPrompt').value.trim();
        const selectedText = selectedFragment();

        if (isPreviewMode) {
          setMessage('В preview-режиме AI-правки отключены. Сначала нажми Use preview as current или Return to current.', 'error');
          return;
        }

        if (!selectedText.trim()) {
          setMessage('Сначала выдели фрагмент текста, который нужно поправить.', 'error');
          return;
        }

        if (!instruction) {
          setMessage('Сначала напиши инструкцию для DeepSeek.', 'error');
          return;
        }

        reviseBtn.disabled = true;
        setMessage('', '');

        try {
          const result = await request(
            '/articles/' + encodeURIComponent(articleId) +
            '/adaptations/' + encodeURIComponent(adaptationId) +
            '/revise-selection',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                currentContent: textarea.value,
                selectedText,
                instruction,
              }),
            },
          );

          await reloadAdaptation();
          document.getElementById('content').value = result.adaptedContent;
          clearPersistentSelection();
          updateSelectionPreview();
          setMessage('DeepSeek создал новую промежуточную версию и сделал ее текущей.', 'success');

          if (window.opener && typeof window.opener.refreshArticle === 'function') {
            window.opener.refreshArticle().catch(() => {});
          }
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'Не удалось получить AI-правку.', 'error');
        } finally {
          reviseBtn.disabled = false;
        }
      }

      function goBack() {
        const reviewUrl = '/test-ui/review?articleId=' + encodeURIComponent(articleId);

        if (window.opener && !window.opener.closed) {
          try {
            if (!window.opener.location.pathname.includes('/test-ui/review')) {
              window.opener.location.href = reviewUrl;
            }

            window.opener.focus();
          } catch {}

          window.close();
          return;
        }

        window.location.href = reviewUrl;
      }

      reloadAdaptation().catch((error) => {
        render(String(error));
        setMessage(String(error), 'error');
      });

      const contentNode = document.getElementById('content');
      contentNode.addEventListener('input', () => {
        renderPersistentSelection();
        syncSaveAvailability();
      });
      contentNode.addEventListener('scroll', renderPersistentSelection);
      contentNode.addEventListener('mouseup', updateSelectionPreview);
      contentNode.addEventListener('keyup', updateSelectionPreview);
      contentNode.addEventListener('select', updateSelectionPreview);
    </script>
  </body>
</html>`;
  }
}
