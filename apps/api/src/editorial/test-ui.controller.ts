import { Controller, Get, Header, Query } from '@nestjs/common';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderDevConsoleStyles(): string {
  return `
      .dev-console-anchor {
        position: fixed;
        right: 24px;
        bottom: 24px;
        z-index: 50;
      }
      .dev-toggle {
        appearance: none;
        border: 0;
        border-radius: 999px;
        padding: 12px 16px;
        background: rgba(16, 24, 40, 0.92);
        color: #eef2ff;
        font: inherit;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 14px 30px rgba(15, 23, 42, 0.24);
      }
      .dev-backdrop {
        position: fixed;
        inset: 0;
        z-index: 70;
        background: rgba(9, 15, 28, 0.42);
        display: none;
        align-items: flex-end;
        justify-content: flex-end;
        padding: 24px;
      }
      .dev-backdrop.open {
        display: flex;
      }
      .dev-panel {
        width: min(540px, calc(100vw - 32px));
        max-height: min(70vh, 680px);
        display: grid;
        gap: 12px;
        padding: 18px;
        border-radius: 20px;
        border: 1px solid rgba(216, 223, 235, 0.9);
        background: rgba(15, 21, 34, 0.96);
        box-shadow: 0 24px 60px rgba(9, 15, 28, 0.32);
      }
      .dev-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        color: #eef2ff;
      }
      .dev-head strong {
        font-size: 15px;
        line-height: 1.2;
      }
      .dev-panel pre {
        margin: 0;
        padding: 18px;
        min-height: 220px;
        max-height: calc(70vh - 90px);
        overflow: auto;
        border-radius: 16px;
        background: #0f1522;
        color: #d8e1f4;
        font: 13px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace;
        white-space: pre-wrap;
        overflow-wrap: break-word;
      }
      @media (max-width: 720px) {
        .dev-console-anchor {
          right: 16px;
          bottom: 16px;
        }
        .dev-backdrop {
          padding: 16px;
        }
      }
`;
}

function renderDevConsoleMarkup(): string {
  return `
    <div class="dev-console-anchor">
      <button type="button" class="dev-toggle" onclick="toggleDevConsole(true)">Dev panel</button>
    </div>
    <div id="devConsoleBackdrop" class="dev-backdrop" onclick="toggleDevConsole(false, event)">
      <div class="dev-panel" onclick="event.stopPropagation()">
        <div class="dev-head">
          <strong>Developer panel</strong>
          <button type="button" class="secondary" onclick="toggleDevConsole(false)">Close</button>
        </div>
        <pre id="output">Ready.</pre>
      </div>
    </div>
`;
}

function renderDevConsoleScript(): string {
  return `
    <script>
      function toggleDevConsole(forceOpen, event) {
        if (event && event.target !== event.currentTarget) return;
        const overlay = document.getElementById('devConsoleBackdrop');
        if (!overlay) return;

        const shouldOpen = typeof forceOpen === 'boolean'
          ? forceOpen
          : !overlay.classList.contains('open');

        overlay.classList.toggle('open', shouldOpen);
        document.body.style.overflow = shouldOpen ? 'hidden' : '';
      }

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          toggleDevConsole(false);
        }
      });
    </script>
`;
}

function renderUnifiedWorkflowStyles(): string {
  return `
      :root {
        --bg: #ececed !important;
        --panel: rgba(255, 255, 255, 0.88) !important;
        --surface-soft: rgba(255, 255, 255, 0.54) !important;
        --text: #121212 !important;
        --muted: rgba(18, 18, 18, 0.58) !important;
        --border: rgba(18, 18, 18, 0.18) !important;
        --line-strong: rgba(18, 18, 18, 0.28) !important;
        --accent: #121212 !important;
        --accent-soft: rgba(255, 255, 255, 0.34) !important;
        --success: #117a43 !important;
        --success-soft: #ebfff4 !important;
        --warning: #b54708 !important;
        --warning-soft: #fff3e8 !important;
        --danger: #b42318 !important;
        --danger-soft: #fff0ed !important;
        --shadow: none !important;
      }
      body {
        background: var(--bg) !important;
        color: var(--text) !important;
        font: 15px/1.32 "Helvetica Neue", Helvetica, Arial, sans-serif !important;
      }
      .wrap {
        max-width: 1800px !important;
        padding: 22px 38px 40px !important;
        gap: 18px !important;
      }
      .panel, .hero, .card, .status-card, .content, .empty-state {
        background: var(--panel) !important;
        border: 1px solid rgba(18, 18, 18, 0.12) !important;
        border-radius: 34px !important;
        box-shadow: none !important;
      }
      .panel, .hero, .content {
        padding: 24px !important;
      }
      h1 {
        margin: 0 !important;
        font-size: clamp(36px, 4.8vw, 72px) !important;
        line-height: 0.92 !important;
        letter-spacing: -0.06em !important;
        font-weight: 400 !important;
      }
      h2 {
        margin: 0 !important;
        font-size: 28px !important;
        line-height: 1 !important;
        letter-spacing: -0.04em !important;
        font-weight: 400 !important;
      }
      h3 {
        margin: 0 !important;
        font-size: 22px !important;
        line-height: 1.06 !important;
        letter-spacing: -0.04em !important;
        font-weight: 400 !important;
      }
      p, .hero p, .sub, .status-subtitle, .meta-line, .post-copy, .translation-note, .channel-copy span, .note, .info-row span, .meta-box span, .meta-value {
        color: var(--muted) !important;
      }
      button, a.btn, .topbar a, .mini-btn, .version-dot {
        appearance: none !important;
        border: 1px solid var(--border) !important;
        border-radius: 999px !important;
        padding: 10px 18px !important;
        background: rgba(255, 255, 255, 0.34) !important;
        color: var(--text) !important;
        font: inherit !important;
        font-weight: 400 !important;
        text-decoration: none !important;
        box-shadow: none !important;
      }
      button:hover, a.btn:hover, .topbar a:hover, .mini-btn:hover, .version-dot:hover {
        background: rgba(255, 255, 255, 0.56) !important;
        transform: none !important;
      }
      button.secondary, .btn.secondary, .mini-btn.danger {
        background: rgba(255, 255, 255, 0.34) !important;
        color: var(--text) !important;
        border-color: var(--border) !important;
      }
      input, textarea, select {
        border: 1px solid var(--border) !important;
        border-radius: 18px !important;
        background: rgba(255, 255, 255, 0.72) !important;
        color: var(--text) !important;
        box-shadow: none !important;
      }
      label {
        color: var(--muted) !important;
        font-weight: 700 !important;
      }
      .check, .translation-box, .translation-row, .note, .meta-box, .version-strip, .ai-panel, .status-card, .post-card, .stat {
        border: 1px solid var(--border) !important;
        border-radius: 24px !important;
        background: var(--surface-soft) !important;
        box-shadow: none !important;
      }
      .placeholder, .content-highlight, .preview-box, .selection-preview {
        border: 1px dashed var(--border) !important;
        border-radius: 20px !important;
        background: rgba(255, 255, 255, 0.5) !important;
      }
      .badge, .status, .version-tag {
        border-radius: 999px !important;
        font-weight: 700 !important;
        letter-spacing: 0.04em !important;
        box-shadow: none !important;
      }
      .empty, .empty-state {
        border-style: dashed !important;
        color: var(--muted) !important;
      }
      .error, .publish-error {
        color: var(--danger) !important;
      }
      .control-panel, .editor-sidebar, .sidebar {
        top: 22px !important;
      }
      .actions, .hero-actions, .post-actions, .modal-actions {
        gap: 10px !important;
      }
      .layout, .grid, .editor-shell {
        gap: 18px !important;
      }
      pre {
        border-radius: 20px !important;
      }
      @media (max-width: 760px) {
        .wrap {
          padding: 18px 16px 28px !important;
        }
      }
`;
}

@Controller('test-ui')
export class TestUiController {
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderProjectsPage(): string {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Marketing Service - Projects</title>
    <style>
      :root {
        --bg: #ececed;
        --text: #121212;
        --muted: rgba(18, 18, 18, 0.58);
        --line: rgba(18, 18, 18, 0.18);
        --danger: #b42318;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font: 15px/1.32 "Helvetica Neue", Helvetica, Arial, sans-serif;
      }
      .wrap {
        max-width: 1800px;
        margin: 0 auto;
        padding: 22px 38px 40px;
        display: grid;
        gap: 18px;
      }
      .section-head,
      .project-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 24px;
      }
      h1 {
        margin: 0;
        font-size: clamp(60px, 7vw, 118px);
        line-height: 0.86;
        letter-spacing: -0.07em;
        font-weight: 400;
      }
      h2 {
        margin: 0;
        font-size: 34px;
        line-height: 1;
        letter-spacing: -0.04em;
        font-weight: 400;
      }
      .calendar-title {
        font-size: 20px;
        line-height: 1.05;
        letter-spacing: -0.04em;
      }
      h3 {
        margin: 0;
        font-size: 44px;
        line-height: 0.94;
        letter-spacing: -0.05em;
        font-weight: 400;
      }
      p {
        margin: 0;
        color: var(--muted);
      }
      button, a.btn, span.btn {
        appearance: none;
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 10px 18px;
        background: rgba(255, 255, 255, 0.34);
        color: var(--text);
        font: inherit;
        font-weight: 400;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background 120ms ease, opacity 120ms ease;
      }
      button:hover, a.btn:hover {
        background: rgba(255, 255, 255, 0.56);
      }
      .project-section {
        display: grid;
        gap: 14px;
      }
      .project-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
        gap: 18px;
      }
      .project-link {
        color: inherit;
        text-decoration: none;
        transition: transform 120ms ease, opacity 120ms ease;
      }
      .project-link:hover {
        opacity: 0.9;
        transform: translateY(-2px);
      }
      .project-card {
        display: grid;
        gap: 18px;
        padding: 24px;
        border: 1px solid rgba(18, 18, 18, 0.12);
        border-radius: 34px;
        background: rgba(255, 255, 255, 0.88);
        min-height: 180px;
      }
      .project-meta {
        color: var(--muted);
        font-size: 18px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .project-open {
        flex-shrink: 0;
        margin-top: 4px;
        background: rgba(255, 255, 255, 0.5);
      }
      .project-actions {
        display: flex;
        align-items: flex-start;
        gap: 10px;
      }
      .project-menu {
        position: relative;
      }
      .project-menu summary {
        list-style: none;
        width: 44px;
        min-width: 44px;
        height: 44px;
        padding: 0;
        border: 1px solid var(--line);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.5);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        line-height: 1;
        cursor: pointer;
        user-select: none;
      }
      .project-menu summary::-webkit-details-marker {
        display: none;
      }
      .project-menu-popover {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        min-width: 140px;
        padding: 8px;
        border: 1px solid var(--line);
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.96);
        box-shadow: 0 18px 40px rgba(18, 18, 18, 0.12);
        display: none;
        z-index: 2;
      }
      .project-menu[open] .project-menu-popover {
        display: grid;
      }
      .project-menu-item {
        width: 100%;
        justify-content: flex-start;
        white-space: nowrap;
      }
      .project-menu-item.danger {
        color: var(--danger);
        border-color: rgba(180, 35, 24, 0.18);
        background: rgba(180, 35, 24, 0.08);
      }
      .empty {
        padding: 18px 0;
        color: var(--muted);
      }
      .error {
        color: var(--danger);
        font-weight: 700;
        min-height: 20px;
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
        background: #f4f4f4;
        border: 1px solid var(--line);
        border-radius: 14px;
        box-shadow: 0 28px 60px rgba(9, 15, 28, 0.16);
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
        border: 1px solid var(--line);
        border-radius: 10px;
        font: inherit;
        color: var(--text);
        background: rgba(255, 255, 255, 0.78);
      }
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        flex-wrap: wrap;
      }
      @media (max-width: 760px) {
        .section-head,
        .project-row { flex-direction: column; }
        h3 {
          font-size: 30px;
        }
        .project-list {
          grid-template-columns: 1fr;
        }
      }
