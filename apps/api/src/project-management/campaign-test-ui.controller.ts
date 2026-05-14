import { Controller, Get, Header, Query } from '@nestjs/common';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderCampaignUiStyles(): string {
  return `
      :root {
        --bg: #ececed;
        --text: #121212;
        --muted: rgba(18, 18, 18, 0.58);
        --line: rgba(18, 18, 18, 0.18);
        --line-strong: rgba(18, 18, 18, 0.28);
        --surface: rgba(255, 255, 255, 0.88);
        --surface-soft: rgba(255, 255, 255, 0.56);
        --success: #117a43;
        --success-soft: #ebfff4;
        --warning: #b54708;
        --warning-soft: #fff3e8;
        --danger: #b42318;
        --danger-soft: #fff0ed;
        --accent: #121212;
        --accent-soft: rgba(18, 18, 18, 0.08);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font: 15px/1.4 "Helvetica Neue", Helvetica, Arial, sans-serif;
      }
      .wrap {
        max-width: 1480px;
        margin: 0 auto;
        padding: 22px 38px 40px;
        display: grid;
        gap: 18px;
      }
      .hero,
      .panel,
      .card,
      .empty-state,
      .metric,
      .form-card {
        border: 1px solid rgba(18, 18, 18, 0.12);
        border-radius: 32px;
        background: var(--surface);
      }
      .hero,
      .panel,
      .form-card {
        padding: 24px;
      }
      .hero {
        display: grid;
        gap: 18px;
      }
      .hero-top,
      .section-head,
      .card-head,
      .toolbar,
      .nav-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }
      .hero-copy,
      .section-copy,
      .stack {
        display: grid;
        gap: 10px;
      }
      .eyebrow {
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      h1 {
        margin: 0;
        font-size: clamp(30px, 4vw, 58px);
        line-height: 0.9;
        letter-spacing: -0.06em;
        font-weight: 400;
      }
      h2 {
        margin: 0;
        font-size: 30px;
        line-height: 1;
        letter-spacing: -0.04em;
        font-weight: 400;
      }
      h3 {
        margin: 0;
        font-size: 22px;
        line-height: 1.05;
        letter-spacing: -0.04em;
        font-weight: 400;
      }
      p {
        margin: 0;
        color: var(--muted);
      }
      .actions,
      .tabs,
      .metric-grid,
      .card-grid,
      .detail-grid {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .metric-grid,
      .card-grid,
      .detail-grid {
        display: grid;
      }
      .metric-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
      }
      .card-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }
      .detail-grid {
        grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
        gap: 18px;
        align-items: start;
      }
      .metric,
      .card {
        padding: 20px;
        display: grid;
        gap: 12px;
      }
      .metric strong {
        font-size: 34px;
        line-height: 1;
        letter-spacing: -0.05em;
        font-weight: 400;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 36px;
        padding: 8px 14px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
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
      .btn,
      button,
      a.btn {
        appearance: none;
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 10px 18px;
        background: rgba(255, 255, 255, 0.34);
        color: var(--text);
        font: inherit;
        font-weight: 400;
        text-decoration: none;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background 120ms ease;
      }
      .btn:hover,
      button:hover,
      a.btn:hover {
        background: rgba(255, 255, 255, 0.56);
      }
      .btn.primary,
      button.primary {
        background: rgba(18, 18, 18, 0.92);
        color: #fff;
        border-color: rgba(18, 18, 18, 0.92);
      }
      .btn.danger,
      button.danger {
        background: var(--danger-soft);
        color: var(--danger);
        border-color: rgba(180, 35, 24, 0.18);
      }
      .tabs a {
        padding: 8px 14px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.34);
        color: var(--text);
        text-decoration: none;
      }
      .tabs a.active {
        background: rgba(18, 18, 18, 0.92);
        color: #fff;
        border-color: rgba(18, 18, 18, 0.92);
      }
      .meta-list,
      .kv,
      .checklist,
      .workflow-list,
      .timeline,
      .inbox-list {
        display: grid;
        gap: 12px;
      }
      .kv {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .meta-item,
      .check-item,
      .workflow-item,
      .timeline-item,
      .inbox-item {
        padding: 16px 18px;
        border: 1px solid var(--line);
        border-radius: 22px;
        background: var(--surface-soft);
        display: grid;
        gap: 10px;
      }
      .meta-item label,
      .check-item label,
      .workflow-item label,
      .timeline-item label {
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .meta-item strong,
      .check-item strong,
      .workflow-item strong,
      .timeline-item strong {
        font-size: 18px;
        line-height: 1.1;
        font-weight: 400;
      }
      .check-item.ok {
        border-color: rgba(17, 122, 67, 0.22);
      }
      .check-item.warn {
        border-color: rgba(181, 71, 8, 0.22);
      }
      .check-item.bad {
        border-color: rgba(180, 35, 24, 0.22);
      }
      label.field {
        display: grid;
        gap: 8px;
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      input,
      textarea,
      select {
        width: 100%;
        padding: 14px 16px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.82);
        color: var(--text);
        font: inherit;
      }
      textarea {
        min-height: 140px;
        resize: vertical;
      }
      .form-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }
      .form-grid .full {
        grid-column: 1 / -1;
      }
      .table-wrap {
        overflow: auto;
        border: 1px solid var(--line);
        border-radius: 24px;
        background: var(--surface-soft);
      }
      table {
        width: 100%;
        min-width: 760px;
        border-collapse: collapse;
      }
      th,
      td {
        padding: 14px 16px;
        text-align: left;
        border-bottom: 1px solid var(--line);
        vertical-align: top;
      }
      th {
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 700;
      }
      tr:last-child td {
        border-bottom: 0;
      }
      .mono {
        font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
      }
      .soft {
        color: var(--muted);
      }
      .pill-row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 7px 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.56);
        border: 1px solid var(--line);
        color: var(--muted);
        font-size: 12px;
      }
      pre.output {
        margin: 0;
        padding: 18px;
        min-height: 220px;
        border-radius: 22px;
        background: #101828;
        color: #eef2ff;
        overflow: auto;
        white-space: pre-wrap;
        overflow-wrap: break-word;
        font: 13px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace;
      }
      .empty-state {
        padding: 28px;
        color: var(--muted);
      }
      @media (max-width: 1120px) {
        .detail-grid {
          grid-template-columns: 1fr;
        }
        .metric-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .card-grid {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 760px) {
        .wrap {
          padding: 18px 16px 28px;
        }
        .form-grid,
        .kv,
        .metric-grid {
          grid-template-columns: 1fr;
        }
      }
`;
}

function renderSharedClientScript(): string {
  return `
    <script>
      function escapeHtml(value) {
        return String(value ?? '')
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#39;');
      }

      function setOutput(data) {
        const output = document.getElementById('output');
        if (!output) return;
        output.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      }

      async function request(url, options = {}, config = {}) {
        const res = await fetch(url, options);
        const text = await res.text();
        let payload;
        try {
          payload = text ? JSON.parse(text) : {};
        } catch {
          payload = text;
        }

        if (config.renderResponse !== false) {
          setOutput({ status: res.status, ok: res.ok, url, payload });
        }

        if (!res.ok) {
          throw new Error(payload?.message || 'Request failed');
        }

        return payload;
      }

      function formatDateTime(value) {
        if (!value) return '—';
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
        if (!value) return '—';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(date);
      }

      function formatDateInputValue(value) {
        const date = value ? new Date(value) : new Date();
        if (Number.isNaN(date.getTime())) {
          return '';
        }
        return date.toISOString().slice(0, 10);
      }

      function formatDateTimeInputValue(value) {
        const date = value ? new Date(value) : new Date();
        if (Number.isNaN(date.getTime())) {
          return '';
        }
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
      }

      function badgeTone(status) {
        const token = String(status || '').toLowerCase();
        if (['ready', 'published', 'completed', 'approved_for_publishing', 'resolved', 'approved', 'exported'].includes(token)) {
          return 'success';
        }
        if (['failed', 'blocked', 'cancelled', 'rejected', 'stage_1_failed', 'stage_2_failed', 'source_needs_review', 'needs_attention', 'source_blocked'].includes(token)) {
          return 'danger';
        }
        if (['draft', 'pending', 'publication_scheduled', 'publishing', 'translating', 'adapting', 'running', 'warning', 'changes_requested', 'ready_for_final_approval'].includes(token)) {
          return 'warning';
        }
        return 'neutral';
      }

      function renderBadge(status) {
        return '<span class="badge ' + badgeTone(status) + '">' + escapeHtml(status || 'unknown') + '</span>';
      }

      function toTitle(value) {
        return String(value || '')
          .split(/[_\\s-]+/)
          .filter(Boolean)
          .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
          .join(' ');
      }

      function splitLines(text) {
        return String(text || '')
          .split('\\n')
          .map((line) => line.trim())
          .filter(Boolean);
      }

      function parseGlossary(text) {
        return Object.fromEntries(
          splitLines(text)
            .map((line) => {
              const separatorIndex = line.indexOf('=');
              if (separatorIndex === -1) return null;
              const key = line.slice(0, separatorIndex).trim();
              const value = line.slice(separatorIndex + 1).trim();
              if (!key || !value) return null;
              return [key, value];
            })
            .filter(Boolean),
        );
      }

      function parseBrandDocs(text) {
        return splitLines(text)
          .map((line) => {
            const [title, url, notes] = line.split('|').map((part) => part.trim());
            if (!title) return null;
            return {
              title,
              url: url || null,
              notes: notes || null,
            };
          })
          .filter(Boolean);
      }

      function renderPills(items) {
        if (!Array.isArray(items) || items.length === 0) {
          return '<span class="soft">—</span>';
        }
        return '<div class="pill-row">' +
          items.map((item) => '<span class="pill">' + escapeHtml(item) + '</span>').join('') +
          '</div>';
      }
    </script>
  `;
}

