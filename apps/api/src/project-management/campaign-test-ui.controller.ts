import { PUBLICATION_TYPE_OPTIONS_BY_CHANNEL } from '@marketing-service/project-management';
import { Controller, Get, Header, Query } from '@nestjs/common';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const FALLBACK_PUBLICATION_TYPE_OPTIONS_BY_CHANNEL = {
  channel_telegram: [{ value: 'default', label: 'Default' }],
  channel_x: [
    { value: 'long', label: 'Long' },
    { value: 'medium', label: 'Medium' },
    { value: 'thread', label: 'Thread' },
  ],
  channel_discord: [{ value: 'default', label: 'Default' }],
  channel_blog: [{ value: 'default', label: 'Default' }],
};

const DEFAULT_ADAPTATION_RULES_BY_CHANNEL = {
  channel_telegram: [
    'Keep the tone concise, clear, and strong.',
    'Prefer short paragraphs.',
    'Do not use hashtags.',
    'Do not use emojis unless absolutely necessary.',
  ].join('\n'),
  channel_x: [
    'Keep the text sharp, compact, and highly readable.',
    'Do not use hashtags.',
    'Do not use emojis.',
  ].join('\n'),
  channel_discord: [
    'Keep the text simple and immediately understandable.',
    'Prefer plain words and short phrasing.',
    'Do not use hashtags.',
    'Do not use emojis.',
  ].join('\n'),
  channel_blog: [
    'Keep the tone informative and readable.',
    'Prefer 2 to 4 short paragraphs.',
    'Do not use hashtags.',
    'Do not use emojis.',
  ].join('\n'),
};