${renderDevConsoleStyles()}
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="project-section">
        <div class="section-head">
          <h2>Available projects</h2>
          <button onclick="openCreateProjectModal()">New project</button>
        </div>
        <div id="error" class="error"></div>
        <div id="projects" class="project-list"></div>
      </section>

    </div>

    <div id="projectModalBackdrop" class="modal-backdrop" onclick="closeCreateProjectModal(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <div>
          <h2 style="margin:0 0 8px;">Create project</h2>
          <p>Enter a name. The backend will generate the project ID automatically.</p>
        </div>
        <label>
          Project name
          <input id="projectName" placeholder="For example, Reinforce Content" />
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
        return new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Europe/Moscow',
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

      async function deleteProject(event, projectId) {
        event.preventDefault();
        event.stopPropagation();

        const menu = event.currentTarget.closest('details');
        if (menu) {
          menu.open = false;
        }

        const project = currentProjects.find((item) => item.id === projectId);
        const projectName = project?.name || projectId;

        const confirmed = window.confirm(
          'Delete project "' + projectName + '" and all related data? This cannot be undone.'
        );

        if (!confirmed) {
          return;
        }

        document.getElementById('error').textContent = '';
        try {
          await request('/projects/' + encodeURIComponent(projectId), {
            method: 'DELETE',
          });
          await loadProjects();
        } catch (err) {
          document.getElementById('error').textContent =
            err instanceof Error ? err.message : String(err);
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

        if (!currentProjects.length) {
          root.innerHTML = '<div class="empty">No projects yet. Click <strong>New project</strong> to create the first one.</div>';
          return;
        }

        root.innerHTML = currentProjects.map((project) => {
          const articleCount = currentArticleCounts.get(project.id) || 0;
          return \`
            <article class="project-card">
              <div class="project-row">
                <div>
                  <h3>\${escapeHtml(project.name)}</h3>
                  <div class="project-meta">Articles: \${escapeHtml(String(articleCount))}</div>
                </div>
                <div class="project-actions">
                  <details class="project-menu">
                    <summary aria-label="Project actions">⋯</summary>
                    <div class="project-menu-popover">
                      <button
                        type="button"
                        class="btn project-menu-item danger"
                        onclick="deleteProject(event, '\${escapeHtml(project.id)}')"
                      >
                        Delete
                      </button>
                    </div>
                  </details>
                  <a class="btn project-open" href="/test-ui/project?projectId=\${escapeHtml(project.id)}">Open project</a>
                </div>
              </div>
            </article>
          \`;
        }).join('');
      }

      loadProjects().catch((error) => {
        document.getElementById('error').textContent = error instanceof Error ? error.message : String(error);
      });
    </script>
${renderDevConsoleMarkup()}
${renderDevConsoleScript()}
  </body>
</html>`;
  }

  @Get('project')
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderProjectPage(@Query('projectId') projectId = 'project_123'): string {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Marketing Service - Project</title>
    <style>
      :root {
        --bg: #ececed;
        --text: #121212;
        --muted: rgba(18, 18, 18, 0.58);
        --line: rgba(18, 18, 18, 0.18);
        --line-strong: rgba(18, 18, 18, 0.28);
        --surface: rgba(255, 255, 255, 0.88);
        --surface-soft: rgba(255, 255, 255, 0.54);
        --success: #117a43;
        --success-soft: #ebfff4;
        --warning: #b54708;
        --warning-soft: #fff3e8;
        --danger: #b42318;
        --danger-soft: #fff0ed;
        --week-cell-height: 138px;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font: 15px/1.32 "Helvetica Neue", Helvetica, Arial, sans-serif;
      }
      .wrap {
        max-width: 1800px;
        margin: 0 auto;
        padding: 22px 38px 40px;
        display: grid;
        gap: 18px;
      }
      .project-card {
        display: grid;
        gap: 18px;
        padding: 24px;
        border: 1px solid rgba(18, 18, 18, 0.12);
        border-radius: 34px;
        background: var(--surface);
      }
      .section-head,
      .hero-top,
      .article-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 24px;
      }
      h1 {
        margin: 0;
        font-size: clamp(28px, 3.5vw, 56px);
        line-height: 0.86;
        letter-spacing: -0.07em;
        font-weight: 400;
      }
      h2 {
        margin: 0;
        font-size: 34px;
        line-height: 1;
        letter-spacing: -0.04em;
        font-weight: 400;
      }
      h3 {
        margin: 0;
        font-size: 34px;
        line-height: 0.98;
        letter-spacing: -0.05em;
        font-weight: 400;
      }
      p {
        margin: 0;
        color: var(--muted);
      }
      button, a.btn, span.btn {
        appearance: none;
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 10px 18px;
        background: rgba(255, 255, 255, 0.34);
        color: var(--text);
        font: inherit;
        font-weight: 400;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background 120ms ease, opacity 120ms ease, transform 120ms ease;
      }
      button:hover, a.btn:hover {
        background: rgba(255, 255, 255, 0.56);
      }
      button.primary, a.btn.primary {
        background: rgba(18, 18, 18, 0.92);
        color: #fff;
        border-color: rgba(18, 18, 18, 0.92);
      }
      a.btn.marker-linked {
        border-color: var(--marker-border);
        background: var(--marker-bg);
        color: var(--marker-text);
      }
      a.btn.marker-linked:hover {
        background: var(--marker-bg);
        transform: translateY(-1px);
      }
      .btn-with-badge {
        position: relative;
        padding-right: 44px;
      }
      .notification-badge {
        position: absolute;
        top: -8px;
        right: -6px;
        min-width: 24px;
        height: 24px;
        padding: 0 7px;
        border-radius: 999px;
        background: #b42318;
        color: #fff;
        font-size: 11px;
        font-weight: 800;
        line-height: 24px;
        text-align: center;
        box-shadow: 0 0 0 4px rgba(236, 236, 237, 0.96);
      }
      .notification-badge.is-zero {
        background: rgba(18, 18, 18, 0.24);
        color: rgba(255, 255, 255, 0.92);
      }
      .hero-copy,
      .section-copy {
        display: grid;
        gap: 12px;
      }
      .eyebrow,
      .meta-label {
        color: var(--muted);
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .hero-actions,
      .week-nav,
      .card-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .project-view-switch,
      .campaign-segment-row {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .project-view-switch button,
      .campaign-segment-row button {
        min-width: 180px;
      }
      .project-view-switch button.is-active,
      .campaign-segment-row button.is-active {
        background: rgba(18, 18, 18, 0.92);
        color: #fff;
        border-color: rgba(18, 18, 18, 0.92);
      }
      .project-view-panel[hidden] {
        display: none;
      }
      .campaign-list-head {
        align-items: end;
        margin-bottom: 18px;
      }
      .campaign-card-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }
      .campaign-card {
        padding: 20px;
        border: 1px solid var(--line);
        border-radius: 28px;
        background: rgba(255, 255, 255, 0.5);
        display: grid;
        gap: 12px;
      }
      .campaign-card-head,
      .campaigns-toolbar {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }
      .campaign-card-meta,
      .pill-row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .pill,
      .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .pill {
        min-height: 30px;
        padding: 7px 10px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.48);
        color: var(--muted);
      }
      .badge {
        min-height: 34px;
        padding: 8px 12px;
      }
      .badge.success {
        background: var(--success-soft);
        color: var(--success);
      }
      .badge.warning {
        background: var(--warning-soft);
        color: var(--warning);
      }
      .badge.danger {
        background: var(--danger-soft);
        color: var(--danger);
      }
      .badge.neutral {
        background: var(--surface-soft);
        color: var(--text);
      }
      .soft {
        color: var(--muted);
      }
      .calendar-controls {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        flex-wrap: wrap;
      }
      .calendar-switch {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .calendar-switch-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .calendar-switch button.is-active {
        background: rgba(18, 18, 18, 0.92);
        color: #fff;
        border-color: rgba(18, 18, 18, 0.92);
      }
      .calendar-headline {
        display: flex;
        align-items: center;
        gap: 14px;
        flex-wrap: wrap;
      }
      .calendar-range {
        display: inline-flex;
        align-items: center;
        padding: 6px 12px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.6);
        color: var(--muted);
        font-size: 12px;
        line-height: 1;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        white-space: nowrap;
      }
      .marker-toolbar {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        flex-wrap: wrap;
      }
      .marker-toolbar-label {
        padding-top: 12px;
        white-space: nowrap;
      }
      .marker-toolbar-main {
        display: grid;
        gap: 10px;
        min-width: 0;
        flex: 1 1 auto;
      }
      .marker-toolbar-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-left: auto;
      }
      .marker-list {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      .marker-pill-wrap {
        position: relative;
      }
      .marker-pill {
        max-width: 260px;
        min-height: 98px;
        padding: 14px 16px;
        border-radius: 24px;
        border: 1px dashed var(--marker-border, var(--line));
        background: rgba(255, 255, 255, 0.72);
        color: var(--marker-text, var(--text));
        display: grid;
        gap: 8px;
        justify-items: start;
        text-align: left;
      }
      .marker-delete {
        position: absolute;
        top: -8px;
        left: -8px;
        width: 28px;
        height: 28px;
        min-width: 28px;
        padding: 0;
        border: 0;
        border-radius: 999px;
        background: #cf222e;
        color: #fff;
        font-size: 18px;
        line-height: 1;
        font-weight: 700;
        box-shadow: 0 8px 18px rgba(207, 34, 46, 0.2);
        z-index: 2;
      }
      .marker-delete:hover {
        background: #b91c1c;
      }
      .marker-pill.is-active {
        border-style: solid;
        background: var(--marker-bg, rgba(255, 255, 255, 0.54));
        box-shadow: inset 0 0 0 1px rgba(18, 18, 18, 0.08);
      }
      .marker-pill strong {
        font-size: 20px;
        line-height: 1.05;
        letter-spacing: -0.04em;
        font-weight: 400;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .marker-pill span {
        color: rgba(18, 18, 18, 0.62);
        font-size: 12px;
        line-height: 1.35;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .marker-pill-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        opacity: 0.68;
      }
      .marker-empty {
        padding: 20px 22px;
        border: 1px dashed var(--line);
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.34);
        color: var(--muted);
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
      }
      .stat {
        padding: 18px;
        border: 1px solid var(--line);
        border-radius: 24px;
        background: var(--surface-soft);
        min-height: 116px;
        display: grid;
        align-content: space-between;
        gap: 12px;
      }
      .stat strong {
        font-size: 30px;
        line-height: 1;
        letter-spacing: -0.05em;
        font-weight: 400;
      }
      .week-header {
        display: block;
      }
      .schedule-shell {
        overflow-x: auto;
        padding-bottom: 4px;
      }
      .week-nav button {
        min-width: 112px;
      }
      .calendar-switch-row .week-nav {
        margin-left: auto;
      }
      .week-board {
        display: grid;
        grid-template-columns: 152px repeat(7, minmax(132px, 1fr));
        gap: 10px;
        align-items: start;
        min-width: 1120px;
      }
      .week-corner,
      .week-column-head,
      .week-row-head,
      .week-cell {
        border: 1px solid var(--line);
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.5);
      }
      .week-corner {
        min-height: 96px;
        padding: 16px;
        display: flex;
        align-items: end;
        color: var(--muted);
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .week-column-head {
        min-height: 96px;
        padding: 16px 14px;
        display: grid;
        align-content: space-between;
      }
      .week-column-head.is-today {
        border-color: var(--line-strong);
        background: rgba(255, 255, 255, 0.82);
      }
      .week-column-head small {
        color: var(--muted);
        font-weight: 400;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .week-column-head strong {
        font-size: 36px;
        line-height: 0.92;
        letter-spacing: -0.06em;
        font-weight: 400;
      }
      .week-column-head span {
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .week-row-head {
        height: var(--week-cell-height);
        min-height: var(--week-cell-height);
        padding: 16px;
        display: grid;
        align-content: center;
        gap: 6px;
      }
      .week-row-head strong {
        font-size: 24px;
        line-height: 1.2;
        letter-spacing: -0.04em;
        font-weight: 400;
      }
      .week-row-head span {
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .week-cell {
        height: var(--week-cell-height);
        min-height: var(--week-cell-height);
        padding: 10px;
        display: flex;
        overflow: hidden;
        text-decoration: none;
        color: inherit;
        transition: transform 120ms ease, background 120ms ease, border-color 120ms ease;
      }
      .week-cell.is-placeable {
        cursor: pointer;
        border-style: dashed;
      }
      .week-cell.is-today {
        border-color: var(--line-strong);
      }
      .week-cell:hover {
        background: rgba(255, 255, 255, 0.78);
        transform: translateY(-1px);
      }
      .week-cell-scroll {
        flex: 1;
        display: grid;
        align-content: start;
        gap: 6px;
        overflow-y: auto;
        overflow-x: hidden;
        overscroll-behavior: contain;
        padding-right: 4px;
        min-height: 0;
        scrollbar-width: thin;
        scrollbar-color: rgba(18, 18, 18, 0.28) transparent;
      }
      .week-cell-scroll::-webkit-scrollbar {
        width: 6px;
      }
      .week-cell-scroll::-webkit-scrollbar-track {
        background: transparent;
      }
      .week-cell-scroll::-webkit-scrollbar-thumb {
        background: rgba(18, 18, 18, 0.24);
        border-radius: 999px;
      }
      .week-cell-placeholder {
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .week-marker {
        --marker-bg: rgba(255, 255, 255, 0.72);
        --marker-border: rgba(18, 18, 18, 0.22);
        --marker-text: var(--text);
        padding: 8px 10px;
        border-radius: 16px;
        border: 1px dashed var(--marker-border);
        background: var(--marker-bg);
        color: var(--marker-text);
        display: grid;
        gap: 6px;
      }
      .week-marker.is-active {
        border-style: solid;
        box-shadow: inset 0 0 0 1px rgba(18, 18, 18, 0.08);
      }
      .week-marker-title {
        font-size: 12px;
        line-height: 1.2;
        letter-spacing: -0.02em;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .week-marker-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
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
        padding: 8px 10px;
        min-width: 0;
        border-radius: 16px;
        background: var(--pub-bg);
        border: 1px solid var(--pub-border);
      }
      .week-publication[data-clickable="true"] {
        cursor: pointer;
      }
      .week-publication.is-published {
        opacity: 0.52;
        filter: grayscale(0.15);
      }
      .week-publication-language {
        color: var(--pub-text);
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        white-space: nowrap;
      }
      .week-publication-time {
        color: var(--pub-time);
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
      }
      .section-stack,
      .cards {
        display: grid;
        gap: 24px;
      }
      .cards {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 24px;
      }
      .articles-section {
        gap: 16px;
      }
      .article-card {
        display: grid;
        gap: 0;
        padding: 0;
        border: 0;
        border-radius: 24px;
        background: transparent;
        align-content: start;
        height: 170px;
      }
      .article-top h3 {
        margin: 0;
        font-size: 27px;
        line-height: 1.05;
        letter-spacing: -0.04em;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .article-headline {
        display: grid;
        gap: 10px;
        min-height: 0;
      }
      .article-top {
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        gap: 10px;
        min-height: 0;
      }
      .empty {
        padding: 28px;
        border: 1px dashed var(--line);
        border-radius: 28px;
        color: var(--muted);
        background: rgba(255, 255, 255, 0.36);
      }
      .error {
        color: var(--danger);
        font-weight: 700;
        min-height: 24px;
      }
      .error:empty {
        display: none;
        min-height: 0;
      }
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(18, 18, 18, 0.22);
        display: none;
        place-items: center;
        padding: 24px;
      }
      .modal-backdrop.open {
        display: grid;
      }
      .modal {
        width: min(560px, 100%);
        background: rgba(255, 255, 255, 0.96);
        border: 1px solid rgba(18, 18, 18, 0.12);
        border-radius: 30px;
        padding: 24px;
        display: grid;
        gap: 14px;
      }
      .modal.is-wide {
        width: min(760px, 100%);
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
        line-height: 1;
        letter-spacing: -0.04em;
        font-weight: 400;
      }
      .modal-head p {
        margin: 0;
        color: var(--muted);
      }
      label {
        display: grid;
        gap: 6px;
        color: var(--muted);
        font-weight: 400;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 12px;
      }
      input,
      textarea,
      select {
        width: 100%;
        padding: 14px 16px;
        border: 1px solid var(--line);
        border-radius: 18px;
        font: inherit;
        color: var(--text);
        background: rgba(255, 255, 255, 0.86);
      }
      textarea {
        min-height: 120px;
        resize: vertical;
      }
      .modal-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .publication-detail-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
      .publication-detail-item {
        display: grid;
        gap: 6px;
        min-height: 82px;
        padding: 14px;
        border: 1px solid var(--line);
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.52);
      }
      .publication-detail-item label {
        display: block;
      }
      .publication-detail-item strong {
        font-size: 16px;
        line-height: 1.2;
        font-weight: 400;
        overflow-wrap: anywhere;
      }
      .publication-detail-link[hidden] {
        display: none;
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
      @media (max-width: 980px) {
        .stats {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .campaign-card-grid {
          grid-template-columns: 1fr;
        }
        .cards {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 760px) {
        .wrap {
          padding: 18px 16px 28px;
        }
        .section-head,
        .hero-top,
        .article-top {
          flex-direction: column;
        }
        .marker-toolbar {
          flex-direction: column;
          align-items: flex-start;
        }
        .marker-toolbar-label {
          padding-top: 0;
        }
        .marker-toolbar-actions {
          margin-left: 0;
        }
        .calendar-headline {
          align-items: flex-start;
        }
        .calendar-switch-row {
          align-items: flex-start;
        }
        .calendar-switch-row .week-nav {
          margin-left: 0;
        }
        .week-header {
          flex-direction: column;
          align-items: flex-start;
        }
        .stats {
          grid-template-columns: 1fr;
        }
      }
${renderDevConsoleStyles()}
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="project-card">
        <div class="hero-top">
          <div class="hero-copy">
            <span class="eyebrow">Project</span>
            <h1 id="projectName">Loading project</h1>
          </div>
          <div class="hero-actions">
            <a class="btn" href="/test-ui">All projects</a>
            <a id="projectInboxLink" class="btn btn-with-badge" href="/test-ui/project-inbox?projectId=${escapeHtml(projectId)}">
              <span id="projectInboxBadge" class="notification-badge is-zero" hidden>0</span>
              Inbox
            </a>
            <a class="btn" href="/test-ui/brand-memory?projectId=${escapeHtml(projectId)}">Brand memory</a>
            <div class="project-view-switch" role="tablist" aria-label="Project sections">
              <button id="dashboardViewBtn" class="is-active" type="button" onclick="setProjectView('dashboard')">Dashboard</button>
              <button id="campaignsViewBtn" type="button" onclick="setProjectView('campaigns')">Campaigns</button>
            </div>
          </div>
        </div>
      </section>

      <section id="dashboardView" class="project-card section-stack project-view-panel">
        <div class="section-head">
          <div class="section-copy">
            <div class="calendar-headline">
              <h2 class="calendar-title">Publication calendar</h2>
              <span id="weekRange" class="calendar-range"></span>
              <a
                class="btn primary"
                id="dashboardCreateCampaignBtn"
                href="/test-ui/campaigns/new?projectId=${escapeHtml(projectId)}"
                hidden
              >Create campaign</a>
            </div>
          </div>
        </div>
        <div class="marker-toolbar">
          <span class="eyebrow marker-toolbar-label">Draft markers</span>
          <div class="marker-toolbar-main">
            <div id="markerList" class="marker-list"></div>
            <p id="markerToolbarMeta"></p>
          </div>
          <div class="marker-toolbar-actions">
            <button id="editMarkersBtn" onclick="toggleMarkerEditMode()">Edit markers</button>
            <button onclick="openMarkerModal()">New marker</button>
          </div>
        </div>
        <div id="error" class="error"></div>
        <div class="week-header"></div>
        <div class="calendar-switch-row">
          <div class="calendar-switch">
            <button id="postsModeBtn" class="is-active" onclick="setCalendarMode('posts')">Publications</button>
            <button id="markersModeBtn" onclick="setCalendarMode('markers')">Plans</button>
          </div>
          <div class="week-nav">
            <button onclick="shiftWeek(-1)" aria-label="Previous week">Previous</button>
            <button onclick="shiftWeek(1)" aria-label="Next week">Next</button>
          </div>
        </div>
        <div class="schedule-shell">
          <div id="weekGrid" class="week-board"></div>
        </div>
      </section>

      <section id="campaignsView" class="project-card section-stack project-view-panel" hidden>
        <div class="campaigns-toolbar">
          <div class="campaign-segment-row" role="tablist" aria-label="Campaign groups">
            <button id="activeCampaignsTab" class="is-active" type="button" data-campaign-group="active">Active<span id="activeCampaignsCount">&nbsp;(0)</span></button>
            <button id="draftCampaignsTab" type="button" data-campaign-group="drafts">Drafts<span id="draftCampaignsCount">&nbsp;(0)</span></button>
            <button id="completedCampaignsTab" type="button" data-campaign-group="completed">Completed<span id="completedCampaignsCount">&nbsp;(0)</span></button>
          </div>
          <div class="hero-actions">
            <a class="btn primary" id="createCampaignFromProjectBtn" href="/test-ui/campaigns/new?projectId=${escapeHtml(projectId)}">Create campaign</a>
          </div>
        </div>
        <div id="projectCampaignCards" class="campaign-card-grid"></div>
      </section>

    </div>

    <div id="markerModalBackdrop" class="modal-backdrop" onclick="closeMarkerModal(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-head">
          <div>
            <h3>Create draft marker</h3>
            <p>Save an idea for future publications and then place it on the current week.</p>
          </div>
          <button type="button" onclick="closeMarkerModal()">Close</button>
        </div>
        <label>
          Idea
          <input id="markerTitle" type="text" maxlength="180" />
        </label>
        <label>
          Notes
          <textarea id="markerNotes" maxlength="2000"></textarea>
        </label>
        <div class="modal-actions">
          <button type="button" onclick="saveMarker()">Save marker</button>
          <button type="button" onclick="closeMarkerModal()">Cancel</button>
        </div>
        <div id="markerError" class="error"></div>
      </div>
    </div>

    <div id="markerPlacementModalBackdrop" class="modal-backdrop" onclick="closeMarkerPlacementModal(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-head">
          <div>
            <h3>Place draft marker</h3>
            <p id="markerPlacementSubtitle">Choose language and time for this marker placement.</p>
          </div>
          <button type="button" onclick="closeMarkerPlacementModal()">Close</button>
        </div>
        <label>
          Language
          <select id="markerPlacementLanguage"></select>
        </label>
        <label>
          Time
          <input id="markerPlacementTime" type="time" />
        </label>
        <div class="modal-actions">
          <button type="button" onclick="saveMarkerPlacement()">Save placement</button>
          <button type="button" onclick="closeMarkerPlacementModal()">Cancel</button>
        </div>
        <div id="markerPlacementError" class="error"></div>
      </div>
    </div>

    <div id="publicationDetailsModalBackdrop" class="modal-backdrop" onclick="closePublicationDetailsModal(event)">
      <div class="modal is-wide" onclick="event.stopPropagation()">
        <div class="modal-head">
          <div>
            <h3 id="publicationDetailsTitle">Publication</h3>
            <p id="publicationDetailsSubtitle">Published publication details.</p>
          </div>
          <button type="button" onclick="closePublicationDetailsModal()">Close</button>
        </div>
        <div id="publicationDetailsGrid" class="publication-detail-grid"></div>
        <div class="modal-actions">
          <a id="publicationExternalLink" class="btn primary publication-detail-link" href="#" target="_blank" rel="noopener noreferrer" hidden>Open published post</a>
          <a id="publicationCampaignLink" class="btn" href="#">Open campaign</a>
        </div>
        <div id="publicationDetailsError" class="error"></div>
      </div>
    </div>

    <script>
      const currentProjectId = ${JSON.stringify(projectId)};
      const weekDayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
      const monthLabels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const adaptationChannels = [
        { id: 'channel_telegram', label: 'Telegram', hint: 'Adaptation' },
        { id: 'channel_x', label: 'X', hint: 'Adaptation' },
        { id: 'channel_discord', label: 'Discord', hint: 'Adaptation' },
        { id: 'channel_blog', label: 'Blog', hint: 'Adaptation' },
      ];
      const articleColorThemes = [
        { bg: '#eaf0ff', border: '#cfdbff', text: '#173b93', time: '#35507d' },
        { bg: '#ebfff4', border: '#c9f0d9', text: '#117a43', time: '#2e6a4a' },
        { bg: '#fff3e8', border: '#ffd7b3', text: '#b54708', time: '#8f4a14' },
        { bg: '#f5edff', border: '#dcc9ff', text: '#6f42c1', time: '#6b4ea0' },
        { bg: '#e8fbff', border: '#bdebf5', text: '#0c6b7a', time: '#2d6670' },
        { bg: '#fff0f5', border: '#ffc9dc', text: '#b42363', time: '#8f3f62' },
      ];
      const MOSCOW_OFFSET_MS = 3 * 60 * 60 * 1000;
      let currentProject = null;
      let currentWeekStart = startOfWeek(new Date());
      let currentProjectArticles = [];
      let currentProjectMarkers = [];
      let currentProjectMarkerPlacements = [];
      let currentProjectPlans = [];
      let currentProjectCampaigns = [];
      let currentPublicationsByArticle = new Map();
      let dashboardPublicationDetails = new Map();
      let currentProjectInboxPendingCount = 0;
      let activeMarkerId = null;
      let markerEditMode = false;
      let pendingMarkerPlacement = null;
      let calendarMode = 'posts';
      let projectView = 'dashboard';
      let currentCampaignGroup = 'active';
      let groupedCampaigns = {
        active: [],
        drafts: [],
        completed: [],
      };
      const draftCampaignStatuses = new Set([
        'draft',
        'source_checking',
        'source_needs_review',
        'producing',
        'needs_attention',
        'ready_for_final_approval',
        'failed',
        'cancelled',
      ]);
      const completedPublicationStatuses = new Set(['published', 'exported']);

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

      async function request(url, options, config) {
        const shouldRender = config?.renderResponse ?? true;
        const response = await fetch(url, options);
        const text = await response.text();
        let payload;
        try {
          payload = text ? JSON.parse(text) : {};
        } catch {
          payload = text;
        }

        if (shouldRender) {
          renderOutput(payload);
        }

        if (!response.ok) {
          throw new Error(payload?.message || 'Request failed');
        }

        return payload;
      }

      function formatDate(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(date);
      }

      function formatDateOnly(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Europe/Moscow',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(date);
      }

      function toMoscowShiftedDate(value) {
        const date = value instanceof Date ? new Date(value) : new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        return new Date(date.getTime() + MOSCOW_OFFSET_MS);
      }

      function getMoscowDateParts(value) {
        const shifted = toMoscowShiftedDate(value);
        if (!shifted) return null;
        return {
          year: shifted.getUTCFullYear(),
          month: shifted.getUTCMonth(),
          day: shifted.getUTCDate(),
          hours: shifted.getUTCHours(),
          minutes: shifted.getUTCMinutes(),
        };
      }

      function buildMoscowIsoFromDayKeyAndTime(dayKey, timeValue) {
        const [year, month, day] = String(dayKey || '').split('-').map((part) => Number(part));
        const [hours, minutes] = String(timeValue || '').split(':').map((part) => Number(part));
        if (!year || !month || !day || Number.isNaN(hours) || Number.isNaN(minutes)) {
          return null;
        }
        return new Date(Date.UTC(year, month - 1, day, hours - 3, minutes, 0, 0)).toISOString();
      }

      function formatTime(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Europe/Moscow',
          hour: '2-digit',
          minute: '2-digit',
        }).format(date);
      }

      function toTitle(value) {
        return String(value || '')
          .replace(/_/g, ' ')
          .replace(/\\b\\w/g, (letter) => letter.toUpperCase());
      }

      function renderBadge(status) {
        const normalized = String(status || 'unknown').toLowerCase();
        const className = normalized.includes('failed') || normalized.includes('error')
          ? 'danger'
          : normalized.includes('pending') || normalized.includes('review') || normalized.includes('attention') || normalized.includes('draft') || normalized.includes('checking') || normalized.includes('producing')
            ? 'warning'
            : normalized.includes('published') || normalized.includes('completed') || normalized.includes('approved') || normalized.includes('exported')
              ? 'success'
              : 'neutral';

        return '<span class="badge ' + className + '">' + escapeHtml(toTitle(normalized)) + '</span>';
      }

      function languageLabel(language) {
        const normalized = String(language || '').toLowerCase();
        if (normalized === 'ru') return 'Russian';
        if (normalized === 'en') return 'English';
        if (normalized === 'es') return 'Spanish';
        if (normalized === 'id') return 'Indonesian';
        if (normalized === 'fil') return 'Filipino';
        if (normalized === 'vi') return 'Vietnamese';
        if (normalized === 'pt') return 'Portuguese';
        return normalized.toUpperCase();
      }

      function languageCode(language) {
        return String(language || '').toUpperCase();
      }

      function channelLabel(channelId) {
        return adaptationChannels.find((channel) => channel.id === channelId)?.label || toTitle(String(channelId || '').replace('channel_', ''));
      }

      function markerById(markerId) {
        return currentProjectMarkers.find((marker) => marker.id === markerId) || null;
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

      function renderProjectHero() {
        const projectName = currentProject?.name || currentProjectId;
        const createCampaignBtn = document.getElementById('createCampaignFromProjectBtn');
        const dashboardCreateCampaignBtn = document.getElementById('dashboardCreateCampaignBtn');
        const projectInboxLink = document.getElementById('projectInboxLink');
        const activeMarker = markerById(activeMarkerId);
        const hasMarkerPlacements = activeMarker
          ? currentProjectMarkerPlacements.some((placement) => placement.markerId === activeMarker.id)
          : false;
        const createCampaignUrl = '/test-ui/campaigns/new?projectId=' + encodeURIComponent(currentProjectId) +
          (activeMarker
            ? '&markerId=' + encodeURIComponent(activeMarker.id)
            : '');

        document.title = 'Marketing Service - ' + projectName;
        document.getElementById('projectName').textContent = projectName;
        if (projectInboxLink) {
          projectInboxLink.setAttribute(
            'href',
            '/test-ui/project-inbox?projectId=' + encodeURIComponent(currentProjectId),
          );
        }
        if (createCampaignBtn) {
          createCampaignBtn.setAttribute('href', createCampaignUrl);
          createCampaignBtn.classList.toggle('marker-linked', Boolean(activeMarker));
          if (activeMarker) {
            createCampaignBtn.style.setProperty('--marker-bg', activeMarker.colorBg);
            createCampaignBtn.style.setProperty('--marker-border', activeMarker.colorBorder);
            createCampaignBtn.style.setProperty('--marker-text', activeMarker.colorText);
          } else {
            createCampaignBtn.style.removeProperty('--marker-bg');
            createCampaignBtn.style.removeProperty('--marker-border');
            createCampaignBtn.style.removeProperty('--marker-text');
          }
        }
        if (dashboardCreateCampaignBtn) {
          dashboardCreateCampaignBtn.hidden = !activeMarker;
          dashboardCreateCampaignBtn.setAttribute('href', createCampaignUrl);
          dashboardCreateCampaignBtn.classList.toggle('marker-linked', Boolean(activeMarker));
          if (activeMarker) {
            dashboardCreateCampaignBtn.style.setProperty('--marker-bg', activeMarker.colorBg);
            dashboardCreateCampaignBtn.style.setProperty('--marker-border', activeMarker.colorBorder);
            dashboardCreateCampaignBtn.style.setProperty('--marker-text', activeMarker.colorText);
          } else {
            dashboardCreateCampaignBtn.style.removeProperty('--marker-bg');
            dashboardCreateCampaignBtn.style.removeProperty('--marker-border');
            dashboardCreateCampaignBtn.style.removeProperty('--marker-text');
          }
        }
      }

      function updateProjectInboxLink(pendingCount) {
        currentProjectInboxPendingCount = Number(pendingCount || 0);
        const badge = document.getElementById('projectInboxBadge');
        if (!badge) {
          return;
        }
        badge.textContent = String(currentProjectInboxPendingCount);
        badge.hidden = currentProjectInboxPendingCount === 0;
        badge.classList.toggle('is-zero', currentProjectInboxPendingCount === 0);
      }

      function setProjectView(view) {
        projectView = view === 'campaigns' ? 'campaigns' : 'dashboard';
        document.getElementById('dashboardView').hidden = projectView !== 'dashboard';
        document.getElementById('campaignsView').hidden = projectView !== 'campaigns';
        document.getElementById('dashboardViewBtn').classList.toggle('is-active', projectView === 'dashboard');
        document.getElementById('campaignsViewBtn').classList.toggle('is-active', projectView === 'campaigns');

        if (projectView === 'campaigns') {
          loadCampaigns().catch((error) => {
            document.getElementById('projectCampaignCards').innerHTML =
              '<div class="empty">' + escapeHtml(error instanceof Error ? error.message : String(error)) + '</div>';
          });
        }
      }

      function getCampaignStatusCount(campaign, status) {
        return Number(campaign.publicationStatusCounts?.[status] || 0);
      }

      function completedCampaignPublicationCount(campaign) {
        return [...completedPublicationStatuses].reduce(
          (sum, status) => sum + getCampaignStatusCount(campaign, status),
          0,
        );
      }

      function isCompletedCampaign(campaign) {
        return Number(campaign.plannedPublicationCount || 0) > 0 &&
          completedCampaignPublicationCount(campaign) >= Number(campaign.plannedPublicationCount || 0);
      }

      function isDraftCampaign(campaign) {
        return Number(campaign.pendingApprovalCount || 0) > 0 ||
          draftCampaignStatuses.has(campaign.status) ||
          Number(campaign.plannedPublicationCount || 0) === 0;
      }

      function groupCampaigns(campaigns) {
        const groups = {
          active: [],
          drafts: [],
          completed: [],
        };

        campaigns.forEach((campaign) => {
          if (isCompletedCampaign(campaign) || campaign.status === 'completed') {
            groups.completed.push(campaign);
            return;
          }

          if (isDraftCampaign(campaign)) {
            groups.drafts.push(campaign);
            return;
          }

          groups.active.push(campaign);
        });

        return groups;
      }

      function campaignGroupLabel(group) {
        if (group === 'drafts') return 'draft campaigns';
        if (group === 'completed') return 'completed campaigns';
        return 'active campaigns';
      }

      function campaignForArticle(articleId) {
        return currentProjectCampaigns.find((campaign) => campaign.sourceArticleId === articleId) || null;
      }

      function articleForId(articleId) {
        return currentProjectArticles.find((article) => article.id === articleId) || null;
      }

      function openCampaignFromPublication(event, campaignId) {
        if (event) {
          event.stopPropagation();
        }

        if (!campaignId) {
          return;
        }

        window.location.href =
          '/test-ui/campaigns/new?projectId=' + encodeURIComponent(currentProjectId) +
          '&campaignId=' + encodeURIComponent(campaignId);
      }

      function resolvePublicationUrl(publication) {
        if (!publication) {
          return null;
        }

        if (publication.externalUrl) {
          return publication.externalUrl;
        }

        const postId = String(publication.telegramMessageId || '').trim();
        const accountRef = String(publication.telegramChatId || '').trim();

        if (!postId) {
          return null;
        }

        if (publication.channelId === 'channel_x') {
          return 'https://x.com/i/web/status/' + encodeURIComponent(postId);
        }

        if (publication.channelId === 'channel_telegram') {
          if (accountRef.startsWith('@')) {
            return 'https://t.me/' + encodeURIComponent(accountRef.slice(1)) + '/' + encodeURIComponent(postId);
          }

          if (/^-100\\d+$/.test(accountRef)) {
            return 'https://t.me/c/' + encodeURIComponent(accountRef.slice(4)) + '/' + encodeURIComponent(postId);
          }
        }

        if (publication.channelId === 'channel_discord' && accountRef.includes('/')) {
          const parts = accountRef.split('/');
          if (parts[0] && parts[1]) {
            return 'https://discord.com/channels/' + encodeURIComponent(parts[0]) + '/' + encodeURIComponent(parts[1]) + '/' + encodeURIComponent(postId);
          }
        }

        return null;
      }

      function renderPublicationDetailItem(label, value) {
        return '<div class="publication-detail-item">' +
          '<label>' + escapeHtml(label) + '</label>' +
          '<strong>' + escapeHtml(value || '—') + '</strong>' +
        '</div>';
      }

      function openDashboardPublicationDetails(event, detailKey) {
        if (event) {
          event.stopPropagation();
        }

        const detail = dashboardPublicationDetails.get(detailKey);
        if (!detail) {
          return;
        }

        const publication = detail.publication || null;
        const campaign = detail.campaign || null;

        if (publication?.status !== 'published' && campaign?.id) {
          openCampaignFromPublication(event, campaign.id);
          return;
        }

        const url = resolvePublicationUrl(publication);
        const modal = document.getElementById('publicationDetailsModalBackdrop');
        const externalLink = document.getElementById('publicationExternalLink');
        const campaignLink = document.getElementById('publicationCampaignLink');

        document.getElementById('publicationDetailsTitle').textContent =
          campaign?.name || detail.articleTitle || 'Publication';
        document.getElementById('publicationDetailsSubtitle').textContent =
          publication?.status === 'published'
            ? 'Published publication details and external link.'
            : 'Publication details.';
        document.getElementById('publicationDetailsGrid').innerHTML = [
          renderPublicationDetailItem('Channel', channelLabel(detail.channelId)),
          renderPublicationDetailItem('Language', languageCode(detail.targetLanguage)),
          renderPublicationDetailItem('Status', toTitle(publication?.status || 'planned')),
          renderPublicationDetailItem('Scheduled for', formatDate(detail.publishAt)),
          renderPublicationDetailItem('Published at', publication?.publishedAt ? formatDate(publication.publishedAt) : null),
          renderPublicationDetailItem('Publication id', publication?.id || detail.id),
          renderPublicationDetailItem('External account', publication?.telegramChatId || null),
          renderPublicationDetailItem('External post', publication?.telegramMessageId || null),
        ].join('');

        if (url) {
          externalLink.hidden = false;
          externalLink.href = url;
        } else {
          externalLink.hidden = true;
          externalLink.removeAttribute('href');
        }

        if (campaign?.id) {
          campaignLink.hidden = false;
          campaignLink.href =
            '/test-ui/campaigns/new?projectId=' + encodeURIComponent(currentProjectId) +
            '&campaignId=' + encodeURIComponent(campaign.id);
        } else {
          campaignLink.hidden = true;
          campaignLink.removeAttribute('href');
        }

        document.getElementById('publicationDetailsError').textContent =
          publication?.status === 'published' && !url
            ? 'Published post id is saved, but this channel did not provide enough data to build a public URL.'
            : '';
        modal.classList.add('open');
      }

      function closePublicationDetailsModal(event) {
        if (event && event.target !== event.currentTarget) {
          return;
        }
        document.getElementById('publicationDetailsModalBackdrop').classList.remove('open');
      }

      function campaignActions(campaign) {
        const actions = [
          '<a class="btn primary" href="/test-ui/campaigns/new?projectId=' + encodeURIComponent(currentProjectId) + '&campaignId=' + encodeURIComponent(campaign.id) + '">Open</a>',
        ];

        if (Number(campaign.pendingApprovalCount || 0) > 0) {
          actions.push('<a class="btn" href="/test-ui/campaign-inbox?campaignId=' + encodeURIComponent(campaign.id) + '">Inbox</a>');
        }
        if (isDraftCampaign(campaign)) {
          actions.push('<button type="button" class="btn danger" data-delete-campaign="' + escapeHtml(campaign.id) + '">Delete</button>');
        }
        return actions.join('');
      }

      function renderCampaignCards(campaigns) {
        const root = document.getElementById('projectCampaignCards');
        if (!Array.isArray(campaigns) || campaigns.length === 0) {
          root.innerHTML = '<div class="empty">No ' + escapeHtml(campaignGroupLabel(currentCampaignGroup)) + ' yet.</div>';
          return;
        }

        root.innerHTML = campaigns.map((campaign) => {
          const completed = completedCampaignPublicationCount(campaign);
          const total = Number(campaign.plannedPublicationCount || 0);
          return '<article class="campaign-card">' +
            '<div class="campaign-card-head">' +
              '<div class="section-copy">' +
                '<span class="eyebrow">' + escapeHtml(campaign.presetName || 'Preset missing') + '</span>' +
                '<h3>' + escapeHtml(campaign.name) + '</h3>' +
              '</div>' +
              renderBadge(campaign.status) +
            '</div>' +
            '<div class="campaign-card-meta">' +
              '<span class="pill">Start ' + escapeHtml(formatDateOnly(campaign.startDate)) + '</span>' +
              '<span class="pill">' + escapeHtml(String(campaign.sourceLanguage || '').toUpperCase()) + '</span>' +
              '<span class="pill">' + escapeHtml(String(completed)) + '/' + escapeHtml(String(total)) + ' published</span>' +
              (Number(campaign.pendingApprovalCount || 0) > 0
                ? '<span class="pill">' + escapeHtml(String(campaign.pendingApprovalCount)) + ' inbox</span>'
                : '') +
            '</div>' +
            '<p class="soft">Updated ' + escapeHtml(formatDate(campaign.updatedAt)) + '</p>' +
            '<div class="card-actions">' + campaignActions(campaign) + '</div>' +
          '</article>';
        }).join('');

        root.querySelectorAll('[data-delete-campaign]').forEach((button) => {
          button.addEventListener('click', async () => {
            const campaignId = button.dataset.deleteCampaign;
            if (!campaignId) {
              return;
            }
            const confirmed = window.confirm(
              'Delete this draft campaign and all related data, including inbox items?',
            );
            if (!confirmed) {
              return;
            }
            try {
              await request('/campaigns/' + encodeURIComponent(campaignId), {
                method: 'DELETE',
              });
              await loadCampaigns();
            } catch (error) {
              setOutput(String(error));
            }
          });
        });
      }

      function renderCampaignGroup(group) {
        currentCampaignGroup = group;
        document.querySelectorAll('[data-campaign-group]').forEach((button) => {
          button.classList.toggle('is-active', button.dataset.campaignGroup === group);
        });
        renderCampaignCards(groupedCampaigns[group] || []);
      }

      function renderCampaignTabs() {
        document.getElementById('activeCampaignsCount').textContent = '\\u00a0(' + String(groupedCampaigns.active.length) + ')';
        document.getElementById('draftCampaignsCount').textContent = '\\u00a0(' + String(groupedCampaigns.drafts.length) + ')';
        document.getElementById('completedCampaignsCount').textContent = '\\u00a0(' + String(groupedCampaigns.completed.length) + ')';
        renderCampaignGroup(currentCampaignGroup);
      }

      async function loadCampaigns() {
        const campaigns = await request(
          '/projects/' + encodeURIComponent(currentProjectId) + '/campaigns',
          undefined,
          { renderResponse: false },
        );
        currentProjectCampaigns = Array.isArray(campaigns) ? campaigns : [];
        groupedCampaigns = groupCampaigns(currentProjectCampaigns);
        renderCampaignTabs();
        renderOutput({ project: currentProject, campaigns: currentProjectCampaigns });
      }

      async function refreshProjectInboxSummary() {
        const campaigns = await request(
          '/projects/' + encodeURIComponent(currentProjectId) + '/campaigns',
          undefined,
          { renderResponse: false },
        ).catch(() => []);
        const pendingCount = Array.isArray(campaigns)
          ? campaigns.reduce(
              (sum, campaign) => sum + Number(campaign?.pendingApprovalCount || 0),
              0,
            )
          : 0;
        updateProjectInboxLink(pendingCount);
      }

      function startOfWeek(date) {
        const parts = getMoscowDateParts(date);
        const value = new Date(Date.UTC(parts.year, parts.month, parts.day));
        const day = value.getUTCDay();
        const diff = day === 0 ? -6 : 1 - day;
        value.setUTCDate(value.getUTCDate() + diff);
        return value;
      }

      function addDays(date, days) {
        const value = new Date(date);
        value.setUTCDate(value.getUTCDate() + days);
        return value;
      }

      function dateKey(date) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
      }

      function isSameDay(a, b) {
        const left = getMoscowDateParts(a);
        const right = getMoscowDateParts(b);
        return left && right &&
          left.year === right.year &&
          left.month === right.month &&
          left.day === right.day;
      }

      function formatWeekRange(start) {
        const end = addDays(start, 6);
        const sameMonth = start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear();

        if (sameMonth) {
          return start.getUTCDate() + '–' + end.getUTCDate() + ' ' + monthLabels[start.getUTCMonth()];
        }

        return start.getUTCDate() + ' ' + monthLabels[start.getUTCMonth()] + ' – ' +
          end.getUTCDate() + ' ' + monthLabels[end.getUTCMonth()];
      }

      function isPastPlanningDay(date) {
        const todayParts = getMoscowDateParts(new Date());
        const today = new Date(Date.UTC(todayParts.year, todayParts.month, todayParts.day));
        const value = new Date(date);
        return value.getTime() < today.getTime();
      }

      function formatDayLabel(value) {
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Europe/Moscow',
          day: 'numeric',
          month: 'long',
        }).format(date);
      }

      function markerPlacementsForCell(channelId, dayDate) {
        return currentProjectMarkerPlacements
          .filter((placement) =>
            placement &&
            placement.channelId === channelId &&
            isSameDay(new Date(placement.publishAt), dayDate),
          )
          .map((placement) => {
            const marker = markerById(placement.markerId);
            return marker
              ? {
                  id: placement.id,
                  markerId: placement.markerId,
                  title: marker.title,
                  notes: marker.notes,
                  targetLanguage: placement.targetLanguage,
                  publishAt: new Date(placement.publishAt),
                  colorBg: marker.colorBg,
                  colorBorder: marker.colorBorder,
                  colorText: marker.colorText,
                }
              : null;
          })
          .filter(Boolean)
          .sort((a, b) => a.publishAt.getTime() - b.publishAt.getTime());
      }

      function languageOptions() {
        return [
          { language: 'en', label: 'English' },
          { language: 'es', label: 'Spanish' },
          { language: 'ru', label: 'Russian' },
          { language: 'id', label: 'Indonesian' },
          { language: 'fil', label: 'Filipino' },
          { language: 'vi', label: 'Vietnamese' },
          { language: 'pt', label: 'Portuguese' },
        ];
      }

      function syncActiveMarker() {
        if (activeMarkerId && markerById(activeMarkerId)) {
          return;
        }

        activeMarkerId = null;
      }

      function toggleMarkerSelection(markerId) {
        if (markerEditMode) {
          return;
        }
        activeMarkerId = activeMarkerId === markerId ? null : markerId;
        renderProjectHero();
        renderMarkers();
        renderWeekDashboard();
      }

      function selectMarkerFromPlacement(event, markerId) {
        if (event) {
          event.stopPropagation();
        }

        if (markerEditMode || !markerId) {
          return;
        }

        activeMarkerId = markerId;
        renderProjectHero();
        renderMarkers();
        renderWeekDashboard();
      }

      function toggleMarkerEditMode() {
        markerEditMode = !markerEditMode;
        const button = document.getElementById('editMarkersBtn');
        if (button) {
          button.textContent = markerEditMode ? 'Done' : 'Edit markers';
          button.classList.toggle('is-active', markerEditMode);
        }
        renderMarkers();
      }

      function setCalendarMode(mode) {
        calendarMode = mode === 'markers' ? 'markers' : 'posts';
        document.getElementById('postsModeBtn').classList.toggle('is-active', calendarMode === 'posts');
        document.getElementById('markersModeBtn').classList.toggle('is-active', calendarMode === 'markers');
        renderWeekDashboard();
      }

      function renderMarkers() {
        const root = document.getElementById('markerList');
        const meta = document.getElementById('markerToolbarMeta');

        if (!Array.isArray(currentProjectMarkers) || currentProjectMarkers.length === 0) {
          meta.textContent = '';
          const button = document.getElementById('editMarkersBtn');
          if (button) {
            button.textContent = 'Edit markers';
            button.classList.remove('is-active');
          }
          markerEditMode = false;
          root.innerHTML = '<div class="marker-empty">No draft markers yet.</div>';
          return;
        }

        const activeMarker = markerById(activeMarkerId);
        meta.textContent = markerEditMode
          ? 'Delete draft marker templates. Their placements on the calendar will be removed too.'
          : '';

        root.innerHTML = currentProjectMarkers.map((marker) =>
          '<div class="marker-pill-wrap">' +
            (markerEditMode
              ? '<button type="button" class="marker-delete" onclick="deleteMarker(event, \\'' + escapeHtml(marker.id) + '\\')" aria-label="Delete marker">−</button>'
              : '') +
            '<button' +
              ' type="button"' +
              ' class="marker-pill ' + (activeMarkerId === marker.id ? 'is-active' : '') + '"' +
              ' style="' +
                '--marker-bg:' + escapeHtml(marker.colorBg) + ';' +
                '--marker-border:' + escapeHtml(marker.colorBorder) + ';' +
                '--marker-text:' + escapeHtml(marker.colorText) + ';' +
              '"' +
              ' onclick="toggleMarkerSelection(\\'' + escapeHtml(marker.id) + '\\')"' +
            '>' +
              '<span class="marker-pill-label">' +
                escapeHtml(activeMarkerId === marker.id ? 'Selected marker' : 'Draft marker') +
              '</span>' +
              '<strong>' + escapeHtml(marker.title) + '</strong>' +
              '<span>' + escapeHtml(marker.notes || 'Click to select and place on the calendar.') + '</span>' +
            '</button>' +
          '</div>'
        ).join('');
      }

      async function deleteMarker(event, markerId) {
        event.stopPropagation();

        const marker = markerById(markerId);
        if (!marker) {
          return;
        }

        const confirmed = window.confirm(
          'Delete marker "' + marker.title + '" and all its placements on the calendar?'
        );

        if (!confirmed) {
          return;
        }

        try {
          await request(
            '/projects/' + encodeURIComponent(currentProjectId) + '/markers/' + encodeURIComponent(markerId),
            { method: 'DELETE' },
            { renderResponse: false },
          );

          if (activeMarkerId === markerId) {
            activeMarkerId = null;
          }

          await refreshProject();
        } catch (requestError) {
          document.getElementById('error').textContent =
            requestError instanceof Error ? requestError.message : String(requestError);
        }
      }

      function openMarkerModal() {
        document.getElementById('markerTitle').value = '';
        document.getElementById('markerNotes').value = '';
        document.getElementById('markerError').textContent = '';
        document.getElementById('markerModalBackdrop').classList.add('open');
      }

      function closeMarkerModal(event) {
        if (event && event.target !== event.currentTarget) return;
        document.getElementById('markerModalBackdrop').classList.remove('open');
        document.getElementById('markerError').textContent = '';
      }

      async function saveMarker() {
        const error = document.getElementById('markerError');
        const title = document.getElementById('markerTitle').value.trim();
        const notes = document.getElementById('markerNotes').value.trim();

        error.textContent = '';

        if (!title) {
          error.textContent = 'Enter marker idea.';
          return;
        }

        try {
          const result = await request('/projects/' + encodeURIComponent(currentProjectId) + '/markers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              notes: notes || null,
            }),
          });
          activeMarkerId = result?.id || null;
          closeMarkerModal();
          await refreshProject();
        } catch (requestError) {
          error.textContent = requestError instanceof Error ? requestError.message : String(requestError);
        }
      }

      function handleCellPress(channelId, dayKey) {
        if (calendarMode === 'markers') {
          if (activeMarkerId) {
            openMarkerPlacementModal(null, channelId, dayKey);
          }
          return;
        }

        const url = '/test-ui/day?projectId=' + encodeURIComponent(currentProjectId) +
          '&channelId=' + encodeURIComponent(channelId) +
          '&date=' + encodeURIComponent(dayKey);
        window.location.href = url;
      }

      function openMarkerPlacementModal(event, channelId, dayKey) {
        if (event) {
          event.stopPropagation();
        }

        const marker = markerById(activeMarkerId);
        const selectedDay = new Date(dayKey + 'T00:00:00.000Z');
        if (!marker || isPastPlanningDay(selectedDay)) {
          return;
        }

        pendingMarkerPlacement = {
          markerId: marker.id,
          channelId,
          dayKey,
        };

        const languageSelect = document.getElementById('markerPlacementLanguage');
        languageSelect.innerHTML = languageOptions().map((option) =>
          '<option value="' + escapeHtml(option.language) + '">' + escapeHtml(option.label) + '</option>'
        ).join('');

        const timeInput = document.getElementById('markerPlacementTime');
        if (isSameDay(selectedDay, new Date())) {
          const nowParts = getMoscowDateParts(new Date(Date.now() + 5 * 60 * 1000));
          timeInput.value = String(nowParts.hours).padStart(2, '0') + ':' +
            String(nowParts.minutes).padStart(2, '0');
        } else {
          timeInput.value = '12:00';
        }

        document.getElementById('markerPlacementSubtitle').textContent =
          marker.title + ' · ' +
          (adaptationChannels.find((item) => item.id === channelId)?.label || channelId) +
          ' · ' +
          formatDayLabel(selectedDay);
        document.getElementById('markerPlacementError').textContent = '';
        document.getElementById('markerPlacementModalBackdrop').classList.add('open');
      }

      function closeMarkerPlacementModal(event) {
        if (event && event.target !== event.currentTarget) return;
        document.getElementById('markerPlacementModalBackdrop').classList.remove('open');
        document.getElementById('markerPlacementError').textContent = '';
        pendingMarkerPlacement = null;
      }

      async function saveMarkerPlacement() {
        const error = document.getElementById('markerPlacementError');
        const targetLanguage = document.getElementById('markerPlacementLanguage').value.trim();
        const timeValue = document.getElementById('markerPlacementTime').value.trim();

        error.textContent = '';

        if (!pendingMarkerPlacement) {
          error.textContent = 'Select a cell first.';
          return;
        }

        if (!targetLanguage || !timeValue) {
          error.textContent = 'Choose language and time.';
          return;
        }

        const publishAtIso = buildMoscowIsoFromDayKeyAndTime(
          pendingMarkerPlacement.dayKey,
          timeValue,
        );
        const publishAt = publishAtIso ? new Date(publishAtIso) : new Date('invalid');
        if (Number.isNaN(publishAt.getTime())) {
          error.textContent = 'Invalid placement time.';
          return;
        }

        try {
          await request('/projects/' + encodeURIComponent(currentProjectId) + '/marker-placements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              markerId: pendingMarkerPlacement.markerId,
              channelId: pendingMarkerPlacement.channelId,
              targetLanguage,
              publishAt: publishAt.toISOString(),
            }),
          });
          closeMarkerPlacementModal();
          await refreshProject();
        } catch (requestError) {
          error.textContent = requestError instanceof Error ? requestError.message : String(requestError);
        }
      }

      function renderWeekDashboard() {
        const root = document.getElementById('weekGrid');
        const todayParts = getMoscowDateParts(new Date());
        const today = new Date(Date.UTC(todayParts.year, todayParts.month, todayParts.day));
        dashboardPublicationDetails = new Map();

        document.getElementById('weekRange').textContent = formatWeekRange(currentWeekStart);
        const headers = Array.from({ length: 7 }, (_, index) => {
          const dayDate = addDays(currentWeekStart, index);
          const isToday = isSameDay(dayDate, today);
          return \`
            <article class="week-column-head \${isToday ? 'is-today' : ''}">
              <small>\${weekDayLabels[index]}</small>
              <strong>\${dayDate.getUTCDate()}</strong>
              <span>\${monthLabels[dayDate.getUTCMonth()]}</span>
            </article>
          \`;
        }).join('');

        const rows = adaptationChannels.map((channel) => {
          const cells = Array.from({ length: 7 }, (_, index) => {
            const dayDate = addDays(currentWeekStart, index);
            const isToday = isSameDay(dayDate, today);
            const isPast = isPastPlanningDay(dayDate);
            const markerPlacements = markerPlacementsForCell(channel.id, dayDate);
            const publications = plannedPublicationsForCell(channel.id, dayDate);
            const markerContent = calendarMode === 'markers' && markerPlacements.length
              ? markerPlacements.map((item) =>
                  '<div class="week-marker ' + (item.markerId === activeMarkerId ? 'is-active' : '') + '"' +
                    ' onclick="selectMarkerFromPlacement(event, \\''
                      + escapeHtml(item.markerId)
                      + '\\')"'
                    + ' style="' +
                    '--marker-bg:' + item.colorBg + ';' +
                    '--marker-border:' + item.colorBorder + ';' +
                    '--marker-text:' + item.colorText + ';' +
                  '">' +
                    '<div class="week-marker-title">' + escapeHtml(item.title) + '</div>' +
                    '<div class="week-marker-meta">' +
                      '<span>' + escapeHtml(languageCode(item.targetLanguage)) + '</span>' +
                      '<span>' + escapeHtml(formatTime(item.publishAt)) + '</span>' +
                    '</div>' +
                  '</div>'
                ).join('')
              : '';
            const publicationContent = calendarMode === 'posts' && publications.length
              ? publications.map((item) =>
                  '<div class="week-publication ' + (item.isPublished ? 'is-published' : '') + '"' +
                    ' data-clickable="true"' +
                    ' onclick="openDashboardPublicationDetails(event, \\''
                      + escapeHtml(item.detailKey)
                      + '\\')"' +
                    ' style="' +
                    '--pub-bg:' + item.theme.bg + ';' +
                    '--pub-border:' + item.theme.border + ';' +
                    '--pub-text:' + item.theme.text + ';' +
                    '--pub-time:' + item.theme.time + ';' +
                  '">' +
                      '<span class="week-publication-language">' + escapeHtml(languageCode(item.targetLanguage)) + '</span>' +
                      '<span class="week-publication-time">' + escapeHtml(formatTime(item.publishAt)) + '</span>' +
                  '</div>'
                ).join('')
              : '';
            const content = markerContent + publicationContent ||
              '<span class="week-cell-placeholder">' +
                (calendarMode === 'markers' && activeMarkerId && !isPast ? 'Place marker' : '—') +
              '</span>';
            const canPlaceMarker = calendarMode === 'markers' && Boolean(activeMarkerId) && !isPast;

            return \`
              <div
                class="week-cell \${isToday ? 'is-today' : ''} \${canPlaceMarker ? 'is-placeable' : ''}"
                onclick="handleCellPress('\${channel.id}', '\${dateKey(dayDate)}')"
              >
                <div class="week-cell-scroll">\${content}</div>
              </div>
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
        return currentProjectPlans
          .filter((plan) =>
            plan &&
            plan.channelId === channelId &&
            isSameDay(new Date(plan.publishAt), dayDate),
          )
          .map((plan) => ({
            plan,
            publication: publicationForPlan(plan.articleId, plan.channelId, plan.targetLanguage, plan.publishAt),
            campaign: campaignForArticle(plan.articleId),
            article: articleForId(plan.articleId),
          }))
          .map(({ plan, publication, campaign, article }) => {
            const detailKey = [
              plan.id,
              publication?.id || 'planned',
              plan.channelId,
              plan.targetLanguage,
            ].join('|');
            const detail = {
              id: plan.id,
              articleId: plan.articleId,
              articleTitle: article?.title || article?.id || plan.articleId,
              campaign,
              channelId: plan.channelId,
              targetLanguage: plan.targetLanguage,
              publishAt: new Date(plan.publishAt),
              publication,
            };
            dashboardPublicationDetails.set(detailKey, detail);

            return {
              ...detail,
              detailKey,
              theme: articleTheme(plan.articleId),
              isPublished: publication?.status === 'published',
            };
          })
          .sort((a, b) => a.publishAt.getTime() - b.publishAt.getTime());
      }

      function publicationForPlan(articleId, channelId, targetLanguage, publishAt) {
        const publications = currentPublicationsByArticle.get(articleId) || [];
        return publications.find((item) =>
          item &&
          item.channelId === channelId &&
          String(item.targetLanguage || '').toLowerCase() === String(targetLanguage || '').toLowerCase() &&
          (!publishAt || new Date(item.publishAt).getTime() === new Date(publishAt).getTime()),
        ) || null;
      }

      function publicationStateFor(articleId, channelId, targetLanguage, publishAt) {
        const match = publicationForPlan(articleId, channelId, targetLanguage, publishAt);

        return match?.status || null;
      }

      function shiftWeek(direction) {
        currentWeekStart = addDays(currentWeekStart, direction * 7);
        refreshProject();
      }

      function nextStepUrl(article) {
        const hasPlans = currentProjectPlans.some((plan) => plan.articleId === article.id);
        if (!hasPlans || article.adaptationCount === 0) {
          return '/test-ui/article-plan?articleId=' + encodeURIComponent(article.id);
        }

        if (article.approvedTranslationCount > 0) {
          return '/test-ui/publishing?articleId=' + encodeURIComponent(article.id);
        }

        if (article.approvedAdaptationCount > 0) {
          return '/test-ui/translations?articleId=' + encodeURIComponent(article.id);
        }

        return '/test-ui/review?articleId=' + encodeURIComponent(article.id);
      }

      function renderArticles() {
        renderProjectHero();
      }

      async function refreshProject() {
        document.getElementById('error').textContent = '';
        const newArticleBtn = document.getElementById('newArticleBtn');
        if (newArticleBtn) {
          newArticleBtn.href = '/test-ui/new?projectId=' + encodeURIComponent(currentProjectId);
        }

        try {
          const [project, articles, markers, campaigns] = await Promise.all([
            request('/projects/' + encodeURIComponent(currentProjectId)).catch(() => null),
            request('/articles?projectId=' + encodeURIComponent(currentProjectId)),
            request('/projects/' + encodeURIComponent(currentProjectId) + '/markers').catch(() => []),
            request('/projects/' + encodeURIComponent(currentProjectId) + '/campaigns', undefined, { renderResponse: false }).catch(() => []),
          ]);
          currentProject = project;
          currentProjectArticles = Array.isArray(articles) ? articles : [];
          currentProjectMarkers = Array.isArray(markers) ? markers : [];
          currentProjectCampaigns = Array.isArray(campaigns) ? campaigns : [];
          updateProjectInboxLink(
            currentProjectCampaigns.reduce(
              (sum, campaign) => sum + Number(campaign?.pendingApprovalCount || 0),
              0,
            ),
          );
          syncActiveMarker();
          const weekStart = new Date(currentWeekStart);
          weekStart.setUTCHours(0, 0, 0, 0);
          const weekEnd = addDays(currentWeekStart, 6);
          weekEnd.setUTCHours(23, 59, 59, 999);
          const [projectPlans, markerPlacements, publicationLists] = await Promise.all([
            request(
              '/publishing/projects/' + encodeURIComponent(currentProjectId) +
              '/plans?from=' + encodeURIComponent(weekStart.toISOString()) +
              '&to=' + encodeURIComponent(weekEnd.toISOString()),
            ),
            request(
              '/projects/' + encodeURIComponent(currentProjectId) +
              '/marker-placements?from=' + encodeURIComponent(weekStart.toISOString()) +
              '&to=' + encodeURIComponent(weekEnd.toISOString()),
            ).catch(() => []),
            Promise.all(
            currentProjectArticles.map((article) =>
              request('/publishing/articles/' + encodeURIComponent(article.id)).catch(() => []),
            ),
            ),
          ]);
          currentProjectPlans = Array.isArray(projectPlans) ? projectPlans : [];
          currentProjectMarkerPlacements = Array.isArray(markerPlacements) ? markerPlacements : [];
          currentPublicationsByArticle = new Map(
            currentProjectArticles.map((article, index) => [
              article.id,
              Array.isArray(publicationLists[index]) ? publicationLists[index] : [],
            ]),
          );
          renderArticles(articles);
          renderMarkers();
          renderWeekDashboard();
          renderProjectHero();
          groupedCampaigns = groupCampaigns(currentProjectCampaigns);
          if (projectView === 'campaigns') {
            renderCampaignTabs();
          }
        } catch (error) {
          document.getElementById('error').textContent = error instanceof Error ? error.message : String(error);
        }
      }

      document.querySelectorAll('[data-campaign-group]').forEach((button) => {
        button.addEventListener('click', () => renderCampaignGroup(button.dataset.campaignGroup));
      });

      refreshProject().catch((error) => {
        document.getElementById('error').textContent = error instanceof Error ? error.message : String(error);
      });
      setInterval(() => {
        refreshProjectInboxSummary().catch(() => {});
      }, 5000);
      renderProjectHero();
      updateProjectInboxLink(0);
      renderMarkers();
      renderWeekDashboard();
    </script>
${renderDevConsoleMarkup()}
${renderDevConsoleScript()}
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
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Marketing Service - Day Schedule</title>
    <style>
      :root {
        --bg: #ececed;
        --panel: rgba(255, 255, 255, 0.88);
        --text: #121212;
        --muted: rgba(18, 18, 18, 0.58);
        --border: rgba(18, 18, 18, 0.18);
        --accent: rgba(18, 18, 18, 0.92);
        --accent-soft: rgba(255, 255, 255, 0.34);
        --danger: #b42318;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font: 15px/1.32 "Helvetica Neue", Helvetica, Arial, sans-serif;
      }
      .wrap {
        max-width: 1320px;
        margin: 0 auto;
        padding: 22px 38px 40px;
        display: grid;
        gap: 18px;
      }
      .panel {
        background: var(--panel);
        border: 1px solid rgba(18, 18, 18, 0.12);
        border-radius: 34px;
      }
      .hero, .content {
        padding: 24px;
      }
      .hero-top, .layout {
        display: grid;
        gap: 18px;
      }
      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }
      h1 {
        margin: 0;
        font-size: clamp(28px, 3.5vw, 56px);
        line-height: 0.86;
        letter-spacing: -0.07em;
        font-weight: 400;
      }
      p {
        margin: 0;
        color: var(--muted);
      }
      a.btn, button {
        appearance: none;
        border: 1px solid var(--border);
        border-radius: 999px;
        padding: 10px 18px;
        background: var(--accent-soft);
        color: var(--text);
        font: inherit;
        font-weight: 400;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      a.btn:hover, button:hover {
        background: rgba(255, 255, 255, 0.56);
      }
      .btn.secondary {
        background: rgba(255, 255, 255, 0.34);
      }
      .posts {
        display: grid;
        gap: 14px;
      }
      .post-card {
        min-height: 220px;
        display: grid;
        grid-template-rows: auto 1fr auto;
        gap: 14px;
        padding: 18px;
        border-radius: 28px;
        border: 1px solid var(--post-border);
        background: var(--post-bg);
        color: var(--post-text);
        overflow: hidden;
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
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .badge.lang {
        background: rgba(255, 255, 255, 0.48);
        border: 1px solid var(--post-border);
        color: var(--post-text);
      }
      .badge.status {
        background: rgba(255, 255, 255, 0.74);
        border: 1px solid rgba(18, 18, 18, 0.14);
        color: rgba(18, 18, 18, 0.72);
      }
      .post-title {
        margin: 0;
        font-size: 34px;
        line-height: 0.98;
        letter-spacing: -0.05em;
        font-weight: 400;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .post-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .empty {
        padding: 28px;
        border: 1px dashed var(--border);
        border-radius: 24px;
        color: var(--muted);
        background: rgba(255, 255, 255, 0.34);
      }
      .error {
        color: var(--danger);
        font-weight: 700;
        min-height: 0;
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
      }
      @media (max-width: 640px) {
        .topbar {
          flex-direction: column;
          align-items: flex-start;
        }
        .post-title {
          font-size: 28px;
        }
      }
${renderUnifiedWorkflowStyles()}
${renderDevConsoleStyles()}
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="panel hero">
        <div class="hero-top">
          <div class="topbar">
            <a class="btn secondary" href="/test-ui/project?projectId=${escapeHtml(projectId)}">← Back to project dashboard</a>
            <a class="btn secondary" href="/test-ui/campaigns?projectId=${escapeHtml(projectId)}">Create campaign</a>
          </div>
          <div>
            <h1 id="pageTitle">Loading...</h1>
          </div>
        </div>
      </section>

      <section class="panel content">
        <div id="error" class="error"></div>
        <div id="posts" class="posts"></div>
      </section>
    </div>

    <script>
      const projectId = ${JSON.stringify(projectId)};
      const channelId = ${JSON.stringify(channelId)};
      const dateKey = ${JSON.stringify(date)};
      const adaptationChannels = [
        { id: 'channel_telegram', label: 'Telegram' },
        { id: 'channel_x', label: 'X' },
        { id: 'channel_discord', label: 'Discord' },
        { id: 'channel_blog', label: 'Blog' },
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

      const MOSCOW_OFFSET_MS = 3 * 60 * 60 * 1000;

      function getMoscowDateParts(value) {
        const date = value instanceof Date ? new Date(value) : new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        const shifted = new Date(date.getTime() + MOSCOW_OFFSET_MS);
        return {
          year: shifted.getUTCFullYear(),
          month: shifted.getUTCMonth(),
          day: shifted.getUTCDate(),
        };
      }

      function parseDateKey(value) {
        if (!value) {
          const today = getMoscowDateParts(new Date());
          return new Date(Date.UTC(today.year, today.month, today.day));
        }
        const [year, month, day] = String(value).split('-').map(Number);
        return new Date(Date.UTC(year, (month || 1) - 1, day || 1));
      }

      function isSameDay(a, b) {
        const left = getMoscowDateParts(a);
        const right = getMoscowDateParts(b);
        return left && right &&
          left.year === right.year &&
          left.month === right.month &&
          left.day === right.day;
      }

      function formatDate(value) {
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Europe/Moscow',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(date);
      }

      function formatDateTime(value) {
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Europe/Moscow',
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
        return new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Europe/Moscow',
          hour: '2-digit',
          minute: '2-digit',
        }).format(date);
      }

      function languageLabel(language) {
        const normalized = String(language || '').toLowerCase();
        if (normalized === 'ru') return 'Russian';
        if (normalized === 'en') return 'English';
        if (normalized === 'es') return 'Spanish';
        if (normalized === 'id') return 'Indonesian';
        if (normalized === 'fil') return 'Filipino';
        if (normalized === 'vi') return 'Vietnamese';
        if (normalized === 'pt') return 'Portuguese';
        return normalized.toUpperCase();
      }

      function channelLabel(channel) {
        return adaptationChannels.find((item) => item.id === channel)?.label || channel;
      }

      function previewStatus(publication, publishAt) {
        if (!publication) {
          return {
            label: 'Will be published ' + formatDateTime(publishAt),
            className: 'is-scheduled',
          };
        }

        if (publication.status === 'published') {
          return {
            label: 'Published' + (publication.publishedAt ? ' · ' + formatDateTime(publication.publishedAt) : ''),
            className: 'is-published',
          };
        }

        if (publication.status === 'publishing') {
          return {
            label: 'Publishing now',
            className: 'is-publishing',
          };
        }

        if (publication.status === 'failed') {
          return {
            label: 'Publishing error',
            className: 'is-failed',
          };
        }

        return {
          label: 'Will be published ' + formatDateTime(publication.publishAt || publishAt),
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

      function collectPosts(plans, articleMap, publicationMap, selectedDate) {
        return plans
          .filter((plan) =>
            plan &&
            plan.channelId === channelId &&
            isSameDay(new Date(plan.publishAt), selectedDate),
          )
          .map((plan) => {
            const article = articleMap.get(plan.articleId);
            const publications = publicationMap.get(plan.articleId) || [];
            const publication = publications.find((item) =>
              item &&
              item.channelId === channelId &&
              String(item.targetLanguage || '').toLowerCase() === String(plan.targetLanguage || '').toLowerCase() &&
              new Date(item.publishAt).getTime() === new Date(plan.publishAt).getTime(),
            ) || null;

            return {
              planId: plan.id,
              articleId: plan.articleId,
              articleTitle: article?.originalTitle || 'Untitled',
              articleExcerpt: article?.originalExcerpt || '',
              targetLanguage: plan.targetLanguage,
              publishAt: new Date(plan.publishAt),
              publication,
              status: previewStatus(publication, plan.publishAt),
              theme: articleTheme(plan.articleId),
            };
          })
          .sort((a, b) => a.publishAt.getTime() - b.publishAt.getTime());
      }

      function renderPosts(items, selectedDate) {
        const root = document.getElementById('posts');
        const title = channelLabel(channelId) + ' · ' + formatDate(selectedDate);
        document.getElementById('pageTitle').textContent = title;
        document.title = 'Marketing Service - ' + title;

        if (!items.length) {
          root.innerHTML = '<div class="empty">Nothing is scheduled for this channel on this day yet.</div>';
          return;
        }

        root.innerHTML = items.map((item) => {
          const canCancel = item.publication
            ? item.publication.status !== 'published' && item.publication.status !== 'publishing'
            : true;
          return \`
            <article
              class="post-card"
              style="
                --post-bg: \${escapeHtml(item.theme.bg)};
                --post-border: \${escapeHtml(item.theme.border)};
                --post-text: \${escapeHtml(item.theme.text)};
              "
            >
              <div class="post-meta">
                <span class="badge lang">\${escapeHtml(languageLabel(item.targetLanguage))}</span>
                <span class="badge lang">\${escapeHtml(formatTime(item.publishAt))}</span>
                <span class="badge status \${escapeHtml(item.status.className)}">\${escapeHtml(item.status.label)}</span>
              </div>
              <h3 class="post-title">\${escapeHtml(item.articleTitle)}</h3>
              <div class="post-actions">
                <a class="btn" style="justify-self:start;" href="/test-ui/review?articleId=\${escapeHtml(item.articleId)}">Open workflow</a>
                \${canCancel
                  ? '<button class="btn secondary" onclick="cancelPublication(\\'' + escapeHtml(item.planId) + '\\')">Cancel publication</button>'
                  : ''}
              </div>
            </article>
          \`;
        }).join('');
      }

      async function cancelPublication(planId) {
        if (!planId) return;

        try {
          await post('/publishing/plans/' + encodeURIComponent(planId) + '/cancel');
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
          const articleMap = new Map(
            (Array.isArray(articles) ? articles : []).map((article) => [article.id, article]),
          );
          const rangeStart = new Date(selectedDate);
          rangeStart.setHours(0, 0, 0, 0);
          const rangeEnd = new Date(selectedDate);
          rangeEnd.setHours(23, 59, 59, 999);
          const plans = await request(
            '/publishing/projects/' + encodeURIComponent(projectId) +
            '/plans?from=' + encodeURIComponent(rangeStart.toISOString()) +
            '&to=' + encodeURIComponent(rangeEnd.toISOString()),
          );
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
          currentPosts = collectPosts(Array.isArray(plans) ? plans : [], articleMap, publicationMap, selectedDate);
          renderPosts(currentPosts, selectedDate);
        } catch (error) {
          document.getElementById('error').textContent = error instanceof Error ? error.message : String(error);
        }
      }

      loadDaySchedule().catch((error) => {
        document.getElementById('error').textContent = error instanceof Error ? error.message : String(error);
      });
    </script>
${renderDevConsoleMarkup()}
${renderDevConsoleScript()}
  </body>
</html>`;
  }

  @Get('new')
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderCreatePage(@Query('projectId') projectId = 'project_123'): string {
    return `<!doctype html>
<html lang="en">
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
      .hero h1 { margin: 0; font-size: 18px; }
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
${renderUnifiedWorkflowStyles()}
${renderDevConsoleStyles()}
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="panel hero">
        <div class="topbar">
          <a href="/test-ui/project?projectId=${escapeHtml(projectId)}">← Back to project</a>
        </div>
        <h1>Article creation</h1>
      </section>

      <div class="grid">
        <section class="panel content">
          <div class="stack">
            <input id="projectId" type="hidden" value="${escapeHtml(projectId)}" />
            <input id="language" type="hidden" value="en" />

            <label>
              Original longread
              <textarea id="content" placeholder="Paste the original article"></textarea>
            </label>
          </div>
        </section>

        <section class="panel content">
          <h2 style="margin:0 0 8px;">Channels and prompt rules</h2>
          <p class="sub" style="margin:0 0 14px;">At this step you can only adjust the built-in prompt rules for channels. Exact publications and languages will be set on the next article planning dashboard.</p>

          <div id="channelList" class="channels"></div>

          <div class="note" style="margin-top: 16px;">
            After you click the button, we will create the article and move you to its dedicated dashboard, where you will place the final publications across days and channels.
          </div>

          <div style="margin-top: 18px;">
            <button id="submitBtn" onclick="submitWorkflow()">Create article</button>
          </div>

          <div id="error" class="error" style="margin-top: 12px;"></div>

        </section>
      </div>
    </div>

    <div id="typeModalBackdrop" class="modal-backdrop ghosted">
      <div class="modal">
        <div class="modal-head">
          <div>
            <h3>Edit prompt</h3>
            <p>Here you can only change the adaptation rule for a built-in channel.</p>
          </div>
          <button type="button" class="secondary" onclick="closeTypeModal()">Close</button>
        </div>

        <label>
          Channel
          <input id="typeName" readonly />
        </label>

        <label>
          Prompt / adaptation rule
          <textarea id="typePrompt" placeholder="For example: Write 1 short post, up to 20 words, with no hashtags."></textarea>
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
        {
          channelId: 'channel_blog',
          displayName: 'Blog',
          promptInstructions: '',
          builtIn: true,
        },
      ];
      let editingTypeId = null;

      function languageLabel(language) {
        if (language === 'ru') return 'Russian';
        if (language === 'en') return 'English';
        if (language === 'es') return 'Spanish';
        if (language === 'id') return 'Indonesian';
        if (language === 'fil') return 'Filipino';
        if (language === 'vi') return 'Vietnamese';
        if (language === 'pt') return 'Portuguese';
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

        if (channelId === 'channel_blog') {
          return [
            'Rewrite the provided long-form article into a short blog post in the same language.',
            'Preserve the core meaning and factual accuracy.',
            'Return 2 to 4 short paragraphs.',
            'Keep the tone clear, informative, and readable.',
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

      function renderTypeList() {
        const list = document.getElementById('channelList');
        const types = allTypes();
        list.innerHTML = types.map((type) => {
          const description = type.promptInstructions
            ? 'Prompt overridden'
            : 'Built-in social adaptation rules';

          return \`
            <div class="check">
              <div class="check-head">
                <div class="check-main">
                  <div class="channel-copy">
                    <strong>\${escapeHtml(type.displayName)}</strong>
                    <span>\${escapeHtml(description)}</span>
                  </div>
                </div>
                <div class="modal-actions">
                  <button type="button" class="mini-btn" onclick="openEditTypeModal('\${type.channelId}')">Edit</button>
                </div>
              </div>
            </div>
          \`;
        }).join('');
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
        error.textContent = '';

        if (!editingTypeId) {
          error.textContent = 'No channel selected for editing.';
          return;
        }

        const baseType = DEFAULT_TYPES.find((type) => type.channelId === editingTypeId);
        if (!baseType) {
          error.textContent = 'Only built-in channels can be edited.';
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
        renderTypeList();
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

        submitBtn.disabled = true;

        try {
          const article = await request('/articles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId: document.getElementById('projectId').value.trim(),
              content: document.getElementById('content').value.trim(),
              language: document.getElementById('language').value.trim(),
              releasePlanSnapshot: null,
            }),
          });

          window.location.href = '/test-ui/article-plan?articleId=' + encodeURIComponent(article.id);
        } catch (e) {
          error.textContent = e instanceof Error ? e.message : 'Failed to create workflow';
          submitBtn.disabled = false;
        }
      }

      renderTypeList();
    </script>
${renderDevConsoleMarkup()}
${renderDevConsoleScript()}
  </body>
</html>`;
  }

  @Get('article-plan')
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderArticlePlanPage(@Query('articleId') articleId = ''): string {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Marketing Service - Article Planning</title>
    <style>
      :root {
        --bg: #ececed;
        --text: #121212;
        --muted: rgba(18, 18, 18, 0.58);
        --line: rgba(18, 18, 18, 0.18);
        --line-strong: rgba(18, 18, 18, 0.28);
        --surface: rgba(255, 255, 255, 0.88);
        --surface-soft: rgba(255, 255, 255, 0.54);
        --danger: #b42318;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font: 15px/1.32 "Helvetica Neue", Helvetica, Arial, sans-serif;
      }
      .wrap {
        max-width: 1800px;
        margin: 0 auto;
        padding: 22px 38px 40px;
        display: grid;
        gap: 18px;
      }
      .project-card {
        display: grid;
        gap: 18px;
        padding: 24px;
        border: 1px solid rgba(18, 18, 18, 0.12);
        border-radius: 34px;
        background: var(--surface);
      }
      .section-head,
      .hero-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 24px;
      }
      h1 {
        margin: 0;
        font-size: clamp(28px, 3.5vw, 56px);
        line-height: 0.86;
        letter-spacing: -0.07em;
        font-weight: 400;
      }
      h2 {
        margin: 0;
        font-size: 34px;
        line-height: 1;
        letter-spacing: -0.04em;
        font-weight: 400;
      }
      h3 {
        margin: 0;
        font-size: 34px;
        line-height: 0.98;
        letter-spacing: -0.05em;
        font-weight: 400;
      }
      p {
        margin: 0;
        color: var(--muted);
      }
      button, a.btn {
        appearance: none;
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 10px 18px;
        background: rgba(255, 255, 255, 0.34);
        color: var(--text);
        font: inherit;
        font-weight: 400;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background 120ms ease, opacity 120ms ease, transform 120ms ease;
      }
      button:hover, a.btn:hover {
        background: rgba(255, 255, 255, 0.56);
      }
      button[disabled] {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .hero-copy,
      .section-copy {
        display: grid;
        gap: 12px;
      }
      .eyebrow,
      .meta-label {
        color: var(--muted);
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .hero-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 18px;
      }
      .section-stack {
        display: grid;
        gap: 24px;
      }
      .calendar-headline {
        display: flex;
        align-items: baseline;
        gap: 14px;
        flex-wrap: wrap;
      }
      .calendar-range {
        display: inline-flex;
        align-items: center;
        padding: 6px 12px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.6);
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        white-space: nowrap;
      }
      .week-nav {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .week-nav button {
        min-width: 112px;
      }
      .schedule-shell {
        overflow-x: auto;
        padding-bottom: 4px;
      }
      .week-board {
        display: grid;
        grid-template-columns: 152px repeat(7, minmax(132px, 1fr));
        gap: 10px;
        align-items: start;
        min-width: 1120px;
      }
      .week-corner,
      .week-column-head,
      .week-row-head,
      .week-cell {
        border: 1px solid var(--line);
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.5);
      }
      .week-corner {
        min-height: 96px;
        padding: 16px;
        display: flex;
        align-items: end;
        color: var(--muted);
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .week-column-head {
        min-height: 96px;
        padding: 16px 14px;
        display: grid;
        align-content: space-between;
      }
      .week-column-head.is-today {
        border-color: var(--line-strong);
        background: rgba(255, 255, 255, 0.82);
      }
      .week-column-head small {
        color: var(--muted);
        font-weight: 400;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .week-column-head strong {
        font-size: 36px;
        line-height: 0.92;
        letter-spacing: -0.06em;
        font-weight: 400;
      }
      .week-column-head span {
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .week-row-head {
        min-height: 124px;
        padding: 16px;
        display: grid;
        align-content: center;
        gap: 6px;
      }
      .week-row-head strong {
        font-size: 24px;
        line-height: 1.2;
        letter-spacing: -0.04em;
        font-weight: 400;
      }
      .week-row-head span {
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .week-cell {
        min-height: 124px;
        width: 100%;
        padding: 10px;
        display: grid;
        align-content: start;
        gap: 6px;
        overflow: hidden;
        text-decoration: none;
        color: inherit;
        transition: transform 120ms ease, background 120ms ease, border-color 120ms ease;
      }
      .week-cell:disabled {
        cursor: not-allowed;
      }
      .week-cell:hover {
        background: rgba(255, 255, 255, 0.78);
        transform: translateY(-1px);
      }
      .week-cell:disabled:hover {
        background: rgba(255, 255, 255, 0.5);
        transform: none;
      }
      .week-cell.is-today {
        border-color: var(--line-strong);
      }
      .week-cell.is-past {
        background: rgba(255, 255, 255, 0.24);
      }
      .week-cell-scroll {
        display: grid;
        gap: 4px;
        align-content: start;
        overflow-y: auto;
        overflow-x: hidden;
        overscroll-behavior: contain;
        padding-right: 4px;
        min-height: 0;
        scrollbar-width: thin;
        scrollbar-color: rgba(18, 18, 18, 0.28) transparent;
      }
      .week-cell-scroll::-webkit-scrollbar {
        width: 6px;
      }
      .week-cell-scroll::-webkit-scrollbar-track {
        background: transparent;
      }
      .week-cell-scroll::-webkit-scrollbar-thumb {
        background: rgba(18, 18, 18, 0.24);
        border-radius: 999px;
      }
      .week-cell-placeholder {
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .week-cell-placeholder.disabled {
        color: rgba(18, 18, 18, 0.34);
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
        padding: 8px 10px;
        min-width: 0;
        border-radius: 16px;
        background: var(--pub-bg);
        border: 1px solid var(--pub-border);
      }
      .week-publication-language {
        color: var(--pub-text);
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        white-space: nowrap;
      }
      .week-publication-time {
        color: var(--pub-time);
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
      }
      .meta {
        display: grid;
        gap: 12px;
      }
      .meta-card {
        display: grid;
        gap: 10px;
        min-height: 110px;
        padding: 18px;
        border: 1px solid var(--line);
        border-radius: 24px;
        background: var(--surface-soft);
        align-content: space-between;
      }
      .meta-value {
        font-size: 24px;
        line-height: 1.02;
        letter-spacing: -0.04em;
        font-weight: 400;
        overflow-wrap: anywhere;
      }
      .meta-value.compact {
        font-size: 18px;
        line-height: 1.1;
      }
      .meta-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      pre {
        margin: 0;
        padding: 16px;
        min-height: 120px;
        overflow: auto;
        border-radius: 16px;
        background: #101828;
        color: #eef2ff;
        font: 13px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace;
        white-space: pre-wrap;
        overflow-wrap: break-word;
      }
      .error {
        color: var(--danger);
        font-weight: 700;
        min-height: 24px;
      }
      .error:empty {
        display: none;
        min-height: 0;
      }
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(18, 18, 18, 0.22);
        display: none;
        place-items: center;
        padding: 24px;
      }
      .modal-backdrop.open {
        display: grid;
      }
      .modal {
        width: min(560px, 100%);
        background: rgba(255, 255, 255, 0.96);
        border: 1px solid rgba(18, 18, 18, 0.12);
        border-radius: 30px;
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
        line-height: 1;
        letter-spacing: -0.04em;
        font-weight: 400;
      }
      .modal-head p {
        margin: 0;
        color: var(--muted);
      }
      label {
        display: grid;
        gap: 6px;
        color: var(--muted);
        font-weight: 400;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 12px;
      }
      input, select {
        width: 100%;
        padding: 14px 16px;
        border: 1px solid var(--line);
        border-radius: 18px;
        font: inherit;
        color: var(--text);
        background: rgba(255, 255, 255, 0.86);
      }
      .modal-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      @media (max-width: 980px) {
        .meta {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 760px) {
        .wrap {
          padding: 18px 16px 28px;
        }
        .section-head,
        .hero-top,
        .section-copy {
          flex-direction: column;
        }
        .calendar-headline {
          align-items: flex-start;
        }
        .meta {
          grid-template-columns: 1fr;
        }
      }
${renderDevConsoleStyles()}
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="project-card">
        <div class="hero-top">
          <div class="hero-copy">
            <span class="eyebrow">Article</span>
            <h1 id="articleTitle">Planning article...</h1>
          </div>
          <div class="hero-actions">
            <a class="btn" id="backToProjectLink" href="#">Back to project</a>
            <button id="continueBtn" onclick="continueToGeneration()" disabled>Continue to generation</button>
          </div>
        </div>
      </section>

      <div class="layout">
        <section class="project-card section-stack">
          <div class="section-head">
            <div class="section-copy">
              <div class="calendar-headline">
                <h2>Publication calendar</h2>
                <span id="weekRange" class="calendar-range"></span>
              </div>
              <p>Plan publications by day, channel, and language for a single article.</p>
            </div>
            <div class="week-nav">
              <button onclick="shiftWeek(-1)" aria-label="Previous week">Previous</button>
              <button onclick="shiftWeek(1)" aria-label="Next week">Next</button>
            </div>
          </div>
          <div id="error" class="error"></div>
          <div class="schedule-shell">
            <div id="weekGrid" class="week-board"></div>
          </div>
        </section>
      </div>

      <div class="sr-only" aria-hidden="true">
        <span id="articleIdLabel"></span>
        <span id="projectIdLabel"></span>
        <span id="planCount">0</span>
        <span id="channelCount">0</span>
      </div>
    </div>

    <div id="planModalBackdrop" class="modal-backdrop" onclick="closePlanModal(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-head">
          <div>
            <h3>Create publication</h3>
            <p id="planModalSubtitle">The selected cell already defines the day and channel. Here you only set language and time.</p>
          </div>
          <button type="button" class="btn secondary" onclick="closePlanModal()">Close</button>
        </div>
        <label>
          Language
          <select id="planLanguage"></select>
        </label>
        <label>
          Time
          <input id="planTime" type="time" />
        </label>
        <div class="modal-actions">
          <button type="button" id="savePlanBtn" onclick="savePlan()">Save publication</button>
          <button type="button" class="btn secondary" onclick="closePlanModal()">Cancel</button>
        </div>
        <div id="planError" class="error"></div>
      </div>
    </div>

    <script>
      const articleId = ${JSON.stringify(articleId)};
      const weekDayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
      const monthLabels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const adaptationChannels = [
        { id: 'channel_telegram', label: 'Telegram', hint: 'Adaptation' },
        { id: 'channel_x', label: 'X', hint: 'Adaptation' },
        { id: 'channel_discord', label: 'Discord', hint: 'Adaptation' },
        { id: 'channel_blog', label: 'Blog', hint: 'Adaptation' },
      ];
      const DEFAULT_TYPES = [
        { channelId: 'channel_telegram', displayName: 'Telegram', promptInstructions: '' },
        { channelId: 'channel_x', displayName: 'X', promptInstructions: '' },
        { channelId: 'channel_discord', displayName: 'Discord', promptInstructions: '' },
        { channelId: 'channel_blog', displayName: 'Blog', promptInstructions: '' },
      ];
      const CUSTOM_TYPES_KEY = 'ms:test-ui-adaptation-overrides';
      const MOSCOW_OFFSET_MS = 3 * 60 * 60 * 1000;
      let currentWeekStart = startOfWeek(new Date());
      let currentArticle = null;
      let currentPlans = [];
      let currentPublications = [];
      let pendingCell = null;

      function escapeHtml(value) {
        return String(value ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      function render(data) {
        document.getElementById('output').textContent =
          typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      }

      async function request(url, options, config) {
        const shouldRender = config?.renderResponse ?? true;
        const response = await fetch(url, options);
        const text = await response.text();
        let payload;
        try {
          payload = text ? JSON.parse(text) : {};
        } catch {
          payload = text;
        }

        if (shouldRender) {
          render({
            status: response.status,
            ok: response.ok,
            url,
            payload,
          });
        }

        if (!response.ok) {
          throw new Error(payload?.message || 'Request failed');
        }

        return payload;
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
            'Return only the final post text with no commentary.',
          ].join(' ');
        }

        if (channelId === 'channel_blog') {
          return [
            'Rewrite the provided long-form article into a short blog post in the same language.',
            'Preserve the core meaning and factual accuracy.',
            'Return 2 to 4 short paragraphs.',
            'Keep the tone clear, informative, and readable.',
            'Do not use hashtags.',
            'Do not use emojis.',
            'Return only the final post text with no commentary.',
          ].join(' ');
        }

        return '';
      }

      function languageOptions() {
        const originalLanguage = String(currentArticle?.original?.language || 'en').trim().toLowerCase() || 'en';
        const options = [
          { language: originalLanguage, label: languageLabel(originalLanguage) },
          { language: 'en', label: 'English' },
          { language: 'es', label: 'Spanish' },
          { language: 'ru', label: 'Russian' },
          { language: 'id', label: 'Indonesian' },
          { language: 'fil', label: 'Filipino' },
          { language: 'vi', label: 'Vietnamese' },
          { language: 'pt', label: 'Portuguese' },
        ];

        return options.filter(
          (option, index, list) => list.findIndex((item) => item.language === option.language) === index,
        );
      }

      function languageLabel(language) {
        const normalized = String(language || '').toLowerCase();
        if (normalized === 'ru') return 'Russian';
        if (normalized === 'en') return 'English';
        if (normalized === 'es') return 'Spanish';
        if (normalized === 'id') return 'Indonesian';
        if (normalized === 'fil') return 'Filipino';
        if (normalized === 'vi') return 'Vietnamese';
        if (normalized === 'pt') return 'Portuguese';
        return normalized.toUpperCase();
      }

      const MOSCOW_OFFSET_MS = 3 * 60 * 60 * 1000;

      function getMoscowDateParts(value) {
        const date = value instanceof Date ? new Date(value) : new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        const shifted = new Date(date.getTime() + MOSCOW_OFFSET_MS);
        return {
          year: shifted.getUTCFullYear(),
          month: shifted.getUTCMonth(),
          day: shifted.getUTCDate(),
          hours: shifted.getUTCHours(),
          minutes: shifted.getUTCMinutes(),
        };
      }

      function startOfWeek(date) {
        const parts = getMoscowDateParts(date);
        const value = new Date(Date.UTC(parts.year, parts.month, parts.day));
        const day = value.getUTCDay();
        const diff = day === 0 ? -6 : 1 - day;
        value.setUTCDate(value.getUTCDate() + diff);
        return value;
      }

      function addDays(date, days) {
        const value = new Date(date);
        value.setUTCDate(value.getUTCDate() + days);
        return value;
      }

      function isSameDay(a, b) {
        const left = getMoscowDateParts(a);
        const right = getMoscowDateParts(b);
        return left && right &&
          left.year === right.year &&
          left.month === right.month &&
          left.day === right.day;
      }

      function isPastPlanningDay(date) {
        const todayParts = getMoscowDateParts(new Date());
        const today = new Date(Date.UTC(todayParts.year, todayParts.month, todayParts.day));
        const value = new Date(date);
        return value.getTime() < today.getTime();
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

      function formatTime(value) {
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Europe/Moscow',
          hour: '2-digit',
          minute: '2-digit',
        }).format(date);
      }

      function dateKey(date) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
      }

      function formatDate(value) {
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Europe/Moscow',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(date);
      }

      function publicationStatus(plan) {
        const linkedPublication = currentPublications.find((item) =>
          item.channelId === plan.channelId &&
          String(item.targetLanguage || '').toLowerCase() === String(plan.targetLanguage || '').toLowerCase() &&
          new Date(item.publishAt).getTime() === new Date(plan.publishAt).getTime(),
        ) || null;

        return linkedPublication?.status || null;
      }

      function plansForCell(channelId, dayDate) {
        return currentPlans
          .filter((plan) => plan.channelId === channelId && isSameDay(new Date(plan.publishAt), dayDate))
          .sort((a, b) => new Date(a.publishAt).getTime() - new Date(b.publishAt).getTime());
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
            const isPast = isPastPlanningDay(dayDate);
            const plans = plansForCell(channel.id, dayDate);
            const content = plans.length
              ? plans.map((plan) =>
                  '<div class="week-publication">' +
                    '<span class="week-publication-language">' + escapeHtml(String(plan.targetLanguage || '').toUpperCase()) + '</span>' +
                    '<span class="week-publication-time">' + escapeHtml(formatTime(plan.publishAt)) + '</span>' +
                  '</div>'
                ).join('')
              : '<span class="week-cell-placeholder ' + (isPast ? 'disabled' : '') + '">' + (isPast ? '—' : '+') + '</span>';

            return \`
              <button
                class="week-cell \${isToday ? 'is-today' : ''} \${isPast ? 'is-past' : ''}"
                onclick="openPlanModal('\${channel.id}', '\${dateKey(dayDate)}')"
                \${isPast ? 'disabled aria-disabled="true"' : ''}
              >
                <div class="week-cell-scroll">\${content}</div>
              </button>
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

      function openPlanModal(channelId, dayKey) {
        const selectedDay = new Date(dayKey + 'T00:00:00');
        if (isPastPlanningDay(selectedDay)) {
          return;
        }

        pendingCell = { channelId, dayKey };
        const languageSelect = document.getElementById('planLanguage');
        languageSelect.innerHTML = languageOptions().map((option) =>
          '<option value="' + escapeHtml(option.language) + '">' + escapeHtml(option.label) + '</option>'
        ).join('');
        const timeInput = document.getElementById('planTime');
        if (isSameDay(selectedDay, new Date())) {
          const now = new Date();
          now.setMinutes(now.getMinutes() + 5);
          timeInput.value = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        } else {
          timeInput.value = '12:00';
        }
        document.getElementById('planError').textContent = '';
        document.getElementById('planModalSubtitle').textContent =
          'Channel: ' +
          adaptationChannels.find((item) => item.id === channelId)?.label +
          ' · Day: ' +
          formatDate(new Date(dayKey + 'T00:00:00'));
        document.getElementById('planModalBackdrop').classList.add('open');
      }

      function closePlanModal(event) {
        if (event && event.target !== event.currentTarget) return;
        document.getElementById('planModalBackdrop').classList.remove('open');
        document.getElementById('planError').textContent = '';
        pendingCell = null;
      }

      async function savePlan() {
        const error = document.getElementById('planError');
        error.textContent = '';

        if (!pendingCell) {
          error.textContent = 'No cell selected.';
          return;
        }

        const targetLanguage = document.getElementById('planLanguage').value.trim();
        const timeValue = document.getElementById('planTime').value.trim();

        if (!targetLanguage) {
          error.textContent = 'Choose a language.';
          return;
        }

        if (!timeValue) {
          error.textContent = 'Choose a time.';
          return;
        }

        const publishAt = new Date(pendingCell.dayKey + 'T' + timeValue + ':00');
        if (Number.isNaN(publishAt.getTime())) {
          error.textContent = 'Invalid publish time.';
          return;
        }

        const now = new Date();
        if (publishAt.getTime() <= now.getTime()) {
          error.textContent = 'Cannot schedule a publication in the past.';
          return;
        }

        try {
          const existing = currentPlans.find((plan) =>
            plan.channelId === pendingCell.channelId &&
            String(plan.targetLanguage || '').toLowerCase() === targetLanguage.toLowerCase(),
          );

          if (existing && new Date(existing.publishAt).getTime() === publishAt.getTime()) {
            closePlanModal();
            return;
          }

          if (existing) {
            await request(
              '/publishing/plans/' + encodeURIComponent(existing.id) + '/cancel',
              { method: 'POST' },
              { renderResponse: false },
            );
          }

          await request('/publishing/plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              articleId,
              channelId: pendingCell.channelId,
              targetLanguage,
              publishAt: publishAt.toISOString(),
            }),
          });
          closePlanModal();
          await refreshPlanning();
        } catch (requestError) {
          error.textContent = requestError instanceof Error ? requestError.message : String(requestError);
        }
      }

      function shiftWeek(direction) {
        currentWeekStart = addDays(currentWeekStart, direction * 7);
        refreshPlanning();
      }

      async function ensureAdaptationsForPlannedChannels() {
        const channelIds = Array.from(new Set(currentPlans.map((plan) => plan.channelId)));
        const existingByChannel = new Map(
          (Array.isArray(currentArticle?.adaptations) ? currentArticle.adaptations : []).map((adaptation) => [adaptation.channelId, adaptation]),
        );
        const types = new Map(allTypes().map((type) => [type.channelId, type]));

        for (const channelId of channelIds) {
          if (existingByChannel.has(channelId)) {
            continue;
          }

          const type = types.get(channelId);
          await request('/articles/' + encodeURIComponent(articleId) + '/adaptations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              channelId,
              displayName: type?.displayName || channelId,
              promptInstructions: type?.promptInstructions || builtInPrompt(channelId) || null,
            }),
          }, { renderResponse: false });
        }
      }

      async function continueToGeneration() {
        const button = document.getElementById('continueBtn');
        if (!currentPlans.length) {
          return;
        }

        button.disabled = true;
        try {
          await ensureAdaptationsForPlannedChannels();
          window.location.href = '/test-ui/review?articleId=' + encodeURIComponent(articleId);
        } catch (error) {
          document.getElementById('error').textContent = error instanceof Error ? error.message : String(error);
          button.disabled = false;
        }
      }

      async function refreshPlanning() {
        document.getElementById('error').textContent = '';
        try {
          currentArticle = await request('/articles/' + encodeURIComponent(articleId), undefined, { renderResponse: false });
          document.getElementById('articleIdLabel').textContent = currentArticle.id || 'missing';
          document.getElementById('projectIdLabel').textContent = currentArticle.projectId || 'missing';
          document.getElementById('articleTitle').textContent = currentArticle.original?.content
            ? String(currentArticle.original.content).split(/\\r?\\n/).map((item) => item.trim()).find(Boolean)?.slice(0, 120) || 'Untitled article'
            : 'Untitled article';
          document.getElementById('backToProjectLink').href = '/test-ui/project?projectId=' + encodeURIComponent(currentArticle.projectId);

          currentPlans = await request(
            '/publishing/articles/' + encodeURIComponent(articleId) + '/plans',
            undefined,
            { renderResponse: false },
          );
          currentPublications = await request(
            '/publishing/articles/' + encodeURIComponent(articleId),
            undefined,
            { renderResponse: false },
          );

          document.getElementById('planCount').textContent = String(currentPlans.length);
          document.getElementById('channelCount').textContent = String(new Set(currentPlans.map((plan) => plan.channelId)).size);
          document.getElementById('continueBtn').disabled = currentPlans.length === 0;

          renderWeekDashboard();
        } catch (error) {
          document.getElementById('error').textContent = error instanceof Error ? error.message : String(error);
        }
      }

      refreshPlanning().catch((error) => {
        document.getElementById('error').textContent = error instanceof Error ? error.message : String(error);
      });
    </script>
${renderDevConsoleMarkup()}
${renderDevConsoleScript()}
  </body>
</html>`;
  }

  @Get('review')
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderReviewPage(): string {
    return `<!doctype html>
<html lang="en">
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
${renderUnifiedWorkflowStyles()}
${renderDevConsoleStyles()}
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="hero">
        <h1>Step 2. Generate adaptations</h1>
        <p>Generation starts automatically for the selected channels when the page loads. A placeholder is shown until the text is ready.</p>
      </section>

      <div class="layout">
        <section class="cards" id="cards"></section>

        <aside class="panel control-panel">
          <h2 style="margin:0 0 10px;">Controls</h2>
          <div class="meta">
            <div class="meta-line"><strong>Article ID:</strong> <span id="articleIdLabel" class="meta-value"></span></div>
            <div class="meta-line"><strong>Adaptations:</strong> <span id="adaptationCount" class="meta-value">0</span></div>
            <div class="meta-line"><strong>Ready:</strong> <span id="readyCount" class="meta-value">0</span></div>
          </div>

          <div class="actions">
            <button id="approveAllBtn" onclick="approveAll()" disabled>Approve adaptation</button>
            <button class="secondary" onclick="refreshArticle()">Refresh</button>
          </div>

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
                  <div class="placeholder-title">Generating adaptation for \${escapeHtml(adaptation.displayName)}...</div>
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
${renderDevConsoleMarkup()}
${renderDevConsoleScript()}
  </body>
</html>`;
  }

  @Get('translations')
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderTranslationsPage(): string {
    return `<!doctype html>
<html lang="en">
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
      .translation-schedule {
        display: grid;
        gap: 6px;
        margin-top: 10px;
      }
      .translation-schedule label {
        display: grid;
        gap: 6px;
        color: var(--muted);
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .translation-schedule input {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--border);
        border-radius: 14px;
        font: inherit;
        color: var(--text);
        background: #fff;
      }
      .translation-schedule input.is-expired {
        border-color: #f2b8ad;
        background: #fff6f4;
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
      .plan-warning {
        margin-top: 14px;
        padding: 12px 14px;
        border-radius: 14px;
        border: 1px solid #f2b8ad;
        background: #fff6f4;
        color: #b42318;
        font-size: 13px;
        font-weight: 700;
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
${renderUnifiedWorkflowStyles()}
${renderDevConsoleStyles()}
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="hero">
        <h1>Step 3. Generate translations</h1>
        <p>After adaptation approval, translations start on a separate page. A placeholder is shown until the translation is ready.</p>
      </section>

      <div class="layout">
        <section class="cards" id="cards"></section>

        <aside class="panel control-panel">
          <h2 style="margin:0 0 10px;">Controls</h2>
          <div class="meta">
            <div class="meta-line"><strong>Article ID:</strong> <span id="articleIdLabel" class="meta-value"></span></div>
            <div class="meta-line"><strong>Adaptations:</strong> <span id="adaptationCount" class="meta-value">0</span></div>
          </div>

          <div class="actions">
            <button id="approvePublishBtn" onclick="goToPublishingStep()">Approve translations and continue</button>
            <button class="secondary" onclick="refreshArticle()">Refresh</button>
            <button class="secondary" onclick="goBack()">Back to adaptations</button>
          </div>
          <div id="planWarning" class="plan-warning hidden"></div>

        </aside>
      </div>
    </div>

    <script>
      const params = new URLSearchParams(window.location.search);
      const articleId = params.get('articleId');
      const generatingTranslations = new Set();
      const publishedLocalizations = new Map();
      let currentArticle = null;
      let currentPlans = [];

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

      function planInputId(planId) {
        return 'planInput_' + planId;
      }

      function languageLabel(language) {
        if (language === 'ru') return 'Russian';
        if (language === 'en') return 'English';
        if (language === 'es') return 'Spanish';
        if (language === 'id') return 'Indonesian';
        if (language === 'fil') return 'Filipino';
        if (language === 'vi') return 'Vietnamese';
        if (language === 'pt') return 'Portuguese';
        return String(language || '').toUpperCase();
      }

      function formatDateTime(value) {
        if (!value) return 'not scheduled';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Europe/Moscow',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(date);
      }

      function formatPlanTiming(plan) {
        return formatDateTime(plan?.publishAt);
      }

      function toDateTimeLocalValue(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
      }

      function publicationPlanFor(adaptation) {
        const planMap = new Map();
        for (const plan of currentPlans) {
          if (!plan || plan.channelId !== adaptation.channelId) {
            continue;
          }

          const key = String(plan.targetLanguage || '').toLowerCase();
          const existing = planMap.get(key);
          if (!existing) {
            planMap.set(key, {
              id: plan.id,
              targetLanguage: key,
              publishAt: plan.publishAt,
              publishAtList: [plan.publishAt],
            });
            continue;
          }

          existing.publishAtList.push(plan.publishAt);
          if (new Date(plan.publishAt).getTime() < new Date(existing.publishAt).getTime()) {
            existing.publishAt = plan.publishAt;
          }
        }

        return Array.from(planMap.values()).sort(
          (left, right) => new Date(left.publishAt).getTime() - new Date(right.publishAt).getTime(),
        );
      }

      function isOriginalLanguagePlan(language, article) {
        return language === article?.original?.language;
      }

      function renderCards(adaptations) {
        const cards = document.getElementById('cards');
        cards.innerHTML = adaptations.map((adaptation) => {
          const key = cardKey(adaptation.id);
          const translationPlans = publicationPlanFor(adaptation);
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
              ? '<p class="publish-note">' +
                  escapeHtml(
                    adaptation.channelId === 'channel_discord'
                      ? 'Published to Discord'
                      : adaptation.channelId === 'channel_x'
                        ? 'Published to X · post #' + String(published.messageId)
                        : adaptation.channelId === 'channel_blog'
                          ? 'Published to Blog'
                          : 'Published to Telegram · message #' + String(published.messageId),
                  ) +
                '</p>'
              : '';
            return \`
              <div class="translation-block">
                <div class="translation-head">
                  <div>
                    <h3>\${escapeHtml(languageLabel(plan.targetLanguage))}</h3>
                    <p class="translation-note">
                      \${plan.publishAtList.length > 1
                        ? 'Planned publications: ' + escapeHtml(String(plan.publishAtList.length)) + ' · next at ' + escapeHtml(formatPlanTiming(plan))
                        : 'Publish at: ' + escapeHtml(formatPlanTiming(plan))}
                    </p>
                    \${publishMarkup}
                  </div>
                  <span id="\${key}TranslationStatus_\${plan.targetLanguage}" class="badge \${status === 'not started' || status === 'pending' ? 'pending' : 'generated'}">\${escapeHtml(status)}</span>
                </div>
                <div class="translation-schedule">
                  <label>
                    Publish at
                    <input
                      id="\${planInputId(plan.id)}"
                      type="datetime-local"
                      value="\${escapeHtml(toDateTimeLocalValue(plan.publishAt))}"
                    />
                  </label>
                </div>
                <div class="stage">
                  <div id="\${key}TranslationPlaceholder_\${plan.targetLanguage}" class="placeholder \${content ? 'hidden' : ''}">
                    <div class="placeholder-title">\${originalPlan ? 'Using the approved adaptation as the localization...' : 'Generating translation for ' + escapeHtml(adaptation.displayName) + '...'}</div>
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

      function setPlanWarning(message) {
        const node = document.getElementById('planWarning');
        if (!node) return;

        if (!message) {
          node.textContent = '';
          node.classList.add('hidden');
          return;
        }

        node.textContent = message;
        node.classList.remove('hidden');
      }

      async function refreshArticle() {
        const article = await request(
          '/articles/' + encodeURIComponent(articleId),
          undefined,
          { renderResponse: false },
        );
        currentPlans = await request(
          '/publishing/articles/' + encodeURIComponent(articleId) + '/plans',
          undefined,
          { renderResponse: false },
        );
        currentArticle = article;
        const adaptations = Array.isArray(article.adaptations)
          ? article.adaptations.filter((item) =>
              item.status === 'approved' &&
              currentPlans.some((plan) => plan.channelId === item.channelId),
            )
          : [];

        renderCards(adaptations);

        for (const adaptation of adaptations) {
          const plans = publicationPlanFor(adaptation);
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
          ? article.adaptations.filter((item) =>
              item.status === 'approved' &&
              currentPlans.some((plan) => plan.channelId === item.channelId),
            )
          : [];
        const translationJobs = [];

        for (const adaptation of adaptations) {
          const plans = publicationPlanFor(adaptation);
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

      async function persistPlanChangesAndValidate() {
        setPlanWarning('');
        const article = await refreshArticle();
        const adaptations = Array.isArray(article.adaptations)
          ? article.adaptations.filter((item) =>
              item.status === 'approved' &&
              currentPlans.some((plan) => plan.channelId === item.channelId),
            )
          : [];
        const issues = [];
        const updates = [];
        const now = new Date();

        for (const adaptation of adaptations) {
          const plans = publicationPlanFor(adaptation);
          for (const plan of plans) {
            const input = document.getElementById(planInputId(plan.id));
            const rawValue = input?.value?.trim() || '';
            const nextPublishAt = rawValue ? new Date(rawValue) : new Date(NaN);

            if (Number.isNaN(nextPublishAt.getTime()) || nextPublishAt.getTime() <= now.getTime()) {
              issues.push(adaptation.displayName + ' · ' + languageLabel(plan.targetLanguage));
              input?.classList.add('is-expired');
              continue;
            }

            input?.classList.remove('is-expired');

            if (new Date(plan.publishAt).getTime() !== nextPublishAt.getTime()) {
              updates.push({
                id: plan.id,
                publishAt: nextPublishAt.toISOString(),
              });
            }
          }
        }

        if (issues.length) {
          setPlanWarning('Update date and time for: ' + issues.join(', ') + '. These publications are already overdue.');
          return false;
        }

        for (const update of updates) {
          await request(
            '/publishing/plans/' + encodeURIComponent(update.id) + '/reschedule',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ publishAt: update.publishAt }),
            },
            { renderResponse: false },
          );
        }

        if (updates.length) {
          await refreshArticle();
        }

        return true;
      }

      async function goToPublishingStep() {
        const button = document.getElementById('approvePublishBtn');
        button.disabled = true;
        try {
          const canContinue = await persistPlanChangesAndValidate();
          if (!canContinue) {
            return;
          }

          window.location.href =
            '/test-ui/publishing?articleId=' + encodeURIComponent(articleId);
        } finally {
          button.disabled = false;
        }
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
${renderDevConsoleMarkup()}
${renderDevConsoleScript()}
  </body>
</html>`;
  }

  @Get('publishing')
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderPublishingPage(): string {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Marketing Service - Publishing Queue</title>
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
${renderUnifiedWorkflowStyles()}
${renderDevConsoleStyles()}
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="hero">
        <h1>Step 4. Publication queue</h1>
        <p>Here we confirm planned localizations and create real backend publications. If a localization has a delayed time, the server will post it to the target channel later.</p>
      </section>

      <div class="layout">
        <section id="statusList" class="status-list"></section>

        <aside class="panel">
          <h2 style="margin:0 0 10px;">Controls</h2>
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
        </aside>
      </div>
    </div>

    <script>
      const params = new URLSearchParams(window.location.search);
      const articleId = params.get('articleId');
      let currentArticle = null;
      let currentPlans = [];
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
        if (language === 'id') return 'Indonesian';
        if (language === 'fil') return 'Filipino';
        if (language === 'vi') return 'Vietnamese';
        if (language === 'pt') return 'Portuguese';
        return String(language || '').toUpperCase();
      }

      function formatDateTime(value) {
        if (!value) return 'not scheduled';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Europe/Moscow',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(date);
      }

      function formatHumanDateTime(value) {
        if (!value) return 'no date';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat('en-GB', {
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit',
        }).format(date);
      }

      function isOriginalLanguagePlan(language, article) {
        return language === article?.original?.language;
      }

      function publishableItems(article) {
        const adaptations = Array.isArray(article?.adaptations)
          ? article.adaptations.filter(
              (item) =>
                item.status === 'approved' &&
                (
                  item.channelId === 'channel_telegram' ||
                  item.channelId === 'channel_discord' ||
                  item.channelId === 'channel_x' ||
                  item.channelId === 'channel_blog'
                ),
            )
          : [];

        return adaptations.flatMap((adaptation) =>
          currentPlans
            .filter((plan) => plan.channelId === adaptation.channelId)
            .map((plan) => ({
            adaptation,
            plan,
            key: publishKey(adaptation.id, plan.targetLanguage) + ':' + plan.publishAt,
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
          return 'Localization content is not available yet.';
        }

        const articleLanguage = currentArticle?.original?.language;
        if (publication.targetLanguage === articleLanguage) {
          return adaptation.adaptedContent || 'Adaptation content is still empty.';
        }

        const translations = Array.isArray(adaptation.translations) ? adaptation.translations : [];
        const translation = translations.find((item) => item.targetLanguage === publication.targetLanguage);
        return translation?.translatedContent || 'Translation not found yet.';
      }

      function shortPreview(text) {
        const normalized = String(text || '').trim();
        if (!normalized) {
          return 'Empty publication.';
        }

        if (normalized.length <= 220) {
          return normalized;
        }

        return normalized.slice(0, 217) + '...';
      }

      function statusSummary(publication) {
        if (publication.status === 'published') {
          const publishedAt = publication.publishedAt ? formatDateTime(publication.publishedAt) : 'just now';
          return {
            className: 'published',
            text: 'Published' + (publishedAt ? ' · ' + publishedAt : ''),
          };
        }

        if (publication.status === 'failed') {
          return {
            className: 'failed',
            text: 'Publishing error',
          };
        }

        if (publication.status === 'publishing') {
          return {
            className: 'scheduled',
            text: 'Publishing now',
          };
        }

        return {
          className: 'scheduled',
          text: 'Will be published ' + formatHumanDateTime(publication.publishAt),
        };
      }

      function renderStatuses() {
        const list = document.getElementById('statusList');
        const items = Array.isArray(currentPublications) ? currentPublications : [];

        if (items.length === 0) {
          list.innerHTML = '<div class="empty-state">No publications have been created for this article yet.</div>';
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
                    : publication.channelId === 'channel_x'
                      ? 'X post #' + String(publication.telegramMessageId)
                      : publication.channelId === 'channel_blog'
                        ? 'Blog item marked as published'
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
        currentPlans = await request(
          '/publishing/articles/' + encodeURIComponent(articleId) + '/plans',
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
                : item.adaptation.channelId === 'channel_x'
                  ? '/publishing/x/schedule'
                  : item.adaptation.channelId === 'channel_blog'
                    ? '/publishing/blog/schedule'
                  : '/publishing/telegram/schedule',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  articleId,
                  adaptationId: item.adaptation.id,
                  targetLanguage: item.plan.targetLanguage,
                  publishAt: item.plan.publishAt,
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
${renderDevConsoleMarkup()}
${renderDevConsoleScript()}
  </body>
</html>`;
  }

  @Get('editor')
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderEditorPage(): string {
    return `<!doctype html>
<html lang="en">
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
${renderUnifiedWorkflowStyles()}
${renderDevConsoleStyles()}
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="panel hero">
        <div class="hero-top">
          <button id="backBtn" class="secondary" onclick="goBack()">Back</button>
          <div class="hero-copy">
            <h1>Adaptation editor</h1>
            <p>Here you can manually adjust a ready adaptation, save changes, and return to the review screen.</p>
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
          <p>The current version is highlighted in blue. If you choose another number, the window switches to preview mode.</p>
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
              <p>Select a text fragment on the left, describe what should change, and DeepSeek will create a new adaptation version.</p>
              <div>
                <strong>Instruction for DeepSeek</strong>
                <textarea id="aiPrompt" class="ai-prompt" placeholder="For example: make this idea softer, remove clickbait, shorten it, make the phrasing more precise"></textarea>
              </div>
              <div class="actions" style="margin-top:0;">
                <button id="aiReviseBtn" class="secondary" onclick="reviseSelectionWithAi()">AI fix selection</button>
              </div>
            </div>
          </aside>
        </div>
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
          return new Date(value).toLocaleString('en-GB', {
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
          caption.textContent = 'This adaptation has no saved versions yet.';
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
        setMessage('This is a preview version. If it works, click Use preview as current.', 'success');
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
          banner.textContent = 'Preview mode: this version is open in read-only mode. Click Use preview as current if you want to make it the working version. To go back without selecting it, click the blue dot of the current version above.';
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
        setMessage('Returned to the current version.', 'success');
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
          setMessage('Editing is disabled in preview mode. Click Use preview as current or Return to current first.', 'error');
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
          setMessage('Changes saved.', 'success');

          if (window.opener && typeof window.opener.refreshArticle === 'function') {
            window.opener.refreshArticle().catch(() => {});
          }
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'Failed to save changes.', 'error');
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
          setMessage('Current version switched.', 'success');

          if (window.opener && typeof window.opener.refreshArticle === 'function') {
            window.opener.refreshArticle().catch(() => {});
          }
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'Failed to switch version.', 'error');
        }
      }

      async function reviseSelectionWithAi() {
        const reviseBtn = document.getElementById('aiReviseBtn');
        const textarea = document.getElementById('content');
        const instruction = document.getElementById('aiPrompt').value.trim();
        const selectedText = selectedFragment();

        if (isPreviewMode) {
          setMessage('AI edits are disabled in preview mode. Click Use preview as current or Return to current first.', 'error');
          return;
        }

        if (!selectedText.trim()) {
          setMessage('Select the text fragment you want to revise first.', 'error');
          return;
        }

        if (!instruction) {
          setMessage('Write an instruction for DeepSeek first.', 'error');
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
          setMessage('DeepSeek created a new intermediate version and made it current.', 'success');

          if (window.opener && typeof window.opener.refreshArticle === 'function') {
            window.opener.refreshArticle().catch(() => {});
          }
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'Failed to get the AI revision.', 'error');
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
${renderDevConsoleMarkup()}
${renderDevConsoleScript()}
  </body>
</html>`;
  }
}
