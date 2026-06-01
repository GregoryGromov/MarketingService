import { DEFAULT_SEO_BRIEF_KEYWORD_EXPANSION_PROMPT } from '@marketing-service/seo-briefing';
import { Controller, Get, Header, Query } from '@nestjs/common';

function escapeHtmlServer(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

@Controller('test-ui')
export class SeoBriefTestUiController {
  @Get('seo-briefing')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getSeoBriefUi(@Query('runId') runId?: string, @Query('projectId') projectId?: string): string {
    const initialState = JSON.stringify({
      runId: runId?.trim() || null,
      projectId: projectId?.trim() || null,
    }).replace(/</g, '\\u003c');
    const defaultKeywordExpansionPrompt = escapeHtmlServer(
      DEFAULT_SEO_BRIEF_KEYWORD_EXPANSION_PROMPT,
    );
    const defaultKeywordExpansionPromptJson = JSON.stringify(
      DEFAULT_SEO_BRIEF_KEYWORD_EXPANSION_PROMPT,
    ).replace(/</g, '\\u003c');

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Marketing Service - SEO Briefing</title>
    <style>
      :root {
        --bg: #f3efe7;
        --panel: rgba(255, 252, 247, 0.92);
        --panel-strong: #fffaf2;
        --text: #141311;
        --muted: rgba(20, 19, 17, 0.62);
        --line: rgba(20, 19, 17, 0.12);
        --line-strong: rgba(20, 19, 17, 0.22);
        --accent: #1b6b4b;
        --accent-soft: rgba(27, 107, 75, 0.12);
        --danger: #b53828;
        --warning: #9a6410;
        --shadow: 0 24px 60px rgba(39, 31, 18, 0.08);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background:
          radial-gradient(circle at top left, rgba(27, 107, 75, 0.10), transparent 30%),
          radial-gradient(circle at top right, rgba(181, 56, 40, 0.08), transparent 24%),
          var(--bg);
        color: var(--text);
        font: 15px/1.45 "Avenir Next", "Helvetica Neue", Arial, sans-serif;
      }
      .shell {
        max-width: 1580px;
        margin: 0 auto;
        padding: 24px;
        display: grid;
        gap: 18px;
      }
      .hero, .panel, .card, .metrics article {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 28px;
        box-shadow: var(--shadow);
      }
      .hero, .panel, .card {
        padding: 20px;
      }
      .hero {
        display: grid;
        gap: 16px;
      }
      .hero-top, .section-head, .toolbar, .form-grid {
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
        align-items: flex-start;
        justify-content: space-between;
      }
      .hero-copy, .stack {
        display: grid;
        gap: 8px;
      }
      .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 11px;
        color: var(--muted);
      }
      h1 {
        margin: 0;
        font-size: clamp(34px, 4vw, 64px);
        line-height: 0.92;
        letter-spacing: -0.06em;
        font-weight: 500;
      }
      h2 {
        margin: 0;
        font-size: 28px;
        line-height: 1;
        letter-spacing: -0.04em;
        font-weight: 500;
      }
      h3 {
        margin: 0;
        font-size: 20px;
        line-height: 1.08;
        letter-spacing: -0.03em;
        font-weight: 500;
      }
      p, li, dd, dt { margin: 0; }
      .sub {
        color: var(--muted);
        max-width: 860px;
      }
      .actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      button, select, input, textarea {
        font: inherit;
      }
      button, .button-like {
        border: 1px solid var(--line-strong);
        border-radius: 999px;
        padding: 11px 16px;
        background: white;
        color: var(--text);
        cursor: pointer;
        transition: 120ms ease;
      }
      button.primary {
        background: var(--text);
        color: white;
        border-color: var(--text);
      }
      button:hover, .button-like:hover {
        transform: translateY(-1px);
        border-color: var(--text);
      }
      button:disabled {
        opacity: 0.52;
        cursor: not-allowed;
        transform: none;
      }
      button.is-loading {
        position: relative;
        padding-left: 42px;
      }
      button.is-loading::before {
        content: "";
        position: absolute;
        left: 16px;
        top: 50%;
        width: 14px;
        height: 14px;
        margin-top: -7px;
        border-radius: 50%;
        border: 2px solid currentColor;
        border-right-color: transparent;
        animation: seo-spin 0.8s linear infinite;
      }
      .main {
        display: grid;
        gap: 18px;
        grid-template-columns: 430px minmax(0, 1fr);
        align-items: start;
      }
      .sidebar, .detail {
        display: grid;
        gap: 18px;
      }
      .panel {
        display: grid;
        gap: 16px;
      }
      .filters, .list, .metrics {
        display: grid;
        gap: 12px;
      }
      .filters {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      label.field {
        display: grid;
        gap: 8px;
        min-width: 0;
      }
      label.field span {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--muted);
      }
      input, select, textarea {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 12px 14px;
        background: rgba(255, 255, 255, 0.88);
        color: var(--text);
      }
      textarea {
        min-height: 110px;
        resize: vertical;
      }
      input[type="range"] {
        padding: 0;
        border: 0;
        background: transparent;
        accent-color: var(--accent);
      }
      .balance-field {
        border: 1px solid var(--line);
        border-radius: 22px;
        padding: 14px;
        background: rgba(255, 255, 255, 0.58);
      }
      .balance-values {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        color: var(--text);
      }
      .balance-values strong {
        display: grid;
        gap: 2px;
        font-size: 14px;
        font-weight: 600;
      }
      .balance-values b {
        font-size: 24px;
        line-height: 1;
        letter-spacing: -0.04em;
      }
      .advanced-field {
        margin-top: 8px;
        border: 1px dashed rgba(154, 100, 16, 0.38);
        border-radius: 22px;
        padding: 14px;
        background: rgba(255, 244, 221, 0.62);
      }
      .advanced-field span {
        color: var(--warning);
      }
      .advanced-field em {
        color: var(--muted);
        font-style: normal;
        font-size: 13px;
      }
      .advanced-field textarea {
        background: rgba(255, 252, 246, 0.9);
      }
      .launch-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .launch-grid .full {
        grid-column: 1 / -1;
      }
      .metric-row, .run-list {
        display: grid;
        gap: 10px;
      }
      .metrics {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
      .metrics article {
        padding: 14px;
        display: grid;
        gap: 6px;
      }
      .metric-value {
        font-size: 30px;
        line-height: 0.95;
        letter-spacing: -0.05em;
      }
      .metric-label {
        font-size: 12px;
        text-transform: uppercase;
        color: var(--muted);
        letter-spacing: 0.08em;
      }
      .run-item {
        padding: 14px;
        border: 1px solid var(--line);
        border-radius: 20px;
        background: rgba(255,255,255,0.74);
        display: grid;
        gap: 10px;
        cursor: pointer;
      }
      .run-item.is-active {
        border-color: var(--accent);
        box-shadow: inset 0 0 0 1px rgba(27, 107, 75, 0.18);
        background: rgba(27, 107, 75, 0.08);
      }
      .run-item-top, .inline-meta {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: start;
        flex-wrap: wrap;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 12px;
        letter-spacing: 0.04em;
        border: 1px solid var(--line);
        background: rgba(255,255,255,0.66);
      }
      .status-done { color: var(--accent); border-color: rgba(27, 107, 75, 0.24); background: rgba(27, 107, 75, 0.10); }
      .status-running, .status-queued, .status-created { color: #284e9b; border-color: rgba(40, 78, 155, 0.24); background: rgba(40, 78, 155, 0.10); }
      .status-awaiting_confirmation { color: #0d5b86; border-color: rgba(13, 91, 134, 0.24); background: rgba(13, 91, 134, 0.10); }
      .status-failed, .status-rejected { color: var(--danger); border-color: rgba(181, 56, 40, 0.28); background: rgba(181, 56, 40, 0.10); }
      .status-needs_manual_review { color: var(--warning); border-color: rgba(154, 100, 16, 0.28); background: rgba(154, 100, 16, 0.12); }
      .detail-grid {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .detail-grid .full {
        grid-column: 1 / -1;
      }
      .card {
        display: grid;
        gap: 12px;
      }
      .definition-list {
        display: grid;
        grid-template-columns: minmax(120px, 180px) 1fr;
        gap: 10px 16px;
      }
      .definition-list dt {
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .timeline, .log-list, .score-list {
        display: grid;
        gap: 10px;
      }
      .timeline-item, .log-item, .score-item {
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 12px 14px;
        background: rgba(255,255,255,0.72);
        display: grid;
        gap: 8px;
      }
      .mono, pre {
        font-family: "SFMono-Regular", "Menlo", monospace;
      }
      pre {
        margin: 0;
        padding: 14px;
        border-radius: 18px;
        border: 1px solid rgba(20, 19, 17, 0.08);
        background: #faf6ee;
        color: #2b2926;
        overflow: auto;
        white-space: pre-wrap;
        word-break: break-word;
      }
      details {
        border: 1px solid var(--line);
        border-radius: 18px;
        background: rgba(255,255,255,0.62);
      }
      summary {
        cursor: pointer;
        padding: 12px 14px;
        font-weight: 500;
      }
      details > div {
        padding: 0 14px 14px;
      }
      .empty {
        color: var(--muted);
        border: 1px dashed var(--line-strong);
        border-radius: 20px;
        padding: 18px;
        background: rgba(255,255,255,0.36);
      }
      .toast {
        position: fixed;
        right: 18px;
        bottom: 18px;
        padding: 12px 14px;
        border-radius: 16px;
        background: #111;
        color: white;
        box-shadow: var(--shadow);
        opacity: 0;
        transform: translateY(12px);
        pointer-events: none;
        transition: 140ms ease;
      }
      .toast.is-visible {
        opacity: 1;
        transform: translateY(0);
      }
      .progress-shell {
        display: grid;
        gap: 12px;
      }
      .progress-track {
        width: 100%;
        height: 12px;
        border-radius: 999px;
        background: rgba(20, 19, 17, 0.08);
        overflow: hidden;
      }
      .progress-bar {
        width: 38%;
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, var(--accent), #52a47f);
        animation: seo-progress 1.3s ease-in-out infinite;
      }
      .inline-progress {
        margin-top: 12px;
        display: grid;
        gap: 8px;
        color: var(--muted);
      }
      .inline-progress[hidden] {
        display: none;
      }
      .stage-output-list {
        display: grid;
        gap: 10px;
      }
      .stage-output-item {
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 12px 14px;
        background: rgba(255,255,255,0.72);
        display: grid;
        gap: 6px;
      }
      .stage-output-item small {
        color: var(--muted);
      }
      .related-query-inline {
        margin-top: 4px;
        padding-top: 10px;
        border-top: 1px solid var(--line);
        display: grid;
        gap: 7px;
      }
      .related-query-inline span {
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .related-query-inline ul {
        margin: 0;
        padding-left: 18px;
        display: grid;
        gap: 4px;
      }
      .related-query-inline li {
        color: var(--ink);
      }
      .keyword-serp-list {
        display: grid;
        gap: 12px;
      }
      .keyword-serp-item {
        border: 1px solid var(--line);
        border-radius: 22px;
        background: rgba(255,255,255,0.54);
      }
      .keyword-serp-item > summary {
        font-weight: 700;
      }
      .keyword-serp-body {
        display: grid;
        gap: 10px;
      }
      @keyframes seo-progress {
        0% { transform: translateX(-115%); }
        100% { transform: translateX(320%); }
      }
      @keyframes seo-spin {
        to { transform: rotate(360deg); }
      }
      :root {
        --bg: #ececed;
        --panel: rgba(255, 255, 255, 0.88);
        --panel-strong: rgba(255, 255, 255, 0.94);
        --text: #121212;
        --muted: rgba(18, 18, 18, 0.58);
        --line: rgba(18, 18, 18, 0.12);
        --line-strong: rgba(18, 18, 18, 0.28);
        --accent: #121212;
        --accent-soft: rgba(18, 18, 18, 0.08);
        --danger: #b42318;
        --warning: #b54708;
        --shadow: none;
      }
      body {
        background: var(--bg);
        color: var(--text);
        font: 15px/1.38 "Helvetica Neue", Helvetica, Arial, sans-serif;
      }
      .shell {
        max-width: 1780px;
        padding: 22px 38px 40px;
        gap: 18px;
      }
      .hero, .panel, .card, .metrics article {
        background: var(--panel);
        border: 1px solid rgba(18, 18, 18, 0.12);
        border-radius: 32px;
        box-shadow: none;
      }
      .hero, .panel, .card {
        padding: 24px;
      }
      .hero {
        gap: 18px;
      }
      .hero-top, .section-head, .toolbar, .form-grid {
        gap: 16px;
      }
      .hero-copy, .stack {
        gap: 10px;
      }
      .eyebrow,
      label.field span,
      .metric-label,
      .definition-list dt {
        color: var(--muted);
        font-size: 12px;
        letter-spacing: 0.08em;
      }
      h1 {
        font-size: clamp(36px, 4.8vw, 72px);
        line-height: 0.92;
        letter-spacing: -0.06em;
        font-weight: 400;
      }
      h2 {
        font-size: 30px;
        line-height: 1;
        letter-spacing: -0.04em;
        font-weight: 400;
      }
      h3 {
        font-size: 22px;
        line-height: 1.04;
        letter-spacing: -0.04em;
        font-weight: 400;
      }
      .sub,
      p,
      .stage-output-item small,
      .run-item .inline-meta,
      .empty {
        color: var(--muted);
      }
      button, .button-like {
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 10px 18px;
        background: rgba(255, 255, 255, 0.34);
        color: var(--text);
        font-weight: 400;
        transition: background 120ms ease, border-color 120ms ease;
      }
      button.primary {
        background: rgba(18, 18, 18, 0.94);
        color: #fff;
        border-color: rgba(18, 18, 18, 0.94);
      }
      button:hover, .button-like:hover {
        transform: none;
        border-color: var(--line-strong);
        background: rgba(255, 255, 255, 0.58);
      }
      button.primary:hover {
        background: #121212;
        border-color: #121212;
      }
      input, select, textarea {
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 13px 14px;
        background: rgba(255, 255, 255, 0.72);
        color: var(--text);
      }
      textarea {
        min-height: 120px;
      }
      .main {
        grid-template-columns: 470px minmax(0, 1fr);
        gap: 18px;
      }
      .panel,
      .sidebar,
      .detail,
      .filters,
      .list,
      .metrics,
      .run-list,
      .detail-grid,
      .timeline,
      .log-list,
      .score-list,
      .progress-shell,
      .stage-output-list {
        gap: 14px;
      }
      .launch-grid {
        gap: 14px;
      }
      .metrics {
        grid-template-columns: repeat(6, minmax(0, 1fr));
      }
      .metrics article {
        padding: 16px;
        border-radius: 26px;
        background: rgba(255, 255, 255, 0.56);
      }
      .metric-value {
        font-size: 34px;
        line-height: 0.95;
        letter-spacing: -0.05em;
      }
      .run-item,
      .timeline-item,
      .log-item,
      .score-item,
      .stage-output-item {
        border: 1px solid var(--line);
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.54);
        box-shadow: none;
      }
      .run-item {
        padding: 16px;
        gap: 12px;
      }
      .run-item:hover {
        border-color: var(--line-strong);
        background: rgba(255, 255, 255, 0.7);
      }
      .run-item.is-active {
        border-color: rgba(18, 18, 18, 0.24);
        box-shadow: inset 0 0 0 1px rgba(18, 18, 18, 0.08);
        background: rgba(18, 18, 18, 0.06);
      }
      .badge {
        padding: 6px 12px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,0.66);
        font-size: 12px;
        letter-spacing: 0.04em;
      }
      .status-done {
        color: #117a43;
        border-color: rgba(17, 122, 67, 0.22);
        background: #ebfff4;
      }
      .status-running, .status-queued, .status-created {
        color: #121212;
        border-color: rgba(18, 18, 18, 0.18);
        background: rgba(18, 18, 18, 0.06);
      }
      .status-awaiting_confirmation {
        color: #121212;
        border-color: rgba(18, 18, 18, 0.18);
        background: rgba(18, 18, 18, 0.08);
      }
      .status-failed, .status-rejected {
        color: var(--danger);
        border-color: rgba(180, 35, 24, 0.22);
        background: #fff0ed;
      }
      .status-needs_manual_review {
        color: var(--warning);
        border-color: rgba(181, 71, 8, 0.22);
        background: #fff3e8;
      }
      .card {
        gap: 14px;
      }
      .definition-list {
        gap: 12px 18px;
      }
      pre {
        padding: 16px;
        border-radius: 22px;
        border: 1px solid var(--line);
        background: rgba(18, 18, 18, 0.035);
        color: #1d1d1d;
      }
      details {
        border: 1px solid var(--line);
        border-radius: 22px;
        background: rgba(255,255,255,0.56);
      }
      summary {
        padding: 14px 16px;
        font-weight: 400;
      }
      details > div {
        padding: 0 16px 16px;
      }
      .empty {
        border: 1px dashed var(--line-strong);
        border-radius: 24px;
        padding: 20px;
        background: rgba(255,255,255,0.42);
      }
      .toast {
        border-radius: 18px;
        background: rgba(18, 18, 18, 0.94);
        box-shadow: none;
      }
      .progress-track {
        height: 10px;
        background: rgba(18, 18, 18, 0.08);
      }
      .progress-bar {
        background: linear-gradient(90deg, #121212, rgba(18, 18, 18, 0.34));
      }
      @media (max-width: 1180px) {
        .main, .detail-grid, .metrics, .filters, .launch-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <section class="hero">
        <div class="hero-top">
          <div class="hero-copy">
            <div class="eyebrow">Internal Console</div>
            <h1>SEO Briefing</h1>
            <p class="sub">
              Move through the SEO brief workflow one semantic step at a time, confirm each
              transition manually, and inspect the trace without leaving the API app.
            </p>
          </div>
          <div class="actions">
            <button type="button" id="refreshAllBtn">Refresh</button>
            <a class="button-like" href="/seo-briefing/health">Health</a>
          </div>
        </div>
      </section>

      <div class="main">
        <aside class="sidebar">
          <section class="panel">
            <div class="section-head">
              <div class="stack">
                <div class="eyebrow">Launch</div>
                <h2>New Run</h2>
              </div>
            </div>
            <form id="launchForm" class="launch-grid">
              <label class="field full">
                <span>Project</span>
                <select id="projectId">
                  <option value="">No project context</option>
                </select>
              </label>
              <label class="field full">
                <span>Topic Seed</span>
                <input id="topicSeed" required value="how to earn with USDT" />
              </label>
              <label class="field">
                <span>Country</span>
                <input id="country" required value="Nigeria" />
              </label>
              <label class="field">
                <span>Language</span>
                <input id="language" required value="English" />
              </label>
              <label class="field full">
                <span>Audience</span>
                <textarea id="audience">Beginners holding USDT who want simple earning options.</textarea>
              </label>
              <label class="field">
                <span>Product Name</span>
                <input id="productName" required value="Reinforce" />
              </label>
              <label class="field">
                <span>CTA</span>
                <input id="cta" value="See how Reinforce works" />
              </label>
              <label class="field full">
                <span>Product Description</span>
                <textarea id="productDescription">Reinforce helps users make idle USDT productive without relying on hype or vague promises.</textarea>
              </label>
              <label class="field full">
                <span>Key Message</span>
                <textarea id="keyMessage">Idle USDT can become productive if users understand the options and risks clearly.</textarea>
              </label>
              <label class="field">
                <span>Audience Before</span>
                <input id="audienceBefore" value="User holds USDT but does not understand earning options." />
              </label>
              <label class="field">
                <span>Audience After</span>
                <input id="audienceAfter" value="User understands the options and sees Reinforce as one practical next step." />
              </label>
              <label class="field full balance-field">
                <span>SEO / Product Balance</span>
                <div class="balance-values">
                  <strong>SEO <b id="seoWeightLabel">60%</b></strong>
                  <strong>Product <b id="productWeightLabel">40%</b></strong>
                </div>
                <input id="balanceSlider" type="range" min="0" max="100" step="5" value="60" />
                <input id="seoWeight" type="hidden" value="0.6" />
                <input id="productWeight" type="hidden" value="0.4" />
              </label>
              <label class="field full advanced-field">
                <span>Operator Prompt Override</span>
                <em>This is not marketer context. It only tunes how AI generates initial keyword hypotheses.</em>
                <textarea id="keywordExpansionPrompt">${defaultKeywordExpansionPrompt}</textarea>
              </label>
              <div class="actions full">
                <button class="primary" type="submit" id="launchBtn">Generate 3 Keywords</button>
                <button type="button" id="fillFromBrandMemoryBtn">Fill From Brand Memory</button>
              </div>
            </form>
          </section>

          <section class="panel">
            <div class="section-head">
              <div class="stack">
                <div class="eyebrow">Runs</div>
                <h2>Recent Runs</h2>
              </div>
            </div>
            <div class="filters">
              <label class="field">
                <span>Project Filter</span>
                <select id="projectFilter">
                  <option value="">All projects</option>
                </select>
              </label>
              <label class="field">
                <span>Status Filter</span>
                <select id="statusFilter">
                  <option value="">All statuses</option>
                  <option value="created">created</option>
                  <option value="awaiting_confirmation">awaiting_confirmation</option>
                  <option value="queued">queued</option>
                  <option value="running">running</option>
                  <option value="done">done</option>
                  <option value="failed">failed</option>
                  <option value="rejected">rejected</option>
                  <option value="needs_manual_review">needs_manual_review</option>
                </select>
              </label>
            </div>
            <div class="actions">
              <button type="button" id="applyFiltersBtn">Apply Filters</button>
              <button type="button" id="clearFiltersBtn">Clear Filters</button>
            </div>
            <div id="runList" class="run-list"></div>
          </section>
        </aside>

        <section class="detail">
          <div id="detailContent" class="detail-grid">
            <div class="empty full">Select a run to inspect the timeline, final brief, evidence pack, and call trail.</div>
          </div>
        </section>
      </div>
    </div>

    <div id="toast" class="toast" role="status" aria-live="polite"></div>

    <script>
      const initialState = ${initialState};
      const appState = {
        projects: [],
        runs: [],
        selectedRun: null,
        selectedRunId: null,
        filterProjectId: null,
        filterStatus: null,
        serpPreviewLoading: false,
        relatedQuerySelectionLoading: false,
      };
      const DEFAULT_KEYWORD_EXPANSION_PROMPT = ${defaultKeywordExpansionPromptJson};
      const UI_LOGS_HIDDEN_STORAGE_KEY = 'seoBriefing.hiddenUiLogRunIds';

      function qs(id) {
        return document.getElementById(id);
      }

      function escapeHtmlClient(value) {
        return String(value ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      function prettyDate(value) {
        if (!value) return '—';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
      }

      function readHiddenUiLogRunIds() {
        try {
          const parsed = JSON.parse(localStorage.getItem(UI_LOGS_HIDDEN_STORAGE_KEY) || '[]');
          return Array.isArray(parsed) ? new Set(parsed.filter((item) => typeof item === 'string')) : new Set();
        } catch (_error) {
          return new Set();
        }
      }

      function areUiLogsHidden(runId) {
        return readHiddenUiLogRunIds().has(runId);
      }

      function setUiLogsHidden(runId, hidden) {
        const ids = readHiddenUiLogRunIds();
        if (hidden) {
          ids.add(runId);
        } else {
          ids.delete(runId);
        }
        localStorage.setItem(UI_LOGS_HIDDEN_STORAGE_KEY, JSON.stringify([...ids]));
      }

      function statusClass(status) {
        return 'status-' + String(status || 'created');
      }

      function prettyJson(value) {
        return JSON.stringify(value, null, 2);
      }

      function syncBalanceSlider() {
        const slider = qs('balanceSlider');
        if (!slider) return;
        const seoPercent = Math.max(0, Math.min(100, Number(slider.value || 50)));
        const productPercent = 100 - seoPercent;
        qs('seoWeight').value = (seoPercent / 100).toFixed(2);
        qs('productWeight').value = (productPercent / 100).toFixed(2);
        qs('seoWeightLabel').textContent = seoPercent + '%';
        qs('productWeightLabel').textContent = productPercent + '%';
      }

      const STAGE_ORDER = [
        'keyword_expansion',
        'keyword_research',
        'related_keyword_research',
        'serp_research',
        'domain_metrics_research',
        'onpage_research',
        'keyword_triage',
        'clustering',
        'cluster_scoring',
        'cluster_selection',
        'brief_generation',
      ];

      const STAGE_META = {
        keyword_expansion: {
          title: 'Generate Initial Keywords',
          loading: 'AI is generating 3 initial keyword hypotheses from the topic, audience, product, and brand memory.',
          action: 'Fetch SERP for the first keyword',
        },
        keyword_research: {
          title: 'Keyword Research',
          loading: 'The system is checking search volume, competition, and CPC signals for the current keyword set.',
          action: 'Approve and continue to related keyword research',
        },
        related_keyword_research: {
          title: 'Related Keyword Research',
          loading: 'The system is expanding the keyword universe with related search suggestions.',
          action: 'Approve and continue to SERP research',
        },
        serp_research: {
          title: 'SERP Research',
          loading: 'The system is collecting live SERP results for representative keywords.',
          action: 'Approve and continue to domain metrics research',
        },
        domain_metrics_research: {
          title: 'Domain Metrics Research',
          loading: 'The system is evaluating the authority and traffic profile of competing domains.',
          action: 'Approve and continue to on-page research',
        },
        onpage_research: {
          title: 'On-Page Research',
          loading: 'The system is parsing competing pages to extract structural and on-page quality signals.',
          action: 'Approve and continue to keyword triage',
        },
        keyword_triage: {
          title: 'Keyword Triage',
          loading: 'AI is filtering the keyword universe down to viable candidates.',
          action: 'Approve and continue to clustering',
        },
        clustering: {
          title: 'Clustering',
          loading: 'AI is grouping viable keywords into semantic clusters.',
          action: 'Approve and continue to cluster scoring',
        },
        cluster_scoring: {
          title: 'Cluster Scoring',
          loading: 'The system is scoring clusters using SEO fit, product fit, and penalties.',
          action: 'Approve and continue to cluster selection',
        },
        cluster_selection: {
          title: 'Cluster Selection',
          loading: 'AI is explaining the best cluster and the system is deciding whether it is strong enough to proceed.',
          action: 'Approve and continue to brief generation',
        },
        brief_generation: {
          title: 'Brief Generation',
          loading: 'AI is generating the final structured SEO brief and evidence pack.',
          action: 'Workflow complete',
        },
      };

      function isBusyStatus(status) {
        return status === 'queued' || status === 'running';
      }

      function latestStepByStage(steps) {
        const map = new Map();
        (steps || []).forEach((step) => {
          map.set(step.stage, step);
        });
        return map;
      }

      function findNextStage(run) {
        const latest = latestStepByStage(run.steps);
        for (const stage of STAGE_ORDER) {
          const step = latest.get(stage);
          if (!step) return stage;
          if (step.status !== 'completed') return stage;
        }
        return null;
      }

      function findLatestStep(run, stage) {
        const latest = latestStepByStage(run.steps);
        return latest.get(stage) || null;
      }

      function findRunningStage(run) {
        const running = [...(run.steps || [])].reverse().find((step) => step.status === 'running');
        if (running) return running.stage;
        if (run.status === 'queued') return findNextStage(run);
        return null;
      }

      function findArtifact(run, artifactType) {
        const artifacts = Array.isArray(run.artifacts) ? run.artifacts : [];
        for (let index = artifacts.length - 1; index >= 0; index -= 1) {
          if (artifacts[index]?.artifactType === artifactType) {
            return artifacts[index];
          }
        }
        return null;
      }

      function readRunKeywordExpansionPrompt(run) {
        const artifact = findArtifact(run, 'normalized_input');
        const value = artifact?.payload?.keywordExpansionPrompt;
        return typeof value === 'string' && value.trim()
          ? value
          : DEFAULT_KEYWORD_EXPANSION_PROMPT;
      }

      function getLatestCompletedStage(run) {
        const latest = latestStepByStage(run.steps);
        for (let index = STAGE_ORDER.length - 1; index >= 0; index -= 1) {
          const stage = STAGE_ORDER[index];
          if (latest.get(stage)?.status === 'completed') {
            return stage;
          }
        }
        return null;
      }

      function readKeywordRelatedSelections(run) {
        const aggregateArtifact = findArtifact(run, 'keyword_related_query_selections');
        const firstArtifact = findArtifact(run, 'first_keyword_related_query_selection');
        const selections = new Map();
        const normalizeSearchQueryDisplay = (value) => value.replace(/\\s+/g, ' ').trim().replace(/[?!.。！？]+$/u, '').trim();

        if (Array.isArray(aggregateArtifact?.payload?.items)) {
          aggregateArtifact.payload.items.forEach((item) => {
            const keyword = typeof item?.keyword === 'string' ? item.keyword.trim() : '';
            const selected = Array.isArray(item?.selected)
              ? item.selected
                  .map((selection) => typeof selection?.keyword === 'string' ? normalizeSearchQueryDisplay(selection.keyword) : '')
                  .filter(Boolean)
              : [];
            if (keyword) {
              selections.set(keyword.toLowerCase(), selected);
            }
          });
        }

        if (firstArtifact?.payload && typeof firstArtifact.payload.keyword === 'string') {
          const keyword = firstArtifact.payload.keyword.trim();
          const selected = Array.isArray(firstArtifact.payload.selected)
            ? firstArtifact.payload.selected
                .map((selection) => typeof selection?.keyword === 'string' ? normalizeSearchQueryDisplay(selection.keyword) : '')
                .filter(Boolean)
            : [];
          if (keyword && !selections.has(keyword.toLowerCase())) {
            selections.set(keyword.toLowerCase(), selected);
          }
        }

        return selections;
      }

      function renderKeywordHypotheses(run) {
        const artifact = findArtifact(run, 'keyword_hypotheses');
        const hypotheses = Array.isArray(artifact?.payload?.hypotheses) ? artifact.payload.hypotheses : [];
        const relatedSelections = readKeywordRelatedSelections(run);
        if (!hypotheses.length) {
          return '<div class="empty">No keyword hypotheses yet.</div>';
        }

        return '<div class="stage-output-list">' + hypotheses.map((item, index) => {
          const keyword = typeof item.keyword === 'string' ? item.keyword.trim() : '';
          const selectedRelatedQueries = relatedSelections.get(keyword.toLowerCase()) || null;

          return (
            '<div class="stage-output-item">' +
              '<strong>' + escapeHtmlClient(String(index + 1).padStart(2, '0') + '. ' + (keyword || 'Untitled keyword')) + '</strong>' +
              '<small>' + escapeHtmlClient(item.intent || 'intent n/a') + '</small>' +
              '<p>' + escapeHtmlClient(item.rationale || item.audienceFit || 'No explanation provided.') + '</p>' +
              (selectedRelatedQueries
                ? '<div class="related-query-inline"><span>Selected related queries</span>' +
                    (selectedRelatedQueries.length
                      ? '<ul>' + selectedRelatedQueries.map((query) => '<li>' + escapeHtmlClient(query) + '</li>').join('') + '</ul>'
                      : '<p>No strong grounded related queries selected.</p>') +
                  '</div>'
                : '') +
            '</div>'
          );
        }).join('') + '</div>';
      }

      function renderFirstKeywordSerpPreview(run) {
        const aggregateSnapshotArtifact = findArtifact(run, 'keyword_serp_preview_snapshots');
        const aggregateRawArtifact = findArtifact(run, 'keyword_serp_preview_raw_responses');
        const aggregateDerivedKeywordsArtifact = findArtifact(run, 'keyword_serp_derived_keywords');
        const aggregateRelatedSelectionArtifact = findArtifact(run, 'keyword_related_query_selections');
        const snapshotArtifact = findArtifact(run, 'first_keyword_serp_preview_snapshot');
        const rawArtifact = findArtifact(run, 'first_keyword_serp_preview_raw_response');
        const derivedKeywordsArtifact = findArtifact(run, 'first_keyword_serp_derived_keywords');
        const relatedSelectionArtifact = findArtifact(run, 'first_keyword_related_query_selection');
        if (!aggregateSnapshotArtifact && !aggregateRawArtifact && !aggregateDerivedKeywordsArtifact && !aggregateRelatedSelectionArtifact && !snapshotArtifact && !rawArtifact && !derivedKeywordsArtifact && !relatedSelectionArtifact) {
          return '';
        }
        const visibleSnapshotArtifact = aggregateSnapshotArtifact || snapshotArtifact;
        const visibleRawArtifact = aggregateRawArtifact || rawArtifact;
        const visibleDerivedKeywordsArtifact = aggregateDerivedKeywordsArtifact || derivedKeywordsArtifact;
        const visibleRelatedSelectionArtifact = aggregateRelatedSelectionArtifact || relatedSelectionArtifact;
        const hypothesisArtifact = findArtifact(run, 'keyword_hypotheses');
        const hypotheses = Array.isArray(hypothesisArtifact?.payload?.hypotheses) ? hypothesisArtifact.payload.hypotheses : [];
        const normalizedDisplayQuery = (value) => value.replace(/\\s+/g, ' ').trim().replace(/[?!.。！？]+$/u, '').trim();
        const toItems = (artifact) => Array.isArray(artifact?.payload?.items)
          ? artifact.payload.items
          : artifact?.payload?.keyword
            ? [artifact.payload]
            : [];
        const keyFor = (item, fallbackIndex) => {
          const keyword = typeof item?.keyword === 'string' ? item.keyword.trim().toLowerCase() : '';
          return keyword || 'index:' + String(typeof item?.index === 'number' ? item.index : fallbackIndex);
        };
        const mapByKeyword = (items) => {
          const map = new Map();
          items.forEach((item, index) => map.set(keyFor(item, index), item));
          return map;
        };
        const selectedByKeyword = mapByKeyword(toItems(visibleRelatedSelectionArtifact));
        const derivedByKeyword = mapByKeyword(toItems(visibleDerivedKeywordsArtifact));
        const snapshotByKeyword = mapByKeyword(toItems(visibleSnapshotArtifact));
        const rawByKeyword = mapByKeyword(toItems(visibleRawArtifact));
        const previewKeywords = hypotheses.length
          ? hypotheses.map((item, index) => ({
              index,
              keyword: typeof item?.keyword === 'string' ? item.keyword.trim() : 'Keyword ' + String(index + 1),
            }))
          : toItems(visibleDerivedKeywordsArtifact || visibleSnapshotArtifact || visibleRawArtifact || visibleRelatedSelectionArtifact)
              .map((item, index) => ({
                index: typeof item?.index === 'number' ? item.index : index,
                keyword: typeof item?.keyword === 'string' ? item.keyword.trim() : 'Keyword ' + String(index + 1),
              }));
        const keywordCards = previewKeywords.map((item, index) => {
          const lookupKey = item.keyword ? item.keyword.toLowerCase() : 'index:' + String(item.index);
          const selected = selectedByKeyword.get(lookupKey);
          const derived = derivedByKeyword.get(lookupKey);
          const snapshot = snapshotByKeyword.get(lookupKey);
          const raw = rawByKeyword.get(lookupKey);
          const selectedQueries = Array.isArray(selected?.selected)
            ? selected.selected
                .map((selection) => typeof selection?.keyword === 'string' ? normalizedDisplayQuery(selection.keyword) : '')
                .filter(Boolean)
            : [];

          return (
            '<details class="keyword-serp-item" ' + (index === 0 ? 'open' : '') + '>' +
              '<summary>' + escapeHtmlClient(String(index + 1).padStart(2, '0') + '. ' + item.keyword) + '</summary>' +
              '<div class="keyword-serp-body">' +
                '<div class="related-query-inline"><span>Selected related queries</span>' +
                  (selected
                    ? selectedQueries.length
                      ? '<ul>' + selectedQueries.map((query) => '<li>' + escapeHtmlClient(query) + '</li>').join('') + '</ul>'
                      : '<p>No strong grounded related queries selected.</p>'
                    : '<p>Selection has not been generated for this keyword yet.</p>') +
                '</div>' +
                (derived
                  ? '<details><summary>SERP-derived similar queries and themes</summary><div><pre>' + escapeHtmlClient(prettyJson(derived)) + '</pre></div></details>'
                  : '') +
                (snapshot
                  ? '<details><summary>Normalized snapshot</summary><div><pre>' + escapeHtmlClient(prettyJson(snapshot)) + '</pre></div></details>'
                  : '') +
                (raw
                  ? '<details><summary>Raw DataForSEO response</summary><div><pre>' + escapeHtmlClient(prettyJson(raw)) + '</pre></div></details>'
                  : '') +
              '</div>' +
            '</details>'
          );
        }).join('');

        return (
          '<section class="card full">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">Saved Preview</div><h3>Keyword SERP Snapshots</h3></div></div>' +
            (keywordCards ? '<div class="keyword-serp-list">' + keywordCards + '</div>' : '<div class="empty">No keyword SERP data saved yet.</div>') +
          '</section>'
        );
      }

      function renderStageOutput(run) {
        const latestCompletedStage = getLatestCompletedStage(run);
        if (!latestCompletedStage) {
          return '<div class="empty">This run has not produced a completed semantic step yet.</div>';
        }

        if (latestCompletedStage === 'keyword_expansion') {
          return renderKeywordHypotheses(run);
        }

        const artifactMap = {
          keyword_research: 'keyword_research_snapshot',
          related_keyword_research: 'related_keyword_research_snapshot',
          serp_research: 'serp_research_snapshot',
          domain_metrics_research: 'domain_metrics_snapshot',
          onpage_research: 'onpage_research_snapshot',
          keyword_triage: 'keyword_triage_snapshot',
          clustering: 'cluster_snapshot',
          cluster_scoring: 'cluster_scoring_snapshot',
          cluster_selection: 'cluster_selection_snapshot',
          brief_generation: 'final_brief_snapshot',
        };
        const artifact = findArtifact(run, artifactMap[latestCompletedStage]);
        if (!artifact) {
          return '<div class="empty">No saved output found for ' + escapeHtmlClient(latestCompletedStage) + '.</div>';
        }

        return '<pre>' + escapeHtmlClient(prettyJson(artifact.payload)) + '</pre>';
      }

      async function fetchJson(url, init) {
        const response = await fetch(url, init);
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || 'Request failed: ' + response.status);
        }
        return response.json();
      }

      function showToast(message) {
        const toast = qs('toast');
        toast.textContent = message;
        toast.classList.add('is-visible');
        clearTimeout(showToast.timer);
        showToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 2500);
      }

      function syncRunPolling(run) {
        clearTimeout(syncRunPolling.timer);
        if (!run || !appState.selectedRunId || !isBusyStatus(run.status)) {
          return;
        }

        syncRunPolling.timer = setTimeout(async () => {
          try {
            await selectRun(appState.selectedRunId, false);
          } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to refresh run');
          }
        }, 1800);
      }

      function getProjectName(projectId) {
        if (!projectId) return 'No project';
        const project = appState.projects.find((item) => item.id === projectId);
        return project ? project.name : projectId;
      }

      function updateUrl(runId) {
        const url = new URL(window.location.href);
        if (runId) {
          url.searchParams.set('runId', runId);
        } else {
          url.searchParams.delete('runId');
        }
        const projectId = qs('projectFilter').value;
        if (projectId) {
          url.searchParams.set('projectId', projectId);
        } else {
          url.searchParams.delete('projectId');
        }
        history.replaceState({}, '', url);
      }

      async function loadProjects() {
        const projects = await fetchJson('/projects');
        appState.projects = Array.isArray(projects) ? projects : [];
        const options = ['<option value="">No project context</option>']
          .concat(appState.projects.map((project) => '<option value="' + escapeHtmlClient(project.id) + '">' + escapeHtmlClient(project.name) + '</option>'))
          .join('');
        qs('projectId').innerHTML = options;
        qs('projectFilter').innerHTML = '<option value="">All projects</option>' + appState.projects
          .map((project) => '<option value="' + escapeHtmlClient(project.id) + '">' + escapeHtmlClient(project.name) + '</option>')
          .join('');
        if (initialState.projectId) {
          qs('projectId').value = initialState.projectId;
          qs('projectFilter').value = initialState.projectId;
          appState.filterProjectId = initialState.projectId;
        }
      }

      async function fillFromBrandMemory() {
        const projectId = qs('projectId').value;
        if (!projectId) {
          showToast('Select a project first');
          return;
        }

        const payload = await fetchJson('/projects/' + encodeURIComponent(projectId) + '/brand-memory');
        const brandMemory = payload.brandMemory || {};
        if (brandMemory.brandName) qs('productName').value = brandMemory.brandName;
        if (brandMemory.productDescription) qs('productDescription').value = brandMemory.productDescription;
        if (brandMemory.targetAudience) qs('audience').value = brandMemory.targetAudience;
        showToast('Brand memory loaded');
      }

      function buildListUrl() {
        const params = new URLSearchParams();
        params.set('limit', '40');
        if (qs('projectFilter').value) params.set('projectId', qs('projectFilter').value);
        if (qs('statusFilter').value) params.set('status', qs('statusFilter').value);
        return '/seo-briefing/runs?' + params.toString();
      }

      async function loadRuns() {
        const runs = await fetchJson(buildListUrl());
        appState.runs = Array.isArray(runs) ? runs : [];
        renderRunList();

        if (appState.selectedRunId) {
          const stillExists = appState.runs.some((item) => item.id === appState.selectedRunId);
          if (stillExists) {
            await selectRun(appState.selectedRunId, false);
            return;
          }
        }

        if (!appState.selectedRunId && initialState.runId) {
          await selectRun(initialState.runId, false);
          return;
        }

        if (!appState.selectedRunId && appState.runs[0]) {
          await selectRun(appState.runs[0].id, false);
        }
      }

      function renderRunList() {
        const container = qs('runList');
        if (appState.runs.length === 0) {
          container.innerHTML = '<div class="empty">No runs match the current filters.</div>';
          return;
        }

        container.innerHTML = appState.runs.map((run) => {
          const active = run.id === appState.selectedRunId ? ' is-active' : '';
          return '<article class="run-item' + active + '" data-run-id="' + escapeHtmlClient(run.id) + '">' +
            '<div class="run-item-top">' +
              '<div class="stack">' +
                '<strong>' + escapeHtmlClient(run.topicSeed) + '</strong>' +
                '<div class="inline-meta"><span>' + escapeHtmlClient(getProjectName(run.projectId)) + '</span><span>' + escapeHtmlClient(run.market.country) + ' · ' + escapeHtmlClient(run.market.language) + '</span></div>' +
              '</div>' +
              '<span class="badge ' + statusClass(run.status) + '">' + escapeHtmlClient(run.status) + '</span>' +
            '</div>' +
            '<div class="inline-meta">' +
              '<span>' + escapeHtmlClient(run.selectedClusterLabel || 'No selected cluster yet') + '</span>' +
              '<span>' + escapeHtmlClient(run.finalBriefTitle || 'No final brief yet') + '</span>' +
            '</div>' +
            '<div class="inline-meta">' +
              '<span>' + escapeHtmlClient(Math.round((run.metricsSummary?.totalRunDurationMs ?? 0) / 1000) + 's') + '</span>' +
            '</div>' +
            '<div class="inline-meta">' +
              '<span class="mono">' + escapeHtmlClient(run.id) + '</span>' +
              '<span>' + escapeHtmlClient(prettyDate(run.updatedAt)) + '</span>' +
            '</div>' +
          '</article>';
        }).join('');

        container.querySelectorAll('[data-run-id]').forEach((node) => {
          node.addEventListener('click', () => selectRun(node.getAttribute('data-run-id')));
        });
      }

      function readBalanceOverride() {
        const seoWeight = Number(qs('detailSeoWeight')?.value ?? 'NaN');
        const productWeight = Number(qs('detailProductWeight')?.value ?? 'NaN');
        const payload = {};

        if (Number.isFinite(seoWeight)) payload.seoWeight = seoWeight;
        if (Number.isFinite(productWeight)) payload.productWeight = productWeight;

        return Object.keys(payload).length ? payload : null;
      }

      async function runControlAction(runId, path, payload, successMessage) {
        await fetchJson('/seo-briefing/runs/' + encodeURIComponent(runId) + path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload || {}),
        });
        showToast(successMessage);
        await loadRuns();
        await selectRun(runId, false);
      }

      function renderDetail(run) {
        const finalBrief = run.finalBrief?.briefPayload || null;
        const uiLogsHidden = areUiLogsHidden(run.id);
        const hasKeywordHypotheses = Boolean(findArtifact(run, 'keyword_hypotheses'));
        const hasKeywordSerpPreview = Boolean(
          findArtifact(run, 'keyword_serp_preview_snapshots') ||
            findArtifact(run, 'first_keyword_serp_preview_snapshot'),
        );
        const hasKeywordSerpDerivedKeywords = Boolean(
          findArtifact(run, 'keyword_serp_derived_keywords') ||
            findArtifact(run, 'first_keyword_serp_derived_keywords'),
        );
        const hasKeywordRelatedQuerySelection = Boolean(
          findArtifact(run, 'keyword_related_query_selections') ||
            findArtifact(run, 'first_keyword_related_query_selection'),
        );
        const outline = Array.isArray(finalBrief?.outline) ? finalBrief.outline : [];
        const faq = Array.isArray(finalBrief?.faq) ? finalBrief.faq : [];
        const nextStage = findNextStage(run);
        const runningStage = findRunningStage(run);
        const workflowStage = runningStage || nextStage || getLatestCompletedStage(run);
        const workflowMeta = workflowStage ? STAGE_META[workflowStage] : null;
        const isFirstKeywordSerpGate =
          !runningStage &&
          nextStage === 'keyword_research' &&
          hasKeywordHypotheses &&
          run.status !== 'done' &&
          run.status !== 'rejected' &&
          run.status !== 'needs_manual_review';
        const canContinue =
          !isFirstKeywordSerpGate &&
          !isBusyStatus(run.status) &&
          nextStage &&
          run.status !== 'done' &&
          run.status !== 'rejected' &&
          run.status !== 'needs_manual_review';
        const workflowTitle = isFirstKeywordSerpGate
          ? 'Review First Keyword SERP'
          : workflowMeta?.title || 'Run Ready';
        const workflowMessage = isFirstKeywordSerpGate
          ? hasKeywordSerpPreview
            ? 'The keyword SERP snapshots are saved below. Review the extracted SERP data before changing the next pipeline stage.'
            : 'Before any deeper research step, fetch live Google SERP snapshots for every generated keyword and review the normalized data.'
          : canContinue
            ? workflowMeta?.action || 'Approve and continue to the next step.'
            : run.status === 'done'
              ? 'The workflow is complete.'
              : run.status === 'needs_manual_review'
                ? 'This run is waiting for manual review.'
                : run.status === 'rejected'
                  ? 'This run was rejected and will not advance automatically.'
                  : 'This run is waiting for the next operator action.';
        const workflowCardHtml = isBusyStatus(run.status)
          ? (
              '<section class="card full">' +
                '<div class="section-head"><div class="stack"><div class="eyebrow">Processing</div><h3>' + escapeHtmlClient(workflowMeta?.title || 'Working') + '</h3></div><span class="badge ' + statusClass(run.status) + '">' + escapeHtmlClient(run.status) + '</span></div>' +
                '<div class="progress-shell">' +
                  '<p>' + escapeHtmlClient(workflowMeta?.loading || 'The system is working on the next SEO brief step.') + '</p>' +
                  '<div class="progress-track"><div class="progress-bar"></div></div>' +
                '</div>' +
              '</section>'
            )
          : (
              '<section class="card full">' +
                '<div class="section-head"><div class="stack"><div class="eyebrow">Workflow</div><h3>' + escapeHtmlClient(workflowTitle) + '</h3></div><span class="badge ' + statusClass(run.status) + '">' + escapeHtmlClient(run.status) + '</span></div>' +
                '<p>' + escapeHtmlClient(workflowMessage) + '</p>' +
                ((canContinue || hasKeywordHypotheses || hasKeywordSerpDerivedKeywords)
                  ? '<div class="actions">' +
                      (canContinue
                        ? '<button type="button" class="primary" id="continueRunBtn">' + escapeHtmlClient(workflowMeta?.action || 'Continue') + '</button>'
                        : '') +
                      (hasKeywordHypotheses
                        ? '<button type="button" class="' + escapeHtmlClient((isFirstKeywordSerpGate ? 'primary ' : '') + (appState.serpPreviewLoading ? 'is-loading' : '')) + '" id="previewKeywordSerpsBtn" ' + (appState.serpPreviewLoading ? 'disabled' : '') + '>' + escapeHtmlClient(appState.serpPreviewLoading ? 'Fetching SERPs...' : hasKeywordSerpPreview ? 'Refresh SERPs For All Keywords' : 'Fetch SERPs For All Keywords') + '</button>'
                        : '') +
                      (hasKeywordSerpDerivedKeywords
                        ? '<button type="button" class="' + escapeHtmlClient(appState.relatedQuerySelectionLoading ? 'is-loading' : '') + '" id="selectKeywordRelatedQueriesBtn" ' + (appState.relatedQuerySelectionLoading ? 'disabled' : '') + '>' + escapeHtmlClient(appState.relatedQuerySelectionLoading ? 'Selecting related queries...' : hasKeywordRelatedQuerySelection ? 'Refresh Related Query Selection For All' : 'Select Related Queries For All') + '</button>'
                        : '') +
                    '</div>'
                  : '') +
                (appState.serpPreviewLoading
                  ? '<div class="inline-progress"><p>Fetching live Google SERP from DataForSEO for every generated keyword and saving normalized snapshots.</p><div class="progress-track"><div class="progress-bar"></div></div></div>'
                  : '') +
                (appState.relatedQuerySelectionLoading
                  ? '<div class="inline-progress"><p>Selecting up to 3 grounded related queries per keyword from SERP-derived candidates. The model can only choose existing queries.</p><div class="progress-track"><div class="progress-bar"></div></div></div>'
                  : '') +
              '</section>'
            );
        const stageOutputHtml =
          '<section class="card full">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">Latest Output</div><h3>' + escapeHtmlClient(STAGE_META[getLatestCompletedStage(run)]?.title || 'No Completed Step Yet') + '</h3></div></div>' +
            renderStageOutput(run) +
          '</section>';
        const scoreLogsHtml = run.scoreLogs.length === 0
          ? '<div class="empty">No score logs yet.</div>'
          : run.scoreLogs.map((item) => (
              '<div class="score-item">' +
                '<div class="inline-meta"><strong>' + escapeHtmlClient(item.formulaName) + '</strong><span>' + escapeHtmlClient(prettyDate(item.createdAt)) + '</span></div>' +
                '<pre>' + escapeHtmlClient(prettyJson(item.resultPayload)) + '</pre>' +
              '</div>'
            )).join('');

        const llmLogsHtml = run.llmCalls.length === 0
          ? '<div class="empty">No LLM calls yet.</div>'
          : run.llmCalls.map((log) => (
              '<details><summary>' + escapeHtmlClient(log.operation) + ' · ' + escapeHtmlClient(log.status) + '</summary>' +
                '<div><pre>' + escapeHtmlClient(prettyJson({
                  model: log.model,
                  promptVersion: log.promptVersion,
                  tokenUsageInput: log.tokenUsageInput,
                  tokenUsageOutput: log.tokenUsageOutput,
                  estimatedCost: log.estimatedCost,
                  requestPayload: log.requestPayload,
                  responsePayload: log.responsePayload,
                  errorMessage: log.errorMessage,
                })) + '</pre></div></details>'
            )).join('');

        const externalLogsHtml = run.externalCalls.length === 0
          ? '<div class="empty">No external calls yet.</div>'
          : run.externalCalls.map((log) => (
              '<details><summary>' + escapeHtmlClient(log.provider + ' · ' + log.endpoint) + '</summary>' +
                '<div><pre>' + escapeHtmlClient(prettyJson({
                  status: log.status,
                  cacheHit: log.cacheHit,
                  estimatedCost: log.estimatedCost,
                  requestPayload: log.requestPayload,
                  responsePayload: log.responsePayload,
                  errorMessage: log.errorMessage,
                })) + '</pre></div></details>'
            )).join('');

        qs('detailContent').innerHTML =
          '<section class="card full">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">Run</div><h2>' + escapeHtmlClient(run.topicSeed) + '</h2></div><span class="badge ' + statusClass(run.status) + '">' + escapeHtmlClient(run.status) + '</span></div>' +
            '<dl class="definition-list">' +
              '<dt>Run ID</dt><dd class="mono">' + escapeHtmlClient(run.id) + '</dd>' +
              '<dt>Project</dt><dd>' + escapeHtmlClient(getProjectName(run.projectId)) + '</dd>' +
              '<dt>Market</dt><dd>' + escapeHtmlClient(run.market.country + ' · ' + run.market.language) + '</dd>' +
              '<dt>Product</dt><dd>' + escapeHtmlClient(run.product.name) + '</dd>' +
              '<dt>Created</dt><dd>' + escapeHtmlClient(prettyDate(run.createdAt)) + '</dd>' +
              '<dt>Updated</dt><dd>' + escapeHtmlClient(prettyDate(run.updatedAt)) + '</dd>' +
              '<dt>Failure Reason</dt><dd>' + escapeHtmlClient(run.failureReason || '—') + '</dd>' +
            '</dl>' +
            '<div class="actions">' +
              '<button type="button" id="toggleUiLogsBtn">' + escapeHtmlClient(uiLogsHidden ? 'Show UI Logs' : 'Clear UI Logs') + '</button>' +
            '</div>' +
            (uiLogsHidden ? '<p class="empty">UI logs for this run are hidden locally in this browser.</p>' : '') +
          '</section>' +

          workflowCardHtml +
          stageOutputHtml +
          renderFirstKeywordSerpPreview(run) +

          '<section class="card">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">Final Brief</div><h3>' + escapeHtmlClient(finalBrief?.title || 'Not generated yet') + '</h3></div></div>' +
            (finalBrief ? (
              '<div class="stack">' +
                '<p><strong>Meta Title:</strong> ' + escapeHtmlClient(finalBrief.metaTitle || '—') + '</p>' +
                '<p><strong>Meta Description:</strong> ' + escapeHtmlClient(finalBrief.metaDescription || '—') + '</p>' +
                '<p><strong>Angle:</strong> ' + escapeHtmlClient(finalBrief.angle || '—') + '</p>' +
                '<p><strong>Primary Keyword:</strong> ' + escapeHtmlClient(finalBrief.primaryKeyword || '—') + '</p>' +
                '<p><strong>Secondary Keywords:</strong> ' + escapeHtmlClient((finalBrief.secondaryKeywords || []).join(', ') || '—') + '</p>' +
                '<details open><summary>Outline</summary><div>' +
                  (outline.length ? outline.map((item) =>
                    '<div class="log-item"><strong>' + escapeHtmlClient(item.heading) + '</strong><p>' + escapeHtmlClient(item.purpose || '') + '</p><pre>' + escapeHtmlClient(prettyJson(item.keyPoints || [])) + '</pre></div>'
                  ).join('') : '<div class="empty">No outline yet.</div>') +
                '</div></details>' +
                '<details><summary>FAQ</summary><div>' +
                  (faq.length ? faq.map((item) =>
                    '<div class="log-item"><strong>' + escapeHtmlClient(item.question) + '</strong><p>' + escapeHtmlClient(item.answer || '') + '</p></div>'
                  ).join('') : '<div class="empty">No FAQ yet.</div>') +
                '</div></details>' +
                '<details><summary>Product Placement</summary><div><pre>' + escapeHtmlClient(prettyJson(finalBrief.productPlacement || null)) + '</pre></div></details>' +
              '</div>'
            ) : '<div class="empty">This run has not produced a final brief yet.</div>') +
          '</section>' +

          (uiLogsHidden ? '' : (
            '<section class="card full">' +
              '<div class="section-head"><div class="stack"><div class="eyebrow">Timeline</div><h3>Step Trace</h3></div></div>' +
              '<div class="timeline">' +
                run.steps.map((step) => (
                  '<div class="timeline-item">' +
                    '<div class="inline-meta"><strong>' + escapeHtmlClient(step.stage) + '</strong><span class="badge ' + statusClass(step.status) + '">' + escapeHtmlClient(step.status) + '</span></div>' +
                    '<div class="inline-meta"><span>Attempt ' + escapeHtmlClient(step.attemptNumber) + '</span><span>' + escapeHtmlClient(prettyDate(step.finishedAt || step.startedAt)) + '</span></div>' +
                    (step.errorMessage ? '<p>' + escapeHtmlClient(step.errorMessage) + '</p>' : '') +
                  '</div>'
                )).join('') +
              '</div>' +
            '</section>' +

            '<section class="card">' +
              '<div class="section-head"><div class="stack"><div class="eyebrow">Scores</div><h3>Score Logs</h3></div></div>' +
              '<div class="score-list">' + scoreLogsHtml + '</div>' +
            '</section>' +

            '<section class="card">' +
              '<div class="section-head"><div class="stack"><div class="eyebrow">Logs</div><h3>LLM Calls</h3></div></div>' +
              '<div class="log-list">' + llmLogsHtml + '</div>' +
            '</section>' +

            '<section class="card full">' +
              '<div class="section-head"><div class="stack"><div class="eyebrow">External</div><h3>External Calls</h3></div></div>' +
              '<div class="log-list">' + externalLogsHtml + '</div>' +
            '</section>'
          ));

        bindDetailActions(run);
      }

      function bindDetailActions(run) {
        qs('toggleUiLogsBtn')?.addEventListener('click', () => {
          const nextHidden = !areUiLogsHidden(run.id);
          setUiLogsHidden(run.id, nextHidden);
          renderDetail(run);
          showToast(nextHidden ? 'UI logs hidden for this run' : 'UI logs shown for this run');
        });
        qs('continueRunBtn')?.addEventListener('click', async () => {
          await runControlAction(
            run.id,
            '/continue',
            {},
            'Next semantic step queued'
          );
        });
        qs('previewKeywordSerpsBtn')?.addEventListener('click', async () => {
          if (appState.serpPreviewLoading) return;
          appState.serpPreviewLoading = true;
          renderDetail(run);
          try {
            await fetchJson('/seo-briefing/runs/' + encodeURIComponent(run.id) + '/preview-keyword-serps', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({}),
            });
            showToast('SERP snapshots saved for all generated keywords');
            await loadRuns();
            appState.serpPreviewLoading = false;
            await selectRun(run.id, false);
          } catch (error) {
            appState.serpPreviewLoading = false;
            renderDetail(run);
            showToast(error instanceof Error ? error.message : 'Failed to fetch SERP snapshots');
          }
        });
        qs('selectKeywordRelatedQueriesBtn')?.addEventListener('click', async () => {
          if (appState.relatedQuerySelectionLoading) return;
          appState.relatedQuerySelectionLoading = true;
          renderDetail(run);
          try {
            await fetchJson(
              '/seo-briefing/runs/' +
                encodeURIComponent(run.id) +
                '/select-keyword-related-queries',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
              },
            );
            showToast('Related queries selected from SERP evidence for all keywords');
            await loadRuns();
            appState.relatedQuerySelectionLoading = false;
            await selectRun(run.id, false);
          } catch (error) {
            appState.relatedQuerySelectionLoading = false;
            renderDetail(run);
            showToast(
              error instanceof Error ? error.message : 'Failed to select related queries',
            );
          }
        });
      }

      async function selectRun(runId, shouldUpdateUrl = true) {
        if (!runId) return;
        appState.selectedRunId = runId;
        renderRunList();
        if (shouldUpdateUrl) updateUrl(runId);
        const run = await fetchJson('/seo-briefing/runs/' + encodeURIComponent(runId));
        appState.selectedRun = run;
        renderDetail(run);
        syncRunPolling(run);
      }

      async function createRun(event) {
        event.preventDefault();
        const launchBtn = qs('launchBtn');
        launchBtn.disabled = true;
        try {
          const payload = {
            projectId: qs('projectId').value || null,
            topicSeed: qs('topicSeed').value,
            market: {
              country: qs('country').value,
              language: qs('language').value,
            },
            audience: qs('audience').value,
            keywordExpansionPrompt: qs('keywordExpansionPrompt').value || null,
            product: {
              name: qs('productName').value,
              description: qs('productDescription').value,
            },
            keyMessage: qs('keyMessage').value || null,
            audienceShift: qs('audienceBefore').value && qs('audienceAfter').value
              ? { before: qs('audienceBefore').value, after: qs('audienceAfter').value }
              : null,
            cta: qs('cta').value || null,
            seoProductBalance: {
              seoWeight: Number(qs('seoWeight').value || '0.5'),
              productWeight: Number(qs('productWeight').value || '0.5'),
            },
          };
          const result = await fetchJson('/seo-briefing/runs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          showToast(result.deduplicated ? 'Reused recent run: ' + result.runId : 'Generating first 3 keyword hypotheses');
          await loadRuns();
          await selectRun(result.runId);
        } catch (error) {
          showToast(error instanceof Error ? error.message : 'Failed to create run');
        } finally {
          launchBtn.disabled = false;
        }
      }

      async function boot() {
        qs('launchForm').addEventListener('submit', createRun);
        qs('balanceSlider').addEventListener('input', syncBalanceSlider);
        syncBalanceSlider();
        qs('refreshAllBtn').addEventListener('click', async () => {
          await loadRuns();
          if (appState.selectedRunId) {
            await selectRun(appState.selectedRunId, false);
          }
          showToast('Refreshed');
        });
        qs('applyFiltersBtn').addEventListener('click', async () => {
          appState.selectedRunId = null;
          await loadRuns();
          updateUrl(null);
        });
        qs('clearFiltersBtn').addEventListener('click', async () => {
          qs('projectFilter').value = '';
          qs('statusFilter').value = '';
          appState.selectedRunId = null;
          await loadRuns();
          updateUrl(null);
        });
        qs('fillFromBrandMemoryBtn').addEventListener('click', fillFromBrandMemory);

        await loadProjects();
        await loadRuns();
      }

      boot().catch((error) => {
        qs('detailContent').innerHTML = '<div class="empty full">Failed to boot UI: ' + escapeHtmlClient(error instanceof Error ? error.message : 'Unknown error') + '</div>';
      });
    </script>
  </body>
</html>`;
  }
}