function renderCampaignUiPage(params: {
  title: string;
  eyebrow: string;
  heading: string;
  summary: string;
  body: string;
  script: string;
}): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(params.title)}</title>
    <style>
${renderCampaignUiStyles()}
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="hero">
        <div class="hero-copy">
          <span class="eyebrow">${escapeHtml(params.eyebrow)}</span>
          <h1>${escapeHtml(params.heading)}</h1>
          <p>${escapeHtml(params.summary)}</p>
        </div>
      </section>
      ${params.body}
      <section class="panel stack">
        <div class="section-head">
          <div class="section-copy">
            <span class="eyebrow">Dev output</span>
            <h2>Request log</h2>
          </div>
        </div>
        <pre id="output" class="output">Ready.</pre>
      </section>
    </div>
${renderSharedClientScript()}
    <script>
${params.script}
    </script>
  </body>
</html>`;
}

@Controller('test-ui')
export class CampaignTestUiController {
  @Get('campaigns')
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderCampaignListPage(@Query('projectId') projectId = ''): string {
    return renderCampaignUiPage({
      title: 'Marketing Service - Campaigns',
      eyebrow: 'Campaigns',
      heading: 'Campaign list',
      summary:
        'This is the project-level entry point for the new campaign flow: brand memory, preset-based creation and operational monitoring.',
      body: `
        <section class="panel stack">
          <div class="nav-row">
            <div class="tabs">
              <a href="/test-ui/project?projectId=${escapeHtml(projectId)}">Project dashboard</a>
              <a class="active" href="/test-ui/campaigns?projectId=${escapeHtml(projectId)}">Campaigns</a>
              <a href="/test-ui/brand-memory?projectId=${escapeHtml(projectId)}">Brand Memory</a>
              <a href="/test-ui/campaigns/new?projectId=${escapeHtml(projectId)}">Create Campaign</a>
            </div>
            <div class="actions">
              <a class="btn" href="/test-ui/project?projectId=${escapeHtml(projectId)}">Back to project</a>
              <a class="btn" href="/test-ui/brand-memory?projectId=${escapeHtml(projectId)}">Brand Memory</a>
              <a class="btn primary" href="/test-ui/campaigns/new?projectId=${escapeHtml(projectId)}">Create campaign</a>
            </div>
          </div>
        </section>

        <section class="metric-grid">
          <article class="metric">
            <span class="eyebrow">Campaigns</span>
            <strong id="campaignCount">0</strong>
            <p>Total campaigns in this project.</p>
          </article>
          <article class="metric">
            <span class="eyebrow">Needs attention</span>
            <strong id="attentionCount">0</strong>
            <p>Campaigns blocked by review items or failures.</p>
          </article>
          <article class="metric">
            <span class="eyebrow">Publishing</span>
            <strong id="publishingCount">0</strong>
            <p>Campaigns already approved and linked to delivery.</p>
          </article>
          <article class="metric">
            <span class="eyebrow">Pending approvals</span>
            <strong id="pendingCount">0</strong>
            <p>Total pending inbox items across campaigns.</p>
          </article>
        </section>

        <section class="panel stack">
          <div class="section-head">
            <div class="section-copy">
              <span class="eyebrow">Project</span>
              <h2 id="projectName">Loading project</h2>
              <p id="projectMeta">Loading campaign inventory…</p>
            </div>
            <div class="actions">
              <button onclick="loadPage()">Refresh</button>
            </div>
          </div>
          <div id="campaignCards" class="card-grid"></div>
        </section>
      `,
      script: `
        const projectId = ${JSON.stringify(projectId)};

        function campaignActions(campaign) {
          return [
            '<a class="btn" href="/test-ui/campaign?campaignId=' + encodeURIComponent(campaign.id) + '">Open</a>',
            '<a class="btn" href="/test-ui/campaign-production?campaignId=' + encodeURIComponent(campaign.id) + '">Production</a>',
            '<a class="btn" href="/test-ui/campaign-inbox?campaignId=' + encodeURIComponent(campaign.id) + '">Inbox</a>',
            '<a class="btn" href="/test-ui/campaign-final-approval?campaignId=' + encodeURIComponent(campaign.id) + '">Final approval</a>',
            '<a class="btn" href="/test-ui/campaign-publishing?campaignId=' + encodeURIComponent(campaign.id) + '">Publishing</a>',
          ].join('');
        }

        function renderCampaignCards(campaigns) {
          const root = document.getElementById('campaignCards');
          if (!Array.isArray(campaigns) || campaigns.length === 0) {
            root.innerHTML = '<div class="empty-state">No campaigns yet. Start from Brand Memory, then create the first preset-based campaign.</div>';
            return;
          }

          root.innerHTML = campaigns.map((campaign) => {
            return '<article class="card">' +
              '<div class="card-head">' +
                '<div class="stack">' +
                  '<span class="eyebrow">' + escapeHtml(campaign.presetName || 'Preset missing') + '</span>' +
                  '<h3>' + escapeHtml(campaign.name) + '</h3>' +
                '</div>' +
                renderBadge(campaign.status) +
              '</div>' +
              '<div class="kv">' +
                '<div class="meta-item"><label>Start date</label><strong>' + escapeHtml(formatDateOnly(campaign.startDate)) + '</strong></div>' +
                '<div class="meta-item"><label>Source language</label><strong>' + escapeHtml(String(campaign.sourceLanguage || '').toUpperCase()) + '</strong></div>' +
                '<div class="meta-item"><label>Planned publications</label><strong>' + escapeHtml(String(campaign.plannedPublicationCount)) + '</strong></div>' +
                '<div class="meta-item"><label>Pending approvals</label><strong>' + escapeHtml(String(campaign.pendingApprovalCount)) + '</strong></div>' +
              '</div>' +
              '<p class="soft">Updated ' + escapeHtml(formatDateTime(campaign.updatedAt)) + '</p>' +
              '<div class="actions">' + campaignActions(campaign) + '</div>' +
            '</article>';
          }).join('');
        }

        async function loadPage() {
          if (!projectId) {
            document.getElementById('projectName').textContent = 'Missing projectId';
            document.getElementById('campaignCards').innerHTML =
              '<div class="empty-state">Open this screen with ?projectId=...</div>';
            return;
          }

          const [project, campaigns] = await Promise.all([
            request('/projects/' + encodeURIComponent(projectId), undefined, { renderResponse: false }),
            request('/projects/' + encodeURIComponent(projectId) + '/campaigns', undefined, { renderResponse: false }),
          ]);

          document.getElementById('projectName').textContent = project.name;
          document.getElementById('projectMeta').textContent =
            'Brand memory is available directly from this project and reused by every campaign.';

          const total = campaigns.length;
          const attention = campaigns.filter((item) => ['needs_attention', 'source_needs_review', 'failed'].includes(item.status)).length;
          const publishing = campaigns.filter((item) => ['approved_for_publishing', 'publishing', 'completed'].includes(item.status)).length;
          const pending = campaigns.reduce((sum, item) => sum + Number(item.pendingApprovalCount || 0), 0);

          document.getElementById('campaignCount').textContent = String(total);
          document.getElementById('attentionCount').textContent = String(attention);
          document.getElementById('publishingCount').textContent = String(publishing);
          document.getElementById('pendingCount').textContent = String(pending);

          renderCampaignCards(campaigns);
          setOutput({ project, campaigns });
        }

        loadPage().catch((error) => setOutput(String(error)));
      `,
    });
  }

  @Get('campaigns/new')
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderCreateCampaignPage(@Query('projectId') projectId = ''): string {
    return renderCampaignUiPage({
      title: 'Marketing Service - Create Campaign',
      eyebrow: 'Campaigns',
      heading: 'Create campaign',
      summary:
        'Create a campaign from a system preset. The preset materializes the planned publications immediately.',
      body: `
        <section class="panel stack">
          <div class="nav-row">
            <div class="tabs">
              <a href="/test-ui/project?projectId=${escapeHtml(projectId)}">Project dashboard</a>
              <a href="/test-ui/campaigns?projectId=${escapeHtml(projectId)}">Campaigns</a>
              <a href="/test-ui/brand-memory?projectId=${escapeHtml(projectId)}">Brand Memory</a>
              <a class="active" href="/test-ui/campaigns/new?projectId=${escapeHtml(projectId)}">Create Campaign</a>
            </div>
            <div class="actions">
              <a class="btn" href="/test-ui/campaigns?projectId=${escapeHtml(projectId)}">Back to campaigns</a>
            </div>
          </div>
        </section>

        <div class="detail-grid">
          <section class="form-card stack">
            <div class="section-copy">
              <span class="eyebrow">Create</span>
              <h2 id="projectName">Loading project</h2>
              <p id="projectSummary">Select a preset, set a start date and optionally override source language or extra instructions.</p>
            </div>
            <form id="createCampaignForm" class="stack">
              <div class="form-grid">
                <label class="field">
                  Campaign name
                  <input id="campaignName" type="text" placeholder="Market insight burst" required />
                </label>
                <label class="field">
                  Start date
                  <input id="startDate" type="date" required />
                </label>
                <label class="field full">
                  Preset
                  <select id="presetId" required></select>
                </label>
                <label class="field">
                  Source language override
                  <input id="sourceLanguage" type="text" maxlength="16" placeholder="Leave empty to use preset default" />
                </label>
                <label class="field full">
                  Extra instructions
                  <textarea id="extraInstructions" placeholder="Optional campaign-level instructions for source check and AI stages."></textarea>
                </label>
              </div>
              <div class="actions">
                <button class="primary" type="submit">Create campaign</button>
                <a class="btn" href="/test-ui/brand-memory?projectId=${escapeHtml(projectId)}">Edit Brand Memory first</a>
              </div>
            </form>
          </section>

          <section class="panel stack">
            <div class="section-copy">
              <span class="eyebrow">Preset preview</span>
              <h2 id="presetName">Pick a preset</h2>
              <p id="presetDescription">The right side shows exactly which planned publications will be materialized.</p>
            </div>
            <div class="kv">
              <div class="meta-item"><label>Source language</label><strong id="presetSourceLanguage">—</strong></div>
              <div class="meta-item"><label>Source type</label><strong id="presetSourceType">—</strong></div>
            </div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Position</th>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Channel</th>
                    <th>Language</th>
                    <th>Type</th>
                    <th>Style</th>
                  </tr>
                </thead>
                <tbody id="presetRows"></tbody>
              </table>
            </div>
          </section>
        </div>
      `,
      script: `
        const projectId = ${JSON.stringify(projectId)};
        let presets = [];

        function renderPresetPreview(presetId) {
          const preset = presets.find((item) => item.id === presetId) || null;
          if (!preset) {
            document.getElementById('presetName').textContent = 'Pick a preset';
            document.getElementById('presetDescription').textContent = 'Preset details will appear here.';
            document.getElementById('presetSourceLanguage').textContent = '—';
            document.getElementById('presetSourceType').textContent = '—';
            document.getElementById('presetRows').innerHTML = '<tr><td colspan="7" class="soft">No preset selected.</td></tr>';
            return;
          }

          document.getElementById('presetName').textContent = preset.name;
          document.getElementById('presetDescription').textContent = preset.description;
          document.getElementById('presetSourceLanguage').textContent = String(preset.sourceLanguage || '').toUpperCase();
          document.getElementById('presetSourceType').textContent = toTitle(preset.sourceType);
          document.getElementById('presetRows').innerHTML = preset.publications
            .slice()
            .sort((left, right) => left.position - right.position)
            .map((publication) => '<tr>' +
              '<td>' + escapeHtml(String(publication.position)) + '</td>' +
              '<td>+' + escapeHtml(String(publication.dayOffset)) + '</td>' +
              '<td>' + escapeHtml(publication.localTime) + '</td>' +
              '<td>' + escapeHtml(toTitle(publication.channel.replace('channel_', ''))) + '</td>' +
              '<td>' + escapeHtml(String(publication.language || '').toUpperCase()) + '</td>' +
              '<td>' + escapeHtml(toTitle(publication.publicationType)) + '</td>' +
              '<td>' + escapeHtml(toTitle(publication.style)) + '</td>' +
            '</tr>')
            .join('');
        }

        async function boot() {
          if (!projectId) {
            document.getElementById('projectName').textContent = 'Missing projectId';
            return;
          }

          const [project, presetList] = await Promise.all([
            request('/projects/' + encodeURIComponent(projectId), undefined, { renderResponse: false }),
            request('/campaign-presets', undefined, { renderResponse: false }),
          ]);

          presets = presetList;
          document.getElementById('projectName').textContent = project.name;
          document.getElementById('startDate').value = formatDateInputValue(new Date());

          const presetSelect = document.getElementById('presetId');
          presetSelect.innerHTML = presets.map((preset) =>
            '<option value="' + escapeHtml(preset.id) + '">' + escapeHtml(preset.name) + '</option>'
          ).join('');

          presetSelect.addEventListener('change', () => renderPresetPreview(presetSelect.value));
          renderPresetPreview(presetSelect.value);

          document.getElementById('createCampaignForm').addEventListener('submit', async (event) => {
            event.preventDefault();
            const payload = {
              presetId: presetSelect.value,
              name: document.getElementById('campaignName').value,
              startDate: new Date(document.getElementById('startDate').value + 'T09:00:00.000Z').toISOString(),
              sourceLanguage: document.getElementById('sourceLanguage').value || null,
              extraInstructions: document.getElementById('extraInstructions').value || null,
            };

            const created = await request(
              '/projects/' + encodeURIComponent(projectId) + '/campaigns',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              },
            );

            window.location.href = '/test-ui/campaign?campaignId=' + encodeURIComponent(created.campaignId);
          });

          setOutput({ project, presets });
        }

        boot().catch((error) => setOutput(String(error)));
      `,
    });
  }

  @Get('brand-memory')
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderBrandMemoryPage(@Query('projectId') projectId = ''): string {
    return renderCampaignUiPage({
      title: 'Marketing Service - Brand Memory',
      eyebrow: 'Brand Memory',
      heading: 'Brand Memory',
      summary:
        'This screen edits the project-level memory that later feeds source validation, Stage 1 adaptations and Stage 2 translations.',
      body: `
        <section class="panel stack">
          <div class="nav-row">
            <div class="tabs">
              <a href="/test-ui/project?projectId=${escapeHtml(projectId)}">Project dashboard</a>
              <a href="/test-ui/campaigns?projectId=${escapeHtml(projectId)}">Campaigns</a>
              <a class="active" href="/test-ui/brand-memory?projectId=${escapeHtml(projectId)}">Brand Memory</a>
              <a href="/test-ui/campaigns/new?projectId=${escapeHtml(projectId)}">Create Campaign</a>
            </div>
            <div class="actions">
              <a class="btn" href="/test-ui/campaigns?projectId=${escapeHtml(projectId)}">Back to campaigns</a>
              <button onclick="loadPage()">Refresh</button>
            </div>
          </div>
        </section>

        <div class="detail-grid">
          <section class="form-card stack">
            <div class="section-copy">
              <span class="eyebrow">Project</span>
              <h2 id="projectName">Loading project</h2>
              <p id="updatedAt">Last update —</p>
            </div>
            <form id="brandMemoryForm" class="stack">
              <div class="form-grid">
                <label class="field">
                  Brand name
                  <input id="brandName" type="text" maxlength="120" />
                </label>
                <label class="field">
                  Target audience
                  <input id="targetAudience" type="text" maxlength="2000" />
                </label>
                <label class="field full">
                  Product description
                  <textarea id="productDescription"></textarea>
                </label>
                <label class="field">
                  Approved facts
                  <textarea id="approvedFacts" placeholder="One fact per line"></textarea>
                </label>
                <label class="field">
                  Forbidden claims
                  <textarea id="forbiddenClaims" placeholder="One claim per line"></textarea>
                </label>
                <label class="field">
                  Required phrases
                  <textarea id="requiredPhrases" placeholder="One phrase per line"></textarea>
                </label>
                <label class="field">
                  Banned phrases
                  <textarea id="bannedPhrases" placeholder="One phrase per line"></textarea>
                </label>
                <label class="field full">
                  Glossary
                  <textarea id="glossary" placeholder="One line per term: token = explanation"></textarea>
                </label>
                <label class="field full">
                  Brand docs
                  <textarea id="brandDocs" placeholder="One line per document: Title | URL | Notes"></textarea>
                </label>
              </div>
              <div class="actions">
                <button class="primary" type="submit">Save Brand Memory</button>
                <a class="btn" href="/test-ui/campaigns/new?projectId=${escapeHtml(projectId)}">Continue to campaign creation</a>
              </div>
            </form>
          </section>

          <section class="panel stack">
            <div class="section-copy">
              <span class="eyebrow">How it is used</span>
              <h2>Campaign AI context</h2>
              <p>Everything here is shared across the campaign pipeline. Keep it practical and explicit.</p>
            </div>
            <div class="checklist">
              <div class="check-item ok">
                <label>Source check</label>
                <strong>Validates facts, claims and risky wording before campaign production starts.</strong>
              </div>
              <div class="check-item ok">
                <label>Stage 1 adaptation</label>
                <strong>Shapes channel-specific copy with the right type, tone and prohibited wording rules.</strong>
              </div>
              <div class="check-item ok">
                <label>Stage 2 translation</label>
                <strong>Preserves brand glossary and avoids off-brand translations in non-source languages.</strong>
              </div>
            </div>
          </section>
        </div>
      `,
      script: `
        const projectId = ${JSON.stringify(projectId)};

        function linesToText(values) {
          return Array.isArray(values) ? values.join('\\n') : '';
        }

        function glossaryToText(glossary) {
          return Object.entries(glossary || {})
            .map(([key, value]) => key + ' = ' + value)
            .join('\\n');
        }

        function docsToText(docs) {
          return Array.isArray(docs)
            ? docs.map((doc) => [doc.title, doc.url || '', doc.notes || ''].join(' | ')).join('\\n')
            : '';
        }

        function fillForm(brandMemory) {
          document.getElementById('brandName').value = brandMemory.brandName || '';
          document.getElementById('productDescription').value = brandMemory.productDescription || '';
          document.getElementById('targetAudience').value = brandMemory.targetAudience || '';
          document.getElementById('approvedFacts').value = linesToText(brandMemory.approvedFacts);
          document.getElementById('forbiddenClaims').value = linesToText(brandMemory.forbiddenClaims);
          document.getElementById('requiredPhrases').value = linesToText(brandMemory.requiredPhrases);
          document.getElementById('bannedPhrases').value = linesToText(brandMemory.bannedPhrases);
          document.getElementById('glossary').value = glossaryToText(brandMemory.glossary);
          document.getElementById('brandDocs').value = docsToText(brandMemory.brandDocs);
        }

        async function loadPage() {
          if (!projectId) {
            document.getElementById('projectName').textContent = 'Missing projectId';
            return;
          }

          const [project, memoryPayload] = await Promise.all([
            request('/projects/' + encodeURIComponent(projectId), undefined, { renderResponse: false }),
            request('/projects/' + encodeURIComponent(projectId) + '/brand-memory', undefined, { renderResponse: false }),
          ]);

          document.getElementById('projectName').textContent = project.name;
          document.getElementById('updatedAt').textContent =
            'Last update ' + formatDateTime(memoryPayload.updatedAt);
          fillForm(memoryPayload.brandMemory);
          setOutput({ project, brandMemory: memoryPayload.brandMemory });
        }

        function buildPayload() {
          return {
            brandName: document.getElementById('brandName').value || null,
            productDescription: document.getElementById('productDescription').value || null,
            targetAudience: document.getElementById('targetAudience').value || null,
            approvedFacts: splitLines(document.getElementById('approvedFacts').value),
            forbiddenClaims: splitLines(document.getElementById('forbiddenClaims').value),
            requiredPhrases: splitLines(document.getElementById('requiredPhrases').value),
            bannedPhrases: splitLines(document.getElementById('bannedPhrases').value),
            glossary: parseGlossary(document.getElementById('glossary').value),
            brandDocs: parseBrandDocs(document.getElementById('brandDocs').value),
          };
        }

        document.addEventListener('DOMContentLoaded', () => {
          document.getElementById('brandMemoryForm').addEventListener('submit', async (event) => {
            event.preventDefault();
            const payload = buildPayload();
            const updated = await request(
              '/projects/' + encodeURIComponent(projectId) + '/brand-memory',
              {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              },
            );
            document.getElementById('updatedAt').textContent =
              'Last update ' + formatDateTime(updated.updatedAt);
          });
        });

        loadPage().catch((error) => setOutput(String(error)));
      `,
    });
  }

  @Get('campaign')
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderCampaignDetailPage(@Query('campaignId') campaignId = ''): string {
    return renderCampaignUiPage({
      title: 'Marketing Service - Campaign Detail',
      eyebrow: 'Campaign',
      heading: 'Campaign detail',
      summary:
        'This is the main operational overview for a single campaign: planned publications, workflow runs and links to the stage-specific screens.',
      body: `
        <section class="panel stack">
          <div class="nav-row">
            <div class="tabs" id="campaignTabs"></div>
            <div class="actions" id="campaignBacklinks"></div>
          </div>
        </section>

        <section class="metric-grid">
          <article class="metric">
            <span class="eyebrow">Campaign status</span>
            <strong id="campaignStatusText">—</strong>
            <div id="campaignStatusBadge"></div>
          </article>
          <article class="metric">
            <span class="eyebrow">Planned publications</span>
            <strong id="plannedCount">0</strong>
            <p>Total materialized items from the preset.</p>
          </article>
          <article class="metric">
            <span class="eyebrow">Pending approvals</span>
            <strong id="pendingApprovalCount">0</strong>
            <p>Exception-only inbox count.</p>
          </article>
          <article class="metric">
            <span class="eyebrow">Workflow runs</span>
            <strong id="workflowCount">0</strong>
            <p>All source / stage execution attempts so far.</p>
          </article>
        </section>

        <div class="detail-grid">
          <section class="panel stack">
            <div class="section-head">
              <div class="section-copy">
                <span class="eyebrow">Summary</span>
                <h2 id="campaignName">Loading campaign</h2>
                <p id="campaignMeta">Loading…</p>
              </div>
            </div>
            <div id="campaignSummary" class="kv"></div>
          </section>

          <aside class="panel stack">
            <div class="section-copy">
              <span class="eyebrow">Navigation</span>
              <h2>Next screens</h2>
              <p>Use the dedicated screens below for production, inbox, final approval and publishing status.</p>
            </div>
            <div class="actions" id="campaignActions"></div>
          </aside>
        </div>

        <section class="panel stack">
          <div class="section-head">
            <div class="section-copy">
              <span class="eyebrow">Planned publications</span>
              <h2>Execution matrix</h2>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Channel</th>
                  <th>Language</th>
                  <th>Type</th>
                  <th>Style</th>
                  <th>Mode</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="plannedRows"></tbody>
            </table>
          </div>
        </section>

        <section class="panel stack">
          <div class="section-head">
            <div class="section-copy">
              <span class="eyebrow">Workflow runs</span>
              <h2>Production history</h2>
            </div>
          </div>
          <div id="workflowRuns" class="workflow-list"></div>
        </section>
      `,
      script: `
        const campaignId = ${JSON.stringify(campaignId)};

        function renderCampaignTabs(campaign, projectId) {
          const root = document.getElementById('campaignTabs');
          root.innerHTML = [
            '<a class="active" href="/test-ui/campaign?campaignId=' + encodeURIComponent(campaign.id) + '">Detail</a>',
            '<a href="/test-ui/campaign-production?campaignId=' + encodeURIComponent(campaign.id) + '">Production</a>',
            '<a href="/test-ui/campaign-inbox?campaignId=' + encodeURIComponent(campaign.id) + '">Inbox</a>',
            '<a href="/test-ui/campaign-final-approval?campaignId=' + encodeURIComponent(campaign.id) + '">Final approval</a>',
            '<a href="/test-ui/campaign-publishing?campaignId=' + encodeURIComponent(campaign.id) + '">Publishing</a>',
            '<a href="/test-ui/campaigns?projectId=' + encodeURIComponent(projectId) + '">All campaigns</a>',
          ].join('');
        }

        function renderSummary(campaign) {
          document.getElementById('campaignName').textContent = campaign.name;
          document.getElementById('campaignMeta').textContent =
            'Preset ' + (campaign.presetName || campaign.presetId) + ' · source ' + String(campaign.sourceLanguage || '').toUpperCase();
          document.getElementById('campaignStatusText').textContent = toTitle(campaign.status);
          document.getElementById('campaignStatusBadge').innerHTML = renderBadge(campaign.status);
          document.getElementById('plannedCount').textContent = String(campaign.plannedPublications.length);
          document.getElementById('pendingApprovalCount').textContent = String(campaign.pendingApprovalCount);
          document.getElementById('workflowCount').textContent = String(campaign.workflowRuns.length);

          document.getElementById('campaignSummary').innerHTML = [
            ['Project ID', campaign.projectId],
            ['Preset', campaign.presetName || campaign.presetId],
            ['Start date', formatDateOnly(campaign.startDate)],
            ['Source article', campaign.sourceArticleId || 'Not attached yet'],
            ['Final approved', campaign.finalApprovedAt ? formatDateTime(campaign.finalApprovedAt) : 'Not yet'],
            ['Extra instructions', campaign.extraInstructions || '—'],
          ].map(([label, value]) =>
            '<div class="meta-item"><label>' + escapeHtml(label) + '</label><strong>' + escapeHtml(String(value)) + '</strong></div>'
          ).join('');

          document.getElementById('campaignActions').innerHTML = [
            '<a class="btn" href="/test-ui/campaign-production?campaignId=' + encodeURIComponent(campaign.id) + '">Open production</a>',
            '<a class="btn" href="/test-ui/campaign-inbox?campaignId=' + encodeURIComponent(campaign.id) + '">Open inbox</a>',
            '<a class="btn" href="/test-ui/campaign-final-approval?campaignId=' + encodeURIComponent(campaign.id) + '">Final approval</a>',
            '<a class="btn" href="/test-ui/campaign-publishing?campaignId=' + encodeURIComponent(campaign.id) + '">Publishing status</a>',
          ].join('');
        }

        function renderPlannedRows(campaign) {
          const rows = campaign.plannedPublications || [];
          document.getElementById('plannedRows').innerHTML = rows.length === 0
            ? '<tr><td colspan="7" class="soft">No planned publications.</td></tr>'
            : rows.map((item) => '<tr>' +
              '<td>' + escapeHtml(formatDateTime(item.scheduledFor)) + '</td>' +
              '<td>' + escapeHtml(toTitle(item.channel.replace('channel_', ''))) + '</td>' +
              '<td>' + escapeHtml(String(item.language || '').toUpperCase()) + '</td>' +
              '<td>' + escapeHtml(toTitle(item.publicationType)) + '</td>' +
              '<td>' + escapeHtml(toTitle(item.style)) + '</td>' +
              '<td>' + escapeHtml(toTitle(item.publishMode || 'auto_publish')) + '</td>' +
              '<td>' + renderBadge(item.status) + '</td>' +
            '</tr>').join('');
        }

        function renderWorkflowRuns(campaign) {
          const runs = campaign.workflowRuns || [];
          const root = document.getElementById('workflowRuns');
          root.innerHTML = runs.length === 0
            ? '<div class="empty-state">No workflow runs yet. Source check will create the first one.</div>'
            : runs.map((run) => '<article class="workflow-item">' +
              '<div class="card-head"><strong>' + escapeHtml(toTitle(run.currentStep)) + '</strong>' + renderBadge(run.status) + '</div>' +
              '<div class="pill-row">' +
                '<span class="pill mono">' + escapeHtml(run.id) + '</span>' +
                '<span class="pill">Started ' + escapeHtml(formatDateTime(run.startedAt)) + '</span>' +
                '<span class="pill">Completed ' + escapeHtml(run.completedAt ? formatDateTime(run.completedAt) : '—') + '</span>' +
              '</div>' +
              '<p>' + escapeHtml(run.errorMessage || 'No error message.') + '</p>' +
            '</article>').join('');
        }

        async function loadPage() {
          if (!campaignId) {
            document.getElementById('campaignName').textContent = 'Missing campaignId';
            return;
          }

          const campaign = await request('/campaigns/' + encodeURIComponent(campaignId), undefined, { renderResponse: false });
          renderCampaignTabs(campaign, campaign.projectId);
          document.getElementById('campaignBacklinks').innerHTML =
            '<a class="btn" href="/test-ui/campaigns?projectId=' + encodeURIComponent(campaign.projectId) + '">Back to campaigns</a>';
          renderSummary(campaign);
          renderPlannedRows(campaign);
          renderWorkflowRuns(campaign);
          setOutput(campaign);
        }

        loadPage().catch((error) => setOutput(String(error)));
      `,
    });
  }

  @Get('campaign-production')
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderCampaignProductionPage(@Query('campaignId') campaignId = ''): string {
    return renderCampaignUiPage({
      title: 'Marketing Service - Campaign Production',
      eyebrow: 'Production',
      heading: 'Production status',
      summary:
        'Attach source, run source check, Stage 1 adaptations and Stage 2 translations from one operational screen.',
      body: `
        <section class="panel stack">
          <div class="nav-row">
            <div class="tabs" id="campaignTabs"></div>
            <div class="actions" id="campaignBacklinks"></div>
          </div>
        </section>

        <section class="metric-grid">
          <article class="metric">
            <span class="eyebrow">Campaign</span>
            <strong id="campaignStatus">—</strong>
            <div id="campaignBadge"></div>
          </article>
          <article class="metric">
            <span class="eyebrow">Source attached</span>
            <strong id="sourceAttached">No</strong>
            <p id="sourceArticleMeta">Attach canonical source before source check.</p>
          </article>
          <article class="metric">
            <span class="eyebrow">Stage 1 queue</span>
            <strong id="stage1Count">0</strong>
            <p>Publications waiting for adaptation or blocked on Stage 1.</p>
          </article>
          <article class="metric">
            <span class="eyebrow">Stage 2 queue</span>
            <strong id="stage2Count">0</strong>
            <p>Publications waiting for translation.</p>
          </article>
        </section>

        <div class="detail-grid">
          <section class="form-card stack">
            <div class="section-copy">
              <span class="eyebrow">Canonical source</span>
              <h2 id="sourcePanelTitle">Attach source article</h2>
              <p id="sourcePanelMeta">This source becomes the canonical article for the campaign.</p>
            </div>
            <form id="attachSourceForm" class="stack">
              <div class="form-grid">
                <label class="field">
                  Source language
                  <input id="sourceLanguage" type="text" maxlength="16" value="en" />
                </label>
                <label class="field full">
                  Source content
                  <textarea id="sourceContent" placeholder="Paste the canonical longread or source memo here."></textarea>
                </label>
              </div>
              <div class="actions">
                <button class="primary" type="submit">Attach source</button>
              </div>
            </form>
          </section>

          <section class="panel stack">
            <div class="section-copy">
              <span class="eyebrow">Execution</span>
              <h2>Stage controls</h2>
              <p>Run each stage explicitly so the pipeline stays inspectable.</p>
            </div>
            <div class="actions">
              <button id="startProductionBtn" class="primary" type="button">Start source check</button>
              <button id="runStage1Btn" type="button">Run Stage 1 adaptations</button>
              <button id="runStage2Btn" type="button">Run Stage 2 translations</button>
              <button type="button" onclick="loadPage()">Refresh</button>
            </div>
            <div id="productionChecklist" class="checklist"></div>
          </section>
        </div>

        <section class="panel stack">
          <div class="section-head">
            <div class="section-copy">
              <span class="eyebrow">Workflow runs</span>
              <h2>Execution history</h2>
            </div>
          </div>
          <div id="workflowRuns" class="workflow-list"></div>
        </section>
      `,
      script: `
        const campaignId = ${JSON.stringify(campaignId)};
        let currentCampaign = null;

        function renderCampaignTabs(campaign) {
          document.getElementById('campaignTabs').innerHTML = [
            '<a href="/test-ui/campaign?campaignId=' + encodeURIComponent(campaign.id) + '">Detail</a>',
            '<a class="active" href="/test-ui/campaign-production?campaignId=' + encodeURIComponent(campaign.id) + '">Production</a>',
            '<a href="/test-ui/campaign-inbox?campaignId=' + encodeURIComponent(campaign.id) + '">Inbox</a>',
            '<a href="/test-ui/campaign-final-approval?campaignId=' + encodeURIComponent(campaign.id) + '">Final approval</a>',
            '<a href="/test-ui/campaign-publishing?campaignId=' + encodeURIComponent(campaign.id) + '">Publishing</a>',
          ].join('');
          document.getElementById('campaignBacklinks').innerHTML =
            '<a class="btn" href="/test-ui/campaigns?projectId=' + encodeURIComponent(campaign.projectId) + '">Back to campaigns</a>';
        }

        function renderWorkflowRuns(campaign) {
          const runs = campaign.workflowRuns || [];
          document.getElementById('workflowRuns').innerHTML = runs.length === 0
            ? '<div class="empty-state">No workflow runs yet.</div>'
            : runs.map((run) => '<article class="workflow-item">' +
              '<div class="card-head"><strong>' + escapeHtml(toTitle(run.currentStep)) + '</strong>' + renderBadge(run.status) + '</div>' +
              '<div class="pill-row">' +
                '<span class="pill">Started ' + escapeHtml(formatDateTime(run.startedAt)) + '</span>' +
                '<span class="pill">Completed ' + escapeHtml(run.completedAt ? formatDateTime(run.completedAt) : '—') + '</span>' +
              '</div>' +
              '<p>' + escapeHtml(run.errorMessage || 'No error message.') + '</p>' +
            '</article>').join('');
        }

        function renderChecklist(campaign) {
          const planned = campaign.plannedPublications || [];
          const stage1Queue = planned.filter((item) => ['pending', 'adapting', 'stage_1_failed', 'source_blocked'].includes(item.status)).length;
          const stage2Queue = planned.filter((item) => ['translating', 'stage_2_failed'].includes(item.status)).length;
          document.getElementById('campaignStatus').textContent = toTitle(campaign.status);
          document.getElementById('campaignBadge').innerHTML = renderBadge(campaign.status);
          document.getElementById('sourceAttached').textContent = campaign.sourceArticleId ? 'Yes' : 'No';
          document.getElementById('sourceArticleMeta').textContent = campaign.sourceArticleId
            ? 'Canonical source article: ' + campaign.sourceArticleId
            : 'No source article attached yet.';
          document.getElementById('stage1Count').textContent = String(stage1Queue);
          document.getElementById('stage2Count').textContent = String(stage2Queue);

          document.getElementById('sourcePanelTitle').textContent = campaign.sourceArticleId
            ? 'Source already attached'
            : 'Attach source article';
          document.getElementById('sourcePanelMeta').textContent = campaign.sourceArticleId
            ? 'Replacing source is not supported yet. Continue with source check or later stages.'
            : 'Paste the canonical source and attach it to the campaign.';

          const checks = [
            {
              label: 'Source article',
              tone: campaign.sourceArticleId ? 'ok' : 'bad',
              text: campaign.sourceArticleId ? 'Canonical source is attached.' : 'Attach source before source check.',
            },
            {
              label: 'Stage 1 queue',
              tone: stage1Queue > 0 ? 'warn' : 'ok',
              text: stage1Queue > 0 ? stage1Queue + ' publication(s) still need Stage 1.' : 'No pending Stage 1 work.',
            },
            {
              label: 'Stage 2 queue',
              tone: stage2Queue > 0 ? 'warn' : 'ok',
              text: stage2Queue > 0 ? stage2Queue + ' publication(s) still need Stage 2.' : 'No pending Stage 2 work.',
            },
            {
              label: 'Pending approvals',
              tone: campaign.pendingApprovalCount > 0 ? 'bad' : 'ok',
              text: campaign.pendingApprovalCount > 0
                ? campaign.pendingApprovalCount + ' inbox item(s) need review.'
                : 'Inbox is currently clear.',
            },
          ];

          document.getElementById('productionChecklist').innerHTML = checks.map((item) =>
            '<article class="check-item ' + item.tone + '">' +
              '<label>' + escapeHtml(item.label) + '</label>' +
              '<strong>' + escapeHtml(item.text) + '</strong>' +
            '</article>'
          ).join('');

          document.getElementById('attachSourceForm').style.opacity = campaign.sourceArticleId ? '0.55' : '1';
          document.getElementById('attachSourceForm').querySelectorAll('input, textarea, button').forEach((node) => {
            node.disabled = Boolean(campaign.sourceArticleId);
          });
        }

        async function loadPage() {
          if (!campaignId) {
            document.getElementById('campaignStatus').textContent = 'Missing campaignId';
            return;
          }

          currentCampaign = await request('/campaigns/' + encodeURIComponent(campaignId), undefined, { renderResponse: false });
          renderCampaignTabs(currentCampaign);
          renderChecklist(currentCampaign);
          renderWorkflowRuns(currentCampaign);
          setOutput(currentCampaign);
        }

        async function executeAction(url, method, body) {
          await request(
            url,
            {
              method,
              headers: body ? { 'Content-Type': 'application/json' } : undefined,
              body: body ? JSON.stringify(body) : undefined,
            },
          );
          await loadPage();
        }

        document.addEventListener('DOMContentLoaded', () => {
          document.getElementById('attachSourceForm').addEventListener('submit', async (event) => {
            event.preventDefault();
            await executeAction(
              '/campaigns/' + encodeURIComponent(campaignId) + '/source',
              'POST',
              {
                content: document.getElementById('sourceContent').value,
                language: document.getElementById('sourceLanguage').value || 'en',
              },
            );
          });

          document.getElementById('startProductionBtn').addEventListener('click', async () => {
            await executeAction('/campaigns/' + encodeURIComponent(campaignId) + '/start-production', 'POST');
          });

          document.getElementById('runStage1Btn').addEventListener('click', async () => {
            await executeAction('/campaigns/' + encodeURIComponent(campaignId) + '/stage-1/run', 'POST');
          });

          document.getElementById('runStage2Btn').addEventListener('click', async () => {
            await executeAction('/campaigns/' + encodeURIComponent(campaignId) + '/stage-2/run', 'POST');
          });
        });

        loadPage().catch((error) => setOutput(String(error)));
      `,
    });
  }

  @Get('campaign-inbox')
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderCampaignInboxPage(@Query('campaignId') campaignId = ''): string {
    return renderCampaignUiPage({
      title: 'Marketing Service - Campaign Inbox',
      eyebrow: 'Inbox',
      heading: 'Approval inbox',
      summary:
        'Exception-only inbox for the campaign. Source issues can be resolved here; other item types are currently inspectable but not yet fully operable from UI.',
      body: `
        <section class="panel stack">
          <div class="nav-row">
            <div class="tabs" id="campaignTabs"></div>
            <div class="actions" id="campaignBacklinks"></div>
          </div>
        </section>

        <section class="metric-grid">
          <article class="metric">
            <span class="eyebrow">Pending items</span>
            <strong id="pendingCount">0</strong>
            <p>Only exception items are shown here.</p>
          </article>
          <article class="metric">
            <span class="eyebrow">Campaign</span>
            <strong id="campaignStatus">—</strong>
            <div id="campaignBadge"></div>
          </article>
          <article class="metric">
            <span class="eyebrow">Source issues</span>
            <strong id="sourceIssueCount">0</strong>
            <p>These can be resolved directly from this screen.</p>
          </article>
          <article class="metric">
            <span class="eyebrow">Other exceptions</span>
            <strong id="otherIssueCount">0</strong>
            <p>Adaptation/translation/publishing exceptions are shown read-only for now.</p>
          </article>
        </section>

        <section class="panel stack">
          <div class="section-head">
            <div class="section-copy">
              <span class="eyebrow">Pending approvals</span>
              <h2>Inbox items</h2>
            </div>
            <div class="actions">
              <button onclick="loadPage()">Refresh</button>
            </div>
          </div>
          <div id="inboxItems" class="inbox-list"></div>
        </section>
      `,
      script: `
        const campaignId = ${JSON.stringify(campaignId)};

        function renderCampaignTabs(campaign) {
          document.getElementById('campaignTabs').innerHTML = [
            '<a href="/test-ui/campaign?campaignId=' + encodeURIComponent(campaign.id) + '">Detail</a>',
            '<a href="/test-ui/campaign-production?campaignId=' + encodeURIComponent(campaign.id) + '">Production</a>',
            '<a class="active" href="/test-ui/campaign-inbox?campaignId=' + encodeURIComponent(campaign.id) + '">Inbox</a>',
            '<a href="/test-ui/campaign-final-approval?campaignId=' + encodeURIComponent(campaign.id) + '">Final approval</a>',
            '<a href="/test-ui/campaign-publishing?campaignId=' + encodeURIComponent(campaign.id) + '">Publishing</a>',
          ].join('');
          document.getElementById('campaignBacklinks').innerHTML =
            '<a class="btn" href="/test-ui/campaigns?projectId=' + encodeURIComponent(campaign.projectId) + '">Back to campaigns</a>';
        }

        function sourceIssueForm(campaign, item) {
          return '<form class="stack" onsubmit="return submitSourceResolution(event, ' +
            JSON.stringify(campaign.id) + ', ' +
            JSON.stringify(item.id) +
          ')">' +
            '<div class="form-grid">' +
              '<label class="field">' +
                'Action' +
                '<select name="action">' +
                  '<option value="accept_fix">accept_fix</option>' +
                  '<option value="manual_edit">manual_edit</option>' +
                  '<option value="ignore">ignore</option>' +
                  '<option value="block">block</option>' +
                '</select>' +
              '</label>' +
              '<label class="field">' +
                'Language override' +
                '<input name="language" type="text" maxlength="16" placeholder="optional" />' +
              '</label>' +
              '<label class="field full">' +
                'Source content (required for accept_fix/manual_edit)' +
                '<textarea name="content" placeholder="Paste corrected source if you accept or manually edit the source."></textarea>' +
              '</label>' +
              '<label class="field full">' +
                'Note' +
                '<textarea name="note" placeholder="Optional review note."></textarea>' +
              '</label>' +
            '</div>' +
            '<div class="actions">' +
              '<button class="primary" type="submit">Resolve source issue</button>' +
            '</div>' +
          '</form>';
        }

        function renderInbox(campaign, inbox) {
          const items = inbox.items || [];
          const sourceIssueCount = items.filter((item) => item.type === 'source_issue').length;
          const otherIssueCount = items.length - sourceIssueCount;

          document.getElementById('pendingCount').textContent = String(items.length);
          document.getElementById('campaignStatus').textContent = toTitle(campaign.status);
          document.getElementById('campaignBadge').innerHTML = renderBadge(campaign.status);
          document.getElementById('sourceIssueCount').textContent = String(sourceIssueCount);
          document.getElementById('otherIssueCount').textContent = String(otherIssueCount);

          const root = document.getElementById('inboxItems');
          if (items.length === 0) {
            root.innerHTML = '<div class="empty-state">Inbox is empty. This campaign currently has no exception items.</div>';
            return;
          }

          root.innerHTML = items.map((item) => {
            const details = JSON.stringify(item.details || {}, null, 2);
            const suggestedFix = item.suggestedFix ? JSON.stringify(item.suggestedFix, null, 2) : '';

            return '<article class="inbox-item">' +
              '<div class="card-head">' +
                '<div class="stack">' +
                  '<span class="eyebrow">' + escapeHtml(item.type) + '</span>' +
                  '<h3>' + escapeHtml(item.title) + '</h3>' +
                '</div>' +
                renderBadge(item.severity) +
              '</div>' +
              '<div class="pill-row">' +
                (item.plannedPublicationId ? '<span class="pill mono">planned ' + escapeHtml(item.plannedPublicationId) + '</span>' : '') +
                (item.artifactId ? '<span class="pill mono">artifact ' + escapeHtml(item.artifactId) + '</span>' : '') +
                '<span class="pill">Updated ' + escapeHtml(formatDateTime(item.updatedAt)) + '</span>' +
              '</div>' +
              '<div class="table-wrap"><table><tbody>' +
                '<tr><th>Details</th><td><pre class="output">' + escapeHtml(details) + '</pre></td></tr>' +
                (suggestedFix ? '<tr><th>Suggested fix</th><td><pre class="output">' + escapeHtml(suggestedFix) + '</pre></td></tr>' : '') +
              '</tbody></table></div>' +
              (item.type === 'source_issue'
                ? sourceIssueForm(campaign, item)
                : '<p class="soft">Manual UI resolution exists only for source issues in this MVP. Other exceptions are visible here for operator awareness.</p>') +
            '</article>';
          }).join('');
        }

        async function submitSourceResolution(event, campaignIdValue, approvalItemId) {
          event.preventDefault();
          const form = event.currentTarget;
          const payload = {
            approvalItemId,
            action: form.action.value,
            content: form.content.value || null,
            language: form.language.value || null,
            note: form.note.value || null,
          };

          await request(
            '/campaigns/' + encodeURIComponent(campaignIdValue) + '/source-issues/review',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            },
          );
          await loadPage();
          return false;
        }

        async function loadPage() {
          if (!campaignId) {
            document.getElementById('campaignStatus').textContent = 'Missing campaignId';
            return;
          }

          const [campaign, inbox] = await Promise.all([
            request('/campaigns/' + encodeURIComponent(campaignId), undefined, { renderResponse: false }),
            request('/campaigns/' + encodeURIComponent(campaignId) + '/inbox', undefined, { renderResponse: false }),
          ]);

          renderCampaignTabs(campaign);
          renderInbox(campaign, inbox);
          setOutput({ campaign, inbox });
        }

        loadPage().catch((error) => setOutput(String(error)));
      `,
    });
  }

  @Get('campaign-final-approval')
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderCampaignFinalApprovalPage(@Query('campaignId') campaignId = ''): string {
    return renderCampaignUiPage({
      title: 'Marketing Service - Final Approval',
      eyebrow: 'Approval',
      heading: 'Final approval',
      summary:
        'Before publishing is linked, check campaign readiness here. The button below calls the real final approval API and then routes to publishing status.',
      body: `
        <section class="panel stack">
          <div class="nav-row">
            <div class="tabs" id="campaignTabs"></div>
            <div class="actions" id="campaignBacklinks"></div>
          </div>
        </section>

        <div class="detail-grid">
          <section class="panel stack">
            <div class="section-copy">
              <span class="eyebrow">Readiness</span>
              <h2 id="campaignName">Loading campaign</h2>
              <p id="campaignMeta">Checking readiness for final approval…</p>
            </div>
            <div id="approvalChecklist" class="checklist"></div>
            <div class="actions">
              <button id="approveBtn" class="primary" type="button">Approve for publishing</button>
              <a id="publishingLink" class="btn" href="#">Open publishing status</a>
            </div>
          </section>

          <section class="panel stack">
            <div class="section-copy">
              <span class="eyebrow">Status mix</span>
              <h2>Current planned publication states</h2>
            </div>
            <div id="statusMix" class="pill-row"></div>
          </section>
        </div>
      `,
      script: `
        const campaignId = ${JSON.stringify(campaignId)};
        let currentCampaign = null;

        function renderCampaignTabs(campaign) {
          document.getElementById('campaignTabs').innerHTML = [
            '<a href="/test-ui/campaign?campaignId=' + encodeURIComponent(campaign.id) + '">Detail</a>',
            '<a href="/test-ui/campaign-production?campaignId=' + encodeURIComponent(campaign.id) + '">Production</a>',
            '<a href="/test-ui/campaign-inbox?campaignId=' + encodeURIComponent(campaign.id) + '">Inbox</a>',
            '<a class="active" href="/test-ui/campaign-final-approval?campaignId=' + encodeURIComponent(campaign.id) + '">Final approval</a>',
            '<a href="/test-ui/campaign-publishing?campaignId=' + encodeURIComponent(campaign.id) + '">Publishing</a>',
          ].join('');
          document.getElementById('campaignBacklinks').innerHTML =
            '<a class="btn" href="/test-ui/campaigns?projectId=' + encodeURIComponent(campaign.projectId) + '">Back to campaigns</a>';
        }

        function countStatuses(plannedPublications) {
          return plannedPublications.reduce((acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          }, {});
        }

        async function loadPage() {
          if (!campaignId) {
            document.getElementById('campaignName').textContent = 'Missing campaignId';
            return;
          }

          const [campaign, inbox, overview] = await Promise.all([
            request('/campaigns/' + encodeURIComponent(campaignId), undefined, { renderResponse: false }),
            request('/campaigns/' + encodeURIComponent(campaignId) + '/inbox', undefined, { renderResponse: false }),
            request('/campaigns/' + encodeURIComponent(campaignId) + '/publishing-overview', undefined, { renderResponse: false }),
          ]);

          currentCampaign = campaign;
          renderCampaignTabs(campaign);
          document.getElementById('campaignName').textContent = campaign.name;
          document.getElementById('campaignMeta').textContent =
            'Campaign status: ' + campaign.status + ' · pending inbox items: ' + String(inbox.pendingCount);
          document.getElementById('publishingLink').href =
            '/test-ui/campaign-publishing?campaignId=' + encodeURIComponent(campaign.id);

          const statusCounts = countStatuses(campaign.plannedPublications || []);
          document.getElementById('statusMix').innerHTML = Object.entries(statusCounts).length === 0
            ? '<span class="soft">No planned publications yet.</span>'
            : Object.entries(statusCounts).map(([status, count]) =>
              '<span class="pill">' + escapeHtml(status) + ': ' + escapeHtml(String(count)) + '</span>'
            ).join('');

          const allReadyForApproval = (campaign.plannedPublications || []).every((item) =>
            ['ready', 'publication_scheduled', 'exported', 'published'].includes(item.status),
          );
          const checks = [
            {
              label: 'Pending inbox items',
              ok: inbox.pendingCount === 0,
              text: inbox.pendingCount === 0
                ? 'Inbox is clear.'
                : inbox.pendingCount + ' item(s) still need review.',
            },
            {
              label: 'Planned publication statuses',
              ok: allReadyForApproval,
              text: allReadyForApproval
                ? 'Every planned publication is already ready, scheduled or terminal.'
                : 'Some planned publications are still in production or blocked.',
            },
            {
              label: 'Campaign status',
              ok: ['ready_for_final_approval', 'approved_for_publishing', 'publishing'].includes(campaign.status),
              text: 'Current status: ' + campaign.status,
            },
            {
              label: 'Publishing linkage',
              ok: true,
              text: 'Current overview counters: ' + JSON.stringify(overview.metrics),
            },
          ];

          document.getElementById('approvalChecklist').innerHTML = checks.map((item) =>
            '<article class="check-item ' + (item.ok ? 'ok' : 'bad') + '">' +
              '<label>' + escapeHtml(item.label) + '</label>' +
              '<strong>' + escapeHtml(item.text) + '</strong>' +
            '</article>'
          ).join('');

          setOutput({ campaign, inbox, overview });
        }

        document.addEventListener('DOMContentLoaded', () => {
          document.getElementById('approveBtn').addEventListener('click', async () => {
            if (!currentCampaign) return;
            await request(
              '/campaigns/' + encodeURIComponent(currentCampaign.id) + '/final-approval',
              { method: 'POST' },
            );
            window.location.href =
              '/test-ui/campaign-publishing?campaignId=' + encodeURIComponent(currentCampaign.id);
          });
        });

        loadPage().catch((error) => setOutput(String(error)));
      `,
    });
  }

  @Get('campaign-publishing')
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderCampaignPublishingPage(@Query('campaignId') campaignId = ''): string {
    return renderCampaignUiPage({
      title: 'Marketing Service - Publishing Status',
      eyebrow: 'Publishing',
      heading: 'Publishing status',
      summary:
        'Campaign-level traceability view: metrics, linked publication/export records, live scheduling time, external ids and errors.',
      body: `
        <section class="panel stack">
          <div class="nav-row">
            <div class="tabs" id="campaignTabs"></div>
            <div class="actions" id="campaignBacklinks"></div>
          </div>
        </section>

        <section class="metric-grid">
          <article class="metric"><span class="eyebrow">Total</span><strong id="metricTotal">0</strong><p>All planned publications.</p></article>
          <article class="metric"><span class="eyebrow">Scheduled</span><strong id="metricScheduled">0</strong><p>Scheduled or queued for delivery.</p></article>
          <article class="metric"><span class="eyebrow">Published</span><strong id="metricPublished">0</strong><p>Already delivered or exported.</p></article>
          <article class="metric"><span class="eyebrow">Failed</span><strong id="metricFailed">0</strong><p>Publishing failures requiring attention.</p></article>
        </section>

        <section class="panel stack">
          <div class="section-head">
            <div class="section-copy">
              <span class="eyebrow">Campaign metrics</span>
              <h2 id="campaignName">Loading publishing overview</h2>
              <p id="campaignMeta">This screen is the end state after final approval.</p>
            </div>
            <div class="actions">
              <button onclick="loadPage()">Refresh</button>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Channel</th>
                  <th>Language</th>
                  <th>Mode</th>
                  <th>Planned status</th>
                  <th>Publication</th>
                  <th>External refs</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody id="publishingRows"></tbody>
            </table>
          </div>
        </section>
      `,
      script: `
        const campaignId = ${JSON.stringify(campaignId)};

        function renderCampaignTabs(campaign) {
          document.getElementById('campaignTabs').innerHTML = [
            '<a href="/test-ui/campaign?campaignId=' + encodeURIComponent(campaign.id) + '">Detail</a>',
            '<a href="/test-ui/campaign-production?campaignId=' + encodeURIComponent(campaign.id) + '">Production</a>',
            '<a href="/test-ui/campaign-inbox?campaignId=' + encodeURIComponent(campaign.id) + '">Inbox</a>',
            '<a href="/test-ui/campaign-final-approval?campaignId=' + encodeURIComponent(campaign.id) + '">Final approval</a>',
            '<a class="active" href="/test-ui/campaign-publishing?campaignId=' + encodeURIComponent(campaign.id) + '">Publishing</a>',
          ].join('');
          document.getElementById('campaignBacklinks').innerHTML =
            '<a class="btn" href="/test-ui/campaigns?projectId=' + encodeURIComponent(campaign.projectId) + '">Back to campaigns</a>';
        }

        function renderMetrics(overview) {
          document.getElementById('metricTotal').textContent = String(overview.metrics.total || 0);
          document.getElementById('metricScheduled').textContent = String((overview.metrics.scheduled || 0) + (overview.metrics.publishing || 0));
          document.getElementById('metricPublished').textContent = String((overview.metrics.published || 0) + (overview.metrics.exported || 0));
          document.getElementById('metricFailed').textContent = String(overview.metrics.failed || 0);
        }

        function renderRows(overview) {
          const rows = overview.items || [];
          document.getElementById('publishingRows').innerHTML = rows.length === 0
            ? '<tr><td colspan="8" class="soft">No publishing records yet.</td></tr>'
            : rows.map((item) => '<tr>' +
              '<td>' + escapeHtml(formatDateTime(item.scheduledFor)) + '</td>' +
              '<td>' + escapeHtml(toTitle(String(item.channel || '').replace('channel_', ''))) + '</td>' +
              '<td>' + escapeHtml(String(item.language || '').toUpperCase()) + '</td>' +
              '<td>' + escapeHtml(toTitle(item.publishMode || 'auto_publish')) + '</td>' +
              '<td>' + renderBadge(item.plannedStatus) + '</td>' +
              '<td>' +
                '<div class="stack">' +
                  (item.publicationId ? '<span class="mono">' + escapeHtml(item.publicationId) + '</span>' : '') +
                  (item.exportPlanId ? '<span class="mono">' + escapeHtml(item.exportPlanId) + '</span>' : '') +
                  (item.publicationStatus ? renderBadge(item.publicationStatus) : '<span class="soft">No linked publication yet</span>') +
                '</div>' +
              '</td>' +
              '<td>' +
                '<div class="stack">' +
                  (item.externalAccountRef ? '<span class="mono">' + escapeHtml(item.externalAccountRef) + '</span>' : '<span class="soft">No account ref</span>') +
                  (item.externalPostId ? '<span class="mono">' + escapeHtml(item.externalPostId) + '</span>' : '<span class="soft">No external post id</span>') +
                  (item.publishedAt ? '<span class="soft">Published ' + escapeHtml(formatDateTime(item.publishedAt)) + '</span>' : '') +
                '</div>' +
              '</td>' +
              '<td>' + (item.errorMessage ? '<span class="soft">' + escapeHtml(item.errorMessage) + '</span>' : '—') + '</td>' +
            '</tr>').join('');
        }

        async function loadPage() {
          if (!campaignId) {
            document.getElementById('campaignName').textContent = 'Missing campaignId';
            return;
          }

          const [campaign, overview] = await Promise.all([
            request('/campaigns/' + encodeURIComponent(campaignId), undefined, { renderResponse: false }),
            request('/campaigns/' + encodeURIComponent(campaignId) + '/publishing-overview', undefined, { renderResponse: false }),
          ]);

          renderCampaignTabs(campaign);
          document.getElementById('campaignName').textContent = campaign.name;
          document.getElementById('campaignMeta').textContent =
            'Campaign status ' + campaign.status + ' · metrics ' + JSON.stringify(overview.metrics);
          renderMetrics(overview);
          renderRows(overview);
          setOutput({ campaign, overview });
        }

        loadPage().catch((error) => setOutput(String(error)));
      `,
    });
  }
}