function renderPublicationTypeOptionsByChannel(): string {
  return JSON.stringify(
    PUBLICATION_TYPE_OPTIONS_BY_CHANNEL ?? FALLBACK_PUBLICATION_TYPE_OPTIONS_BY_CHANNEL,
  );
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
      .campaign-creation-nav {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 16px;
      }
      .campaign-creation-nav .actions:last-child {
        justify-self: end;
      }
      .nav-center-label {
        color: var(--text);
        font-size: clamp(17px, 1.8vw, 28px);
        line-height: 0.98;
        letter-spacing: -0.05em;
        text-align: center;
        white-space: nowrap;
      }
      .campaign-flow-progress {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }
      .flow-step {
        min-height: 84px;
        padding: 16px;
        border: 1px solid var(--line);
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.44);
        display: grid;
        gap: 8px;
        align-content: center;
      }
      .flow-step.is-disabled {
        border-color: rgba(18, 18, 18, 0.09);
        background: rgba(245, 245, 245, 0.42);
        color: rgba(18, 18, 18, 0.22);
        cursor: not-allowed;
      }
      .flow-step.is-disabled span,
      .flow-step.is-disabled strong,
      .flow-step.is-disabled p {
        color: rgba(18, 18, 18, 0.22);
      }
      .flow-step.can-open {
        cursor: pointer;
      }
      .flow-step.can-open:hover {
        border-color: var(--line-strong);
        background: rgba(255, 255, 255, 0.62);
      }
      .flow-step.can-open.is-active:hover {
        background: rgba(18, 18, 18, 0.92);
      }
      .flow-step.can-open.is-done:hover {
        background: rgba(17, 122, 67, 0.14);
      }
      .flow-step span {
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .flow-step strong {
        font-size: 18px;
        line-height: 1;
        letter-spacing: -0.035em;
        font-weight: 400;
      }
      .flow-step.is-active {
        background: rgba(18, 18, 18, 0.92);
        border-color: rgba(18, 18, 18, 0.92);
        color: #fff;
      }
      .flow-step.is-active span {
        color: rgba(255, 255, 255, 0.68);
      }
      .flow-step.is-done {
        background: rgba(17, 122, 67, 0.1);
        border-color: rgba(17, 122, 67, 0.22);
        color: #117a43;
      }
      .campaign-wizard-step[hidden] {
        display: none;
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
      .create-campaign-grid {
        grid-template-columns: minmax(280px, 0.3fr) minmax(0, 0.7fr);
        align-items: stretch;
      }
      .create-campaign-grid > .form-card,
      .create-campaign-grid > .panel {
        height: 100%;
      }
      .campaign-ai-progress {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }
      .ai-flow-step {
        min-height: 150px;
        align-content: start;
      }
      .ai-flow-step p {
        color: var(--muted);
        font-size: 14px;
      }
      .ai-flow-step.is-active p {
        color: rgba(255, 255, 255, 0.72);
      }
      .ai-flow-step.is-done p {
        color: rgba(17, 122, 67, 0.72);
      }
      .ai-flow-step.is-warning {
        background: rgba(181, 71, 8, 0.1);
        border-color: rgba(181, 71, 8, 0.22);
        color: #a14c0a;
      }
      .ai-flow-step.is-warning span,
      .ai-flow-step.is-warning p {
        color: rgba(161, 76, 10, 0.72);
      }
      .ai-flow-step.is-danger {
        background: rgba(180, 35, 24, 0.1);
        border-color: rgba(180, 35, 24, 0.22);
        color: #b42318;
      }
      .ai-flow-step.is-danger span,
      .ai-flow-step.is-danger p {
        color: rgba(180, 35, 24, 0.72);
      }
      .campaign-done-actions {
        margin-top: 4px;
      }
      .done-publication-editor {
        margin-top: 18px;
        padding: 22px;
        border: 1px solid var(--line);
        border-radius: 28px;
        background: rgba(255, 255, 255, 0.54);
      }
      .done-publication-editor[hidden] {
        display: none;
      }
      .done-publication-grid {
        grid-template-columns: minmax(0, 1fr) 180px 160px;
        align-items: end;
      }
      .done-publication-row.is-active {
        background: rgba(18, 18, 18, 0.035);
      }
      .done-publication-meta {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .done-publication-editor textarea {
        min-height: 280px;
      }
      .source-review-card {
        display: grid;
        gap: 18px;
      }
      .source-review-summary {
        font-size: 18px;
        line-height: 1.35;
        color: var(--text);
      }
      .source-problem-list {
        display: grid;
        gap: 10px;
      }
      .source-problem {
        padding: 16px 18px;
        border: 1px solid rgba(236, 151, 31, 0.32);
        border-radius: 22px;
        background: rgba(255, 244, 214, 0.78);
        display: grid;
        gap: 8px;
      }
      .source-problem strong {
        font-weight: 400;
        font-size: 18px;
        line-height: 1.2;
      }
      .source-problem blockquote {
        margin: 0;
        padding-left: 12px;
        border-left: 2px solid rgba(236, 151, 31, 0.48);
        color: var(--muted);
      }
      .source-edit-panel[hidden] {
        display: none;
      }
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(9, 15, 28, 0.4);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 24px;
        z-index: 80;
      }
      .modal-backdrop.open {
        display: flex;
      }
      .modal {
        width: min(560px, calc(100vw - 32px));
        padding: 22px;
        border: 1px solid rgba(18, 18, 18, 0.12);
        border-radius: 28px;
        background: var(--surface);
        display: grid;
        gap: 16px;
      }
      .modal-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }
      .modal-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }
      .source-edit-panel textarea {
        min-height: 360px;
      }
      .form-grid.create-campaign-form-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        align-items: end;
      }
      .form-grid.create-campaign-form-grid .full {
        grid-column: auto;
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
      .btn-with-badge {
        position: relative;
      }
      .notification-badge {
        position: absolute;
        top: -8px;
        left: -8px;
        min-width: 22px;
        height: 22px;
        padding: 0 7px;
        border-radius: 999px;
        background: #d92d20;
        color: #fff;
        border: 2px solid var(--surface);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        line-height: 1;
        font-weight: 700;
        box-shadow: 0 8px 18px rgba(217, 45, 32, 0.24);
      }
      .notification-badge[hidden] {
        display: none;
      }
      .stage-button.is-running {
        background: rgba(18, 18, 18, 0.92);
        color: #fff;
        border-color: rgba(18, 18, 18, 0.92);
        animation: stage-breathe 1.9s ease-in-out infinite;
      }
      .stage-button.is-success {
        background: rgba(17, 122, 67, 0.12);
        color: #117a43;
        border-color: rgba(17, 122, 67, 0.24);
      }
      .stage-button.is-success[disabled] {
        opacity: 1;
      }
      .stage-button.is-warning {
        background: rgba(181, 71, 8, 0.12);
        color: #a14c0a;
        border-color: rgba(181, 71, 8, 0.24);
      }
      .stage-button.is-danger {
        background: rgba(180, 35, 24, 0.12);
        color: #b42318;
        border-color: rgba(180, 35, 24, 0.22);
      }
      .stage-button.is-running[disabled] {
        opacity: 1;
      }
      @keyframes stage-breathe {
        0%,
        100% {
          transform: scale(1);
          box-shadow: 0 0 0 rgba(18, 18, 18, 0);
        }
        50% {
          transform: scale(1.015);
          box-shadow: 0 10px 24px rgba(18, 18, 18, 0.12);
        }
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
      .campaign-segment-row {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .campaign-segment-row button {
        min-width: 180px;
      }
      .campaign-segment-row button.is-active {
        background: rgba(18, 18, 18, 0.92);
        color: #fff;
        border-color: rgba(18, 18, 18, 0.92);
      }
      .campaign-list-head {
        align-items: end;
        margin-bottom: 18px;
      }
      .campaign-card-meta {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
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
      .table-editor input,
      .table-editor select {
        min-width: 96px;
        padding: 10px 12px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.94);
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
      .inline-note {
        color: var(--muted);
        font-size: 13px;
      }
      .stepper {
        display: grid;
        gap: 10px;
        align-items: start;
      }
      .step-item {
        display: grid;
        gap: 8px;
        justify-items: center;
      }
      .step-item button {
        width: fit-content;
        min-width: 260px;
      }
      .stage-status {
        min-width: 260px;
        padding: 10px 18px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.34);
        color: var(--muted);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-align: center;
      }
      .stage-status.is-muted {
        background: rgba(17, 122, 67, 0.06);
        border-color: rgba(17, 122, 67, 0.16);
        color: #4b6e59;
      }
      .step-arrow {
        color: var(--muted);
        font-size: 28px;
        line-height: 1;
        justify-self: center;
      }
      button[disabled],
      .btn[disabled],
      a.btn[aria-disabled="true"] {
        opacity: 0.42;
        cursor: not-allowed;
        pointer-events: none;
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
      .dev-toggle {
        position: fixed;
        right: 24px;
        bottom: 24px;
        z-index: 70;
        box-shadow: 0 14px 34px rgba(18, 18, 18, 0.16);
      }
      .dev-overlay {
        position: fixed;
        top: 18px;
        left: 0;
        right: 0;
        z-index: 65;
        padding: 0 38px;
        pointer-events: none;
      }
      .dev-overlay[hidden] {
        display: none;
      }
      .dev-panel {
        max-width: 1480px;
        max-height: calc(100vh - 92px);
        margin: 0 auto;
        overflow: auto;
        box-shadow: 0 24px 80px rgba(18, 18, 18, 0.22);
        pointer-events: auto;
      }
      .empty-state {
        padding: 28px;
        color: var(--muted);
      }
      @media (max-width: 1120px) {
        .detail-grid {
          grid-template-columns: 1fr;
        }
        .campaign-flow-progress {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .campaign-ai-progress {
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
        .dev-overlay {
          padding: 0 16px;
        }
        .form-grid,
        .kv,
        .campaign-flow-progress,
        .campaign-ai-progress,
        .metric-grid {
          grid-template-columns: 1fr;
        }
      }
`;
}

function renderDefaultAdaptationRulesByChannel(): string {
  return JSON.stringify(DEFAULT_ADAPTATION_RULES_BY_CHANNEL);
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

      const MOSCOW_TIME_ZONE = 'Europe/Moscow';
      const MOSCOW_OFFSET_MS = 3 * 60 * 60 * 1000;

      function toggleDevOverlay(forceOpen) {
        const overlay = document.getElementById('devOverlay');
        if (!overlay) return;
        const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : overlay.hidden;
        overlay.hidden = !shouldOpen;
      }

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          toggleDevOverlay(false);
        }
      });

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

      function toMoscowShiftedDate(value) {
        const date = value ? new Date(value) : new Date();
        if (Number.isNaN(date.getTime())) {
          return null;
        }
        return new Date(date.getTime() + MOSCOW_OFFSET_MS);
      }

      function getMoscowDateParts(value) {
        const shifted = toMoscowShiftedDate(value);
        if (!shifted) {
          return null;
        }
        return {
          year: shifted.getUTCFullYear(),
          month: shifted.getUTCMonth() + 1,
          day: shifted.getUTCDate(),
          hours: shifted.getUTCHours(),
          minutes: shifted.getUTCMinutes(),
        };
      }

      function buildMoscowIsoFromDateAndTime(dateValue, timeValue = '00:00') {
        const [year, month, day] = String(dateValue || '').split('-').map((part) => Number(part));
        const [hours, minutes] = String(timeValue || '').split(':').map((part) => Number(part));
        if (!year || !month || !day || Number.isNaN(hours) || Number.isNaN(minutes)) {
          return null;
        }
        return new Date(Date.UTC(year, month - 1, day, hours - 3, minutes, 0, 0)).toISOString();
      }

      function formatDateTime(value) {
        if (!value) return '—';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat('en-GB', {
          timeZone: MOSCOW_TIME_ZONE,
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
          timeZone: MOSCOW_TIME_ZONE,
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(date);
      }

      function formatDateInputValue(value) {
        const parts = getMoscowDateParts(value || new Date());
        if (!parts) {
          return '';
        }
        return [
          String(parts.year),
          String(parts.month).padStart(2, '0'),
          String(parts.day).padStart(2, '0'),
        ].join('-');
      }

      function formatDateTimeInputValue(value) {
        const parts = getMoscowDateParts(value || new Date());
        if (!parts) {
          return '';
        }
        return [
          String(parts.year),
          String(parts.month).padStart(2, '0'),
          String(parts.day).padStart(2, '0'),
        ].join('-') + 'T' +
          String(parts.hours).padStart(2, '0') + ':' +
          String(parts.minutes).padStart(2, '0');
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
  showHero?: boolean;
}): string {
  const heroMarkup = params.showHero === false
    ? ''
    : `
      <section class="hero">
        <div class="hero-copy">
          <span class="eyebrow">${escapeHtml(params.eyebrow)}</span>
          <h1>${escapeHtml(params.heading)}</h1>
          <p>${escapeHtml(params.summary)}</p>
        </div>
      </section>`;

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
      ${heroMarkup}
      ${params.body}
    </div>
    <button type="button" class="dev-toggle" onclick="toggleDevOverlay()">Dev</button>
    <div id="devOverlay" class="dev-overlay" hidden>
      <section class="panel stack dev-panel">
        <div class="section-head">
          <div class="section-copy">
            <span class="eyebrow">Dev output</span>
            <h2>Request log</h2>
          </div>
          <div class="actions">
            <button type="button" onclick="toggleDevOverlay(false)">Close</button>
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
  renderCampaignListPage(
    @Query('projectId') projectId = '',
    @Query('markerId') markerId = '',
  ): string {
    return renderCampaignUiPage({
      title: 'Marketing Service - Campaigns',
      eyebrow: 'Campaigns',
      heading: 'Campaigns',
      summary:
        'Project campaign workspace.',
      showHero: false,
      body: `
        <section class="panel stack">
          <div class="nav-row campaign-creation-nav">
            <div class="actions">
              <a class="btn" href="/test-ui/project?projectId=${escapeHtml(projectId)}">&lt; Dashboard</a>
            </div>
            <div class="nav-center-label">Campaigns</div>
            <div class="actions">
              <a class="btn primary" href="/test-ui/campaigns/new?projectId=${escapeHtml(projectId)}${markerId ? `&markerId=${escapeHtml(markerId)}` : ''}">Create campaign</a>
            </div>
          </div>
        </section>

        <section class="panel stack">
          <div class="section-head campaign-list-head">
            <div class="campaign-segment-row" role="tablist" aria-label="Campaign groups">
              <button id="activeCampaignsTab" class="is-active" type="button" data-campaign-group="active">Active<span id="activeCampaignsCount">&nbsp;(0)</span></button>
              <button id="draftCampaignsTab" type="button" data-campaign-group="drafts">Drafts<span id="draftCampaignsCount">&nbsp;(0)</span></button>
              <button id="completedCampaignsTab" type="button" data-campaign-group="completed">Completed<span id="completedCampaignsCount">&nbsp;(0)</span></button>
            </div>
          </div>
          <div id="campaignCards" class="card-grid"></div>
        </section>
      `,
      script: `
        const projectId = ${JSON.stringify(projectId)};
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

        function getStatusCount(campaign, status) {
          return Number(campaign.publicationStatusCounts?.[status] || 0);
        }

        function completedPublicationCount(campaign) {
          return [...completedPublicationStatuses].reduce((sum, status) => sum + getStatusCount(campaign, status), 0);
        }

        function isCompletedCampaign(campaign) {
          return campaign.plannedPublicationCount > 0 &&
            completedPublicationCount(campaign) >= Number(campaign.plannedPublicationCount || 0);
        }

        function isDraftCampaign(campaign) {
          return campaign.pendingApprovalCount > 0 ||
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
          if (group === 'drafts') {
            return 'Drafts';
          }
          if (group === 'completed') {
            return 'Completed';
          }
          return 'Active campaigns';
        }

        function campaignActions(campaign) {
          const actions = [
            '<a class="btn primary" href="/test-ui/campaigns/new?projectId=' + encodeURIComponent(projectId) + '&campaignId=' + encodeURIComponent(campaign.id) + '">Open</a>',
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
          const root = document.getElementById('campaignCards');
          if (!Array.isArray(campaigns) || campaigns.length === 0) {
            root.innerHTML = '<div class="empty-state">No ' + escapeHtml(campaignGroupLabel(currentCampaignGroup).toLowerCase()) + ' yet.</div>';
            return;
          }

          root.innerHTML = campaigns.map((campaign) => {
            const completed = completedPublicationCount(campaign);
            const total = Number(campaign.plannedPublicationCount || 0);
            return '<article class="card">' +
              '<div class="card-head">' +
                '<div class="stack">' +
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
              '<p class="soft">Updated ' + escapeHtml(formatDateTime(campaign.updatedAt)) + '</p>' +
              '<div class="actions">' + campaignActions(campaign) + '</div>' +
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

          const campaigns = groupedCampaigns[group] || [];
          renderCampaignCards(campaigns);
        }

        function renderCampaignTabs() {
          document.getElementById('activeCampaignsCount').textContent = '\\u00a0(' + String(groupedCampaigns.active.length) + ')';
          document.getElementById('draftCampaignsCount').textContent = '\\u00a0(' + String(groupedCampaigns.drafts.length) + ')';
          document.getElementById('completedCampaignsCount').textContent = '\\u00a0(' + String(groupedCampaigns.completed.length) + ')';
          renderCampaignGroup(currentCampaignGroup);
        }

        async function loadPage() {
          if (!projectId) {
            document.getElementById('campaignCards').innerHTML =
              '<div class="empty-state">Open this screen with ?projectId=...</div>';
            return;
          }

          const [project, campaigns] = await Promise.all([
            request('/projects/' + encodeURIComponent(projectId), undefined, { renderResponse: false }),
            request('/projects/' + encodeURIComponent(projectId) + '/campaigns', undefined, { renderResponse: false }),
          ]);

          groupedCampaigns = groupCampaigns(campaigns);
          renderCampaignTabs();
          setOutput({ project, campaigns });
        }

        document.querySelectorAll('[data-campaign-group]').forEach((button) => {
          button.addEventListener('click', () => renderCampaignGroup(button.dataset.campaignGroup));
        });

        loadPage().catch((error) => setOutput(String(error)));
      `,
    });
  }

  @Get('campaigns/new')
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderCreateCampaignPage(
    @Query('projectId') projectId = '',
    @Query('markerId') markerId = '',
    @Query('campaignId') campaignId = '',
  ): string {
    return renderCampaignUiPage({
      title: 'Marketing Service - Create Campaign',
      eyebrow: 'Campaigns',
      heading: 'Create campaign',
      summary:
        'Create a campaign from a preset. You can customize, remove, or add publications for this campaign without changing the preset.',
      showHero: false,
      body: `
        <section class="panel stack">
          <div class="nav-row campaign-creation-nav">
            <div class="actions">
              <a class="btn" href="/test-ui/project?projectId=${escapeHtml(projectId)}">&lt; Dashboard</a>
            </div>
            <div class="nav-center-label">Campaign creation</div>
            <div class="actions">
              <a id="campaignCreationInboxLink" class="btn btn-with-badge" href="#" aria-disabled="true">
                <span id="campaignCreationInboxBadge" class="notification-badge" hidden>0</span>
                Inbox
              </a>
              <a class="btn" href="/test-ui/campaign-presets?projectId=${escapeHtml(projectId)}">Manage presets</a>
            </div>
          </div>
        </section>

        <section class="panel campaign-flow-progress" aria-label="Campaign creation progress">
          <div class="flow-step is-active" data-flow-step="general">
            <span>Step 1</span>
            <strong>General information</strong>
          </div>
          <div class="flow-step is-disabled" data-flow-step="longread">
            <span>Step 2</span>
            <strong>Longread</strong>
          </div>
          <div class="flow-step is-disabled" data-flow-step="ai">
            <span>Step 3</span>
            <strong>AI work</strong>
          </div>
          <div class="flow-step is-disabled" data-flow-step="done">
            <span>Step 4</span>
            <strong>Done</strong>
          </div>
        </section>

        <section id="generalStep" class="form-card stack campaign-wizard-step">
          <form id="createCampaignForm" class="stack">
            <div class="section-head">
              <div class="section-copy">
                <h2>General information</h2>
              </div>
              <div class="actions">
                <button id="openSavePresetModalBtn" type="button">Save preset</button>
                <button id="createCampaignNext" class="primary" type="submit">Next</button>
              </div>
            </div>
            <div style="display:none;">
              <span id="projectName"></span>
              <span id="projectSummary"></span>
              <span id="presetName"></span>
              <span id="presetDescription"></span>
              <span id="presetSourceLanguage"></span>
              <span id="presetSourceType"></span>
            </div>
            <div class="form-grid create-campaign-form-grid">
              <label class="field">
                Campaign name
                <input id="campaignName" type="text" placeholder="Market insight burst" required />
              </label>
              <label class="field">
                Start date
                <input id="startDate" type="date" required />
              </label>
              <label id="presetField" class="field">
                Preset
                <select id="presetId" required></select>
              </label>
            </div>

            <div class="section-copy">
              <span class="eyebrow">Publications</span>
            </div>
            <div class="table-wrap">
              <table class="table-editor">
                <thead>
                  <tr>
                    <th>Position</th>
                    <th>Publish date</th>
                    <th>Time</th>
                    <th>Channel</th>
                    <th>Language</th>
                    <th>Type</th>
                    <th>Style</th>
                    <th>Row</th>
                  </tr>
                </thead>
                <tbody id="presetRows"></tbody>
              </table>
            </div>
            <div class="actions">
              <button type="button" id="addCampaignPlanRow">Add publication</button>
            </div>
          </form>
        </section>

        <section id="longreadStep" class="form-card stack campaign-wizard-step" hidden>
          <form id="longreadForm" class="stack">
            <div class="section-head">
              <div class="section-copy">
                <h2>Longread</h2>
                <p>Paste the canonical source article for this campaign. AI production starts after this step.</p>
              </div>
              <div class="actions">
                <button id="longreadNext" class="primary" type="submit">Next</button>
              </div>
            </div>
            <label class="field">
              Source longread
              <textarea id="sourceContent" placeholder="Paste the longread here." required></textarea>
            </label>
          </form>
        </section>

        <section id="aiStep" class="panel stack campaign-wizard-step" hidden>
          <div class="section-head">
            <div class="section-copy">
              <h2>AI work</h2>
              <p id="aiStatusText">Waiting for production to start.</p>
            </div>
          </div>
          <div class="campaign-ai-progress">
            <article id="flowSourceCheck" class="flow-step ai-flow-step is-disabled">
              <span>Step A</span>
              <strong>Longread Check</strong>
              <p>AI reviews the source longread, checks whether it is usable, and pauses the flow if it needs human clarification.</p>
            </article>
            <article id="flowStage1" class="flow-step ai-flow-step is-disabled">
              <span>Step B</span>
              <strong>Adaptations Generation</strong>
              <p>AI turns the source into channel-specific publication drafts according to the campaign plan.</p>
            </article>
            <article id="flowStage2" class="flow-step ai-flow-step is-disabled">
              <span>Step C</span>
              <strong>Translation Generation</strong>
              <p>AI prepares the required language versions and final text variants for planned publications.</p>
            </article>
          </div>
        </section>

        <section id="doneStep" class="panel stack campaign-wizard-step" hidden>
          <div class="section-head">
            <div class="section-copy">
              <h2>Done</h2>
              <p id="doneStepText">Campaign production is ready.</p>
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
                  <th>Status</th>
                  <th>Publication</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="donePublicationRows"></tbody>
            </table>
          </div>
          <form id="donePublicationEditor" class="done-publication-editor stack" hidden>
            <div class="section-head">
              <div class="section-copy">
                <h3 id="donePublicationEditorTitle">Publication</h3>
                <div id="donePublicationEditorMeta" class="done-publication-meta"></div>
              </div>
              <div class="actions">
                <button type="button" id="closeDonePublicationEditor">Close</button>
              </div>
            </div>
            <div class="form-grid done-publication-grid">
              <label class="field full">
                Content
                <textarea id="donePublicationContent" required></textarea>
              </label>
              <label class="field">
                Publish date
                <input id="donePublicationDate" type="date" required />
              </label>
              <label class="field">
                Publish time
                <input id="donePublicationTime" type="time" required />
              </label>
            </div>
            <div class="actions">
              <button type="submit" id="saveDonePublicationChanges" class="primary">Save changes</button>
            </div>
            <div id="donePublicationStatus" class="inline-note"></div>
          </form>
        </section>

        <div id="savePresetModalBackdrop" class="modal-backdrop" onclick="closeSavePresetModal(event)">
          <div class="modal" onclick="event.stopPropagation()">
            <div class="modal-head">
              <div class="section-copy">
                <h3>Save preset</h3>
                <p>Save the current publication plan as a reusable preset for future campaigns.</p>
              </div>
              <button type="button" onclick="closeSavePresetModal()">Close</button>
            </div>
            <label class="field">
              Preset name
              <input id="savePresetName" type="text" maxlength="160" placeholder="Community Roundup" />
            </label>
            <div id="savePresetError" class="error"></div>
            <div class="modal-actions">
              <button id="savePresetConfirmBtn" type="button" class="primary" onclick="saveCurrentPlanAsPreset()">Save preset</button>
              <button type="button" onclick="closeSavePresetModal()">Cancel</button>
            </div>
          </div>
        </div>
      `,
      script: `
        const projectId = ${JSON.stringify(projectId)};
        const markerId = ${JSON.stringify(markerId)};
        const initialCampaignId = ${JSON.stringify(campaignId)};
        let presets = [];
        let campaignPlan = [];
        let customPublicationCounter = 0;
        let markerDrivenPreset = null;
        let createdCampaignId = initialCampaignId || null;
        let currentCampaign = null;
        let currentCampaignOverview = null;
        let currentArticle = null;
        let activeDonePublicationId = null;
        let flowRefreshTimer = null;
        let activeFlowStep = 'general';
        const completedFlowSteps = new Set();
        const accessibleFlowSteps = new Set(['general']);
        const channelOptions = [
          ['channel_telegram', 'Telegram'],
          ['channel_x', 'X'],
          ['channel_discord', 'Discord'],
          ['channel_blog', 'Blog'],
        ];
        const languageOptions = ['RU', 'EN', 'ES'];
        const publicationTypeOptionsByChannel = ${renderPublicationTypeOptionsByChannel()} || {};
        const defaultPublicationTypeOptions = [{ value: 'default', label: 'Default' }];
        const emptyPresetId = '__empty__';
        const flowStepOrder = ['general', 'longread', 'ai', 'done'];
        const aiStepConfig = [
          {
            key: 'source_check',
            elementId: 'flowSourceCheck',
          },
          {
            key: 'stage_1_adaptation',
            elementId: 'flowStage1',
          },
          {
            key: 'stage_2_translation',
            elementId: 'flowStage2',
          },
        ];

        function goToFlowStep(step) {
          activeFlowStep = step;
          accessibleFlowSteps.add(step);
          flowStepOrder.forEach((item) => {
            const section = document.getElementById(item + 'Step');
            const progressItem = document.querySelector('[data-flow-step="' + item + '"]');
            if (section) {
              section.hidden = item !== step;
            }
            if (progressItem) {
              progressItem.classList.toggle('is-active', item === step);
              progressItem.classList.toggle('is-done', completedFlowSteps.has(item));
              progressItem.classList.toggle(
                'is-disabled',
                !accessibleFlowSteps.has(item) && !completedFlowSteps.has(item),
              );
            }
          });
          syncFlowStepAccess();
        }

        function setFlowStepReadOnly(step, isReadOnly) {
          const section = document.getElementById(step + 'Step');
          if (!section) {
            return;
          }

          section.querySelectorAll('input, textarea, select, button').forEach((element) => {
            if (isReadOnly) {
              element.dataset.locked = 'true';
              element.disabled = true;
            } else {
              delete element.dataset.locked;
              element.disabled = false;
            }
          });
        }

        function syncFlowStepAccess() {
          document.querySelectorAll('[data-flow-step]').forEach((item) => {
            const step = item.dataset.flowStep;
            const canOpen = accessibleFlowSteps.has(step) || completedFlowSteps.has(step);
            item.classList.toggle('can-open', canOpen);
            item.classList.toggle('is-disabled', !canOpen);
            item.setAttribute('role', 'button');
            item.setAttribute('aria-disabled', canOpen ? 'false' : 'true');
            item.tabIndex = canOpen ? 0 : -1;
          });
        }

        function openFlowStepFromProgress(step) {
          if (accessibleFlowSteps.has(step) || completedFlowSteps.has(step)) {
            goToFlowStep(step);
            return;
          }
          setOutput('Step "' + toTitle(step) + '" is not available yet.');
        }

        function markFlowStepDone(step) {
          completedFlowSteps.add(step);
          accessibleFlowSteps.add(step);
          if (step !== 'done') {
            setFlowStepReadOnly(step, true);
          } else {
            setFlowStepReadOnly(step, false);
          }
          document.querySelectorAll('[data-flow-step]').forEach((item) => {
            item.classList.toggle('is-done', completedFlowSteps.has(item.dataset.flowStep));
            item.classList.toggle(
              'is-disabled',
              !accessibleFlowSteps.has(item.dataset.flowStep) &&
                !completedFlowSteps.has(item.dataset.flowStep),
            );
          });
          syncFlowStepAccess();
        }

        function getSelectedPreset() {
          const presetId = document.getElementById('presetId')?.value;
          return presets.find((item) => item.id === presetId) || null;
        }

        function getSelectedSourceLanguage() {
          if (currentCampaign?.sourceLanguage) {
            return String(currentCampaign.sourceLanguage).toLowerCase();
          }
          const preset = getSelectedPreset();
          return String(preset?.sourceLanguage || 'en').toLowerCase();
        }

        function getSelectedSourceType() {
          const preset = getSelectedPreset();
          const sourceType = String(preset?.sourceType || '').trim().toLowerCase();
          if (!sourceType || sourceType === 'empty') {
            return 'custom';
          }
          return sourceType;
        }

        function setPrimaryButtonBusy(buttonId, isBusy, busyText, idleText) {
          const button = document.getElementById(buttonId);
          if (!button) {
            return;
          }
          button.disabled = isBusy || button.dataset.locked === 'true';
          button.textContent = isBusy ? busyText : idleText;
        }

        function updateCampaignCreationInboxLink(campaign) {
          const link = document.getElementById('campaignCreationInboxLink');
          const badge = document.getElementById('campaignCreationInboxBadge');
          if (!link || !badge) {
            return;
          }

          if (!campaign?.id) {
            link.href = '#';
            link.setAttribute('aria-disabled', 'true');
            badge.hidden = true;
            badge.textContent = '0';
            return;
          }

          const pendingCount = Number(campaign.pendingApprovalCount || 0);
          link.href = '/test-ui/campaign-inbox?campaignId=' + encodeURIComponent(campaign.id);
          link.setAttribute('aria-disabled', 'false');
          badge.textContent = String(pendingCount);
          badge.hidden = pendingCount === 0;
        }

        function rebuildPresetSelect(selectedPresetId) {
          const presetSelect = document.getElementById('presetId');
          if (!presetSelect) {
            return;
          }
          presetSelect.innerHTML = presets.map((preset) =>
            '<option value="' + escapeHtml(preset.id) + '">' + escapeHtml(preset.name) + '</option>'
          ).join('');
          if (selectedPresetId) {
            presetSelect.value = selectedPresetId;
          }
        }

        function openSavePresetModal() {
          syncCampaignPlanFromTable();
          const selectedPreset = getSelectedPreset();
          const suggestedName = selectedPreset?.id === emptyPresetId
            ? document.getElementById('campaignName').value.trim()
            : (selectedPreset?.name || document.getElementById('campaignName').value.trim());
          document.getElementById('savePresetName').value = suggestedName || '';
          document.getElementById('savePresetError').textContent = '';
          document.getElementById('savePresetModalBackdrop').classList.add('open');
          document.getElementById('savePresetName').focus();
          document.getElementById('savePresetName').select();
        }

        function closeSavePresetModal(event) {
          if (event && event.target !== event.currentTarget) {
            return;
          }
          document.getElementById('savePresetModalBackdrop').classList.remove('open');
          document.getElementById('savePresetError').textContent = '';
        }

        async function saveCurrentPlanAsPreset() {
          const error = document.getElementById('savePresetError');
          const saveButton = document.getElementById('savePresetConfirmBtn');
          const presetName = document.getElementById('savePresetName').value.trim();

          error.textContent = '';
          if (!presetName) {
            error.textContent = 'Enter preset name.';
            return;
          }

          syncCampaignPlanFromTable();

          const selectedPreset = getSelectedPreset();
          const description = selectedPreset?.id === '__marker__'
            ? (selectedPreset.description || 'Saved from selected plan.')
            : (selectedPreset?.id === emptyPresetId
              ? 'Saved from campaign creation.'
              : (selectedPreset?.description || 'Saved from campaign creation.'));

          saveButton.disabled = true;
          saveButton.textContent = 'Saving...';

          try {
            const created = await request(
              '/campaign-presets',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: presetName,
                  description,
                  sourceLanguage: getSelectedSourceLanguage(),
                  sourceType: getSelectedSourceType(),
                  isActive: true,
                  publications: campaignPlan.map((publication, index) => ({
                    dayOffset: Number(publication.dayOffset || '0'),
                    localTime: publication.localTime,
                    channel: publication.channel,
                    language: publication.language,
                    publicationType: publication.publicationType,
                    style: publication.style,
                    position: index + 1,
                  })),
                }),
              },
              { renderResponse: false },
            );

            const presetList = await request('/campaign-presets', undefined, { renderResponse: false });
            presets = markerDrivenPreset
              ? [markerDrivenPreset, ...presetList, buildEmptyPresetOption()]
              : [...presetList, buildEmptyPresetOption()];
            rebuildPresetSelect(created.id);
            renderPresetPreview(created.id);
            closeSavePresetModal();
            setOutput({ savedPresetId: created.id, publications: campaignPlan.length });
          } catch (saveError) {
            error.textContent = saveError instanceof Error ? saveError.message : String(saveError);
          } finally {
            saveButton.disabled = false;
            saveButton.textContent = 'Save preset';
          }
        }

        function getLatestWorkflowRunByStep(campaign, step) {
          return [...(campaign.workflowRuns || [])]
            .filter((run) => run.currentStep === step)
            .sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime())[0] || null;
        }

        function getAiStageVisualState(campaign, config, activeWorkflowRun) {
          if (activeWorkflowRun?.currentStep === config.key) {
            return {
              className: 'flow-step ai-flow-step is-active',
            };
          }

          const latestRun = getLatestWorkflowRunByStep(campaign, config.key);
          if (!latestRun) {
            return {
              className: 'flow-step ai-flow-step is-disabled',
            };
          }

          if (latestRun.status === 'completed') {
            return {
              className: 'flow-step ai-flow-step is-done',
            };
          }

          const errorMessage = String(latestRun.errorMessage || '').toLowerCase();
          const isReviewState =
            errorMessage.includes('review') ||
            errorMessage.includes('approval') ||
            campaign.pendingApprovalCount > 0 ||
            campaign.status === 'source_needs_review';

          return {
            className: isReviewState
              ? 'flow-step ai-flow-step is-warning'
              : 'flow-step ai-flow-step is-danger',
          };
        }

        function isCampaignAiDone(campaign) {
          const hasActiveWorkflowRun = (campaign.workflowRuns || []).some((run) => run.status === 'running');
          const planned = campaign.plannedPublications || [];
          const allPlannedReady = planned.length > 0 && planned.every((item) =>
            ['ready', 'ready_for_final_approval', 'publication_scheduled', 'exported', 'published'].includes(item.status),
          );
          return !hasActiveWorkflowRun &&
            campaign.pendingApprovalCount === 0 &&
            (
              allPlannedReady ||
              ['ready_for_final_approval', 'approved_for_publishing', 'publishing', 'completed'].includes(campaign.status)
            );
        }

        function renderDonePublications(overview) {
          const rows = overview?.items || [];
          const root = document.getElementById('donePublicationRows');
          if (!root) {
            return;
          }

          root.innerHTML = rows.length === 0
            ? '<tr><td colspan="7" class="soft">No publications were created for this campaign yet.</td></tr>'
            : rows.map((item) => '<tr class="done-publication-row' + (activeDonePublicationId === item.plannedPublicationId ? ' is-active' : '') + '">' +
              '<td>' + escapeHtml(formatDateTime(item.scheduledFor)) + '</td>' +
              '<td>' + escapeHtml(toTitle(String(item.channel || '').replace('channel_', ''))) + '</td>' +
              '<td>' + escapeHtml(String(item.language || '').toUpperCase()) + '</td>' +
              '<td>' + escapeHtml(toTitle(item.publishMode || 'auto_publish')) + '</td>' +
              '<td>' + renderBadge(item.publicationStatus || item.plannedStatus) + '</td>' +
              '<td>' +
                '<div class="stack">' +
                  (item.publicationId ? '<span class="mono">' + escapeHtml(item.publicationId) + '</span>' : '') +
                  (item.exportPlanId ? '<span class="mono">' + escapeHtml(item.exportPlanId) + '</span>' : '') +
                  (!item.publicationId && !item.exportPlanId ? '<span class="soft">Dashboard planned publication</span>' : '') +
                  (item.externalPostId ? '<span class="soft">External post ' + escapeHtml(item.externalPostId) + '</span>' : '') +
                  (item.errorMessage ? '<span class="soft">' + escapeHtml(item.errorMessage) + '</span>' : '') +
                '</div>' +
              '</td>' +
              '<td><button type="button" data-open-done-publication="' + escapeHtml(item.plannedPublicationId) + '">Open</button></td>' +
            '</tr>').join('');

          root.querySelectorAll('[data-open-done-publication]').forEach((button) => {
            button.addEventListener('click', () => openDonePublicationEditor(button.dataset.openDonePublication));
          });
        }

        function getDoneOverviewItem(plannedPublicationId) {
          return (currentCampaignOverview?.items || []).find(
            (item) => item.plannedPublicationId === plannedPublicationId,
          ) || null;
        }

        async function ensureArticleForDoneItem(item) {
          if (!item?.articleId) {
            return null;
          }
          if (currentArticle?.id === item.articleId) {
            return currentArticle;
          }
          currentArticle = await request(
            '/articles/' + encodeURIComponent(item.articleId),
            undefined,
            { renderResponse: false },
          );
          return currentArticle;
        }

        function resolveDonePublicationContent(article, item) {
          if (!article || !item?.adaptationId) {
            return '';
          }
          const adaptation = (article.adaptations || []).find(
            (entry) => entry.id === item.adaptationId,
          );
          if (!adaptation) {
            return '';
          }
          if (item.translationId) {
            const translation = (adaptation.translations || []).find(
              (entry) => entry.id === item.translationId,
            );
            return translation?.translatedContent || '';
          }
          return adaptation.adaptedContent || '';
        }

        function closeDonePublicationEditor() {
          activeDonePublicationId = null;
          const form = document.getElementById('donePublicationEditor');
          if (form) {
            form.hidden = true;
          }
          const status = document.getElementById('donePublicationStatus');
          if (status) {
            status.textContent = '';
          }
          renderDonePublications(currentCampaignOverview);
        }

        async function openDonePublicationEditor(plannedPublicationId) {
          const item = getDoneOverviewItem(plannedPublicationId);
          if (!item) {
            setOutput('Publication not found in campaign overview.');
            return;
          }

          const article = await ensureArticleForDoneItem(item);
          const content = resolveDonePublicationContent(article, item);
          activeDonePublicationId = plannedPublicationId;

          document.getElementById('donePublicationEditorTitle').textContent =
            toTitle(String(item.channel || '').replace('channel_', '')) + ' · ' +
            String(item.language || '').toUpperCase();
          document.getElementById('donePublicationEditorMeta').innerHTML =
            '<span class="pill">' + escapeHtml(formatDateTime(item.scheduledFor)) + '</span>' +
            '<span class="pill">' + escapeHtml(toTitle(item.publishMode || 'auto_publish')) + '</span>' +
            '<span class="pill">' + escapeHtml(item.artifactType || 'publication') + '</span>';
          document.getElementById('donePublicationContent').value = content;
          document.getElementById('donePublicationDate').value = formatDateInputValue(item.scheduledFor);
          const scheduledParts = getMoscowDateParts(item.scheduledFor);
          document.getElementById('donePublicationTime').value = scheduledParts
            ? String(scheduledParts.hours).padStart(2, '0') + ':' +
              String(scheduledParts.minutes).padStart(2, '0')
            : '09:00';
          document.getElementById('donePublicationStatus').textContent = '';
          document.getElementById('donePublicationEditor').hidden = false;
          renderDonePublications(currentCampaignOverview);
          document.getElementById('donePublicationContent').focus();
        }

        const buildUtcIsoFromDateAndTime = buildMoscowIsoFromDateAndTime;

        async function saveDonePublicationChanges(event) {
          event.preventDefault();
          if (!createdCampaignId || !activeDonePublicationId) {
            setOutput('Campaign publication editor is not ready.');
            return;
          }

          const item = getDoneOverviewItem(activeDonePublicationId);
          if (!item || !item.articleId || !item.adaptationId) {
            setOutput('Publication editing data is missing.');
            return;
          }

          const content = document.getElementById('donePublicationContent').value.trim();
          const publishDate = document.getElementById('donePublicationDate').value;
          const publishTime = document.getElementById('donePublicationTime').value;
          const publishAt = buildUtcIsoFromDateAndTime(publishDate, publishTime);
          if (!content || !publishAt) {
            setOutput('Content, date and time are required.');
            return;
          }

          setPrimaryButtonBusy(
            'saveDonePublicationChanges',
            true,
            'Saving...',
            'Save changes',
          );
          const status = document.getElementById('donePublicationStatus');
          if (status) {
            status.textContent = '';
          }

          try {
            if (item.translationId) {
              await request(
                '/articles/' + encodeURIComponent(item.articleId) +
                  '/adaptations/' + encodeURIComponent(item.adaptationId) +
                  '/translations/' + encodeURIComponent(item.translationId) + '/edit',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ translatedContent: content }),
                },
                { renderResponse: false },
              );
              await request(
                '/articles/' + encodeURIComponent(item.articleId) +
                  '/adaptations/' + encodeURIComponent(item.adaptationId) +
                  '/translations/' + encodeURIComponent(item.translationId) + '/approve',
                { method: 'POST' },
                { renderResponse: false },
              );
            } else {
              await request(
                '/articles/' + encodeURIComponent(item.articleId) +
                  '/adaptations/' + encodeURIComponent(item.adaptationId) + '/edit',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ adaptedContent: content }),
                },
                { renderResponse: false },
              );
              await request(
                '/articles/' + encodeURIComponent(item.articleId) +
                  '/adaptations/' + encodeURIComponent(item.adaptationId) + '/approve',
                { method: 'POST' },
                { renderResponse: false },
              );
            }

            const rescheduled = await request(
              '/campaigns/' + encodeURIComponent(createdCampaignId) +
                '/planned-publications/' + encodeURIComponent(item.plannedPublicationId) + '/reschedule',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ publishAt }),
              },
              { renderResponse: false },
            );

            currentArticle = null;
            await loadCampaignFlow();
            await openDonePublicationEditor(item.plannedPublicationId);
            if (status) {
              status.textContent = 'Saved. Content and schedule were updated.';
            }
            setOutput({ saved: true, rescheduled });
          } catch (error) {
            if (status) {
              status.textContent = String(error);
            }
            setOutput(String(error));
          } finally {
            setPrimaryButtonBusy(
              'saveDonePublicationChanges',
              false,
              'Saving...',
              'Save changes',
            );
          }
        }

        function renderAiWork(campaign, overview) {
          const activeWorkflowRun = (campaign.workflowRuns || []).find((run) => run.status === 'running') || null;
          const hasInboxPause = campaign.pendingApprovalCount > 0 || campaign.status === 'source_needs_review';
          const isDone = isCampaignAiDone(campaign);
          updateCampaignCreationInboxLink(campaign);

          aiStepConfig.forEach((config) => {
            const element = document.getElementById(config.elementId);
            const visualState = getAiStageVisualState(campaign, config, activeWorkflowRun);
            element.className = visualState.className;
          });

          document.getElementById('aiStatusText').textContent = hasInboxPause
            ? 'Flow is paused by inbox review. Resolve the item, then it will continue automatically.'
            : activeWorkflowRun
              ? 'Worker is running ' + toTitle(activeWorkflowRun.currentStep) + '.'
              : isDone
                ? 'AI production is complete. Publications are ready for publishing overview.'
                : 'Waiting for the worker to pick up the next stage.';

          if (isDone) {
            renderDonePublications(overview);
            if (flowRefreshTimer) {
              clearInterval(flowRefreshTimer);
              flowRefreshTimer = null;
            }
            markFlowStepDone('ai');
            markFlowStepDone('done');
            document.getElementById('doneStepText').textContent =
              'Campaign "' + campaign.name + '" is ready.';
            if (activeFlowStep === 'ai' || activeFlowStep === 'done') {
              goToFlowStep('done');
            }
          }
        }

        async function loadCampaignFlow() {
          if (!createdCampaignId) {
            return;
          }
          const [campaign, overview] = await Promise.all([
            request('/campaigns/' + encodeURIComponent(createdCampaignId), undefined, { renderResponse: false }),
            request('/campaigns/' + encodeURIComponent(createdCampaignId) + '/publishing-overview', undefined, { renderResponse: false }),
          ]);
          currentCampaign = campaign;
          currentCampaignOverview = overview;
          if (campaign?.sourceArticleId && currentArticle?.id !== campaign.sourceArticleId) {
            await syncSourceContentFromCampaign(campaign);
          }
          renderAiWork(campaign, overview);
          setOutput({ campaign, overview });
        }

        async function syncSourceContentFromCampaign(campaign) {
          if (!campaign?.sourceArticleId) {
            currentArticle = null;
            return null;
          }

          currentArticle = await request(
            '/articles/' + encodeURIComponent(campaign.sourceArticleId),
            undefined,
            { renderResponse: false },
          );

          const sourceContentInput = document.getElementById('sourceContent');
          if (sourceContentInput && typeof currentArticle?.original?.content === 'string') {
            sourceContentInput.value = currentArticle.original.content;
          }

          return currentArticle;
        }

        function startFlowPolling() {
          if (flowRefreshTimer) {
            clearInterval(flowRefreshTimer);
          }
          flowRefreshTimer = setInterval(() => {
            loadCampaignFlow().catch((error) => setOutput(String(error)));
          }, 4000);
        }

        function buildChannelSelectOptions(selectedValue) {
          return channelOptions
            .map(([value, label]) =>
              '<option value="' + escapeHtml(value) + '"' +
              (value === selectedValue ? ' selected' : '') +
              '>' + escapeHtml(label) + '</option>'
            )
            .join('');
        }

        function normalizePublicationLanguage(value) {
          const normalizedValue = String(value || 'EN').toUpperCase();
          return languageOptions.includes(normalizedValue) ? normalizedValue : 'EN';
        }

        function buildLanguageSelectOptions(selectedValue) {
          const normalizedValue = normalizePublicationLanguage(selectedValue);
          return languageOptions
            .map((language) =>
              '<option value="' + escapeHtml(language) + '"' +
              (language === normalizedValue ? ' selected' : '') +
              '>' + escapeHtml(language) + '</option>'
            )
            .join('');
        }

        function getPublicationTypeOptions(channel) {
          return publicationTypeOptionsByChannel[channel] ||
            publicationTypeOptionsByChannel.channel_telegram ||
            defaultPublicationTypeOptions;
        }

        function normalizePublicationTypeValue(channel, selectedValue) {
          const options = getPublicationTypeOptions(channel);
          const matched = options.find((option) => option.value === selectedValue);
          return matched ? matched.value : (options[0]?.value || 'default');
        }

        function buildPublicationTypeSelectOptions(channel, selectedValue) {
          const normalizedValue = normalizePublicationTypeValue(channel, selectedValue);
          return getPublicationTypeOptions(channel)
            .map((option) =>
              '<option value="' + escapeHtml(option.value) + '"' +
              (option.value === normalizedValue ? ' selected' : '') +
              '>' + escapeHtml(option.label) + '</option>'
            )
            .join('');
        }

        function parseDateInputValue(value) {
          const iso = buildMoscowIsoFromDateAndTime(value, '00:00');
          return iso ? new Date(iso) : null;
        }

        function getSelectedStartDateValue() {
          return document.getElementById('startDate')?.value || formatDateInputValue(new Date());
        }

        function buildPublishDateValue(dayOffset) {
          const startDate = parseDateInputValue(getSelectedStartDateValue());
          if (!startDate) {
            return '';
          }
          startDate.setUTCDate(startDate.getUTCDate() + Number(dayOffset || '0'));
          return formatDateInputValue(startDate);
        }

        function buildDayOffsetValue(publishDateValue) {
          const startDate = parseDateInputValue(getSelectedStartDateValue());
          const publishDate = parseDateInputValue(publishDateValue);
          if (!startDate || !publishDate) {
            return '0';
          }
          return String(Math.round((publishDate.getTime() - startDate.getTime()) / 86400000));
        }

        function buildCampaignPlanFromPreset(preset) {
          customPublicationCounter = 0;
          return (preset.publications || [])
            .slice()
            .sort((left, right) => left.position - right.position)
            .map((publication) => ({
              rowKey: publication.id,
              presetPublicationId: publication.id,
              rowType: 'preset',
              position: publication.position,
              dayOffset: String(publication.dayOffset),
              localTime: publication.localTime,
              channel: publication.channel,
              language: normalizePublicationLanguage(publication.language),
              publicationType: normalizePublicationTypeValue(
                publication.channel,
                publication.publicationType,
              ),
              style: publication.style,
            }));
        }

        function buildMarkerDrivenPreset(marker, placements) {
          const orderedPlacements = [...placements]
            .sort((left, right) => new Date(left.publishAt).getTime() - new Date(right.publishAt).getTime());

          if (orderedPlacements.length === 0) {
            return null;
          }

          const firstPlacementDate = parseDateInputValue(
            formatDateInputValue(orderedPlacements[0].publishAt),
          );

          const publications = orderedPlacements.map((placement, index) => {
            const publishAt = new Date(placement.publishAt);
            const publishDay = parseDateInputValue(formatDateInputValue(publishAt));
            const dayOffset = Math.round(
              (publishDay.getTime() - firstPlacementDate.getTime()) / 86400000,
            );
            const publishParts = getMoscowDateParts(publishAt);
            const localTime = String(publishParts?.hours ?? 9).padStart(2, '0') + ':' +
              String(publishParts?.minutes ?? 0).padStart(2, '0');

            return {
              id: 'marker-placement-' + placement.id,
              dayOffset,
              localTime,
              channel: placement.channelId,
              language: normalizePublicationLanguage(placement.targetLanguage),
              publicationType: normalizePublicationTypeValue(placement.channelId, null),
              style: 'default',
              position: index + 1,
            };
          });

          return {
            id: '__marker__',
            name: 'Plan · ' + marker.title,
            description: marker.notes || ('Generated from selected plan "' + marker.title + '".'),
            sourceLanguage: 'EN',
            sourceType: 'marker_plan',
            isActive: true,
            isSystem: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            markerTitle: marker.title,
            firstPlacementDate: firstPlacementDate,
            publications,
          };
        }

        function buildNewCustomPublication() {
          customPublicationCounter += 1;
          return {
            rowKey: 'custom-' + customPublicationCounter,
            presetPublicationId: null,
            rowType: 'custom',
            position: campaignPlan.length + 1,
            dayOffset: '0',
            localTime: '09:00',
            channel: 'channel_telegram',
            language: 'EN',
            publicationType: normalizePublicationTypeValue('channel_telegram', null),
            style: 'default',
          };
        }

        function syncCampaignPlanFromTable() {
          campaignPlan = Array.from(document.querySelectorAll('#presetRows tr[data-row-key]'))
            .map((row) => ({
              rowKey: row.dataset.rowKey,
              presetPublicationId: row.dataset.presetPublicationId || null,
              rowType: row.dataset.rowType || 'preset',
              position: Number(row.dataset.position || '0'),
              dayOffset: buildDayOffsetValue(row.querySelector('[data-field="publishDate"]').value),
              localTime: row.querySelector('[data-field="localTime"]').value,
              channel: row.querySelector('[data-field="channel"]').value,
              language: normalizePublicationLanguage(row.querySelector('[data-field="language"]').value),
              publicationType: normalizePublicationTypeValue(
                row.querySelector('[data-field="channel"]').value,
                row.querySelector('[data-field="publicationType"]').value,
              ),
              style: row.querySelector('[data-field="style"]').value,
            }));
        }

        function removeCampaignPlanRow(rowKey) {
          campaignPlan = campaignPlan
            .filter((publication) => publication.rowKey !== rowKey)
            .map((publication, index) => ({
              ...publication,
              position: index + 1,
            }));
          renderCampaignPlanRows(campaignPlan);
        }

        function renderCampaignPlanRows(rows) {
          document.getElementById('presetRows').innerHTML = rows
            .map((publication) => (
              '<tr data-row-key="' + escapeHtml(publication.rowKey) + '" data-row-type="' + escapeHtml(publication.rowType) + '" data-preset-publication-id="' + escapeHtml(publication.presetPublicationId || '') + '" data-position="' + escapeHtml(String(publication.position)) + '">' +
                '<td>' + escapeHtml(String(publication.position)) + '</td>' +
                '<td><input data-field="publishDate" type="date" value="' + escapeHtml(buildPublishDateValue(publication.dayOffset)) + '" /></td>' +
                '<td><input data-field="localTime" type="time" value="' + escapeHtml(publication.localTime) + '" /></td>' +
                '<td><select data-field="channel">' + buildChannelSelectOptions(publication.channel) + '</select></td>' +
                '<td><select data-field="language">' + buildLanguageSelectOptions(publication.language) + '</select></td>' +
                '<td><select data-field="publicationType">' + buildPublicationTypeSelectOptions(publication.channel, publication.publicationType) + '</select></td>' +
                '<td><input data-field="style" type="text" maxlength="64" value="' + escapeHtml(publication.style) + '" /></td>' +
                '<td><button type="button" class="btn danger" data-remove-row="' + escapeHtml(publication.rowKey) + '">Remove</button></td>' +
              '</tr>'
            ))
            .join('');

          document.querySelectorAll('#presetRows input, #presetRows select').forEach((element) => {
            const syncAndMaybeRerender = () => {
              syncCampaignPlanFromTable();
              if (element.dataset.field === 'channel') {
                renderCampaignPlanRows(campaignPlan);
              }
            };
            element.addEventListener('input', syncAndMaybeRerender);
            element.addEventListener('change', syncAndMaybeRerender);
          });

          document.querySelectorAll('[data-remove-row]').forEach((element) => {
            element.addEventListener('click', () => removeCampaignPlanRow(element.dataset.removeRow));
          });

          syncCampaignPlanFromTable();
        }

        function renderPresetPreview(presetId) {
          const preset = presets.find((item) => item.id === presetId) || null;
          if (!preset) {
            document.getElementById('presetName').textContent = 'Pick a preset';
            document.getElementById('presetDescription').textContent = 'Preset details will appear here.';
            document.getElementById('presetSourceLanguage').textContent = '—';
            document.getElementById('presetSourceType').textContent = '—';
            document.getElementById('presetRows').innerHTML = '<tr><td colspan="8" class="soft">No preset selected.</td></tr>';
            campaignPlan = [];
            return;
          }

          document.getElementById('presetName').textContent = preset.name;
          document.getElementById('presetDescription').textContent = preset.id === '__marker__'
            ? 'Generated from the selected plan. Channel rows come directly from its placements.'
            : preset.description;
          document.getElementById('presetSourceLanguage').textContent = String(preset.sourceLanguage || '').toUpperCase();
          document.getElementById('presetSourceType').textContent = toTitle(preset.sourceType);
          campaignPlan = buildCampaignPlanFromPreset(preset);
          renderCampaignPlanRows(campaignPlan);
        }

        function buildEmptyPresetOption() {
          return {
            id: emptyPresetId,
            name: 'Empty preset',
            description: 'Start with no planned publications and add rows manually if needed.',
            sourceLanguage: 'en',
            sourceType: 'empty',
            publications: [],
            isSystem: true,
            isActive: true,
            updatedAt: new Date().toISOString(),
          };
        }

        async function boot() {
          updateCampaignCreationInboxLink(null);
          if (!projectId) {
            document.getElementById('projectName').textContent = 'Missing projectId';
            return;
          }

          const [project, presetList] = await Promise.all([
            request('/projects/' + encodeURIComponent(projectId), undefined, { renderResponse: false }),
            request('/campaign-presets', undefined, { renderResponse: false }),
          ]);

          presets = [...presetList, buildEmptyPresetOption()];
          document.getElementById('projectName').textContent = project.name;
          document.getElementById('startDate').value = formatDateInputValue(new Date());

          const presetSelect = document.getElementById('presetId');
          if (markerId) {
            const [markers, placements] = await Promise.all([
              request('/projects/' + encodeURIComponent(projectId) + '/markers', undefined, {
                renderResponse: false,
              }),
              request('/projects/' + encodeURIComponent(projectId) + '/marker-placements', undefined, {
                renderResponse: false,
              }),
            ]);

            const marker = (markers || []).find((item) => item.id === markerId) || null;
            const markerPlacements = (placements || []).filter((item) => item.markerId === markerId);

            if (marker) {
              document.getElementById('campaignName').value = marker.title;
            }

            if (marker && markerPlacements.length > 0) {
              markerDrivenPreset = buildMarkerDrivenPreset(marker, markerPlacements);
              if (markerDrivenPreset) {
                presets = [markerDrivenPreset, ...presetList, buildEmptyPresetOption()];
                document.getElementById('startDate').value = formatDateInputValue(markerDrivenPreset.firstPlacementDate);
                document.getElementById('projectSummary').textContent =
                  'This campaign is generated from the selected plan. Adaptation channels and schedule are taken from its placements.';
                document.getElementById('presetField').style.display = 'none';
              }
            }
          }

          rebuildPresetSelect();
          presetSelect.addEventListener('change', () => renderPresetPreview(presetSelect.value));
          document.getElementById('startDate').addEventListener('input', () => renderCampaignPlanRows(campaignPlan));
          document.getElementById('startDate').addEventListener('change', () => renderCampaignPlanRows(campaignPlan));
          document.getElementById('addCampaignPlanRow').addEventListener('click', () => {
            campaignPlan = [
              ...campaignPlan,
              buildNewCustomPublication(),
            ].map((publication, index) => ({
              ...publication,
              position: index + 1,
            }));
            renderCampaignPlanRows(campaignPlan);
          });
          document.querySelectorAll('[data-flow-step]').forEach((element) => {
            element.addEventListener('click', () => openFlowStepFromProgress(element.dataset.flowStep));
            element.addEventListener('keydown', (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openFlowStepFromProgress(element.dataset.flowStep);
              }
            });
          });
          document.getElementById('openSavePresetModalBtn').addEventListener('click', openSavePresetModal);
          document.getElementById('savePresetName').addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              saveCurrentPlanAsPreset();
            }
          });
          renderPresetPreview(presetSelect.value);

          document.getElementById('createCampaignForm').addEventListener('submit', async (event) => {
            event.preventDefault();
            setPrimaryButtonBusy('createCampaignNext', true, 'Creating...', 'Next');
            try {
              syncCampaignPlanFromTable();
              let presetId = presetSelect.value;
              let shouldSendPlanOverrides = true;

              if (markerDrivenPreset && presetId === markerDrivenPreset.id) {
                const createdPreset = await request(
                  '/campaign-presets',
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: markerDrivenPreset.name,
                      description: markerDrivenPreset.description,
                      sourceLanguage: 'en',
                      sourceType: 'marker_plan',
                      isActive: true,
                      publications: campaignPlan.map((publication, index) => ({
                        dayOffset: Number(publication.dayOffset || '0'),
                        localTime: publication.localTime,
                        channel: publication.channel,
                        language: publication.language,
                        publicationType: publication.publicationType,
                        style: publication.style,
                        position: index + 1,
                      })),
                    }),
                  },
                  { renderResponse: false },
                );
                presetId = createdPreset.id;
                shouldSendPlanOverrides = false;
              }

              const payload = {
                presetId,
                name: document.getElementById('campaignName').value,
                startDate: buildMoscowIsoFromDateAndTime(
                  document.getElementById('startDate').value,
                  '00:00',
                ),
                extraInstructions: null,
              };
              if (shouldSendPlanOverrides) {
                payload.plannedPublicationOverrides = campaignPlan.map((publication) => ({
                  presetPublicationId: publication.presetPublicationId,
                  dayOffset: publication.dayOffset,
                  localTime: publication.localTime,
                  channel: publication.channel,
                  language: publication.language,
                  publicationType: publication.publicationType,
                  style: publication.style,
                }));
              }

              const created = await request(
                '/projects/' + encodeURIComponent(projectId) + '/campaigns',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                },
              );

              createdCampaignId = created.campaignId;
              currentCampaign = await request(
                '/campaigns/' + encodeURIComponent(createdCampaignId),
                undefined,
                { renderResponse: false },
              );
              updateCampaignCreationInboxLink(currentCampaign);

              if (markerId) {
                try {
                  await request(
                    '/projects/' + encodeURIComponent(projectId) + '/markers/' + encodeURIComponent(markerId),
                    { method: 'DELETE' },
                    { renderResponse: false },
                  );
                } catch (cleanupError) {
                  setOutput({
                    warning: 'Campaign was created, but selected plan cleanup failed.',
                    cleanupError: String(cleanupError),
                  });
                }
              }

              markFlowStepDone('general');
              window.history.replaceState(
                null,
                '',
                '/test-ui/campaigns/new?projectId=' + encodeURIComponent(projectId) +
                  '&campaignId=' + encodeURIComponent(createdCampaignId),
              );
              goToFlowStep('longread');
              document.getElementById('sourceContent').focus();
              setOutput({ created, campaign: currentCampaign });
            } catch (error) {
              setOutput(String(error));
            } finally {
              setPrimaryButtonBusy('createCampaignNext', false, 'Creating...', 'Next');
            }
          });

          document.getElementById('longreadForm').addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!createdCampaignId) {
              setOutput('Create campaign first.');
              return;
            }

            const sourceContent = document.getElementById('sourceContent').value.trim();
            if (!sourceContent) {
              setOutput('Longread is empty.');
              return;
            }

            setPrimaryButtonBusy('longreadNext', true, 'Starting AI...', 'Next');
            try {
              await request(
                '/campaigns/' + encodeURIComponent(createdCampaignId) + '/source',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    content: sourceContent,
                    language: getSelectedSourceLanguage(),
                  }),
                },
                { renderResponse: false },
              );
              currentCampaign = await request(
                '/campaigns/' + encodeURIComponent(createdCampaignId),
                undefined,
                { renderResponse: false },
              );
              await syncSourceContentFromCampaign(currentCampaign);
              markFlowStepDone('longread');
              goToFlowStep('ai');
              await loadCampaignFlow();
              startFlowPolling();
            } catch (error) {
              setOutput(String(error));
            } finally {
              setPrimaryButtonBusy('longreadNext', false, 'Starting AI...', 'Next');
            }
          });

          document.getElementById('closeDonePublicationEditor').addEventListener('click', () => {
            closeDonePublicationEditor();
          });
          document.getElementById('donePublicationEditor').addEventListener('submit', saveDonePublicationChanges);

          if (createdCampaignId) {
            currentCampaign = await request(
              '/campaigns/' + encodeURIComponent(createdCampaignId),
              undefined,
              { renderResponse: false },
            );
            updateCampaignCreationInboxLink(currentCampaign);
            markFlowStepDone('general');
            if (currentCampaign.sourceArticleId) {
              await syncSourceContentFromCampaign(currentCampaign);
              markFlowStepDone('longread');
              goToFlowStep('ai');
              await loadCampaignFlow();
              startFlowPolling();
            } else {
              goToFlowStep('longread');
            }
          } else {
            goToFlowStep('general');
          }

          setOutput({ project, presets });
        }

        boot().catch((error) => setOutput(String(error)));
      `,
    });
  }

  @Get('campaign-presets')
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderCampaignPresetManagementPage(@Query('projectId') projectId = ''): string {
    return renderCampaignUiPage({
      title: 'Marketing Service - Preset Library',
      eyebrow: 'Preset Library',
      heading: 'Preset Library',
      summary:
        'Create new presets, edit existing ones, and manage the publication plan template used during campaign creation.',
      showHero: false,
      body: `
        <section class="panel stack">
          <div class="nav-row">
            <div class="actions">
              <a class="btn" href="/test-ui/project?projectId=${escapeHtml(projectId)}">Back to dashboard</a>
            </div>
            <div class="tabs">
              <a href="/test-ui/brand-memory?projectId=${escapeHtml(projectId)}">Brand Memory</a>
              <a href="/test-ui/prompt-management?projectId=${escapeHtml(projectId)}">Prompt Management</a>
              <a class="active" href="/test-ui/campaign-presets?projectId=${escapeHtml(projectId)}">Preset Library</a>
            </div>
          </div>
        </section>

        <div class="detail-grid">
          <section class="panel stack">
            <div class="section-copy">
              <span class="eyebrow">Library</span>
              <h2 id="presetLibraryTitle">Campaign presets</h2>
              <p id="presetLibrarySummary">Loading presets…</p>
            </div>
            <div id="presetCards" class="card-grid"></div>
          </section>

          <section class="form-card stack">
            <div class="section-copy">
              <span class="eyebrow">Editor</span>
              <h2 id="editorTitle">New preset</h2>
              <p id="editorSummary">Define the source profile and the publication plan template.</p>
            </div>
            <div class="actions">
              <button type="button" class="primary" id="newPresetBtn">New preset</button>
            </div>
            <form id="presetForm" class="stack">
              <div class="form-grid">
                <label class="field">
                  Name
                  <input id="presetNameInput" type="text" placeholder="Market insight burst" required />
                </label>
                <label class="field">
                  Source language
                  <select id="presetSourceLanguageInput" required>
                    <option value="RU">RU</option>
                    <option value="EN" selected>EN</option>
                    <option value="ES">ES</option>
                  </select>
                </label>
                <label class="field full">
                  Description
                  <textarea id="presetDescriptionInput" placeholder="Describe how this preset should be used."></textarea>
                </label>
              </div>

              <div class="section-copy">
                <span class="eyebrow">Publications</span>
                <h3>Template plan</h3>
                <p>These rows will be materialized when a campaign is created from this preset.</p>
              </div>

              <div class="table-wrap">
                <table class="table-editor">
                  <thead>
                    <tr>
                      <th>Position</th>
                      <th>Day</th>
                      <th>Time</th>
                      <th>Channel</th>
                      <th>Language</th>
                      <th>Type</th>
                      <th>Style</th>
                      <th>Row</th>
                    </tr>
                  </thead>
                  <tbody id="presetEditorRows"></tbody>
                </table>
              </div>

              <div class="actions">
                <button type="button" id="addPresetRowBtn">Add publication</button>
                <button type="submit" class="primary">Save preset</button>
              </div>
              <div id="presetSaveStatus" class="inline-note"></div>
            </form>
          </section>
        </div>
      `,
      script: `
        const projectId = ${JSON.stringify(projectId)};
        let project = null;
        let presets = [];
        let selectedPresetId = null;
        let editorRows = [];
        let customPublicationCounter = 0;
        const channelOptions = [
          ['channel_telegram', 'Telegram'],
          ['channel_x', 'X'],
          ['channel_discord', 'Discord'],
          ['channel_blog', 'Blog'],
        ];
        const languageOptions = ['RU', 'EN', 'ES'];
        const publicationTypeOptionsByChannel = ${renderPublicationTypeOptionsByChannel()} || {};
        const defaultPublicationTypeOptions = [{ value: 'default', label: 'Default' }];

        function buildChannelSelectOptions(selectedValue) {
          return channelOptions
            .map(([value, label]) =>
              '<option value="' + escapeHtml(value) + '"' +
              (value === selectedValue ? ' selected' : '') +
              '>' + escapeHtml(label) + '</option>'
            )
            .join('');
        }

        function normalizePublicationLanguage(value) {
          const normalizedValue = String(value || 'EN').toUpperCase();
          return languageOptions.includes(normalizedValue) ? normalizedValue : 'EN';
        }

        function buildLanguageSelectOptions(selectedValue) {
          const normalizedValue = normalizePublicationLanguage(selectedValue);
          return languageOptions
            .map((language) =>
              '<option value="' + escapeHtml(language) + '"' +
              (language === normalizedValue ? ' selected' : '') +
              '>' + escapeHtml(language) + '</option>'
            )
            .join('');
        }

        function getPublicationTypeOptions(channel) {
          return publicationTypeOptionsByChannel[channel] ||
            publicationTypeOptionsByChannel.channel_telegram ||
            defaultPublicationTypeOptions;
        }

        function normalizePublicationTypeValue(channel, selectedValue) {
          const options = getPublicationTypeOptions(channel);
          const matched = options.find((option) => option.value === selectedValue);
          return matched ? matched.value : (options[0]?.value || 'default');
        }

        function buildPublicationTypeSelectOptions(channel, selectedValue) {
          const normalizedValue = normalizePublicationTypeValue(channel, selectedValue);
          return getPublicationTypeOptions(channel)
            .map((option) =>
              '<option value="' + escapeHtml(option.value) + '"' +
              (option.value === normalizedValue ? ' selected' : '') +
              '>' + escapeHtml(option.label) + '</option>'
            )
            .join('');
        }

        function createEmptyRow() {
          customPublicationCounter += 1;
          return {
            rowKey: 'new-' + customPublicationCounter,
            position: editorRows.length + 1,
            dayOffset: '0',
            localTime: '09:00',
            channel: 'channel_telegram',
            language: 'EN',
            publicationType: normalizePublicationTypeValue('channel_telegram', null),
            style: 'default',
          };
        }

        function createBlankPresetState() {
          selectedPresetId = null;
          customPublicationCounter = 0;
          editorRows = [createEmptyRow()];
          document.getElementById('editorTitle').textContent = 'New preset';
          document.getElementById('editorSummary').textContent =
            'Define the source profile and the publication plan template.';
          document.getElementById('presetNameInput').value = '';
          document.getElementById('presetSourceLanguageInput').value = 'EN';
          document.getElementById('presetDescriptionInput').value = '';
          renderEditorRows();
        }

        function selectPreset(presetId) {
          const preset = presets.find((item) => item.id === presetId) || null;
          if (!preset) {
            createBlankPresetState();
            return;
          }

          selectedPresetId = preset.id;
          customPublicationCounter = 0;
          editorRows = (preset.publications || [])
            .slice()
            .sort((left, right) => left.position - right.position)
            .map((publication) => ({
              rowKey: publication.id,
              position: publication.position,
              dayOffset: String(publication.dayOffset),
              localTime: publication.localTime,
              channel: publication.channel,
              language: normalizePublicationLanguage(publication.language),
              publicationType: normalizePublicationTypeValue(
                publication.channel,
                publication.publicationType,
              ),
              style: publication.style,
            }));

          document.getElementById('editorTitle').textContent = preset.name;
          document.getElementById('editorSummary').textContent =
            (preset.isSystem ? 'System preset' : 'Custom preset') + ' · updated ' + formatDateTime(preset.updatedAt);
          document.getElementById('presetNameInput').value = preset.name;
          document.getElementById('presetSourceLanguageInput').value = String(preset.sourceLanguage || '').toUpperCase();
          document.getElementById('presetDescriptionInput').value = preset.description;
          renderEditorRows();
        }

        function renderPresetCards() {
          const root = document.getElementById('presetCards');
          if (!Array.isArray(presets) || presets.length === 0) {
            root.innerHTML = '<div class="empty-state">No presets yet. Create the first one.</div>';
            return;
          }

          root.innerHTML = presets.map((preset) =>
            '<article class="card">' +
              '<div class="card-head">' +
                '<div class="stack">' +
                  '<span class="eyebrow">' + escapeHtml(preset.isSystem ? 'System' : 'Custom') + '</span>' +
                  '<h3>' + escapeHtml(preset.name) + '</h3>' +
                '</div>' +
                renderBadge(preset.isActive ? 'approved_for_publishing' : 'needs_attention') +
              '</div>' +
              '<p>' + escapeHtml(preset.description) + '</p>' +
              '<div class="kv">' +
                '<div class="meta-item"><label>Source language</label><strong>' + escapeHtml(String(preset.sourceLanguage || '').toUpperCase()) + '</strong></div>' +
                '<div class="meta-item"><label>Rows</label><strong>' + escapeHtml(String((preset.publications || []).length)) + '</strong></div>' +
              '</div>' +
              '<div class="actions"><button type="button" data-select-preset="' + escapeHtml(preset.id) + '">Edit preset</button></div>' +
            '</article>'
          ).join('');

          document.querySelectorAll('[data-select-preset]').forEach((element) => {
            element.addEventListener('click', () => selectPreset(element.dataset.selectPreset));
          });
        }

        function syncEditorRowsFromTable() {
          editorRows = Array.from(document.querySelectorAll('#presetEditorRows tr[data-row-key]'))
            .map((row) => ({
              rowKey: row.dataset.rowKey,
              position: Number(row.dataset.position || '0'),
              dayOffset: row.querySelector('[data-field="dayOffset"]').value,
              localTime: row.querySelector('[data-field="localTime"]').value,
              channel: row.querySelector('[data-field="channel"]').value,
              language: normalizePublicationLanguage(row.querySelector('[data-field="language"]').value),
              publicationType: normalizePublicationTypeValue(
                row.querySelector('[data-field="channel"]').value,
                row.querySelector('[data-field="publicationType"]').value,
              ),
              style: row.querySelector('[data-field="style"]').value,
            }));
        }

        function removeEditorRow(rowKey) {
          editorRows = editorRows
            .filter((publication) => publication.rowKey !== rowKey)
            .map((publication, index) => ({
              ...publication,
              position: index + 1,
            }));
          renderEditorRows();
        }

        function renderEditorRows() {
          const root = document.getElementById('presetEditorRows');
          root.innerHTML = editorRows
            .map((publication) => (
              '<tr data-row-key="' + escapeHtml(publication.rowKey) + '" data-position="' + escapeHtml(String(publication.position)) + '">' +
                '<td>' + escapeHtml(String(publication.position)) + '</td>' +
                '<td><input data-field="dayOffset" type="number" step="1" value="' + escapeHtml(String(publication.dayOffset)) + '" /></td>' +
                '<td><input data-field="localTime" type="time" value="' + escapeHtml(publication.localTime) + '" /></td>' +
                '<td><select data-field="channel">' + buildChannelSelectOptions(publication.channel) + '</select></td>' +
                '<td><select data-field="language">' + buildLanguageSelectOptions(publication.language) + '</select></td>' +
                '<td><select data-field="publicationType">' + buildPublicationTypeSelectOptions(publication.channel, publication.publicationType) + '</select></td>' +
                '<td><input data-field="style" type="text" maxlength="64" value="' + escapeHtml(publication.style) + '" /></td>' +
                '<td><button type="button" class="btn danger" data-remove-preset-row="' + escapeHtml(publication.rowKey) + '">Remove</button></td>' +
              '</tr>'
            ))
            .join('');

          document.querySelectorAll('#presetEditorRows input, #presetEditorRows select').forEach((element) => {
            const syncAndMaybeRerender = () => {
              syncEditorRowsFromTable();
              if (element.dataset.field === 'channel') {
                renderEditorRows();
              }
            };
            element.addEventListener('input', syncAndMaybeRerender);
            element.addEventListener('change', syncAndMaybeRerender);
          });

          document.querySelectorAll('[data-remove-preset-row]').forEach((element) => {
            element.addEventListener('click', () => removeEditorRow(element.dataset.removePresetRow));
          });

          syncEditorRowsFromTable();
        }

        function buildPayload() {
          syncEditorRowsFromTable();
          return {
            name: document.getElementById('presetNameInput').value,
            description: document.getElementById('presetDescriptionInput').value,
            sourceLanguage: normalizePublicationLanguage(
              document.getElementById('presetSourceLanguageInput').value,
            ),
            sourceType: 'custom_preset',
            isActive: true,
            publications: editorRows.map((publication, index) => ({
              dayOffset: Number(publication.dayOffset || '0'),
              localTime: publication.localTime,
              channel: publication.channel,
              language: publication.language,
              publicationType: publication.publicationType,
              style: publication.style,
              position: index + 1,
            })),
          };
        }

        function setSaveStatus(message, tone) {
          const status = document.getElementById('presetSaveStatus');
          status.textContent = message || '';
          status.style.color = tone === 'error' ? 'var(--danger)' : 'var(--muted)';
        }

        async function refreshPresets(targetPresetId) {
          presets = await request('/campaign-presets?all=true', undefined, { renderResponse: false });
          document.getElementById('presetLibraryTitle').textContent =
            project ? project.name + ' · campaign presets' : 'Campaign presets';
          document.getElementById('presetLibrarySummary').textContent =
            String(presets.length) + ' presets available for campaign creation.';
          renderPresetCards();

          if (targetPresetId) {
            selectPreset(targetPresetId);
            return;
          }

          if (selectedPresetId) {
            selectPreset(selectedPresetId);
            return;
          }

          createBlankPresetState();
        }

        async function boot() {
          if (projectId) {
            project = await request('/projects/' + encodeURIComponent(projectId), undefined, { renderResponse: false });
          }

          document.getElementById('newPresetBtn').addEventListener('click', createBlankPresetState);
          document.getElementById('addPresetRowBtn').addEventListener('click', () => {
            editorRows = [
              ...editorRows,
              createEmptyRow(),
            ].map((publication, index) => ({
              ...publication,
              position: index + 1,
            }));
            renderEditorRows();
          });

          document.getElementById('presetForm').addEventListener('submit', async (event) => {
            event.preventDefault();
            setSaveStatus('Saving preset…');
            try {
              const payload = buildPayload();
              const result = await request(
                selectedPresetId
                  ? '/campaign-presets/' + encodeURIComponent(selectedPresetId)
                  : '/campaign-presets',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                },
              );
              selectedPresetId = result.id;
              await refreshPresets(result.id);
              setSaveStatus('Preset saved.');
            } catch (error) {
              setSaveStatus(error instanceof Error ? error.message : String(error), 'error');
              setOutput(error instanceof Error ? error.message : String(error));
            }
          });

          await refreshPresets(null);
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
      showHero: false,
      body: `
        <section class="panel stack">
          <div class="nav-row">
            <div class="actions">
              <a class="btn" href="/test-ui/project?projectId=${escapeHtml(projectId)}">Back to dashboard</a>
            </div>
            <div class="tabs">
              <a class="active" href="/test-ui/brand-memory?projectId=${escapeHtml(projectId)}">Brand Memory</a>
              <a href="/test-ui/prompt-management?projectId=${escapeHtml(projectId)}">Prompt Management</a>
              <a href="/test-ui/campaign-presets?projectId=${escapeHtml(projectId)}">Preset Library</a>
            </div>
          </div>
        </section>

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
            </div>
          </form>
        </section>
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

  @Get('prompt-management')
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderPromptManagementPage(@Query('projectId') projectId = ''): string {
    return renderCampaignUiPage({
      title: 'Marketing Service - Prompt Management',
      eyebrow: 'Prompt Management',
      heading: 'Prompt Management',
      summary:
        'Control the project-level adaptation prompt rules that are applied during Stage 1 and carried into later reviews and translations.',
      showHero: false,
      body: `
        <section class="panel stack">
          <div class="nav-row">
            <div class="actions">
              <a class="btn" href="/test-ui/project?projectId=${escapeHtml(projectId)}">Back to dashboard</a>
            </div>
            <div class="tabs">
              <a href="/test-ui/brand-memory?projectId=${escapeHtml(projectId)}">Brand Memory</a>
              <a class="active" href="/test-ui/prompt-management?projectId=${escapeHtml(projectId)}">Prompt Management</a>
              <a href="/test-ui/campaign-presets?projectId=${escapeHtml(projectId)}">Preset Library</a>
            </div>
          </div>
        </section>

        <section class="form-card stack">
          <div class="section-copy">
            <span class="eyebrow">Project</span>
            <h2 id="projectName">Loading project</h2>
            <p id="updatedAt">Last update —</p>
          </div>
          <form id="promptManagementForm" class="stack">
            <div class="field full stack" style="gap:12px;">
              <div class="section-copy" style="gap:6px;">
                <label style="margin:0;">Adaptation prompt rules</label>
                <p style="margin:0;">These rules are appended to Stage 1 adaptation prompts and then flow into quality checks and Stage 2 translations.</p>
              </div>
              <label class="field full">
                General adaptation rules
                <textarea id="adaptationRulesGeneral" placeholder="Project-wide instructions for all channel adaptations."></textarea>
              </label>
              <div class="form-grid">
                <label class="field">
                  Telegram rules
                  <textarea id="adaptationRulesTelegram" placeholder="Telegram-specific adaptation rules."></textarea>
                </label>
                <label class="field">
                  X rules
                  <textarea id="adaptationRulesX" placeholder="X-specific adaptation rules."></textarea>
                </label>
                <label class="field">
                  Discord rules
                  <textarea id="adaptationRulesDiscord" placeholder="Discord-specific adaptation rules."></textarea>
                </label>
                <label class="field">
                  Blog rules
                  <textarea id="adaptationRulesBlog" placeholder="Blog-specific adaptation rules."></textarea>
                </label>
              </div>
            </div>
            <div class="actions">
              <button class="primary" type="submit">Save Prompt Rules</button>
            </div>
          </form>
        </section>
      `,
      script: `
        const projectId = ${JSON.stringify(projectId)};
        const defaultAdaptationRulesByChannel = ${renderDefaultAdaptationRulesByChannel()} || {};

        function fillPromptRules(brandMemory) {
          const adaptationPromptRules = brandMemory.adaptationPromptRules || {};
          document.getElementById('adaptationRulesGeneral').value =
            adaptationPromptRules.generalInstructions || '';
          document.getElementById('adaptationRulesTelegram').value =
            adaptationPromptRules.telegram || defaultAdaptationRulesByChannel.channel_telegram || '';
          document.getElementById('adaptationRulesX').value =
            adaptationPromptRules.x || defaultAdaptationRulesByChannel.channel_x || '';
          document.getElementById('adaptationRulesDiscord').value =
            adaptationPromptRules.discord || defaultAdaptationRulesByChannel.channel_discord || '';
          document.getElementById('adaptationRulesBlog').value =
            adaptationPromptRules.blog || defaultAdaptationRulesByChannel.channel_blog || '';
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
          fillPromptRules(memoryPayload.brandMemory);
          setOutput({ project, promptRules: memoryPayload.brandMemory?.adaptationPromptRules || {} });
        }

        function buildPayload() {
          return {
            adaptationPromptRules: {
              generalInstructions:
                document.getElementById('adaptationRulesGeneral').value || null,
              telegram:
                document.getElementById('adaptationRulesTelegram').value || null,
              x:
                document.getElementById('adaptationRulesX').value || null,
              discord:
                document.getElementById('adaptationRulesDiscord').value || null,
              blog:
                document.getElementById('adaptationRulesBlog').value || null,
            },
          };
        }

        document.addEventListener('DOMContentLoaded', () => {
          document.getElementById('promptManagementForm').addEventListener('submit', async (event) => {
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
            <div class="actions" id="campaignBacklinks"></div>
            <div class="tabs" id="campaignTabs"></div>
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

      `,
      script: `
        const campaignId = ${JSON.stringify(campaignId)};

        function renderCampaignTabs(campaign, projectId) {
          const root = document.getElementById('campaignTabs');
          root.innerHTML = [
            '<a class="active" href="/test-ui/campaign?campaignId=' + encodeURIComponent(campaign.id) + '">Detail</a>',
            '<a href="/test-ui/campaign-production?campaignId=' + encodeURIComponent(campaign.id) + '">Production</a>',
            '<a href="/test-ui/campaign-inbox?campaignId=' + encodeURIComponent(campaign.id) + '">Inbox</a>',
            '<a href="/test-ui/campaign-execution-history?campaignId=' + encodeURIComponent(campaign.id) + '">Execution history</a>',
            '<a href="/test-ui/campaign-publishing?campaignId=' + encodeURIComponent(campaign.id) + '">Publishing</a>',
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
              <h2>Stage status</h2>
              <p>The flow advances automatically after source attach. Inbox items pause it until they are resolved.</p>
            </div>
            <div class="stepper">
              <div class="step-item">
                <button id="startProductionBtn" class="primary stage-button" type="button">1. Start source check</button>
              </div>
              <div class="step-arrow" aria-hidden="true">↓</div>
              <div class="step-item">
                <button id="runStage1Btn" type="button">2. Run Stage 1 adaptations</button>
              </div>
              <div id="stage2StepArrow" class="step-arrow" aria-hidden="true">↓</div>
              <div id="stage2Step" class="step-item">
                <button id="runStage2Btn" type="button">3. Run Stage 2 translations</button>
              </div>
              <div id="approveStepArrow" class="step-arrow" aria-hidden="true">↓</div>
              <div class="step-item">
                <button id="approveForPublishingBtn" type="button">4. Approve for publishing</button>
              </div>
            </div>
            <div id="productionChecklist" class="checklist"></div>
          </section>
        </div>

        <section class="panel stack">
          <div class="section-copy">
            <span class="eyebrow">Readiness</span>
            <h2>Publishing approval readiness</h2>
            <p>Use these checks to see whether this campaign can already be approved for publishing.</p>
          </div>
          <div id="approvalChecklist" class="checklist"></div>
          <div class="actions">
            <a id="publishingLink" class="btn" href="#">Open publishing status</a>
          </div>
        </section>

      `,
      script: `
        const campaignId = ${JSON.stringify(campaignId)};
        let currentCampaign = null;
        let refreshTimer = null;

        function renderCampaignTabs(campaign) {
          document.getElementById('campaignTabs').innerHTML = [
            '<a href="/test-ui/campaign?campaignId=' + encodeURIComponent(campaign.id) + '">Detail</a>',
            '<a class="active" href="/test-ui/campaign-production?campaignId=' + encodeURIComponent(campaign.id) + '">Production</a>',
            '<a href="/test-ui/campaign-inbox?campaignId=' + encodeURIComponent(campaign.id) + '">Inbox</a>',
            '<a href="/test-ui/campaign-execution-history?campaignId=' + encodeURIComponent(campaign.id) + '">Execution history</a>',
            '<a href="/test-ui/campaign-publishing?campaignId=' + encodeURIComponent(campaign.id) + '">Publishing</a>',
          ].join('');
          document.getElementById('campaignBacklinks').innerHTML =
            '<a class="btn" href="/test-ui/campaigns?projectId=' + encodeURIComponent(campaign.projectId) + '">Back to campaigns</a>';
        }

        function getLatestWorkflowRunByStep(campaign, step) {
          return [...(campaign.workflowRuns || [])]
            .filter((run) => run.currentStep === step)
            .sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime())[0] || null;
        }

        function getSourceCheckVisualState(campaign, activeWorkflowRun) {
          if (activeWorkflowRun && activeWorkflowRun.currentStep === 'source_check') {
            return {
              label: '1. Source check in progress',
              className: 'stage-button is-running',
              title: 'Source check is currently running.',
            };
          }

          const latestSourceCheckRun = getLatestWorkflowRunByStep(campaign, 'source_check');
          if (!latestSourceCheckRun) {
            return {
              label: '1. Start source check',
              className: 'primary stage-button',
              title: '',
            };
          }

          if (latestSourceCheckRun.status === 'completed') {
            return {
              label: '1. Source check passed',
              className: 'stage-button is-success',
              title: 'Source check completed successfully.',
            };
          }

          const errorMessage = String(latestSourceCheckRun.errorMessage || '').toLowerCase();
          if (errorMessage.includes('review')) {
            return {
              label: '1. Source check needs review',
              className: 'stage-button is-warning',
              title: 'Source check requires review before Stage 1.',
            };
          }

          if (errorMessage.includes('blocked')) {
            return {
              label: '1. Source check blocked',
              className: 'stage-button is-danger',
              title: 'Source check blocked this campaign.',
            };
          }

          return {
            label: '1. Source check failed',
            className: 'stage-button is-danger',
            title: latestSourceCheckRun.errorMessage || 'Source check failed.',
          };
        }

        function getStage1VisualState(campaign, activeWorkflowRun) {
          if (activeWorkflowRun && activeWorkflowRun.currentStep === 'stage_1_adaptation') {
            return {
              label: '2. Stage 1 in progress',
              className: 'stage-button is-running',
              title: 'Stage 1 adaptations are currently running.',
            };
          }

          const latestStage1Run = getLatestWorkflowRunByStep(campaign, 'stage_1_adaptation');
          if (!latestStage1Run) {
            return {
              label: '2. Run Stage 1 adaptations',
              className: 'stage-button',
              title: '',
            };
          }

          if (latestStage1Run.status === 'completed') {
            return {
              label: '2. Stage 1 completed',
              className: 'stage-button is-success',
              title: 'Stage 1 adaptations completed successfully.',
            };
          }

          const hasStage1FailedItems = (campaign.plannedPublications || []).some(
            (item) => item.status === 'stage_1_failed',
          );

          if (hasStage1FailedItems || campaign.pendingApprovalCount > 0) {
            return {
              label: '2. Stage 1 needs review',
              className: 'stage-button is-warning',
              title: 'Stage 1 created issues that need review.',
            };
          }

          return {
            label: '2. Stage 1 failed',
            className: 'stage-button is-danger',
            title: latestStage1Run.errorMessage || 'Stage 1 failed.',
          };
        }

        function getStage2VisualState(campaign, activeWorkflowRun) {
          if (activeWorkflowRun && activeWorkflowRun.currentStep === 'stage_2_translation') {
            return {
              label: '3. Stage 2 in progress',
              className: 'stage-button is-running',
              title: 'Stage 2 translations are currently running.',
            };
          }

          const latestStage2Run = getLatestWorkflowRunByStep(campaign, 'stage_2_translation');
          if (!latestStage2Run) {
            return {
              label: '3. Run Stage 2 translations',
              className: 'stage-button',
              title: '',
            };
          }

          if (latestStage2Run.status === 'completed') {
            return {
              label: '3. Stage 2 completed',
              className: 'stage-button is-success',
              title: 'Stage 2 translations completed successfully.',
            };
          }

          const hasStage2FailedItems = (campaign.plannedPublications || []).some(
            (item) => item.status === 'stage_2_failed',
          );

          if (hasStage2FailedItems || campaign.pendingApprovalCount > 0) {
            return {
              label: '3. Stage 2 needs review',
              className: 'stage-button is-warning',
              title: 'Stage 2 created issues that need review.',
            };
          }

          return {
            label: '3. Stage 2 failed',
            className: 'stage-button is-danger',
            title: latestStage2Run.errorMessage || 'Stage 2 failed.',
          };
        }

        function renderChecklist(campaign, overview) {
          const planned = campaign.plannedPublications || [];
          const stage1Queue = planned.filter((item) => ['pending', 'adapting', 'stage_1_failed', 'source_blocked'].includes(item.status)).length;
          const stage2Queue = planned.filter((item) => ['translating', 'stage_2_failed'].includes(item.status)).length;
          const activeWorkflowRun = (campaign.workflowRuns || []).find((run) => run.status === 'running') || null;
          const stage1RunnableCount = planned.filter((item) => item.status === 'pending').length;
          const stage2RunnableCount = planned.filter((item) => item.status === 'translating').length;
          const hasTranslationTargets = planned.some((item) => item.language !== campaign.sourceLanguage);
          const hasSourceBlocked = planned.some((item) => item.status === 'source_blocked');
          const allReadyForApproval = planned.every((item) =>
            ['ready', 'publication_scheduled', 'exported', 'published'].includes(item.status),
          );
          const alreadyApproved = Boolean(campaign.finalApprovedAt) || ['approved_for_publishing', 'publishing', 'completed'].includes(campaign.status);
          const sourceReadyForStage1 =
            Boolean(campaign.sourceArticleId) &&
            !['draft', 'source_checking', 'source_needs_review'].includes(campaign.status) &&
            !hasSourceBlocked;
          const canStartSourceCheck = Boolean(campaign.sourceArticleId) && !activeWorkflowRun;
          const canRunStage1 = sourceReadyForStage1 && !activeWorkflowRun && stage1RunnableCount > 0;
          const canRunStage2 =
            sourceReadyForStage1 &&
            !activeWorkflowRun &&
            stage1RunnableCount === 0 &&
            stage2RunnableCount > 0;
          const canApproveForPublishing =
            !activeWorkflowRun &&
            campaign.pendingApprovalCount === 0 &&
            allReadyForApproval &&
            campaign.status === 'ready_for_final_approval';

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
            ? 'Replacing source is not supported yet. The automation will continue from the current stage.'
            : 'Paste the canonical source. Production starts automatically after attach.';

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

          const startProductionBtn = document.getElementById('startProductionBtn');
          const runStage1Btn = document.getElementById('runStage1Btn');
          const runStage2Btn = document.getElementById('runStage2Btn');
          const stage2Step = document.getElementById('stage2Step');
          const stage2StepArrow = document.getElementById('stage2StepArrow');
          const approveStepArrow = document.getElementById('approveStepArrow');
          const approveForPublishingBtn = document.getElementById('approveForPublishingBtn');
          const publishingLink = document.getElementById('publishingLink');
          const sourceCheckVisualState = getSourceCheckVisualState(campaign, activeWorkflowRun);
          const stage1VisualState = getStage1VisualState(campaign, activeWorkflowRun);
          const stage2VisualState = getStage2VisualState(campaign, activeWorkflowRun);
          const approveStepNumber = hasTranslationTargets ? 4 : 3;
          const sourceCheckCompleted = sourceCheckVisualState.className.includes('is-success');
          const stage1Completed = stage1VisualState.className.includes('is-success');
          const stage2Completed = stage2VisualState.className.includes('is-success');

          startProductionBtn.disabled = true;
          runStage1Btn.disabled = true;
          runStage2Btn.disabled = true;
          approveForPublishingBtn.disabled = true;

          startProductionBtn.className = sourceCheckVisualState.className;
          startProductionBtn.textContent = sourceCheckVisualState.label;
          runStage1Btn.className = stage1VisualState.className;
          runStage1Btn.textContent = stage1VisualState.label;
          runStage2Btn.className = stage2VisualState.className;
          runStage2Btn.textContent = stage2VisualState.label;
          approveForPublishingBtn.textContent = alreadyApproved
            ? approveStepNumber + '. Publishing already approved'
            : approveStepNumber + '. Approve for publishing';

          startProductionBtn.title = activeWorkflowRun && activeWorkflowRun.currentStep === 'source_check'
              ? sourceCheckVisualState.title
              : campaign.sourceArticleId
                ? 'Source check is automatic after source attach.'
                : 'Attach source to start source check automatically.';
          runStage1Btn.title = activeWorkflowRun
              ? stage1VisualState.title || 'Wait until the current workflow run finishes.'
              : hasSourceBlocked || campaign.status === 'source_needs_review'
                ? 'Resolve the source issue before Stage 1.'
                : stage1RunnableCount === 0
                  ? 'Stage 1 has no pending publications to process.'
                  : 'Stage 1 runs automatically after source check.';
          runStage2Btn.title = activeWorkflowRun
              ? stage2VisualState.title || 'Wait until the current workflow run finishes.'
              : !hasTranslationTargets
                ? ''
                : stage1RunnableCount > 0
                ? 'Stage 2 runs automatically after Stage 1.'
                : stage2RunnableCount === 0
                  ? 'Stage 2 has no translations waiting to run.'
                  : 'Stage 2 is still locked.';
          approveForPublishingBtn.title = alreadyApproved
              ? 'Publishing has already been approved for this campaign.'
              : activeWorkflowRun
                ? 'Wait until the current workflow run finishes.'
                : campaign.pendingApprovalCount > 0
                  ? 'Resolve pending inbox items before approving for publishing.'
                : !allReadyForApproval
                  ? 'Some planned publications are still in production or blocked.'
                    : 'Final approval runs automatically when the campaign is ready.';

          if (hasTranslationTargets) {
            stage2Step.style.display = '';
            stage2StepArrow.style.display = '';
            approveStepArrow.style.display = '';
            runStage2Btn.hidden = false;
            stage2Step.hidden = false;
            stage2StepArrow.hidden = false;
            approveStepArrow.hidden = false;
          } else {
            stage2Step.style.display = 'none';
            stage2StepArrow.style.display = '';
            approveStepArrow.style.display = 'none';
            stage2Step.hidden = true;
            stage2StepArrow.hidden = false;
            approveStepArrow.hidden = true;
          }

          publishingLink.href = '/test-ui/campaign-publishing?campaignId=' + encodeURIComponent(campaign.id);

          const approvalChecks = [
            {
              label: 'Pending inbox items',
              ok: campaign.pendingApprovalCount === 0,
              text: campaign.pendingApprovalCount === 0
                ? 'Inbox is clear.'
                : campaign.pendingApprovalCount + ' item(s) still need review.',
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
              ok: ['ready_for_final_approval', 'approved_for_publishing', 'publishing', 'completed'].includes(campaign.status),
              text: 'Current status: ' + campaign.status,
            },
            {
              label: 'Final approval state',
              ok: canApproveForPublishing || alreadyApproved,
              text: alreadyApproved
                ? 'Publishing approval has already been granted.'
                : canApproveForPublishing
                  ? 'Campaign can now be approved for publishing.'
                  : 'Campaign is not ready for publishing approval yet.',
            },
            {
              label: 'Publishing linkage',
              ok: true,
              text: 'Current overview counters: ' + JSON.stringify((overview && overview.metrics) || {}),
            },
          ];

          document.getElementById('approvalChecklist').innerHTML = approvalChecks.map((item) =>
            '<article class="check-item ' + (item.ok ? 'ok' : 'bad') + '">' +
              '<label>' + escapeHtml(item.label) + '</label>' +
              '<strong>' + escapeHtml(item.text) + '</strong>' +
            '</article>'
          ).join('');
        }

        function scheduleAutoRefresh(campaign) {
          if (refreshTimer) {
            clearTimeout(refreshTimer);
            refreshTimer = null;
          }

          const hasActiveWorkflowRun = (campaign.workflowRuns || []).some((run) => run.status === 'running');
          if (!hasActiveWorkflowRun) {
            return;
          }

          refreshTimer = setTimeout(() => {
            loadPage().catch((error) => setOutput(String(error)));
          }, 4000);
        }

        async function loadPage() {
          if (!campaignId) {
            document.getElementById('campaignStatus').textContent = 'Missing campaignId';
            return;
          }

          const [campaign, overview] = await Promise.all([
            request('/campaigns/' + encodeURIComponent(campaignId), undefined, { renderResponse: false }),
            request('/campaigns/' + encodeURIComponent(campaignId) + '/publishing-overview', undefined, { renderResponse: false }),
          ]);
          currentCampaign = campaign;
          renderCampaignTabs(currentCampaign);
          renderChecklist(currentCampaign, overview);
          scheduleAutoRefresh(currentCampaign);
          setOutput({ campaign: currentCampaign, overview });
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
        });

        loadPage().catch((error) => setOutput(String(error)));
      `,
    });
  }

  @Get('campaign-execution-history')
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderCampaignExecutionHistoryPage(@Query('campaignId') campaignId = ''): string {
    return renderCampaignUiPage({
      title: 'Marketing Service - Execution History',
      eyebrow: 'History',
      heading: 'Execution history',
      summary:
        'Full workflow run history for this campaign: source check, Stage 1 and Stage 2 attempts with timestamps and errors.',
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
            <span class="eyebrow">Workflow runs</span>
            <strong id="workflowCount">0</strong>
            <p>Total source and stage execution attempts.</p>
          </article>
          <article class="metric">
            <span class="eyebrow">Completed</span>
            <strong id="completedCount">0</strong>
            <p>Runs that reached a completed state.</p>
          </article>
          <article class="metric">
            <span class="eyebrow">Failed</span>
            <strong id="failedCount">0</strong>
            <p>Runs that ended with an error or blocking outcome.</p>
          </article>
        </section>

        <section class="panel stack">
          <div class="section-head">
            <div class="section-copy">
              <span class="eyebrow">Campaign</span>
              <h2 id="campaignName">Loading campaign</h2>
              <p id="campaignMeta">Loading workflow timeline…</p>
            </div>
            <div class="actions">
              <button onclick="loadPage()">Refresh</button>
            </div>
          </div>
          <div id="workflowRuns" class="workflow-list"></div>
        </section>
      `,
      script: `
        const campaignId = ${JSON.stringify(campaignId)};

        function renderCampaignTabs(campaign) {
          document.getElementById('campaignTabs').innerHTML = [
            '<a href="/test-ui/campaign?campaignId=' + encodeURIComponent(campaign.campaignId) + '">Detail</a>',
            '<a href="/test-ui/campaign-production?campaignId=' + encodeURIComponent(campaign.campaignId) + '">Production</a>',
            '<a href="/test-ui/campaign-inbox?campaignId=' + encodeURIComponent(campaign.campaignId) + '">Inbox</a>',
            '<a class="active" href="/test-ui/campaign-execution-history?campaignId=' + encodeURIComponent(campaign.campaignId) + '">Execution history</a>',
            '<a href="/test-ui/campaign-publishing?campaignId=' + encodeURIComponent(campaign.campaignId) + '">Publishing</a>',
          ].join('');
          document.getElementById('campaignBacklinks').innerHTML =
            '<a class="btn" href="/test-ui/campaigns?projectId=' + encodeURIComponent(campaign.projectId) + '">Back to campaigns</a>';
        }

        function attemptTone(result) {
          if (result === 'passed') {
            return 'ok';
          }
          if (result === 'warning') {
            return 'warn';
          }
          return 'bad';
        }

        function renderWorkflowRuns(campaign) {
          const runs = campaign.workflowRuns || [];
          const completedCount = runs.filter((run) => run.status === 'completed').length;
          const failedCount = runs.filter((run) => run.status === 'failed').length;

          document.getElementById('campaignName').textContent = campaign.campaignName;
          document.getElementById('campaignMeta').textContent =
            'Campaign status: ' + campaign.campaignStatus + ' · source ' + String(campaign.sourceLanguage || '').toUpperCase();
          document.getElementById('campaignStatus').textContent = toTitle(campaign.campaignStatus);
          document.getElementById('campaignBadge').innerHTML = renderBadge(campaign.campaignStatus);
          document.getElementById('workflowCount').textContent = String(runs.length);
          document.getElementById('completedCount').textContent = String(completedCount);
          document.getElementById('failedCount').textContent = String(failedCount);

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
              (run.attempts && run.attempts.length > 0
                ? '<div class="stack">' +
                    '<span class="eyebrow">Attempts</span>' +
                    '<div class="checklist">' +
                      run.attempts.map((attempt) => '<article class="check-item ' + attemptTone(attempt.result) + '">' +
                        '<div class="card-head">' +
                          '<strong>Attempt ' + escapeHtml(String(attempt.attemptNumber)) + '</strong>' +
                          renderBadge(attempt.result) +
                        '</div>' +
                        '<div class="pill-row">' +
                          (attempt.plannedPublicationLabel
                            ? '<span class="pill">' + escapeHtml(attempt.plannedPublicationLabel) + '</span>'
                            : '<span class="pill">Source validation</span>') +
                          '<span class="pill">Logged ' + escapeHtml(formatDateTime(attempt.createdAt)) + '</span>' +
                          '<span class="pill">Reasons ' + escapeHtml(String(attempt.reasonCount)) + '</span>' +
                        '</div>' +
                        '<p>' + escapeHtml(attempt.summary || 'No summary.') + '</p>' +
                      '</article>').join('') +
                    '</div>' +
                  '</div>'
                : '<p class="soft">No per-attempt quality logs were recorded for this run.</p>') +
            '</article>').join('');
        }

        async function loadPage() {
          if (!campaignId) {
            document.getElementById('campaignName').textContent = 'Missing campaignId';
            return;
          }

          const campaign = await request('/campaigns/' + encodeURIComponent(campaignId) + '/execution-history', undefined, { renderResponse: false });
          renderCampaignTabs(campaign);
          renderWorkflowRuns(campaign);
          setOutput(campaign);
        }

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
      showHero: false,
      body: `
        <section class="panel stack">
          <div class="nav-row campaign-creation-nav">
            <div class="actions">
              <a id="backToCampaignCreation" class="btn" href="#">&lt; Campaign creation</a>
            </div>
            <div class="nav-center-label">Approval inbox</div>
            <div></div>
          </div>
        </section>

        <section class="panel stack">
          <div class="section-head">
            <div class="section-copy">
              <h2 id="inboxTitle">Inbox</h2>
              <p id="inboxSummary">Loading messages that need a decision.</p>
            </div>
          </div>
          <div id="inboxItems" class="inbox-list"></div>
        </section>
      `,
      script: `
        const campaignId = ${JSON.stringify(campaignId)};
        let currentCampaign = null;
        let currentArticle = null;

        function normalizeOptionalFieldValue(value) {
          const normalized = String(value ?? '').trim();
          return normalized ? normalized : null;
        }

        function campaignCreationUrl(campaign) {
          return '/test-ui/campaigns/new?projectId=' + encodeURIComponent(campaign.projectId) +
            '&campaignId=' + encodeURIComponent(campaign.id);
        }

        function sourceIssueReasons(item) {
          const reasons = Array.isArray(item.details?.reasons) ? item.details.reasons : [];
          if (reasons.length === 0) {
            return [{
              message: item.details?.summary || item.title || 'AI found a source issue that needs a decision.',
              excerpt: null,
              suggestion: item.suggestedFix?.summary || null,
            }];
          }
          return reasons;
        }

        function renderSourceProblems(item) {
          return '<div class="source-problem-list">' +
            sourceIssueReasons(item).map((reason) =>
              '<article class="source-problem">' +
                '<strong>' + escapeHtml(reason.message || 'Source issue') + '</strong>' +
                (reason.excerpt ? '<blockquote>' + escapeHtml(reason.excerpt) + '</blockquote>' : '') +
                (reason.suggestion ? '<p>' + escapeHtml(reason.suggestion) + '</p>' : '') +
              '</article>'
            ).join('') +
          '</div>';
        }

        function isGeneratedArtifactIssue(item) {
          return item.type === 'adaptation_quality_exception' ||
            item.type === 'translation_fidelity_exception';
        }

        function getGeneratedArtifactLabels(item) {
          if (item.type === 'translation_fidelity_exception') {
            return {
              eyebrow: 'Step C · Translation generation',
              title: 'Translation needs review',
              editLabel: 'Corrected translation',
              emptyContent: 'No translation text is available for manual editing.',
            };
          }

          return {
            eyebrow: 'Step B · Adaptations generation',
            title: 'Adaptation needs review',
            editLabel: 'Corrected adaptation',
            emptyContent: 'No adaptation text is available for manual editing.',
          };
        }

        function sourceIssueCard(campaign, item, article) {
          const currentSource = article?.original?.content || '';
          const sourceLanguage = article?.original?.language || campaign.sourceLanguage || 'en';
          const summary = item.details?.summary || item.title || 'AI found a problem in the longread.';
          return '<article class="inbox-item source-review-card" data-source-issue-card="' + escapeHtml(item.id) + '">' +
            '<div class="section-copy">' +
              '<span class="eyebrow">Longread check</span>' +
              '<h2>AI needs your decision</h2>' +
              '<p class="source-review-summary">' + escapeHtml(summary) + '</p>' +
            '</div>' +
            renderSourceProblems(item) +
            '<div class="actions">' +
              '<button type="button" class="primary" data-open-source-edit="' + escapeHtml(item.id) + '">Change longread</button>' +
              '<button type="button" data-ignore-source-issue="' + escapeHtml(item.id) + '">Ignore</button>' +
            '</div>' +
            '<form class="stack source-edit-panel source-resolution-form" hidden data-campaign-id="' + escapeHtml(campaign.id) + '" data-approval-item-id="' + escapeHtml(item.id) + '" data-source-language="' + escapeHtml(sourceLanguage) + '">' +
              '<label class="field">' +
                'Corrected longread' +
                '<textarea name="content" required>' + escapeHtml(currentSource) + '</textarea>' +
              '</label>' +
              '<div class="actions">' +
                '<button class="primary" type="submit">Save and re-check</button>' +
                '<button type="button" data-close-source-edit="' + escapeHtml(item.id) + '">Cancel</button>' +
              '</div>' +
            '</form>' +
          '</article>';
        }

        function generatedArtifactIssueCard(campaign, item) {
          const labels = getGeneratedArtifactLabels(item);
          const currentContent = item.currentContent || '';
          const summary = item.details?.summary || item.title || 'AI found a problem that needs a decision.';
          return '<article class="inbox-item source-review-card" data-artifact-issue-card="' + escapeHtml(item.id) + '">' +
            '<div class="section-copy">' +
              '<span class="eyebrow">' + escapeHtml(labels.eyebrow) + '</span>' +
              '<h2>' + escapeHtml(labels.title) + '</h2>' +
              '<p class="source-review-summary">' + escapeHtml(summary) + '</p>' +
            '</div>' +
            renderSourceProblems(item) +
            '<div class="actions">' +
              '<button type="button" class="primary" data-fix-artifact-issue="' + escapeHtml(item.id) + '">Fix with AI</button>' +
              '<button type="button" data-open-artifact-edit="' + escapeHtml(item.id) + '">Edit manually</button>' +
              '<button type="button" data-ignore-artifact-issue="' + escapeHtml(item.id) + '">Ignore</button>' +
            '</div>' +
            '<form class="stack source-edit-panel artifact-resolution-form" hidden data-campaign-id="' + escapeHtml(campaign.id) + '" data-approval-item-id="' + escapeHtml(item.id) + '">' +
              '<label class="field">' +
                escapeHtml(labels.editLabel) +
                '<textarea name="content" required placeholder="' + escapeHtml(labels.emptyContent) + '">' + escapeHtml(currentContent) + '</textarea>' +
              '</label>' +
              '<div class="actions">' +
                '<button class="primary" type="submit">Save and continue</button>' +
                '<button type="button" data-close-artifact-edit="' + escapeHtml(item.id) + '">Cancel</button>' +
              '</div>' +
            '</form>' +
          '</article>';
        }

        function genericInboxCard(item) {
          return '<article class="inbox-item">' +
            '<div class="card-head">' +
              '<div class="stack">' +
                '<span class="eyebrow">' + escapeHtml(item.type) + '</span>' +
                '<h3>' + escapeHtml(item.title) + '</h3>' +
              '</div>' +
              renderBadge(item.severity) +
            '</div>' +
            '<p class="soft">This item is read-only for now. Technical payload is available in Dev output.</p>' +
          '</article>';
        }

        function renderInbox(campaign, inbox, article) {
          const items = inbox.items || [];
          const sourceIssueCount = items.filter((item) => item.type === 'source_issue').length;
          const otherIssueCount = items.length - sourceIssueCount;

          document.getElementById('backToCampaignCreation').href =
            campaignCreationUrl(campaign);
          document.getElementById('inboxTitle').textContent = campaign.name;
          document.getElementById('inboxSummary').textContent = items.length === 0
            ? 'No messages require a decision right now.'
            : items.length + ' message(s) require a decision. Source issues: ' +
              sourceIssueCount + '. Other exceptions: ' + otherIssueCount + '.';

          const root = document.getElementById('inboxItems');
          if (items.length === 0) {
            root.innerHTML = '<div class="empty-state">Inbox is empty.</div>';
            return;
          }

          root.innerHTML = items.map((item) =>
            item.type === 'source_issue'
              ? sourceIssueCard(campaign, item, article)
              : isGeneratedArtifactIssue(item)
                ? generatedArtifactIssueCard(campaign, item)
              : genericInboxCard(item)
          ).join('');

          root.querySelectorAll('[data-open-source-edit]').forEach((button) => {
            button.addEventListener('click', () => {
              const card = button.closest('[data-source-issue-card]');
              const panel = card?.querySelector('.source-edit-panel');
              if (panel) {
                panel.hidden = false;
                panel.querySelector('textarea')?.focus();
              }
            });
          });

          root.querySelectorAll('[data-close-source-edit]').forEach((button) => {
            button.addEventListener('click', () => {
              const card = button.closest('[data-source-issue-card]');
              const panel = card?.querySelector('.source-edit-panel');
              if (panel) {
                panel.hidden = true;
              }
            });
          });

          root.querySelectorAll('[data-ignore-source-issue]').forEach((button) => {
            button.addEventListener('click', () => submitIgnoreSourceIssue(button.dataset.ignoreSourceIssue));
          });

          root.querySelectorAll('[data-open-artifact-edit]').forEach((button) => {
            button.addEventListener('click', () => {
              const card = button.closest('[data-artifact-issue-card]');
              const panel = card?.querySelector('.source-edit-panel');
              if (panel) {
                panel.hidden = false;
                panel.querySelector('textarea')?.focus();
              }
            });
          });

          root.querySelectorAll('[data-close-artifact-edit]').forEach((button) => {
            button.addEventListener('click', () => {
              const card = button.closest('[data-artifact-issue-card]');
              const panel = card?.querySelector('.source-edit-panel');
              if (panel) {
                panel.hidden = true;
              }
            });
          });

          root.querySelectorAll('[data-fix-artifact-issue]').forEach((button) => {
            button.addEventListener('click', () => submitGeneratedArtifactIssue(button.dataset.fixArtifactIssue, 'fix_ai'));
          });

          root.querySelectorAll('[data-ignore-artifact-issue]').forEach((button) => {
            button.addEventListener('click', () => submitGeneratedArtifactIssue(button.dataset.ignoreArtifactIssue, 'ignore'));
          });

          root.querySelectorAll('.source-resolution-form').forEach((form) => {
            form.addEventListener('submit', submitEditedSource);
          });

          root.querySelectorAll('.artifact-resolution-form').forEach((form) => {
            form.addEventListener('submit', submitEditedGeneratedArtifact);
          });
        }

        async function postSourceIssueDecision(payload) {
          await request(
            '/campaigns/' + encodeURIComponent(campaignId) + '/source-issues/review',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            },
          );
          window.location.href = campaignCreationUrl(currentCampaign);
        }

        async function submitIgnoreSourceIssue(approvalItemId) {
          if (!approvalItemId || !currentCampaign) {
            return;
          }
          await postSourceIssueDecision({
            approvalItemId,
            action: 'ignore',
            note: 'Ignored from Approval inbox.',
          });
        }

        async function submitEditedSource(event) {
          event.preventDefault();
          const form = event.currentTarget;
          const approvalItemId = form.dataset.approvalItemId;
          const formData = new FormData(form);
          await postSourceIssueDecision({
            approvalItemId,
            action: 'manual_edit',
            content: normalizeOptionalFieldValue(formData.get('content')),
            language: form.dataset.sourceLanguage || currentCampaign?.sourceLanguage || 'en',
            note: 'Longread changed from Approval inbox.',
          });
          return false;
        }

        async function postGeneratedArtifactIssueDecision(payload) {
          await request(
            '/campaigns/' + encodeURIComponent(campaignId) + '/generated-artifact-issues/review',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            },
          );
          window.location.href = campaignCreationUrl(currentCampaign);
        }

        async function submitGeneratedArtifactIssue(approvalItemId, action) {
          if (!approvalItemId || !currentCampaign) {
            return;
          }
          await postGeneratedArtifactIssueDecision({
            approvalItemId,
            action,
            note: action === 'fix_ai'
              ? 'Requested AI fix from Approval inbox.'
              : 'Ignored from Approval inbox.',
          });
        }

        async function submitEditedGeneratedArtifact(event) {
          event.preventDefault();
          const form = event.currentTarget;
          const approvalItemId = form.dataset.approvalItemId;
          const formData = new FormData(form);
          await postGeneratedArtifactIssueDecision({
            approvalItemId,
            action: 'manual_edit',
            content: normalizeOptionalFieldValue(formData.get('content')),
            note: 'Manually edited from Approval inbox.',
          });
          return false;
        }

        async function loadPage() {
          if (!campaignId) {
            document.getElementById('inboxTitle').textContent = 'Missing campaignId';
            return;
          }

          const [campaign, inbox] = await Promise.all([
            request('/campaigns/' + encodeURIComponent(campaignId), undefined, { renderResponse: false }),
            request('/campaigns/' + encodeURIComponent(campaignId) + '/inbox', undefined, { renderResponse: false }),
          ]);
          currentCampaign = campaign;
          currentArticle = campaign.sourceArticleId
            ? await request('/articles/' + encodeURIComponent(campaign.sourceArticleId), undefined, { renderResponse: false })
            : null;

          renderInbox(campaign, inbox, currentArticle);
          setOutput({ campaign, inbox, article: currentArticle });
        }

        loadPage().catch((error) => setOutput(String(error)));
      `,
    });
  }

  @Get('project-inbox')
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderProjectInboxPage(@Query('projectId') projectId = ''): string {
    return renderCampaignUiPage({
      title: 'Marketing Service - Project Inbox',
      eyebrow: 'Inbox',
      heading: 'Project inbox',
      summary:
        'Shared inbox for all campaigns in this project. Items stay here until you make a decision, and resolved items disappear automatically.',
      showHero: false,
      body: `
        <section class="panel stack">
          <div class="nav-row campaign-creation-nav">
            <div class="actions">
              <a id="backToProjectDashboard" class="btn" href="#">&lt; Dashboard</a>
            </div>
            <div class="nav-center-label">Project inbox</div>
            <div></div>
          </div>
        </section>

        <section class="panel stack">
          <div class="section-head">
            <div class="section-copy">
              <h2 id="inboxTitle">Inbox</h2>
              <p id="inboxSummary">Loading messages that need a decision.</p>
            </div>
          </div>
          <div id="inboxItems" class="inbox-list"></div>
        </section>
      `,
      script: `
        const projectId = ${JSON.stringify(projectId)};
        let currentProject = null;
        let currentInbox = null;
        let currentArticlesById = new Map();

        function normalizeOptionalFieldValue(value) {
          const normalized = String(value ?? '').trim();
          return normalized ? normalized : null;
        }

        function campaignCreationUrl(item) {
          return '/test-ui/campaigns/new?projectId=' + encodeURIComponent(projectId) +
            '&campaignId=' + encodeURIComponent(item.campaignId);
        }

        function sourceIssueReasons(item) {
          const reasons = Array.isArray(item.details?.reasons) ? item.details.reasons : [];
          if (reasons.length === 0) {
            return [{
              message: item.details?.summary || item.title || 'AI found a source issue that needs a decision.',
              excerpt: null,
              suggestion: item.suggestedFix?.summary || null,
            }];
          }
          return reasons;
        }

        function renderSourceProblems(item) {
          return '<div class="source-problem-list">' +
            sourceIssueReasons(item).map((reason) =>
              '<article class="source-problem">' +
                '<strong>' + escapeHtml(reason.message || 'Source issue') + '</strong>' +
                (reason.excerpt ? '<blockquote>' + escapeHtml(reason.excerpt) + '</blockquote>' : '') +
                (reason.suggestion ? '<p>' + escapeHtml(reason.suggestion) + '</p>' : '') +
              '</article>'
            ).join('') +
          '</div>';
        }

        function isGeneratedArtifactIssue(item) {
          return item.type === 'adaptation_quality_exception' ||
            item.type === 'translation_fidelity_exception';
        }

        function getGeneratedArtifactLabels(item) {
          if (item.type === 'translation_fidelity_exception') {
            return {
              eyebrow: 'Step C · Translation generation',
              title: 'Translation needs review',
              editLabel: 'Corrected translation',
              emptyContent: 'No translation text is available for manual editing.',
            };
          }

          return {
            eyebrow: 'Step B · Adaptations generation',
            title: 'Adaptation needs review',
            editLabel: 'Corrected adaptation',
            emptyContent: 'No adaptation text is available for manual editing.',
          };
        }

        function campaignMetaPill(item) {
          return '<div class="actions">' +
            '<span class="pill">' + escapeHtml(item.campaignName) + '</span>' +
            renderBadge(item.campaignStatus) +
            '<a class="btn" href="' + campaignCreationUrl(item) + '">Open campaign</a>' +
          '</div>';
        }

        function sourceIssueCard(item) {
          const article = item.sourceArticleId ? currentArticlesById.get(item.sourceArticleId) : null;
          const currentSource = article?.original?.content || '';
          const sourceLanguage = article?.original?.language || 'en';
          const summary = item.details?.summary || item.title || 'AI found a problem in the longread.';
          return '<article class="inbox-item source-review-card" data-source-issue-card="' + escapeHtml(item.id) + '">' +
            '<div class="section-copy">' +
              '<span class="eyebrow">Longread check</span>' +
              '<h2>AI needs your decision</h2>' +
              '<p class="source-review-summary">' + escapeHtml(summary) + '</p>' +
            '</div>' +
            campaignMetaPill(item) +
            renderSourceProblems(item) +
            '<div class="actions">' +
              '<button type="button" class="primary" data-open-source-edit="' + escapeHtml(item.id) + '">Change longread</button>' +
              '<button type="button" data-ignore-source-issue="' + escapeHtml(item.id) + '">Ignore</button>' +
            '</div>' +
            '<form class="stack source-edit-panel source-resolution-form" hidden data-campaign-id="' + escapeHtml(item.campaignId) + '" data-approval-item-id="' + escapeHtml(item.id) + '" data-source-language="' + escapeHtml(sourceLanguage) + '">' +
              '<label class="field">' +
                'Corrected longread' +
                '<textarea name="content" required>' + escapeHtml(currentSource) + '</textarea>' +
              '</label>' +
              '<div class="actions">' +
                '<button class="primary" type="submit">Save and re-check</button>' +
                '<button type="button" data-close-source-edit="' + escapeHtml(item.id) + '">Cancel</button>' +
              '</div>' +
            '</form>' +
          '</article>';
        }

        function generatedArtifactIssueCard(item) {
          const labels = getGeneratedArtifactLabels(item);
          const currentContent = item.currentContent || '';
          const summary = item.details?.summary || item.title || 'AI found a problem that needs a decision.';
          return '<article class="inbox-item source-review-card" data-artifact-issue-card="' + escapeHtml(item.id) + '">' +
            '<div class="section-copy">' +
              '<span class="eyebrow">' + escapeHtml(labels.eyebrow) + '</span>' +
              '<h2>' + escapeHtml(labels.title) + '</h2>' +
              '<p class="source-review-summary">' + escapeHtml(summary) + '</p>' +
            '</div>' +
            campaignMetaPill(item) +
            renderSourceProblems(item) +
            '<div class="actions">' +
              '<button type="button" class="primary" data-fix-artifact-issue="' + escapeHtml(item.id) + '">Fix with AI</button>' +
              '<button type="button" data-open-artifact-edit="' + escapeHtml(item.id) + '">Edit manually</button>' +
              '<button type="button" data-ignore-artifact-issue="' + escapeHtml(item.id) + '">Ignore</button>' +
            '</div>' +
            '<form class="stack source-edit-panel artifact-resolution-form" hidden data-campaign-id="' + escapeHtml(item.campaignId) + '" data-approval-item-id="' + escapeHtml(item.id) + '">' +
              '<label class="field">' +
                escapeHtml(labels.editLabel) +
                '<textarea name="content" required placeholder="' + escapeHtml(labels.emptyContent) + '">' + escapeHtml(currentContent) + '</textarea>' +
              '</label>' +
              '<div class="actions">' +
                '<button class="primary" type="submit">Save and continue</button>' +
                '<button type="button" data-close-artifact-edit="' + escapeHtml(item.id) + '">Cancel</button>' +
              '</div>' +
            '</form>' +
          '</article>';
        }

        function genericInboxCard(item) {
          return '<article class="inbox-item">' +
            '<div class="card-head">' +
              '<div class="stack">' +
                '<span class="eyebrow">' + escapeHtml(item.type) + '</span>' +
                '<h3>' + escapeHtml(item.title) + '</h3>' +
              '</div>' +
              renderBadge(item.severity) +
            '</div>' +
            campaignMetaPill(item) +
            '<p class="soft">This item is read-only for now. Technical payload is available in Dev output.</p>' +
          '</article>';
        }

        function renderInbox(project, inbox) {
          const items = inbox.items || [];
          const campaignCount = new Set(items.map((item) => item.campaignId)).size;
          const sourceIssueCount = items.filter((item) => item.type === 'source_issue').length;
          const otherIssueCount = items.length - sourceIssueCount;

          document.getElementById('backToProjectDashboard').href =
            '/test-ui/project?projectId=' + encodeURIComponent(project.id);
          document.getElementById('inboxTitle').textContent = project.name;
          document.getElementById('inboxSummary').textContent = items.length === 0
            ? 'No messages require a decision right now.'
            : items.length + ' message(s) require a decision across ' + campaignCount + ' campaign(s). Source issues: ' +
              sourceIssueCount + '. Other exceptions: ' + otherIssueCount + '.';

          const root = document.getElementById('inboxItems');
          if (items.length === 0) {
            root.innerHTML = '<div class="empty-state">Inbox is empty.</div>';
            return;
          }

          root.innerHTML = items.map((item) =>
            item.type === 'source_issue'
              ? sourceIssueCard(item)
              : isGeneratedArtifactIssue(item)
                ? generatedArtifactIssueCard(item)
                : genericInboxCard(item)
          ).join('');

          root.querySelectorAll('[data-open-source-edit]').forEach((button) => {
            button.addEventListener('click', () => {
              const card = button.closest('[data-source-issue-card]');
              const panel = card?.querySelector('.source-edit-panel');
              if (panel) {
                panel.hidden = false;
                panel.querySelector('textarea')?.focus();
              }
            });
          });

          root.querySelectorAll('[data-close-source-edit]').forEach((button) => {
            button.addEventListener('click', () => {
              const card = button.closest('[data-source-issue-card]');
              const panel = card?.querySelector('.source-edit-panel');
              if (panel) {
                panel.hidden = true;
              }
            });
          });

          root.querySelectorAll('[data-ignore-source-issue]').forEach((button) => {
            button.addEventListener('click', () => submitIgnoreSourceIssue(button.dataset.ignoreSourceIssue, button.closest('[data-source-issue-card]')?.querySelector('.source-resolution-form')?.dataset.campaignId));
          });

          root.querySelectorAll('[data-open-artifact-edit]').forEach((button) => {
            button.addEventListener('click', () => {
              const card = button.closest('[data-artifact-issue-card]');
              const panel = card?.querySelector('.source-edit-panel');
              if (panel) {
                panel.hidden = false;
                panel.querySelector('textarea')?.focus();
              }
            });
          });

          root.querySelectorAll('[data-close-artifact-edit]').forEach((button) => {
            button.addEventListener('click', () => {
              const card = button.closest('[data-artifact-issue-card]');
              const panel = card?.querySelector('.source-edit-panel');
              if (panel) {
                panel.hidden = true;
              }
            });
          });

          root.querySelectorAll('[data-fix-artifact-issue]').forEach((button) => {
            const form = button.closest('[data-artifact-issue-card]')?.querySelector('.artifact-resolution-form');
            button.addEventListener('click', () => submitGeneratedArtifactIssue(button.dataset.fixArtifactIssue, form?.dataset.campaignId, 'fix_ai'));
          });

          root.querySelectorAll('[data-ignore-artifact-issue]').forEach((button) => {
            const form = button.closest('[data-artifact-issue-card]')?.querySelector('.artifact-resolution-form');
            button.addEventListener('click', () => submitGeneratedArtifactIssue(button.dataset.ignoreArtifactIssue, form?.dataset.campaignId, 'ignore'));
          });

          root.querySelectorAll('.source-resolution-form').forEach((form) => {
            form.addEventListener('submit', submitEditedSource);
          });

          root.querySelectorAll('.artifact-resolution-form').forEach((form) => {
            form.addEventListener('submit', submitEditedGeneratedArtifact);
          });
        }

        async function postSourceIssueDecision(campaignId, payload) {
          await request(
            '/campaigns/' + encodeURIComponent(campaignId) + '/source-issues/review',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            },
          );
          await loadPage();
        }

        async function submitIgnoreSourceIssue(approvalItemId, campaignId) {
          if (!approvalItemId || !campaignId) {
            return;
          }
          await postSourceIssueDecision(campaignId, {
            approvalItemId,
            action: 'ignore',
            note: 'Ignored from Project inbox.',
          });
        }

        async function submitEditedSource(event) {
          event.preventDefault();
          const form = event.currentTarget;
          const approvalItemId = form.dataset.approvalItemId;
          const campaignId = form.dataset.campaignId;
          const formData = new FormData(form);
          await postSourceIssueDecision(campaignId, {
            approvalItemId,
            action: 'manual_edit',
            content: normalizeOptionalFieldValue(formData.get('content')),
            language: form.dataset.sourceLanguage || 'en',
            note: 'Longread changed from Project inbox.',
          });
          return false;
        }

        async function postGeneratedArtifactIssueDecision(campaignId, payload) {
          await request(
            '/campaigns/' + encodeURIComponent(campaignId) + '/generated-artifact-issues/review',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            },
          );
          await loadPage();
        }

        async function submitGeneratedArtifactIssue(approvalItemId, campaignId, action) {
          if (!approvalItemId || !campaignId) {
            return;
          }
          await postGeneratedArtifactIssueDecision(campaignId, {
            approvalItemId,
            action,
            note: action === 'fix_ai'
              ? 'Requested AI fix from Project inbox.'
              : 'Ignored from Project inbox.',
          });
        }

        async function submitEditedGeneratedArtifact(event) {
          event.preventDefault();
          const form = event.currentTarget;
          const approvalItemId = form.dataset.approvalItemId;
          const campaignId = form.dataset.campaignId;
          const formData = new FormData(form);
          await postGeneratedArtifactIssueDecision(campaignId, {
            approvalItemId,
            action: 'manual_edit',
            content: normalizeOptionalFieldValue(formData.get('content')),
            note: 'Manually edited from Project inbox.',
          });
          return false;
        }

        async function loadPage() {
          if (!projectId) {
            document.getElementById('inboxTitle').textContent = 'Missing projectId';
            return;
          }

          const [project, inbox] = await Promise.all([
            request('/projects/' + encodeURIComponent(projectId), undefined, { renderResponse: false }),
            request('/projects/' + encodeURIComponent(projectId) + '/inbox', undefined, { renderResponse: false }),
          ]);

          const articleIds = [...new Set(
            (inbox.items || [])
              .map((item) => item.sourceArticleId)
              .filter(Boolean),
          )];
          const articles = await Promise.all(
            articleIds.map(async (articleId) => [
              articleId,
              await request('/articles/' + encodeURIComponent(articleId), undefined, { renderResponse: false }).catch(() => null),
            ]),
          );

          currentProject = project;
          currentInbox = inbox;
          currentArticlesById = new Map(articles);
          renderInbox(project, inbox);
          setOutput({ project, inbox, articles: Object.fromEntries(currentArticlesById) });
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
            '<a href="/test-ui/campaign-execution-history?campaignId=' + encodeURIComponent(campaign.id) + '">Execution history</a>',
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
            '<a href="/test-ui/campaign-execution-history?campaignId=' + encodeURIComponent(campaign.id) + '">Execution history</a>',
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
