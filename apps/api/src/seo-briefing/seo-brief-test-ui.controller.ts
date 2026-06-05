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
  getSeoBriefUi(
    @Query('runId') runId?: string,
    @Query('projectId') projectId?: string,
    @Query('step') step?: string,
  ): string {
    const initialState = JSON.stringify({
      runId: runId?.trim() || null,
      projectId: projectId?.trim() || null,
      step: step?.trim() || null,
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
        grid-template-columns: minmax(0, 1fr);
        align-items: start;
      }
      .sidebar {
        display: contents;
      }
      .sidebar > .panel:first-child {
        order: 1;
      }
      .detail {
        display: grid;
        gap: 18px;
        order: 2;
      }
      .sidebar > .panel:last-child {
        order: 3;
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
      label.field span, .field > span {
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
      .input-mode-tabs {
        display: grid;
        gap: 8px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .input-mode-tabs label {
        display: flex;
        align-items: center;
        gap: 8px;
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 10px 12px;
        background: rgba(255, 255, 255, 0.58);
        cursor: pointer;
      }
      .context-panel {
        border: 1px solid rgba(27, 107, 75, 0.18);
        border-radius: 22px;
        padding: 14px;
        background: rgba(27, 107, 75, 0.07);
        display: grid;
        gap: 10px;
      }
      .context-panel[hidden] {
        display: none;
      }
      .context-result {
        border: 1px dashed var(--line-strong);
        border-radius: 18px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.62);
        color: var(--muted);
        display: grid;
        gap: 8px;
      }
      .context-result strong {
        color: var(--text);
      }
      .context-result ul {
        margin: 0;
        padding-left: 18px;
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
      .brand-memory-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .brand-memory-block {
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 12px 14px;
        background: rgba(255,255,255,0.72);
        display: grid;
        gap: 8px;
      }
      .brand-memory-block.full {
        grid-column: 1 / -1;
      }
      .brand-memory-block h4 {
        margin: 0;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--muted);
      }
      .brand-memory-block ul {
        margin: 0;
        padding-left: 18px;
        display: grid;
        gap: 4px;
      }
      .brand-memory-block li {
        color: var(--ink);
      }
      .brand-memory-block .muted {
        color: var(--muted);
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
      .metric-grid {
        display: grid;
        gap: 10px;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        margin: 14px 0;
      }
      .metric-grid > div {
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 12px 14px;
        background: rgba(255,255,255,0.62);
        display: grid;
        gap: 4px;
      }
      .metric-grid strong {
        font-size: 22px;
      }
      .metric-grid span, .section-subhead p {
        color: var(--muted);
      }
      .section-subhead {
        margin: 18px 0 10px;
      }
      .section-subhead h4 {
        margin: 0 0 4px;
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
      .seo-step-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .seo-step-tab {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        padding: 10px 14px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,0.62);
        color: var(--muted);
      }
      .seo-step-tab.is-active {
        background: var(--text);
        border-color: var(--text);
        color: white;
      }
      .seo-step-tab.is-ready:not(.is-active) {
        color: #117a43;
        border-color: rgba(17, 122, 67, 0.34);
        background: rgba(17, 122, 67, 0.08);
      }
      .seo-step-tab.is-ready:not(.is-active) .seo-step-dot {
        background: #117a43;
        opacity: 1;
      }
      .seo-step-dot {
        width: 7px;
        height: 7px;
        border-radius: 999px;
        background: currentColor;
        opacity: 0.6;
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
        grid-template-columns: minmax(0, 1fr);
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
            <button type="button" class="primary" id="startNewRunBtn">Start New SEO Brief</button>
            <button type="button" id="refreshAllBtn">Refresh</button>
            <a class="button-like" href="/seo-briefing/health">Health</a>
          </div>
        </div>
      </section>

      <div class="main">
        <aside class="sidebar">
          <section class="panel" id="launchPanel">
            <div class="section-head">
              <div class="stack">
                <div class="eyebrow">Step 0</div>
                <h2>Input</h2>
              </div>
              <button class="primary" type="submit" id="launchBtn" form="launchForm">Create SEO Brief Run</button>
            </div>
            <form id="launchForm" class="launch-grid">
              <label class="field full">
                <span>Project</span>
                <select id="projectId">
                  <option value="">No project context</option>
                </select>
              </label>
              <label class="field full">
                <span>AI Model</span>
                <select id="aiModelMode">
                  <option value="flash">Flash - faster, cheaper, no thinking</option>
                  <option value="pro" selected>Pro - better quality, no thinking</option>
                  <option value="pro_thinking">Pro Thinking - best reasoning, slower</option>
                </select>
              </label>
              <div class="field full">
                <span>Input Mode</span>
                <div class="input-mode-tabs">
                  <label><input type="radio" name="inputMode" value="manual" checked /> Manual fields</label>
                  <label><input type="radio" name="inputMode" value="brief_text" /> One brief text</label>
                  <label><input type="radio" name="inputMode" value="file" /> File</label>
                </div>
              </div>
              <section id="briefTextPanel" class="context-panel full" hidden>
                <label class="field full">
                  <span>One Brief Text</span>
                  <textarea id="briefContextText" placeholder="Paste the full SEO task brief here: topic, launch context, market, audience, product context, constraints, CTA."></textarea>
                </label>
                <div class="actions">
                  <button type="button" id="extractBriefTextBtn">Extract Fields From Text</button>
                </div>
              </section>
              <section id="filePanel" class="context-panel full" hidden>
                <label class="field full">
                  <span>Brief File</span>
                  <input id="briefContextFile" type="file" accept=".txt,.md,.json,.csv,text/plain,text/markdown,application/json" />
                </label>
                <div class="actions">
                  <button type="button" id="extractFileBtn">Extract Fields From File</button>
                </div>
              </section>
              <div id="contextExtractionResult" class="context-result full" hidden></div>
              <textarea id="campaignContext" hidden></textarea>
              <label class="field full">
                <span>Topic Hint</span>
                <em>Research direction from the marketer. This is not a final keyword and not an article title.</em>
                <textarea id="topicHint" required>How people in emerging markets can make idle USDT productive</textarea>
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
              <label class="field full">
                <span>User Pains</span>
                <em>Manual input from marketer. One per line or comma-separated. AI does not generate this step anymore.</em>
                <textarea id="userPains" required>Save money in dollars
Avoid naira devaluation
Make idle USDT useful without hype</textarea>
              </label>
              <label class="field full">
                <span>User Scenarios</span>
                <em>Manual search, behavior, ecosystem, comparison, or action scenarios.</em>
                <textarea id="userScenarios" required>Uses Binance P2P
Stores USDT in Trust Wallet
Needs to understand TRC20 vs BEP20</textarea>
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
              <label class="field full">
                <span>Known Competitor Domains To Include</span>
                <em>Optional. One domain per line or comma-separated. These are explicit competitor targets for DataForSEO Ranked Keywords.</em>
                <textarea id="knownCompetitorsMustInclude">binance.com
nexo.com</textarea>
              </label>
              <label class="field">
                <span>Optional Competitor Domains</span>
                <textarea id="knownCompetitorsOptional">trustwallet.com
kraken.com</textarea>
              </label>
              <label class="field">
                <span>Competitors / Sources To Exclude</span>
                <textarea id="knownCompetitorsExclude">Scammy faucets
Unsupported regions</textarea>
              </label>
              <label class="field full">
                <span>Brand Constraints</span>
                <textarea id="brandConstraints">No hype
No get-rich-quick framing
Keep trust and proof central</textarea>
              </label>
              <label class="field full">
                <span>Claims / Compliance Constraints</span>
                <textarea id="claimsConstraints">Do not promise guaranteed returns
Explain risks clearly
Do not present yield as risk-free</textarea>
              </label>
              <label class="field full">
                <span>Preferred Angle</span>
                <input id="preferredAngle" value="Educational comparison for cautious USDT holders" />
              </label>
              <label class="field full">
                <span>Excluded Topics</span>
                <textarea id="excludedTopics">Airdrops
Faucets
High-risk leverage</textarea>
              </label>
              <label class="field">
                <span>Audience Before</span>
                <input id="audienceBefore" value="User holds USDT but does not understand earning options." />
              </label>
              <label class="field">
                <span>Audience After</span>
                <input id="audienceAfter" value="User understands the options and sees Reinforce as one practical next step." />
              </label>
              <label class="field">
                <span>Hypotheses Count</span>
                <input id="hypothesesCount" type="number" min="1" max="100" step="1" value="10" />
              </label>
              <label class="field">
                <span>SERP Enrichment Count</span>
                <input id="serpEnrichmentCount" type="number" min="1" max="100" step="1" value="10" />
              </label>
              <label class="field full">
                <span>Competitor Keywords JSON ID</span>
                <input id="competitorKeywordsJsonId" placeholder="nigeria_usdt_wallet_cex_v1_2026_06_04" />
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
        initialRunSelectionDone: false,
        activeSeoStep: initialState.step || 'input',
        keywordHypothesesLoading: false,
        serpPreviewLoading: false,
        serpDerivedCandidatesLoading: false,
        rankedKeywordsLoading: false,
        competitorMatchingLoading: false,
        dirtyKeywordPoolLoading: false,
        candidateScoringLoading: false,
        keywordClusteringLoading: false,
        clusterProductFitLoading: false,
        clusterSelectionLoading: false,
        onPageLoading: false,
        onPageSynthesisLoading: false,
        finalBriefLoading: false,
      };
      let launchPanelNode = null;
      const DEFAULT_KEYWORD_EXPANSION_PROMPT = ${defaultKeywordExpansionPromptJson};
      const UI_LOGS_HIDDEN_STORAGE_KEY = 'seoBriefing.hiddenUiLogRunIds';
      const SEO_STEP_TABS = [
        { id: 'input', label: 'Input' },
        { id: 'keywords', label: 'Keywords' },
        { id: 'serp', label: 'SERP Snapshots' },
        { id: 'candidates', label: 'SERP Candidates' },
        { id: 'rankedKeywords', label: 'Competitor Keywords' },
        { id: 'competitorMatching', label: 'Matching' },
        { id: 'dirtyPool', label: 'Dirty Pool' },
        { id: 'candidateScoring', label: 'Filtering' },
        { id: 'clusters', label: 'Clusters' },
        { id: 'productFit', label: 'Product Fit' },
        { id: 'selection', label: 'Selection' },
        { id: 'onPage', label: 'OnPage' },
        { id: 'onPageSynthesis', label: 'OnPage Synthesis' },
        { id: 'finalBrief', label: 'Final Brief' },
      ];

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

      function getInputMode() {
        return document.querySelector('input[name="inputMode"]:checked')?.value || 'manual';
      }

      function syncInputMode() {
        const mode = getInputMode();
        qs('briefTextPanel').hidden = mode !== 'brief_text';
        qs('filePanel').hidden = mode !== 'file';
      }

      function readTextFile(file) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(reader.error || new Error('File read failed'));
          reader.readAsText(file);
        });
      }

      function setIfPresent(id, value) {
        if (typeof value !== 'string' || !value.trim()) return;
        qs(id).value = value.trim();
      }

      function setListIfPresent(id, value) {
        if (!Array.isArray(value) || value.length === 0) return;
        const nextValue = value
          .filter((item) => typeof item === 'string' && item.trim())
          .map((item) => item.trim())
          .join('\\n');
        if (nextValue) qs(id).value = nextValue;
      }

      function parseListInput(id) {
        return qs(id).value
          .split(/[\\n,]/)
          .map((item) => item.trim())
          .filter(Boolean);
      }

      function applyExtractedContext(result) {
        setIfPresent('topicHint', result.topicHint || result.topicSeed);
        setIfPresent('country', result.country);
        setIfPresent('language', result.language);
        setIfPresent('audience', result.audience);
        setListIfPresent('userPains', result.userPains);
        setListIfPresent('userScenarios', result.userScenarios);
        setIfPresent('productName', result.productName);
        setIfPresent('productDescription', result.productDescription);
        setIfPresent('keyMessage', result.keyMessage);
        setIfPresent('audienceBefore', result.audienceBefore);
        setIfPresent('audienceAfter', result.audienceAfter);
        setIfPresent('cta', result.cta);
        setListIfPresent('knownCompetitorsMustInclude', result.knownCompetitors);
        setListIfPresent('brandConstraints', result.brandConstraints);
        setListIfPresent('claimsConstraints', result.claimsConstraints);
        setIfPresent('preferredAngle', result.preferredAngle);
        setListIfPresent('excludedTopics', result.excludedTopics);
        const contextLines = []
          .concat(Array.isArray(result.temporaryConstraints) ? result.temporaryConstraints.map((item) => 'Constraint: ' + item) : [])
          .concat(Array.isArray(result.notes) ? result.notes.map((item) => 'Note: ' + item) : []);
        qs('campaignContext').value = contextLines.join('\\n').slice(0, 8000);
      }

      function renderExtractionResult(result) {
        const missing = Array.isArray(result.missingFields) ? result.missingFields : [];
        const constraints = Array.isArray(result.temporaryConstraints) ? result.temporaryConstraints : [];
        const notes = Array.isArray(result.notes) ? result.notes : [];
        const root = qs('contextExtractionResult');
        root.hidden = false;
        root.innerHTML =
          '<strong>' + (missing.length > 0 ? 'Missing fields' : 'Extracted fields look usable') + '</strong>' +
          (missing.length > 0
            ? '<ul>' + missing.map((item) => '<li>' + escapeHtmlClient(item) + '</li>').join('') + '</ul>'
            : '<p>Review the filled fields below before launching the run.</p>') +
          (constraints.length > 0
            ? '<strong>Temporary constraints</strong><ul>' + constraints.map((item) => '<li>' + escapeHtmlClient(item) + '</li>').join('') + '</ul>'
            : '') +
          (notes.length > 0
            ? '<strong>Notes</strong><ul>' + notes.map((item) => '<li>' + escapeHtmlClient(item) + '</li>').join('') + '</ul>'
            : '');
      }

      async function extractContextFromText(contextText) {
        const trimmed = String(contextText || '').trim();
        if (!trimmed) {
          showToast('Brief context is empty');
          return;
        }
        const result = await fetchJson('/seo-briefing/context/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            aiModelMode: qs('aiModelMode').value,
            contextText: trimmed,
          }),
        });
        applyExtractedContext(result);
        renderExtractionResult(result);
        showToast('Brief context extracted');
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
          loading: 'AI is generating 10 initial keyword hypotheses from the topic, audience, product, and brand memory.',
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

      function readRunAiModelMode(run) {
        const artifact = findArtifact(run, 'normalized_input');
        const value = artifact?.payload?.aiModelMode;
        return value === 'flash' || value === 'pro' || value === 'pro_thinking' ? value : 'pro';
      }

      function aiModelModeLabel(value) {
        if (value === 'flash') return 'Flash';
        if (value === 'pro_thinking') return 'Pro Thinking';
        return 'Pro';
      }

      function renderMemoryList(items, emptyText) {
        const values = Array.isArray(items)
          ? items.filter((item) => typeof item === 'string' && item.trim())
          : [];
        return values.length
          ? '<ul>' + values.map((item) => '<li>' + escapeHtmlClient(item.trim()) + '</li>').join('') + '</ul>'
          : '<p class="muted">' + escapeHtmlClient(emptyText) + '</p>';
      }

      function renderBrandMemorySnapshot(run) {
        const artifact = findArtifact(run, 'brand_memory_snapshot');
        const payload = artifact?.payload || {};
        const snapshot = payload.snapshot || run.brandMemorySnapshot || {};
        const summary = payload.summary || {};
        const source = typeof payload.source === 'string' ? payload.source : 'unknown';
        const sourceLabel = source === 'project_brand_memory'
          ? 'Project Brand Memory'
          : source === 'input_fallback'
            ? 'Input fallback'
            : source;
        const glossary = snapshot.glossary && typeof snapshot.glossary === 'object' && !Array.isArray(snapshot.glossary)
          ? snapshot.glossary
          : {};
        const glossaryEntries = Object.entries(glossary);
        const brandDocs = Array.isArray(snapshot.brandDocs) ? snapshot.brandDocs : [];
        const usageRules = Array.isArray(payload.usageRules) ? payload.usageRules : [];

        return (
          '<section class="card full">' +
            '<div class="section-head">' +
              '<div class="stack"><div class="eyebrow">Algorithm Step 2</div><h3>Brand Memory Snapshot</h3></div>' +
              '<span class="badge">' + escapeHtmlClient(sourceLabel) + '</span>' +
            '</div>' +
            '<p>' + escapeHtmlClient(payload.purpose || 'Brand Memory used as source-of-truth for product, trust, claims, and phrase constraints.') + '</p>' +
            '<dl class="definition-list">' +
              '<dt>Brand</dt><dd>' + escapeHtmlClient(snapshot.brandName || run.product.name || '—') + '</dd>' +
              '<dt>Source Project</dt><dd>' + escapeHtmlClient(payload.projectName || payload.projectId || run.projectId || '—') + '</dd>' +
              '<dt>Approved Facts</dt><dd>' + escapeHtmlClient(String(summary.approvedFactCount ?? (snapshot.approvedFacts || []).length ?? 0)) + '</dd>' +
              '<dt>Forbidden Claims</dt><dd>' + escapeHtmlClient(String(summary.forbiddenClaimCount ?? (snapshot.forbiddenClaims || []).length ?? 0)) + '</dd>' +
              '<dt>Required / Banned Phrases</dt><dd>' + escapeHtmlClient(String(summary.requiredPhraseCount ?? (snapshot.requiredPhrases || []).length ?? 0)) + ' / ' + escapeHtmlClient(String(summary.bannedPhraseCount ?? (snapshot.bannedPhrases || []).length ?? 0)) + '</dd>' +
            '</dl>' +
            '<div class="brand-memory-grid">' +
              '<div class="brand-memory-block full"><h4>Product Description</h4><p>' + escapeHtmlClient(snapshot.productDescription || run.product.description || 'No product description in Brand Memory snapshot.') + '</p></div>' +
              '<div class="brand-memory-block full"><h4>Target Audience</h4><p>' + escapeHtmlClient(snapshot.targetAudience || run.audience || 'No target audience in Brand Memory snapshot.') + '</p></div>' +
              '<div class="brand-memory-block"><h4>Approved Facts</h4>' + renderMemoryList(snapshot.approvedFacts, 'No approved facts saved.') + '</div>' +
              '<div class="brand-memory-block"><h4>Forbidden Claims</h4>' + renderMemoryList(snapshot.forbiddenClaims, 'No forbidden claims saved.') + '</div>' +
              '<div class="brand-memory-block"><h4>Required Phrases</h4>' + renderMemoryList(snapshot.requiredPhrases, 'No required phrases saved.') + '</div>' +
              '<div class="brand-memory-block"><h4>Banned Phrases</h4>' + renderMemoryList(snapshot.bannedPhrases, 'No banned phrases saved.') + '</div>' +
              '<div class="brand-memory-block"><h4>Glossary</h4>' +
                (glossaryEntries.length
                  ? '<ul>' + glossaryEntries.map(([term, definition]) => '<li><strong>' + escapeHtmlClient(term) + ':</strong> ' + escapeHtmlClient(String(definition)) + '</li>').join('') + '</ul>'
                  : '<p class="muted">No glossary terms saved.</p>') +
              '</div>' +
              '<div class="brand-memory-block"><h4>Brand Docs</h4>' +
                (brandDocs.length
                  ? '<ul>' + brandDocs.map((doc) => '<li>' + escapeHtmlClient(doc.title || doc.url || 'Untitled doc') + (doc.notes ? ' · ' + escapeHtmlClient(doc.notes) : '') + '</li>').join('') + '</ul>'
                  : '<p class="muted">No brand docs saved.</p>') +
              '</div>' +
              '<div class="brand-memory-block full"><h4>Usage Rules</h4>' + renderMemoryList(usageRules, 'Default Brand Memory usage rules apply.') + '</div>' +
            '</div>' +
            '<details><summary>Raw Brand Memory Snapshot</summary><div><pre>' + escapeHtmlClient(prettyJson(payload.snapshot ? payload : { snapshot })) + '</pre></div></details>' +
          '</section>'
        );
      }

      function renderSeoProductContext(run) {
        const artifact = findArtifact(run, 'seo_product_context');
        if (!artifact?.payload) {
          return '';
        }

        const payload = artifact.payload;
        const researchFrame = payload.researchFrame || {};
        const competitorContext = payload.competitorContext || {};
        const marketerConstraints = payload.marketerConstraints || {};
        const brandMemoryContext = payload.brandMemoryContext || {};
        const sourcePriority = Array.isArray(payload.sourcePriority) ? payload.sourcePriority : [];
        const generationGuardrails = Array.isArray(payload.generationGuardrails) ? payload.generationGuardrails : [];

        return (
          '<section class="card full">' +
            '<div class="section-head">' +
              '<div class="stack"><div class="eyebrow">Algorithm Step 3</div><h3>SEO Product Context</h3></div>' +
              '<span class="badge">' + escapeHtmlClient(payload.artifactVersion || 'context') + '</span>' +
            '</div>' +
            '<p>' + escapeHtmlClient(payload.purpose || 'Compact SEO context assembled before keyword generation.') + '</p>' +
            '<div class="brand-memory-grid">' +
              '<div class="brand-memory-block full"><h4>Research Frame</h4>' +
                '<dl class="definition-list">' +
                  '<dt>Topic Hint</dt><dd>' + escapeHtmlClient(researchFrame.topicHint || run.topicSeed || '—') + '</dd>' +
                  '<dt>Market</dt><dd>' + escapeHtmlClient(((researchFrame.market?.country || run.market.country || '—') + ' · ' + (researchFrame.market?.language || run.market.language || '—'))) + '</dd>' +
                  '<dt>Audience</dt><dd>' + escapeHtmlClient(researchFrame.audience || run.audience || '—') + '</dd>' +
                  '<dt>Preferred Angle</dt><dd>' + escapeHtmlClient(researchFrame.preferredAngle || '—') + '</dd>' +
                  '<dt>Key Message</dt><dd>' + escapeHtmlClient(researchFrame.keyMessage || run.keyMessage || '—') + '</dd>' +
                  '<dt>CTA</dt><dd>' + escapeHtmlClient(researchFrame.cta || run.cta || '—') + '</dd>' +
                '</dl>' +
              '</div>' +
              '<div class="brand-memory-block"><h4>Competitors: Must Include</h4>' + renderMemoryList(competitorContext.mustInclude, 'No must-include competitors.') + '</div>' +
              '<div class="brand-memory-block"><h4>Competitors: Optional</h4>' + renderMemoryList(competitorContext.optional, 'No optional competitors.') + '</div>' +
              '<div class="brand-memory-block"><h4>Competitors / Sources To Exclude</h4>' + renderMemoryList(competitorContext.exclude, 'No excluded competitors.') + '</div>' +
              '<div class="brand-memory-block"><h4>Excluded Topics</h4>' + renderMemoryList(marketerConstraints.excludedTopics, 'No excluded topics.') + '</div>' +
              '<div class="brand-memory-block"><h4>Brand Constraints</h4>' + renderMemoryList(marketerConstraints.brandConstraints, 'No run-specific brand constraints.') + '</div>' +
              '<div class="brand-memory-block"><h4>Claims Constraints</h4>' + renderMemoryList(marketerConstraints.claimsConstraints, 'No run-specific claims constraints.') + '</div>' +
              '<div class="brand-memory-block full"><h4>Brand Memory Product Context</h4>' +
                '<p><strong>' + escapeHtmlClient(brandMemoryContext.brandName || run.product.name || 'Brand') + '</strong></p>' +
                '<p>' + escapeHtmlClient(brandMemoryContext.productDescription || run.product.description || 'No product description.') + '</p>' +
                renderMemoryList(brandMemoryContext.approvedFacts, 'No approved facts in Brand Memory.') +
              '</div>' +
              '<div class="brand-memory-block"><h4>Source Priority</h4>' + renderMemoryList(sourcePriority, 'Default source priority applies.') + '</div>' +
              '<div class="brand-memory-block"><h4>Generation Guardrails</h4>' + renderMemoryList(generationGuardrails, 'Default generation guardrails apply.') + '</div>' +
            '</div>' +
            '<details><summary>Raw SEO Product Context</summary><div><pre>' + escapeHtmlClient(prettyJson(payload)) + '</pre></div></details>' +
          '</section>'
        );
      }

      function renderUserPainScenarios(run) {
        const artifact = findArtifact(run, 'user_pain_scenarios');
        if (!artifact?.payload) {
          return '';
        }

        const payload = artifact.payload;
        const userPains = Array.isArray(payload.userPains) ? payload.userPains : [];
        const userScenarios = Array.isArray(payload.userScenarios) ? payload.userScenarios : [];
        const riskNotes = Array.isArray(payload.riskNotes) ? payload.riskNotes : [];

        const renderPain = (item) => (
          '<div class="stage-output-item">' +
            '<strong>' + escapeHtmlClient(item?.pain || 'Untitled pain') + '</strong>' +
            '<small>' + escapeHtmlClient(item?.productConnection || 'connection n/a') + '</small>' +
            '<p>' + escapeHtmlClient(item?.whyRelevant || 'No explanation provided.') + '</p>' +
          '</div>'
        );

        const renderScenario = (item) => (
          '<div class="stage-output-item">' +
            '<strong>' + escapeHtmlClient(item?.scenario || 'Untitled scenario') + '</strong>' +
            '<small>' + escapeHtmlClient([item?.type || null, item?.productFitHypothesis || null].filter(Boolean).join(' · ') || 'scenario') + '</small>' +
            '<p>' + escapeHtmlClient(item?.whyCheck || 'No explanation provided.') + '</p>' +
          '</div>'
        );

        return (
          '<section class="card full">' +
            '<div class="section-head">' +
              '<div class="stack"><div class="eyebrow">Algorithm Step 4</div><h3>User Pains & Search Scenarios</h3></div>' +
              '<span class="badge">' + escapeHtmlClient(payload.artifactVersion || 'user_pain_scenarios_v1') + '</span>' +
            '</div>' +
            '<p>' + escapeHtmlClient(payload.topicHintInterpretation || 'Topic hint interpreted into user pains before keyword generation.') + '</p>' +
            '<div class="brand-memory-grid">' +
              '<div class="brand-memory-block full"><h4>User Pains</h4>' +
                (userPains.length
                  ? '<div class="stage-output-list">' + userPains.map(renderPain).join('') + '</div>'
                  : '<p class="muted">No user pains saved.</p>') +
              '</div>' +
              '<div class="brand-memory-block full"><h4>Search Scenarios</h4>' +
                (userScenarios.length
                  ? '<div class="stage-output-list">' + userScenarios.map(renderScenario).join('') + '</div>'
                  : '<p class="muted">No search scenarios saved.</p>') +
              '</div>' +
              '<div class="brand-memory-block full"><h4>Risk Notes</h4>' + renderMemoryList(riskNotes, 'No risk notes saved.') + '</div>' +
            '</div>' +
            '<details><summary>Raw User Pain Scenarios</summary><div><pre>' + escapeHtmlClient(prettyJson(payload)) + '</pre></div></details>' +
          '</section>'
        );
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
        const groups = Array.isArray(artifact?.payload?.groups) ? artifact.payload.groups : [];
        const relatedSelections = readKeywordRelatedSelections(run);
        if (!hypotheses.length) {
          return '<div class="empty">No keyword hypotheses yet.</div>';
        }

        const renderHypothesis = (item, index) => {
          const keyword = typeof item.keyword === 'string' ? item.keyword.trim() : '';
          const selectedRelatedQueries = relatedSelections.get(keyword.toLowerCase()) || null;

          return (
            '<div class="stage-output-item">' +
              '<strong>' + escapeHtmlClient(String(index + 1).padStart(2, '0') + '. ' + (keyword || 'Untitled keyword')) + '</strong>' +
              '<small>' + escapeHtmlClient([
                item.intent || 'intent n/a',
                item.hypothesisType || item.groupLabel || null,
                item.productFitHypothesis || null,
              ].filter(Boolean).join(' · ')) + '</small>' +
              '<p>' + escapeHtmlClient(item.rationale || item.audienceFit || 'No explanation provided.') + '</p>' +
              (Array.isArray(item.riskFlags) && item.riskFlags.length
                ? '<p class="muted">Risk: ' + escapeHtmlClient(item.riskFlags.join(', ')) + '</p>'
                : '') +
              (selectedRelatedQueries
                ? '<div class="related-query-inline"><span>Selected related queries</span>' +
                    (selectedRelatedQueries.length
                      ? '<ul>' + selectedRelatedQueries.map((query) => '<li>' + escapeHtmlClient(query) + '</li>').join('') + '</ul>'
                      : '<p>No strong grounded related queries selected.</p>') +
                  '</div>'
                : '') +
            '</div>'
          );
        };

        if (groups.length) {
          let indexOffset = 0;
          return '<div class="stage-output-list">' + groups.map((group) => {
            const groupHypotheses = Array.isArray(group.hypotheses) ? group.hypotheses : [];
            const html = (
              '<details class="keyword-serp-item" open>' +
                '<summary>' + escapeHtmlClient(group.label || group.groupId || 'Keyword group') + '</summary>' +
                '<div class="keyword-serp-body">' +
                  '<p>' + escapeHtmlClient(group.purpose || 'Grouped keyword hypotheses.') + '</p>' +
                  groupHypotheses.map((item, localIndex) => renderHypothesis(item, indexOffset + localIndex)).join('') +
                '</div>' +
              '</details>'
            );
            indexOffset += groupHypotheses.length;
            return html;
          }).join('') + '</div>';
        }

        return '<div class="stage-output-list">' + hypotheses.map(renderHypothesis).join('') + '</div>';
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
        const selectedHypotheses = Array.isArray(visibleSnapshotArtifact?.payload?.selectedHypotheses)
          ? visibleSnapshotArtifact.payload.selectedHypotheses
          : Array.isArray(visibleRawArtifact?.payload?.selectedHypotheses)
            ? visibleRawArtifact.payload.selectedHypotheses
            : [];
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
        const previewKeywords = selectedHypotheses.length
          ? selectedHypotheses.map((item, index) => ({
              index: typeof item?.index === 'number' ? item.index : index,
              keyword: typeof item?.keyword === 'string' ? item.keyword.trim() : 'Keyword ' + String(index + 1),
              selectionReason: typeof item?.selectionReason === 'string' ? item.selectionReason : '',
            }))
          : hypotheses.length
          ? hypotheses.map((item, index) => ({
              index,
              keyword: typeof item?.keyword === 'string' ? item.keyword.trim() : 'Keyword ' + String(index + 1),
              selectionReason: '',
            }))
          : toItems(visibleDerivedKeywordsArtifact || visibleSnapshotArtifact || visibleRawArtifact || visibleRelatedSelectionArtifact)
              .map((item, index) => ({
                index: typeof item?.index === 'number' ? item.index : index,
                keyword: typeof item?.keyword === 'string' ? item.keyword.trim() : 'Keyword ' + String(index + 1),
                selectionReason: '',
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
          const similarQueries = Array.isArray(derived?.similarSearchQueries)
            ? derived.similarSearchQueries
                .map((candidate) => ({
                  query: typeof candidate?.query === 'string' ? normalizedDisplayQuery(candidate.query) : '',
                  source: typeof candidate?.source === 'string' ? candidate.source : 'serp',
                }))
                .filter((candidate) => candidate.query)
            : [];
          const serpThemes = Array.isArray(derived?.serpThemes)
            ? derived.serpThemes
                .map((theme) => ({
                  theme: typeof theme?.theme === 'string' ? theme.theme.trim() : '',
                  source: typeof theme?.source === 'string' ? theme.source : 'serp_theme',
                }))
                .filter((theme) => theme.theme)
                .slice(0, 8)
            : [];
          const features = Array.isArray(snapshot?.snapshot?.serpFeatures)
            ? snapshot.snapshot.serpFeatures
            : Array.isArray(snapshot?.serpFeatures)
              ? snapshot.serpFeatures
              : [];

          return (
            '<details class="keyword-serp-item" ' + (index === 0 ? 'open' : '') + '>' +
              '<summary>' + escapeHtmlClient(String(index + 1).padStart(2, '0') + '. ' + item.keyword) + '</summary>' +
              '<div class="keyword-serp-body">' +
                (derived
                  ? '<div class="related-query-inline"><span>SERP-derived related queries</span>' +
                      (similarQueries.length
                        ? '<ul>' + similarQueries.map((candidate) => '<li>' + escapeHtmlClient(candidate.query) + ' <small>' + escapeHtmlClient(candidate.source) + '</small></li>').join('') + '</ul>'
                        : '<p>No People Also Ask or related search queries found.</p>') +
                    '</div>' +
                    '<div class="related-query-inline"><span>Competitor / SERP content themes</span>' +
                      (serpThemes.length
                        ? '<ul>' + serpThemes.map((theme) => '<li>' + escapeHtmlClient(theme.theme) + ' <small>' + escapeHtmlClient(theme.source) + '</small></li>').join('') + '</ul>'
                        : '<p>No compact SERP themes extracted.</p>') +
                    '</div>'
                  : '') +
                (features.length
                  ? '<div class="related-query-inline"><span>SERP features</span><p>' + escapeHtmlClient(features.join(', ')) + '</p></div>'
                  : '') +
                (item.selectionReason
                  ? '<div class="related-query-inline"><span>Why selected for SERP</span><p>' + escapeHtmlClient(item.selectionReason) + '</p></div>'
                  : '') +
                '<div class="related-query-inline"><span>Selected related queries</span>' +
                  (selected
                    ? selectedQueries.length
                      ? '<ul>' + selectedQueries.map((query) => '<li>' + escapeHtmlClient(query) + '</li>').join('') + '</ul>'
                      : '<p>No strong grounded related queries selected.</p>'
                    : '<p>Selection has not been generated for this keyword yet.</p>') +
                '</div>' +
                (derived
                  ? '<details><summary>Raw SERP-derived candidates</summary><div><pre>' + escapeHtmlClient(prettyJson(derived)) + '</pre></div></details>'
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

      function renderSerpDomainAggregation(run) {
        const artifact = findArtifact(run, 'serp_domain_aggregation');
        const payload = artifact?.payload || null;
        const domains = Array.isArray(payload?.domains) ? payload.domains : [];
        const formatSignals = Array.isArray(payload?.formatSignals) ? payload.formatSignals : [];
        if (!artifact) {
          return '<section class="card full"><div class="empty">No SERP domain aggregation yet.</div></section>';
        }

        const domainCards = domains.length
          ? domains.map((domain, index) => {
              const rankingUrls = Array.isArray(domain?.ranking_urls) ? domain.ranking_urls : [];
              const queries = Array.isArray(domain?.queries) ? domain.queries : [];
              const features = Array.isArray(domain?.serp_feature_context) ? domain.serp_feature_context : [];
              return (
                '<details class="keyword-serp-item" ' + (index < 3 ? 'open' : '') + '>' +
                  '<summary>' +
                    escapeHtmlClient(String(index + 1).padStart(2, '0') + '. ' + (domain?.domain || 'unknown domain')) +
                    ' · ' + escapeHtmlClient(String(domain?.appearances ?? 0)) + ' appearances' +
                    ' · best ' + escapeHtmlClient(domain?.best_rank ?? 'AI ref') +
                  '</summary>' +
                  '<div class="keyword-serp-body">' +
                    '<div class="inline-meta">' +
                      '<span>Avg rank: ' + escapeHtmlClient(domain?.avg_rank ?? '—') + '</span>' +
                      '<span>Ranking URLs: ' + escapeHtmlClient(String(rankingUrls.length)) + '</span>' +
                    '</div>' +
                    (queries.length
                      ? '<div class="related-query-inline"><span>Queries</span><ul>' + queries.map((query) => '<li>' + escapeHtmlClient(query) + '</li>').join('') + '</ul></div>'
                      : '') +
                    (features.length
                      ? '<div class="related-query-inline"><span>SERP feature context</span><p>' + escapeHtmlClient(features.join(', ')) + '</p></div>'
                      : '') +
                    (rankingUrls.length
                      ? '<div class="stage-output-list">' + rankingUrls.slice(0, 8).map((url) => (
                          '<div class="stage-output-item">' +
                            '<div class="inline-meta"><strong>' + escapeHtmlClient(url?.type || 'organic') + '</strong><span>' + escapeHtmlClient(url?.rank_absolute ?? 'AI ref') + '</span></div>' +
                            '<p>' + escapeHtmlClient(url?.title || url?.url || 'Untitled') + '</p>' +
                            '<p class="mono">' + escapeHtmlClient(url?.url || '—') + '</p>' +
                            '<p>' + escapeHtmlClient(url?.query || '') + '</p>' +
                          '</div>'
                        )).join('') + '</div>'
                      : '<div class="empty">No ranking URL evidence.</div>') +
                  '</div>' +
                '</details>'
              );
            }).join('')
          : '<div class="empty">No domains found in SERP evidence.</div>';

        return (
          '<section class="card full">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">Algorithm Step 4</div><h3>SERP Domain Aggregation</h3></div><span class="badge">' + escapeHtmlClient(payload?.artifactVersion || 'serp_domain_aggregation') + '</span></div>' +
            '<dl class="definition-list">' +
              '<dt>Queries</dt><dd>' + escapeHtmlClient(payload?.queryCount ?? 0) + '</dd>' +
              '<dt>Domains</dt><dd>' + escapeHtmlClient(payload?.domainCount ?? domains.length) + '</dd>' +
              '<dt>Ranking URLs</dt><dd>' + escapeHtmlClient(payload?.rankingUrlCount ?? 0) + '</dd>' +
            '</dl>' +
            domainCards +
            (formatSignals.length
              ? '<details><summary>Format signals</summary><div><pre>' + escapeHtmlClient(prettyJson(formatSignals)) + '</pre></div></details>'
              : '') +
          '</section>'
        );
      }

      function renderSerpDomainClassification(run) {
        const artifact = findArtifact(run, 'serp_domain_classification');
        const payload = artifact?.payload || null;
        if (!artifact) {
          return '<section class="card full"><div class="empty">No SERP domain classification yet.</div></section>';
        }

        const rankedTargets = Array.isArray(payload?.rankedKeywordsTargets)
          ? payload.rankedKeywordsTargets
          : [];
        const onpageTargets = Array.isArray(payload?.onpageOnlyTargets)
          ? payload.onpageOnlyTargets
          : [];
        const painTargets = Array.isArray(payload?.painSignalTargets)
          ? payload.painSignalTargets
          : [];
        const ignoredTargets = Array.isArray(payload?.ignoredTargets)
          ? payload.ignoredTargets
          : [];

        return (
          '<section class="card full">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">Algorithm Step 5</div><h3>SERP Domain Classification</h3></div><span class="badge">' + escapeHtmlClient(payload?.artifactVersion || 'serp_domain_classification') + '</span></div>' +
            '<p>Primary output: domains that should be used as competitors for the next Ranked Keywords step. Everything else is context, not a keyword source.</p>' +
            '<div class="metric-grid compact">' +
              '<div><strong>' + escapeHtmlClient(rankedTargets.length) + '</strong><span>Ranked Keywords targets</span></div>' +
              '<div><strong>' + escapeHtmlClient(onpageTargets.length) + '</strong><span>On-page only</span></div>' +
              '<div><strong>' + escapeHtmlClient(painTargets.length) + '</strong><span>Pain signals</span></div>' +
              '<div><strong>' + escapeHtmlClient(ignoredTargets.length) + '</strong><span>Ignored</span></div>' +
            '</div>' +
            '<div class="section-subhead"><h4>Selected 3-6 Ranked Keywords Targets</h4><p>These are the domains AI thinks can provide useful keyword universes.</p></div>' +
            renderDomainClassificationCards(rankedTargets, 'ranked') +
            '<details open><summary>Secondary: on-page-only targets</summary>' + renderDomainClassificationCards(onpageTargets, 'onpage') + '</details>' +
            '<details><summary>Secondary: pain signal targets</summary>' + renderDomainClassificationCards(painTargets, 'pain') + '</details>' +
            '<details><summary>Ignored targets</summary>' + renderDomainClassificationCards(ignoredTargets, 'ignored') + '</details>' +
            '<details><summary>Raw domain classification</summary><div><pre>' + escapeHtmlClient(prettyJson(payload)) + '</pre></div></details>' +
          '</section>'
        );
      }

      function renderDomainClassificationCards(items, mode) {
        if (!items.length) {
          return '<div class="empty">No domains in this bucket.</div>';
        }

        return (
          '<div class="stage-output-list">' +
            items.map((item, index) => {
              const meta = [
                item?.domainType,
                item?.priority,
              ].filter(Boolean).join(' · ');
              const prefix = mode === 'ranked'
                ? String(index + 1).padStart(2, '0') + '. '
                : '';
              return (
                '<div class="stage-output-item">' +
                  '<div class="inline-meta"><strong>' + escapeHtmlClient(prefix + (item?.domain || 'unknown domain')) + '</strong>' + (meta ? '<span>' + escapeHtmlClient(meta) + '</span>' : '') + '</div>' +
                  '<p>' + escapeHtmlClient(item?.reason || 'No reason saved.') + '</p>' +
                '</div>'
              );
            }).join('') +
          '</div>'
        );
      }

      function renderRankedKeywordsUniverse(run) {
        const artifact =
          findArtifact(run, 'competitor_keyword_map') ||
          findArtifact(run, 'ranked_keywords_universe');
        const payload = artifact?.payload || null;
        if (!artifact) {
          return '<section class="card full"><div class="empty">No competitor keyword map built yet.</div></section>';
        }

        const targetResults = Array.isArray(payload?.targetResults) ? payload.targetResults : [];
        const items = Array.isArray(payload?.items) ? payload.items : [];
        const flatKeywords = Array.isArray(payload?.allKeywordsFlat) ? payload.allKeywordsFlat : [];
        const skippedCompetitors = Array.isArray(payload?.manualCompetitors?.skipped)
          ? payload.manualCompetitors.skipped
          : [];
        const topItems = items
          .slice()
          .sort((left, right) => {
            const leftVolume = Number(left?.metrics?.searchVolume ?? -1);
            const rightVolume = Number(right?.metrics?.searchVolume ?? -1);
            if (rightVolume !== leftVolume) return rightVolume - leftVolume;
            return Number(left?.competitorEvidence?.rankAbsolute ?? 999) -
              Number(right?.competitorEvidence?.rankAbsolute ?? 999);
          })
          .slice(0, 40);

        const targetCards = targetResults.length
          ? '<div class="stage-output-list">' + targetResults.map((target, index) => (
              '<details class="keyword-serp-item" ' + (index < 3 ? 'open' : '') + '>' +
                '<summary>' +
                  escapeHtmlClient(String(index + 1).padStart(2, '0') + '. ' + (target?.target || 'unknown domain')) +
                  ' · ' + escapeHtmlClient(String(target?.itemsCount ?? 0)) + ' keywords' +
                  ' · ETV ' + escapeHtmlClient(target?.metrics?.organicEtv ?? '—') +
                '</summary>' +
                '<div class="keyword-serp-body">' +
                  '<dl class="definition-list">' +
                    '<dt>Total count</dt><dd>' + escapeHtmlClient(target?.totalCount ?? '—') + '</dd>' +
                    '<dt>Pos 1</dt><dd>' + escapeHtmlClient(target?.metrics?.organicPos1 ?? '—') + '</dd>' +
                    '<dt>Pos 2-3</dt><dd>' + escapeHtmlClient(target?.metrics?.organicPos2To3 ?? '—') + '</dd>' +
                    '<dt>Pos 4-10</dt><dd>' + escapeHtmlClient(target?.metrics?.organicPos4To10 ?? '—') + '</dd>' +
                  '</dl>' +
                  renderRankedKeywordCards(Array.isArray(target?.items) ? target.items.slice(0, 8) : []) +
                '</div>' +
              '</details>'
            )).join('') + '</div>'
          : '<div class="empty">No target results saved.</div>';

        return (
          '<section class="card full">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">Competitor Keyword Map</div><h3>Manual Competitor Ranked Keywords</h3></div><span class="badge">' + escapeHtmlClient(payload?.artifactVersion || 'competitor_keyword_map') + '</span></div>' +
            '<p>Primary output: DataForSEO Ranked Keywords from manual competitor domains only. This is still an unfiltered evidence pool, not the final keyword list.</p>' +
            '<div class="metric-grid compact">' +
              '<div><strong>' + escapeHtmlClient(payload?.targetCount ?? targetResults.length) + '</strong><span>Queried domains</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload?.itemCount ?? items.length) + '</strong><span>Ranked keyword rows</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload?.deduplicatedKeywordCount ?? flatKeywords.length) + '</strong><span>Unique competitor keywords</span></div>' +
              '<div><strong>' + escapeHtmlClient(targetResults.reduce((sum, target) => sum + Number(target?.metrics?.organicEtv ?? 0), 0).toFixed(1)) + '</strong><span>Total organic ETV</span></div>' +
            '</div>' +
            '<dl class="definition-list">' +
              '<dt>competitor_keywords_json_id</dt><dd class="mono">' + escapeHtmlClient(payload?.competitorKeywordsJsonId || '—') + '</dd>' +
              '<dt>Endpoint</dt><dd class="mono">' + escapeHtmlClient(payload?.endpoint || '—') + '</dd>' +
            '</dl>' +
            (skippedCompetitors.length
              ? '<div class="section-subhead"><h4>Skipped competitor hints</h4><p>These were not queried because they were excluded or not domain-like targets.</p></div>' +
                '<div class="stage-output-list">' + skippedCompetitors.map((item) => (
                  '<div class="stage-output-item"><div class="inline-meta"><strong>' + escapeHtmlClient(item?.raw || 'unknown') + '</strong><span>' + escapeHtmlClient(item?.source || '—') + '</span></div><p>' + escapeHtmlClient(item?.reason || 'Skipped') + '</p></div>'
                )).join('') + '</div>'
              : '') +
            '<div class="section-subhead"><h4>Target domains</h4><p>These came from manual competitors in Step 0 input.</p></div>' +
            targetCards +
            '<div class="section-subhead"><h4>Top normalized keyword evidence</h4><p>Sorted by search volume, then competitor rank. Product-fit filtering is a later step.</p></div>' +
            renderRankedKeywordCards(topItems) +
            '<details><summary>Raw competitor keyword map artifact</summary><div><pre>' + escapeHtmlClient(prettyJson(payload)) + '</pre></div></details>' +
          '</section>'
        );
      }

      function renderRankedKeywordCards(items) {
        if (!items.length) {
          return '<div class="empty">No ranked keyword rows.</div>';
        }

        return (
          '<div class="stage-output-list">' +
            items.map((item, index) => {
              const metrics = item?.metrics || {};
              const evidence = item?.competitorEvidence || {};
              const features = Array.isArray(item?.serpEvidence?.serpFeatures)
                ? item.serpEvidence.serpFeatures
                : [];
              return (
                '<div class="stage-output-item">' +
                  '<div class="inline-meta"><strong>' + escapeHtmlClient(String(index + 1).padStart(2, '0') + '. ' + (item?.text || 'unknown keyword')) + '</strong><span>' + escapeHtmlClient(item?.sourceDomain || '—') + '</span></div>' +
                  '<p>' +
                    'SV: ' + escapeHtmlClient(metrics.searchVolume ?? '—') +
                    ' · KD: ' + escapeHtmlClient(metrics.keywordDifficulty ?? '—') +
                    ' · intent: ' + escapeHtmlClient(metrics.intent || '—') +
                    ' · rank: ' + escapeHtmlClient(evidence.rankAbsolute ?? '—') +
                  '</p>' +
                  '<p>' + escapeHtmlClient(evidence.rankingTitle || 'No ranking title') + '</p>' +
                  '<p class="mono">' + escapeHtmlClient(evidence.rankingUrl || '—') + '</p>' +
                  (features.length ? '<p>SERP: ' + escapeHtmlClient(features.join(', ')) + '</p>' : '') +
                '</div>'
              );
            }).join('') +
          '</div>'
        );
      }

      function renderCompetitorKeywordMatches(run) {
        const artifact = findArtifact(run, 'competitor_keyword_matches');
        const payload = artifact?.payload || null;
        if (!artifact) {
          return '<section class="card full"><div class="empty">No competitor keyword matching saved yet.</div></section>';
        }

        const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
        const topCandidates = candidates
          .slice()
          .sort((left, right) =>
            Number(right?.proxyEvaluation?.proxyDemandScore ?? 0) -
              Number(left?.proxyEvaluation?.proxyDemandScore ?? 0),
          )
          .slice(0, 80);

        return (
          '<section class="card full">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">Algorithm Step 5</div><h3>Competitor Keyword Matching</h3></div><span class="badge">' + escapeHtmlClient(payload?.artifactVersion || 'competitor_keyword_matches') + '</span></div>' +
            '<p>Primary output: candidate queries matched to competitor ranked keywords. Competitor volume is used only as proxy evidence, not copied onto candidate queries.</p>' +
            '<div class="metric-grid compact">' +
              '<div><strong>' + escapeHtmlClient(payload?.candidateCount ?? candidates.length) + '</strong><span>Candidates checked</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload?.matchedCandidateCount ?? 0) + '</strong><span>Matched candidates</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload?.competitorKeywordCount ?? 0) + '</strong><span>Competitor keywords</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload?.averageProxyDemandScore ?? 0) + '</strong><span>Avg proxy score</span></div>' +
            '</div>' +
            renderCompetitorMatchCards(topCandidates) +
            '<details><summary>Raw competitor keyword matches</summary><div><pre>' + escapeHtmlClient(prettyJson(payload)) + '</pre></div></details>' +
          '</section>'
        );
      }

      function renderCompetitorMatchCards(items) {
        if (!items.length) {
          return '<div class="empty">No competitor keyword matches.</div>';
        }

        return (
          '<div class="stage-output-list">' +
            items.map((item, index) => {
              const proxy = item?.proxyEvaluation || {};
              const matches = Array.isArray(proxy?.semanticMatches) ? proxy.semanticMatches : [];
              return (
                '<details class="keyword-serp-item" ' + (index < 12 ? 'open' : '') + '>' +
                  '<summary>' +
                    escapeHtmlClient(String(index + 1).padStart(2, '0') + '. ' + (item?.text || 'unknown query')) +
                    ' · proxy ' + escapeHtmlClient(proxy?.proxyDemandScore ?? 0) +
                    ' · ' + escapeHtmlClient(proxy?.bestMatchType || 'no_match') +
                  '</summary>' +
                  '<div class="keyword-serp-body">' +
                    '<p>' +
                      'origin: ' + escapeHtmlClient(item?.originType || '—') +
                      ' · candidate score: ' + escapeHtmlClient(item?.candidateScore ?? '—') +
                      ' · domains: ' + escapeHtmlClient(Array.isArray(proxy?.matchingDomains) ? proxy.matchingDomains.join(', ') : '—') +
                    '</p>' +
                    '<div class="stage-output-list">' +
                      matches.slice(0, 6).map((match) => (
                        '<div class="stage-output-item">' +
                          '<div class="inline-meta"><strong>' + escapeHtmlClient(match?.competitorKeyword || 'unknown keyword') + '</strong><span>' + escapeHtmlClient(match?.sourceDomain || '—') + '</span></div>' +
                          '<p>' + escapeHtmlClient((match?.matchType || 'no_match') + ' · confidence ' + (match?.matchConfidence ?? '—') + ' · proxy contribution ' + (match?.proxyContribution ?? 0)) + '</p>' +
                          '<p>' + escapeHtmlClient(match?.why || 'Matched by deterministic lexical signals.') + '</p>' +
                        '</div>'
                      )).join('') +
                    '</div>' +
                  '</div>' +
                '</details>'
              );
            }).join('') +
          '</div>'
        );
      }

      function renderDirtyKeywordPool(run) {
        const artifact = findArtifact(run, 'dirty_keyword_pool');
        const payload = artifact?.payload || null;
        if (!artifact) {
          return '<section class="card full"><div class="empty">No dirty keyword pool built yet.</div></section>';
        }

        const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
        const sourceCounts = payload?.sourceCounts && typeof payload.sourceCounts === 'object'
          ? payload.sourceCounts
          : {};
        const topCandidates = candidates
          .slice()
          .sort((left, right) => {
            if (Number(right?.sourceCount ?? 0) !== Number(left?.sourceCount ?? 0)) {
              return Number(right?.sourceCount ?? 0) - Number(left?.sourceCount ?? 0);
            }
            return Number(right?.metrics?.searchVolume ?? -1) -
              Number(left?.metrics?.searchVolume ?? -1);
          })
          .slice(0, 80);

        return (
          '<section class="card full">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">Algorithm Step 6</div><h3>Dirty Keyword Pool</h3></div><span class="badge">' + escapeHtmlClient(payload?.artifactVersion || 'dirty_keyword_pool') + '</span></div>' +
            '<p>Primary output: one intentionally dirty pool of keyword candidates from hypotheses, SERP-derived queries, selected related queries, and Ranked Keywords. Filtering happens later.</p>' +
            '<div class="metric-grid compact">' +
              '<div><strong>' + escapeHtmlClient(payload?.candidateCount ?? candidates.length) + '</strong><span>Unique candidates</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload?.duplicateEvidenceCount ?? 0) + '</strong><span>Merged duplicate evidence</span></div>' +
              '<div><strong>' + escapeHtmlClient(sourceCounts.keyword_hypothesis ?? 0) + '</strong><span>Initial hypotheses</span></div>' +
              '<div><strong>' + escapeHtmlClient(sourceCounts.competitor_keyword_match ?? 0) + '</strong><span>Competitor matches</span></div>' +
            '</div>' +
            '<div class="section-subhead"><h4>Source mix</h4><p>Counts show how many unique candidates have evidence from each source.</p></div>' +
            '<dl class="definition-list">' +
              '<dt>Hypotheses</dt><dd>' + escapeHtmlClient(sourceCounts.keyword_hypothesis ?? 0) + '</dd>' +
              '<dt>SERP-derived</dt><dd>' + escapeHtmlClient(sourceCounts.serp_derived_candidate ?? 0) + '</dd>' +
              '<dt>Selected related</dt><dd>' + escapeHtmlClient(sourceCounts.selected_related_query ?? 0) + '</dd>' +
              '<dt>Competitor matches</dt><dd>' + escapeHtmlClient(sourceCounts.competitor_keyword_match ?? 0) + '</dd>' +
              '<dt>Ranked Keywords</dt><dd>' + escapeHtmlClient(sourceCounts.ranked_keywords ?? 0) + '</dd>' +
            '</dl>' +
            '<div class="section-subhead"><h4>Candidate pool</h4><p>Sorted by source coverage and search volume. This is not filtered by Product Fit yet.</p></div>' +
            renderDirtyKeywordCards(topCandidates) +
            '<details><summary>Raw dirty keyword pool</summary><div><pre>' + escapeHtmlClient(prettyJson(payload)) + '</pre></div></details>' +
          '</section>'
        );
      }

      function renderDirtyKeywordCards(items) {
        if (!items.length) {
          return '<div class="empty">No dirty keyword candidates.</div>';
        }

        return (
          '<div class="stage-output-list">' +
            items.map((item, index) => {
              const metrics = item?.metrics || {};
              const sources = Array.isArray(item?.sources) ? item.sources : [];
              const evidence = Array.isArray(item?.evidence) ? item.evidence : [];
              return (
                '<details class="keyword-serp-item" ' + (index < 12 ? 'open' : '') + '>' +
                  '<summary>' +
                    escapeHtmlClient(String(index + 1).padStart(2, '0') + '. ' + (item?.text || 'unknown keyword')) +
                    ' · ' + escapeHtmlClient(sources.join(', ') || 'no source') +
                    ' · SV ' + escapeHtmlClient(metrics.searchVolume ?? '—') +
                  '</summary>' +
                  '<div class="keyword-serp-body">' +
                    '<p>' +
                      'Intent: ' + escapeHtmlClient(metrics.intent || '—') +
                      ' · KD: ' + escapeHtmlClient(metrics.keywordDifficulty ?? '—') +
                      ' · best rank: ' + escapeHtmlClient(metrics.bestRankAbsolute ?? '—') +
                      ' · proxy: ' + escapeHtmlClient(metrics.proxyDemandScore ?? '—') +
                    '</p>' +
                    '<div class="stage-output-list">' +
                      evidence.slice(0, 8).map((entry) => (
                        '<div class="stage-output-item">' +
                          '<div class="inline-meta"><strong>' + escapeHtmlClient(entry?.source || 'source') + '</strong><span>' + escapeHtmlClient(entry?.sourceDomain || entry?.keywordGroup || '—') + '</span></div>' +
                          '<p>' + escapeHtmlClient(entry?.reason || entry?.sourceText || entry?.sourceKeyword || 'Evidence saved.') + '</p>' +
                        '</div>'
                      )).join('') +
                    '</div>' +
                  '</div>' +
                '</details>'
              );
            }).join('') +
          '</div>'
        );
      }

      function renderKeywordCandidateScoring(run) {
        const artifact = findArtifact(run, 'keyword_candidate_scoring');
        const payload = artifact?.payload || null;
        if (!artifact) {
          return '<section class="card full"><div class="empty">No candidate scoring saved yet.</div></section>';
        }

        const accepted = Array.isArray(payload?.accepted) ? payload.accepted : [];
        const maybe = Array.isArray(payload?.maybe) ? payload.maybe : [];
        const rejected = Array.isArray(payload?.rejected) ? payload.rejected : [];
        const notes = Array.isArray(payload?.summary?.notes) ? payload.summary.notes : [];

        return (
          '<section class="card full">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">Algorithm Step 7</div><h3>Staged Candidate Filtering</h3></div><span class="badge">' + escapeHtmlClient(payload?.artifactVersion || 'keyword_candidate_scoring') + '</span></div>' +
            '<p>Primary output: dirty-pool candidates split into accepted, maybe, and rejected through noise filtering, semantic buckets, product-fit scoring, and per-bucket shortlist caps.</p>' +
            '<div class="metric-grid compact">' +
              '<div><strong>' + escapeHtmlClient(payload?.acceptedCount ?? accepted.length) + '</strong><span>Accepted</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload?.maybeCount ?? maybe.length) + '</strong><span>Maybe</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload?.rejectedCount ?? rejected.length) + '</strong><span>Rejected</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload?.keptAfterNoiseCount ?? 0) + '</strong><span>After noise</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload?.hardExcludedCandidateCount ?? 0) + '</strong><span>Hard excluded</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload?.llmScoredCandidateCount ?? payload?.aiScoredCandidateCount ?? 0) + '</strong><span>LLM calls</span></div>' +
            '</div>' +
            renderStagedFilteringSummary(payload?.stagedFiltering) +
            (notes.length ? '<div class="section-subhead"><h4>Filtering notes</h4><p>' + escapeHtmlClient(notes.join(' ')) + '</p></div>' : '') +
            renderScoredCandidateSection('Accepted', accepted, 'Candidates safe enough to continue into narrowing and clustering.', true) +
            renderScoredCandidateSection('Maybe', maybe, 'Candidates that need human review, reframing, or extra evidence.', false) +
            renderScoredCandidateSection('Rejected', rejected, 'Candidates removed because of weak fit, risk, compliance, or poor evidence.', false) +
            '<details><summary>Raw candidate scoring artifact</summary><div><pre>' + escapeHtmlClient(prettyJson(payload)) + '</pre></div></details>' +
          '</section>'
        );
      }

      function renderStagedFilteringSummary(stagedFiltering) {
        const stages = Array.isArray(stagedFiltering?.stages) ? stagedFiltering.stages : [];
        const buckets = Array.isArray(stagedFiltering?.buckets) ? stagedFiltering.buckets : [];
        if (!stages.length && !buckets.length) {
          return '';
        }

        return (
          '<details class="keyword-serp-item" open>' +
            '<summary>Staged filtering summary</summary>' +
            '<div class="keyword-serp-body">' +
              (stages.length
                ? '<div class="stage-output-list compact">' + stages.map((stage) => (
                    '<div class="stage-output-item">' +
                      '<div class="inline-meta"><strong>' + escapeHtmlClient(stage?.stage || 'stage') + '</strong><span>' + escapeHtmlClient(stage?.keptCount ?? stage?.acceptedCount ?? stage?.bucketCount ?? '') + '</span></div>' +
                      '<p>' + escapeHtmlClient(stage?.description || 'Stage completed.') + '</p>' +
                    '</div>'
                  )).join('') + '</div>'
                : '') +
              (buckets.length
                ? '<div class="section-subhead"><h4>Bucket shortlists</h4></div><div class="stage-output-list">' + buckets.filter((bucket) => Number(bucket?.inputCount || 0) > 0).map((bucket) => {
                    const topCandidates = Array.isArray(bucket?.topCandidates) ? bucket.topCandidates : [];
                    return (
                      '<div class="stage-output-item">' +
                        '<div class="inline-meta"><strong>' + escapeHtmlClient(bucket?.label || bucket?.bucket || 'Bucket') + '</strong><span>' + escapeHtmlClient((bucket?.acceptedCount ?? 0) + ' accepted · ' + (bucket?.maybeCount ?? 0) + ' maybe · ' + (bucket?.rejectedCount ?? 0) + ' rejected') + '</span></div>' +
                        '<p>' + escapeHtmlClient(bucket?.description || '') + '</p>' +
                        (topCandidates.length ? '<ul>' + topCandidates.map((candidate) => '<li>' + escapeHtmlClient(candidate?.keyword || 'keyword') + ' · ' + escapeHtmlClient(candidate?.status || 'status') + ' · score ' + escapeHtmlClient(candidate?.totalScore ?? '—') + '</li>').join('') + '</ul>' : '') +
                      '</div>'
                    );
                  }).join('') + '</div>'
                : '') +
            '</div>' +
          '</details>'
        );
      }

      function renderScoredCandidateSection(label, items, description, openByDefault) {
        return (
          '<details class="keyword-serp-item" ' + (openByDefault ? 'open' : '') + '>' +
            '<summary>' + escapeHtmlClient(label + ' · ' + items.length) + '</summary>' +
            '<div class="keyword-serp-body">' +
              '<p>' + escapeHtmlClient(description) + '</p>' +
              (items.length ? '<div class="stage-output-list">' + items.map(renderScoredCandidateCard).join('') + '</div>' : '<div class="empty">No candidates in this bucket.</div>') +
            '</div>' +
          '</details>'
        );
      }

      function renderScoredCandidateCard(item, index) {
        const scores = item?.scores || {};
        const fit = item?.fit || {};
        const sourceCandidate = item?.sourceCandidate || {};
        const metrics = sourceCandidate?.metrics || {};
        const sources = Array.isArray(sourceCandidate?.sources) ? sourceCandidate.sources : [];
        const reasons = Array.isArray(item?.reasons) ? item.reasons : [];
        const riskFlags = Array.isArray(item?.riskFlags) ? item.riskFlags : [];
        const evidenceNotes = Array.isArray(item?.evidenceNotes) ? item.evidenceNotes : [];

        return (
          '<div class="stage-output-item">' +
            '<div class="inline-meta"><strong>' + escapeHtmlClient(String(index + 1).padStart(2, '0') + '. ' + (item?.keyword || sourceCandidate?.text || 'unknown keyword')) + '</strong><span>score ' + escapeHtmlClient(item?.totalScore ?? '—') + '</span></div>' +
            '<p>' +
              'intent: ' + escapeHtmlClient(item?.intent || metrics.intent || '—') +
              ' · stage: ' + escapeHtmlClient(item?.stage || '—') +
              ' · sources: ' + escapeHtmlClient(sources.join(', ') || '—') +
            '</p>' +
            '<p>' +
              'topic ' + escapeHtmlClient(scores.topicFit ?? '—') + '/' + escapeHtmlClient(fit.topicFit || '—') +
              ' · product ' + escapeHtmlClient(scores.productFit ?? '—') + '/' + escapeHtmlClient(fit.productFit || '—') +
              ' · audience ' + escapeHtmlClient(scores.audienceFit ?? '—') + '/' + escapeHtmlClient(fit.audienceFit || '—') +
              ' · risk ' + escapeHtmlClient(scores.riskCompliance ?? '—') + '/' + escapeHtmlClient(fit.riskCompliance || '—') +
              ' · evidence ' + escapeHtmlClient(scores.evidence ?? '—') + '/' + escapeHtmlClient(fit.evidence || '—') +
            '</p>' +
            '<p>SV: ' + escapeHtmlClient(metrics.searchVolume ?? '—') + ' · KD: ' + escapeHtmlClient(metrics.keywordDifficulty ?? '—') + ' · best rank: ' + escapeHtmlClient(metrics.bestRankAbsolute ?? '—') + ' · proxy: ' + escapeHtmlClient(metrics.proxyDemandScore ?? '—') + ' · candidate: ' + escapeHtmlClient(metrics.candidateScore ?? '—') + '</p>' +
            (reasons.length ? '<p><strong>Reasons:</strong> ' + escapeHtmlClient(reasons.join(' ')) + '</p>' : '') +
            (riskFlags.length ? '<p><strong>Risk flags:</strong> ' + escapeHtmlClient(riskFlags.join(' · ')) + '</p>' : '') +
            (evidenceNotes.length ? '<p><strong>Evidence:</strong> ' + escapeHtmlClient(evidenceNotes.join(' ')) + '</p>' : '') +
          '</div>'
        );
      }

      function renderIntentClusters(run) {
        const artifact = findArtifact(run, 'cluster_snapshot');
        const payload = artifact?.payload || null;
        if (!artifact) {
          return '<section class="card full"><div class="empty">No intent clusters built yet.</div></section>';
        }

        const clusters = Array.isArray(payload?.clusters) ? payload.clusters : [];

        return (
          '<section class="card full">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">Algorithm Step 8</div><h3>Intent Clusters</h3></div><span class="badge">' + escapeHtmlClient(payload?.artifactVersion || 'cluster_snapshot') + '</span></div>' +
            '<p>Primary output: accepted and maybe candidates grouped by user intent. Product Fit review happens in the next step.</p>' +
            '<div class="metric-grid compact">' +
              '<div><strong>' + escapeHtmlClient(payload?.clusterCount ?? clusters.length) + '</strong><span>Clusters</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload?.inputCandidateCount ?? 0) + '</strong><span>Input candidates</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload?.acceptedCandidateCount ?? 0) + '</strong><span>Accepted input</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload?.maybeCandidateCount ?? 0) + '</strong><span>Maybe input</span></div>' +
            '</div>' +
            renderIntentClusterCards(clusters) +
            '<details><summary>Raw intent clusters artifact</summary><div><pre>' + escapeHtmlClient(prettyJson(payload)) + '</pre></div></details>' +
          '</section>'
        );
      }

      function renderIntentClusterCards(clusters) {
        if (!clusters.length) {
          return '<div class="empty">No clusters saved.</div>';
        }

        return (
          '<div class="stage-output-list">' +
            clusters.map((cluster, index) => {
              const secondary = Array.isArray(cluster?.secondaryKeywords) ? cluster.secondaryKeywords : [];
              const questions = Array.isArray(cluster?.questions) ? cluster.questions : [];
              const supporting = Array.isArray(cluster?.supportingItems) ? cluster.supportingItems : [];
              const supportingDetails = Array.isArray(cluster?.supportingItemDetails) ? cluster.supportingItemDetails : [];
              const competitorUrls = Array.isArray(cluster?.competitorUrls) ? cluster.competitorUrls : [];
              const keywords = Array.isArray(cluster?.keywords) ? cluster.keywords : [];
              return (
                '<details class="keyword-serp-item" ' + (index < 4 ? 'open' : '') + '>' +
                  '<summary>' +
                    escapeHtmlClient(String(index + 1).padStart(2, '0') + '. ' + (cluster?.clusterName || cluster?.label || 'Intent cluster')) +
                    ' · ' + escapeHtmlClient(cluster?.intent || 'intent n/a') +
                    ' · ' + escapeHtmlClient(cluster?.sourceConfidence || 'confidence n/a') +
                  '</summary>' +
                  '<div class="keyword-serp-body">' +
                    '<dl class="definition-list">' +
                      '<dt>Primary</dt><dd>' + escapeHtmlClient(cluster?.primaryKeywordCandidate || cluster?.primaryKeyword || '—') + '</dd>' +
                      '<dt>User intent</dt><dd>' + escapeHtmlClient(cluster?.userIntent || '—') + '</dd>' +
                      '<dt>Evidence</dt><dd>' + escapeHtmlClient(cluster?.evidenceSummary || cluster?.rationale || '—') + '</dd>' +
                    '</dl>' +
                    renderCompactStringList('Secondary keywords', secondary.length ? secondary : keywords.slice(1)) +
                    renderCompactStringList('Questions', questions) +
                    renderCompactStringList('Supporting items', supporting) +
                    renderSupportingItemDetails(supportingDetails) +
                    (competitorUrls.length
                      ? '<div class="section-subhead"><h4>Competitor URLs</h4></div><div class="stage-output-list">' + competitorUrls.slice(0, 6).map((url) => (
                          '<div class="stage-output-item">' +
                            '<div class="inline-meta"><strong>' + escapeHtmlClient(url?.domain || 'domain') + '</strong><span>' + escapeHtmlClient(url?.rankAbsolute ?? '—') + '</span></div>' +
                            '<p>' + escapeHtmlClient(url?.title || url?.url || 'Untitled') + '</p>' +
                            '<p class="mono">' + escapeHtmlClient(url?.url || '—') + '</p>' +
                          '</div>'
                        )).join('') + '</div>'
                      : '') +
                  '</div>' +
                '</details>'
              );
            }).join('') +
          '</div>'
        );
      }

      function renderSupportingItemDetails(items) {
        if (!items.length) {
          return '';
        }

        return (
          '<div class="section-subhead"><h4>Supporting evidence</h4></div>' +
          '<div class="stage-output-list">' +
            items.slice(0, 8).map((item) => {
              const metrics = item?.metrics || {};
              const sources = Array.isArray(item?.sources) ? item.sources : [];
              return (
                '<div class="stage-output-item">' +
                  '<div class="inline-meta"><strong>' + escapeHtmlClient(item?.text || 'supporting item') + '</strong><span>' + escapeHtmlClient(item?.originType || sources[0] || 'source n/a') + '</span></div>' +
                  '<p>Candidate: ' + escapeHtmlClient(item?.candidateScore ?? '—') +
                    ' · proxy: ' + escapeHtmlClient(metrics.proxyDemandScore ?? '—') +
                    ' · competitor: ' + escapeHtmlClient(metrics.competitorMatchScore ?? '—') +
                    ' · SV: ' + escapeHtmlClient(metrics.searchVolume ?? '—') +
                    ' · best rank: ' + escapeHtmlClient(metrics.bestRankAbsolute ?? '—') +
                  '</p>' +
                  (sources.length ? '<p class="muted">Sources: ' + escapeHtmlClient(sources.join(' · ')) + '</p>' : '') +
                  (item?.whyInCluster ? '<p>' + escapeHtmlClient(item.whyInCluster) + '</p>' : '') +
                '</div>'
              );
            }).join('') +
          '</div>'
        );
      }

      function renderClusterProductFitReview(run) {
        const artifact = findArtifact(run, 'cluster_product_fit_review');
        const payload = artifact?.payload || null;
        if (!artifact) {
          return '<section class="card full"><div class="empty">No cluster Product Fit review saved yet.</div></section>';
        }

        const reviews = Array.isArray(payload?.clusterProductFit) ? payload.clusterProductFit : [];
        const approved = reviews.filter((item) => item?.decision === 'approve');
        const supportingOnly = reviews.filter((item) => item?.decision === 'supporting_only');
        const rejected = reviews.filter((item) => item?.decision === 'reject');

        return (
          '<section class="card full">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">Algorithm Step 9</div><h3>Cluster Product Fit Review</h3></div><span class="badge">' + escapeHtmlClient(payload?.artifactVersion || 'cluster_product_fit_review') + '</span></div>' +
            '<p>Primary output: every intent cluster reviewed for whether Reinforce can naturally answer the user intent. This is not final cluster selection yet.</p>' +
            '<div class="metric-grid compact">' +
              '<div><strong>' + escapeHtmlClient(payload?.inputClusterCount ?? reviews.length) + '</strong><span>Input clusters</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload?.approvedCount ?? approved.length) + '</strong><span>Approved</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload?.supportingOnlyCount ?? supportingOnly.length) + '</strong><span>Supporting only</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload?.rejectedCount ?? rejected.length) + '</strong><span>Rejected</span></div>' +
            '</div>' +
            renderClusterProductFitSection('Approved', approved, true) +
            renderClusterProductFitSection('Supporting only', supportingOnly, true) +
            renderClusterProductFitSection('Rejected', rejected, false) +
            '<details><summary>Raw Product Fit review</summary><div><pre>' + escapeHtmlClient(prettyJson(payload)) + '</pre></div></details>' +
          '</section>'
        );
      }

      function renderClusterProductFitSection(label, items, openByDefault) {
        return (
          '<details class="keyword-serp-item" ' + (openByDefault ? 'open' : '') + '>' +
            '<summary>' + escapeHtmlClient(label + ' · ' + items.length) + '</summary>' +
            '<div class="keyword-serp-body">' +
              (items.length ? '<div class="stage-output-list">' + items.map(renderClusterProductFitCard).join('') + '</div>' : '<div class="empty">No clusters in this bucket.</div>') +
            '</div>' +
          '</details>'
        );
      }

      function renderClusterProductFitCard(item, index) {
        const cluster = item?.sourceCluster || {};
        const whatNotToClaim = Array.isArray(item?.whatNotToClaim) ? item.whatNotToClaim : [];
        const keywords = Array.isArray(cluster?.keywords) ? cluster.keywords : [];
        const competitorUrls = Array.isArray(cluster?.competitorUrls) ? cluster.competitorUrls : [];
        const supportingDetails = Array.isArray(cluster?.supportingItemDetails) ? cluster.supportingItemDetails : [];
        return (
          '<div class="stage-output-item">' +
            '<div class="inline-meta"><strong>' + escapeHtmlClient(String(index + 1).padStart(2, '0') + '. ' + (item?.clusterName || 'Cluster')) + '</strong><span>' + escapeHtmlClient((item?.decision || 'decision') + ' · ' + (item?.productFitScore ?? '—') + '/100') + '</span></div>' +
            '<p><strong>' + escapeHtmlClient(item?.productFitType || 'fit n/a') + '</strong> · ' + escapeHtmlClient(item?.reason || 'No reason saved.') + '</p>' +
            '<dl class="definition-list">' +
              '<dt>Primary</dt><dd>' + escapeHtmlClient(cluster?.primaryKeywordCandidate || '—') + '</dd>' +
              '<dt>User intent</dt><dd>' + escapeHtmlClient(cluster?.userIntent || '—') + '</dd>' +
              '<dt>Insertion angle</dt><dd>' + escapeHtmlClient(item?.productInsertionAngle || '—') + '</dd>' +
              '<dt>Where to insert</dt><dd>' + escapeHtmlClient(item?.whereToInsert || '—') + '</dd>' +
            '</dl>' +
            renderCompactStringList('What not to claim', whatNotToClaim) +
            renderCompactStringList('Cluster keywords', keywords.slice(0, 8)) +
            renderSupportingItemDetails(supportingDetails.slice(0, 4)) +
            (competitorUrls.length
              ? '<div class="related-query-inline"><span>Evidence URLs</span><ul>' + competitorUrls.slice(0, 4).map((url) => '<li>' + escapeHtmlClient((url?.domain || 'domain') + ' · ' + (url?.title || url?.url || 'URL')) + '</li>').join('') + '</ul></div>'
              : '') +
          '</div>'
        );
      }

      function renderClusterSelection(run) {
        const artifact = findArtifact(run, 'cluster_selection_snapshot');
        const payload = artifact?.payload || null;
        if (!artifact) {
          return '<section class="card full"><div class="empty">No main/supporting cluster selection saved yet.</div></section>';
        }

        const main = payload?.mainCluster || null;
        const supporting = Array.isArray(payload?.supportingClusters) ? payload.supportingClusters : [];
        const rejected = Array.isArray(payload?.rejectedClusters) ? payload.rejectedClusters : [];
        const ranked = Array.isArray(payload?.rankedClusters) ? payload.rankedClusters : [];

        return (
          '<section class="card full">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">Algorithm Step 10</div><h3>Main Cluster Selection</h3></div><span class="badge">' + escapeHtmlClient(payload?.artifactVersion || 'cluster_selection_snapshot') + '</span></div>' +
            '<p>Primary output: one main cluster for the SEO brief plus supporting clusters for internal links or adjacent articles.</p>' +
            '<div class="metric-grid compact">' +
              '<div><strong>' + escapeHtmlClient(main ? '1' : '0') + '</strong><span>Main</span></div>' +
              '<div><strong>' + escapeHtmlClient(supporting.length) + '</strong><span>Supporting</span></div>' +
              '<div><strong>' + escapeHtmlClient(rejected.length) + '</strong><span>Rejected</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload?.inputClusterCount ?? ranked.length) + '</strong><span>Input clusters</span></div>' +
            '</div>' +
            (main ? renderSelectedClusterCard('Main cluster', main, true) : '<div class="empty">No eligible approved main cluster selected.</div>') +
            renderSelectedClusterList('Supporting clusters', supporting, true) +
            renderSelectedClusterList('Rejected clusters', rejected, false) +
            '<details><summary>Ranked clusters and raw selection</summary><div>' +
              renderSelectedClusterList('All ranked clusters', ranked, false) +
              '<pre>' + escapeHtmlClient(prettyJson(payload)) + '</pre>' +
            '</div></details>' +
          '</section>'
        );
      }

      function renderSelectedClusterList(label, items, openByDefault) {
        return (
          '<details class="keyword-serp-item" ' + (openByDefault ? 'open' : '') + '>' +
            '<summary>' + escapeHtmlClient(label + ' · ' + items.length) + '</summary>' +
            '<div class="keyword-serp-body">' +
              (items.length
                ? '<div class="stage-output-list">' + items.map((item, index) => renderSelectedClusterCard(String(index + 1).padStart(2, '0'), item, false)).join('') + '</div>'
                : '<div class="empty">No clusters in this bucket.</div>') +
            '</div>' +
          '</details>'
        );
      }

      function renderSelectedClusterCard(label, item, prominent) {
        const breakdown = item?.scoreBreakdown || {};
        const cluster = item?.sourceCluster || {};
        const keywords = Array.isArray(cluster?.keywords) ? cluster.keywords : [];
        return (
          '<div class="stage-output-item ' + (prominent ? 'is-prominent' : '') + '">' +
            '<div class="inline-meta"><strong>' + escapeHtmlClient(label + '. ' + (item?.clusterName || 'Cluster')) + '</strong><span>' + escapeHtmlClient((item?.priorityScore ?? '—') + '/100') + '</span></div>' +
            '<p><strong>' + escapeHtmlClient(item?.primaryKeyword || 'No primary keyword') + '</strong></p>' +
            '<p>' + escapeHtmlClient(item?.reason || 'No reason saved.') + '</p>' +
            '<p class="muted">Product Fit: ' + escapeHtmlClient(item?.productFitType || '—') + ' · decision: ' + escapeHtmlClient(item?.productFitDecision || '—') + (item?.role ? ' · role: ' + escapeHtmlClient(item.role) : '') + '</p>' +
            renderSelectionScoreBreakdown(breakdown) +
            renderCompactStringList('Cluster keywords', keywords.slice(0, 6)) +
          '</div>'
        );
      }

      function renderSelectionScoreBreakdown(breakdown) {
        return (
          '<div class="metric-grid compact">' +
            '<div><strong>' + escapeHtmlClient(breakdown.productFit ?? '—') + '</strong><span>Product</span></div>' +
            '<div><strong>' + escapeHtmlClient(breakdown.competitorProxyDemandEvidence ?? '—') + '</strong><span>Proxy</span></div>' +
            '<div><strong>' + escapeHtmlClient(breakdown.intentRelevance ?? '—') + '</strong><span>Intent</span></div>' +
            '<div><strong>' + escapeHtmlClient(breakdown.serpEnrichmentSupport ?? '—') + '</strong><span>SERP</span></div>' +
            '<div><strong>' + escapeHtmlClient(breakdown.sourceDiversityConfidence ?? '—') + '</strong><span>Sources</span></div>' +
            '<div><strong>' + escapeHtmlClient(breakdown.riskPenalty ?? '—') + '</strong><span>Risk penalty</span></div>' +
          '</div>'
        );
      }

      function renderSelectedClusterOnPage(run) {
        const artifact = findArtifact(run, 'onpage_research_snapshot');
        const payload = artifact?.payload || null;
        if (!artifact) {
          return '<section class="card full"><div class="empty">No selected-cluster OnPage evidence saved yet.</div></section>';
        }

        const targets = Array.isArray(payload?.targets) ? payload.targets : [];
        const pages = Array.isArray(payload?.pages) ? payload.pages : [];
        const completed = pages.filter((page) => page?.status === 'completed');
        const failed = pages.filter((page) => page?.status === 'failed');

        return (
          '<section class="card full">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">Algorithm Step 11</div><h3>Selected Cluster OnPage Evidence</h3></div><span class="badge">' + escapeHtmlClient(payload?.artifactVersion || 'onpage_research_snapshot') + '</span></div>' +
            '<p>Primary output: parsed page evidence from selected SERP URLs for the final SEO brief. This is page evidence, not keyword generation.</p>' +
            '<div class="metric-grid compact">' +
              '<div><strong>' + escapeHtmlClient(payload?.targetCount ?? targets.length) + '</strong><span>Targets</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload?.successfulPageCount ?? completed.length) + '</strong><span>Parsed</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload?.failedPageCount ?? failed.length) + '</strong><span>Failed</span></div>' +
              '<div><strong>' + escapeHtmlClient(targets.filter((target) => target?.role === 'closest_intent_match').length) + '</strong><span>Closest intent</span></div>' +
            '</div>' +
            '<div class="section-subhead"><h4>Selected URLs</h4><p>Chosen from already saved SERP evidence. Video/social/homepage URLs are excluded.</p></div>' +
            renderOnPageTargetList(targets) +
            '<div class="section-subhead"><h4>Parsed pages</h4></div>' +
            (pages.length ? '<div class="stage-output-list">' + pages.map(renderOnPagePageCard).join('') + '</div>' : '<div class="empty">No pages saved.</div>') +
            '<details><summary>Raw OnPage snapshot</summary><div><pre>' + escapeHtmlClient(prettyJson(payload)) + '</pre></div></details>' +
          '</section>'
        );
      }

      function renderOnPageTargetList(targets) {
        return targets.length
          ? '<div class="stage-output-list compact">' + targets.map((target, index) => (
              '<div class="stage-output-item">' +
                '<div class="inline-meta"><strong>' + escapeHtmlClient(String(index + 1).padStart(2, '0') + '. ' + (target?.domain || 'domain')) + '</strong><span>' + escapeHtmlClient(target?.role || 'role n/a') + '</span></div>' +
                '<p class="mono">' + escapeHtmlClient(target?.url || '—') + '</p>' +
                '<p>' + escapeHtmlClient(target?.selectionReason || 'No selection reason saved.') + '</p>' +
                '<p class="muted">Query: ' + escapeHtmlClient(target?.sourceQuery || '—') + ' · rank: ' + escapeHtmlClient(target?.rankAbsolute ?? '—') + '</p>' +
              '</div>'
            )).join('') + '</div>'
          : '<div class="empty">No selected OnPage targets.</div>';
      }

      function renderOnPagePageCard(page, index) {
        const h1 = Array.isArray(page?.h1) ? page.h1 : [];
        const h2 = Array.isArray(page?.h2) ? page.h2 : [];
        const h3 = Array.isArray(page?.h3) ? page.h3 : [];
        const textBlocks = Array.isArray(page?.textBlocks) ? page.textBlocks : [];
        const importantLinks = Array.isArray(page?.importantLinks) ? page.importantLinks : [];
        const status = page?.status || 'unknown';

        return (
          '<div class="stage-output-item ' + (status === 'failed' ? 'is-rejected' : '') + '">' +
            '<div class="inline-meta"><strong>' + escapeHtmlClient(String(index + 1).padStart(2, '0') + '. ' + (page?.title || page?.domain || 'Page')) + '</strong><span>' + escapeHtmlClient(status + ' · ' + (page?.role || 'role n/a')) + '</span></div>' +
            '<p class="mono">' + escapeHtmlClient(page?.url || '—') + '</p>' +
            (page?.errorMessage ? '<p class="error-text">' + escapeHtmlClient(page.errorMessage) + '</p>' : '') +
            '<dl class="definition-list">' +
              '<dt>Meta</dt><dd>' + escapeHtmlClient(page?.metaDescription || '—') + '</dd>' +
              '<dt>Canonical</dt><dd class="mono">' + escapeHtmlClient(page?.canonical || '—') + '</dd>' +
              '<dt>Status</dt><dd>' + escapeHtmlClient(page?.statusCode ?? '—') + '</dd>' +
            '</dl>' +
            renderCompactStringList('H1', h1.slice(0, 3)) +
            renderCompactStringList('H2', h2.slice(0, 8)) +
            renderCompactStringList('H3', h3.slice(0, 6)) +
            renderCompactStringList('Text signals', textBlocks.slice(0, 5)) +
            (importantLinks.length
              ? '<details><summary>Important links · ' + escapeHtmlClient(importantLinks.length) + '</summary><div><pre>' + escapeHtmlClient(prettyJson(importantLinks)) + '</pre></div></details>'
              : '') +
          '</div>'
        );
      }

      function renderOnPageSynthesis(run) {
        const artifact = findArtifact(run, 'onpage_synthesis_snapshot');
        const payload = artifact?.payload || null;
        if (!artifact) {
          return '<section class="card full"><div class="empty">No OnPage synthesis saved yet.</div></section>';
        }

        const summary = payload?.competitorStructureSummary || {};
        const structure = payload?.recommendedArticleStructure || {};
        const insertion = payload?.productInsertion || {};
        const h2 = Array.isArray(structure?.h2) ? structure.h2 : [];
        const faq = Array.isArray(structure?.faq) ? structure.faq : [];
        const risks = Array.isArray(payload?.riskAndComplianceNotes) ? payload.riskAndComplianceNotes : [];

        return (
          '<section class="card full">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">Algorithm Step 12</div><h3>OnPage Synthesis</h3></div><span class="badge">' + escapeHtmlClient(payload?.artifactVersion || 'onpage_synthesis_snapshot') + '</span></div>' +
            '<p>Primary output: article structure requirements extracted from parsed competitor pages. This is the bridge between OnPage evidence and the final SEO brief.</p>' +
            '<div class="metric-grid compact">' +
              '<div><strong>' + escapeHtmlClient(payload?.pageCount ?? '—') + '</strong><span>Parsed pages</span></div>' +
              '<div><strong>' + escapeHtmlClient(h2.length) + '</strong><span>Recommended H2</span></div>' +
              '<div><strong>' + escapeHtmlClient((summary?.contentGaps || []).length || 0) + '</strong><span>Content gaps</span></div>' +
              '<div><strong>' + escapeHtmlClient(faq.length) + '</strong><span>FAQ</span></div>' +
            '</div>' +
            '<div class="brand-memory-grid">' +
              '<div class="brand-memory-block"><h4>Common H2 Patterns</h4>' + renderMemoryList(summary?.commonH2Patterns, 'No repeated H2 patterns saved.') + '</div>' +
              '<div class="brand-memory-block"><h4>Common Content Blocks</h4>' + renderMemoryList(summary?.commonContentBlocks, 'No common content blocks saved.') + '</div>' +
              '<div class="brand-memory-block"><h4>Common FAQ Questions</h4>' + renderMemoryList(summary?.commonFaqQuestions, 'No common FAQ saved.') + '</div>' +
              '<div class="brand-memory-block"><h4>Tables / Comparisons</h4>' + renderMemoryList(summary?.commonTablesOrComparisons, 'No table/comparison patterns saved.') + '</div>' +
              '<div class="brand-memory-block full"><h4>Content Gaps</h4>' + renderMemoryList(summary?.contentGaps, 'No content gaps saved.') + '</div>' +
            '</div>' +
            '<div class="section-subhead"><h4>Recommended Article Structure</h4><p>H1: ' + escapeHtmlClient(structure?.h1 || '—') + '</p></div>' +
            renderRecommendedOnPageSections(h2) +
            renderCompactStringList('Recommended FAQ', faq) +
            '<div class="section-subhead"><h4>Product Insertion</h4></div>' +
            '<div class="stage-output-item is-prominent">' +
              '<p><strong>Section:</strong> ' + escapeHtmlClient(insertion?.section || '—') + '</p>' +
              '<p><strong>Angle:</strong> ' + escapeHtmlClient(insertion?.angle || '—') + '</p>' +
              renderCompactStringList('Do', Array.isArray(insertion?.do) ? insertion.do : []) +
              renderCompactStringList('Avoid', Array.isArray(insertion?.avoid) ? insertion.avoid : []) +
            '</div>' +
            renderCompactStringList('Risk and compliance notes', risks) +
            '<details><summary>Raw OnPage synthesis</summary><div><pre>' + escapeHtmlClient(prettyJson(payload)) + '</pre></div></details>' +
          '</section>'
        );
      }

      function renderRecommendedOnPageSections(sections) {
        return sections.length
          ? '<div class="stage-output-list">' + sections.map((section, index) => (
              '<div class="stage-output-item">' +
                '<div class="inline-meta"><strong>' + escapeHtmlClient(String(index + 1).padStart(2, '0') + '. ' + (section?.heading || 'Section')) + '</strong><span>H2</span></div>' +
                '<p>' + escapeHtmlClient(section?.purpose || 'No purpose saved.') + '</p>' +
                renderCompactStringList('Subpoints', Array.isArray(section?.subpoints) ? section.subpoints : []) +
              '</div>'
            )).join('') + '</div>'
          : '<div class="empty">No recommended article sections saved.</div>';
      }

      function renderFinalSeoBrief(run) {
        const artifact = findArtifact(run, 'final_brief_snapshot');
        const brief = artifact?.payload?.brief || run.finalBrief?.briefPayload || null;
        if (!brief) {
          return '<section class="card full"><div class="empty">No final SEO brief generated yet.</div></section>';
        }

        const outline = Array.isArray(brief.outline) ? brief.outline : [];
        const faq = Array.isArray(brief.faq) ? brief.faq : [];
        const productInsertion = brief.productInsertion || {};

        return (
          '<section class="card full">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">Final Output</div><h3>Final SEO Brief</h3></div><span class="badge">' + escapeHtmlClient(artifact?.payload?.artifactVersion || 'final_seo_brief_v2') + '</span></div>' +
            '<div class="metric-grid compact">' +
              '<div><strong>' + escapeHtmlClient(brief.primaryKeyword || '—') + '</strong><span>Primary keyword</span></div>' +
              '<div><strong>' + escapeHtmlClient((brief.secondaryKeywords || []).length || 0) + '</strong><span>Secondary</span></div>' +
              '<div><strong>' + escapeHtmlClient(outline.length) + '</strong><span>Outline H2</span></div>' +
              '<div><strong>' + escapeHtmlClient(faq.length) + '</strong><span>FAQ</span></div>' +
            '</div>' +
            '<dl class="definition-list">' +
              '<dt>Recommended title</dt><dd>' + escapeHtmlClient(brief.recommendedTitle || brief.title || '—') + '</dd>' +
              '<dt>H1</dt><dd>' + escapeHtmlClient(brief.recommendedH1 || brief.recommendedTitle || '—') + '</dd>' +
              '<dt>Meta title</dt><dd>' + escapeHtmlClient(brief.recommendedMetaTitle || brief.metaTitle || '—') + '</dd>' +
              '<dt>Meta description</dt><dd>' + escapeHtmlClient(brief.recommendedMetaDescription || brief.metaDescription || '—') + '</dd>' +
              '<dt>Search intent</dt><dd>' + escapeHtmlClient(brief.searchIntent || brief.angle || '—') + '</dd>' +
              '<dt>Content type</dt><dd>' + escapeHtmlClient(brief.contentType || '—') + '</dd>' +
              '<dt>Target reader</dt><dd>' + escapeHtmlClient(brief.targetReader || run.audience || '—') + '</dd>' +
            '</dl>' +
            renderCompactStringList('Secondary keywords', Array.isArray(brief.secondaryKeywords) ? brief.secondaryKeywords : []) +
            '<div class="section-subhead"><h4>Outline</h4></div>' +
            renderFinalBriefOutline(outline) +
            renderFinalBriefFaq(faq) +
            '<div class="section-subhead"><h4>Product Insertion</h4></div>' +
            '<div class="stage-output-item is-prominent">' +
              '<p><strong>Where:</strong> ' + escapeHtmlClient(productInsertion.where || '—') + '</p>' +
              '<p><strong>How:</strong> ' + escapeHtmlClient(productInsertion.how || '—') + '</p>' +
              '<p><strong>Sample angle:</strong> ' + escapeHtmlClient(productInsertion.sampleAngle || '—') + '</p>' +
              renderCompactStringList('Avoid', Array.isArray(productInsertion.avoid) ? productInsertion.avoid : []) +
            '</div>' +
            renderCompactStringList('Competitor gaps to fill', Array.isArray(brief.competitorGapsToFill) ? brief.competitorGapsToFill : []) +
            renderCompactStringList('Risk notes', Array.isArray(brief.riskNotes) ? brief.riskNotes : []) +
            renderCompactStringList('Internal links', Array.isArray(brief.internalLinks) ? brief.internalLinks : []) +
            renderCompactStringList('External sources needed', Array.isArray(brief.externalSourcesNeeded) ? brief.externalSourcesNeeded : []) +
            '<div class="section-subhead"><h4>CTA</h4><p>' + escapeHtmlClient(brief.cta || '—') + '</p></div>' +
            '<details><summary>Raw final brief</summary><div><pre>' + escapeHtmlClient(prettyJson(brief)) + '</pre></div></details>' +
          '</section>'
        );
      }

      function renderFinalBriefOutline(outline) {
        return outline.length
          ? '<div class="stage-output-list">' + outline.map((section, index) => (
              '<div class="stage-output-item">' +
                '<div class="inline-meta"><strong>' + escapeHtmlClient(String(index + 1).padStart(2, '0') + '. ' + (section?.h2 || section?.heading || 'Section')) + '</strong><span>H2</span></div>' +
                '<p>' + escapeHtmlClient(section?.notes || section?.purpose || 'No notes saved.') + '</p>' +
                renderCompactStringList('H3', Array.isArray(section?.h3) ? section.h3 : Array.isArray(section?.keyPoints) ? section.keyPoints : []) +
              '</div>'
            )).join('') + '</div>'
          : '<div class="empty">No outline saved.</div>';
      }

      function renderFinalBriefFaq(faq) {
        return faq.length
          ? '<div class="section-subhead"><h4>FAQ</h4></div><div class="stage-output-list">' + faq.map((item, index) => (
              '<div class="stage-output-item">' +
                '<div class="inline-meta"><strong>' + escapeHtmlClient(String(index + 1).padStart(2, '0') + '. ' + (item?.question || 'Question')) + '</strong><span>FAQ</span></div>' +
                '<p>' + escapeHtmlClient(item?.answerDirection || item?.answer || 'No answer direction saved.') + '</p>' +
              '</div>'
            )).join('') + '</div>'
          : '';
      }

      function renderCompactStringList(label, items) {
        return items.length
          ? '<div class="related-query-inline"><span>' + escapeHtmlClient(label) + '</span><ul>' + items.map((item) => '<li>' + escapeHtmlClient(item) + '</li>').join('') + '</ul></div>'
          : '';
      }

      function getLaunchPanelNode() {
        if (!launchPanelNode) {
          launchPanelNode = qs('launchPanel');
        }
        return launchPanelNode;
      }

      function detachLaunchPanel() {
        const panel = getLaunchPanelNode();
        if (panel?.parentNode) {
          panel.parentNode.removeChild(panel);
        }
        return panel;
      }

      function renderEmptyDetail() {
        const launchPanel = detachLaunchPanel();
        appState.activeSeoStep = 'input';
        qs('detailContent').innerHTML =
          renderStepTabs({ input: true }) +
          '<section id="launchPanelMount" class="full"></section>';
        bindEmptyWorkflowTabs();
        if (launchPanel) {
          qs('launchPanelMount').appendChild(launchPanel);
          bindLaunchFormActions();
          populateProjectControls();
          syncBalanceSlider();
          syncInputMode();
        }
      }

      function bindEmptyWorkflowTabs() {
        document.querySelectorAll('[data-seo-step]').forEach((node) => {
          node.addEventListener('click', () => {
            const nextStep = node.getAttribute('data-seo-step');
            if (nextStep === 'input') {
              appState.activeSeoStep = 'input';
              renderEmptyDetail();
              return;
            }
            showToast('Create a run first');
          });
        });
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
        if (appState.activeSeoStep && appState.activeSeoStep !== 'input') {
          url.searchParams.set('step', appState.activeSeoStep);
        } else {
          url.searchParams.delete('step');
        }
        history.replaceState({}, '', url);
      }

      async function loadProjects() {
        const projects = await fetchJson('/projects');
        appState.projects = Array.isArray(projects) ? projects : [];
        populateProjectControls();
      }

      function populateProjectControls() {
        const options = ['<option value="">No project context</option>']
          .concat(appState.projects.map((project) => '<option value="' + escapeHtmlClient(project.id) + '">' + escapeHtmlClient(project.name) + '</option>'))
          .join('');
        if (qs('projectId')) {
          qs('projectId').innerHTML = options;
        }
        if (qs('projectFilter')) {
          qs('projectFilter').innerHTML = '<option value="">All projects</option>' + appState.projects
          .map((project) => '<option value="' + escapeHtmlClient(project.id) + '">' + escapeHtmlClient(project.name) + '</option>')
          .join('');
        }
        if (initialState.projectId) {
          if (qs('projectId')) qs('projectId').value = initialState.projectId;
          if (qs('projectFilter')) qs('projectFilter').value = initialState.projectId;
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
          appState.selectedRunId = null;
          appState.selectedRun = null;
          syncRunPolling(null);
          updateUrl(null);
          renderRunList();
        }

        if (!appState.initialRunSelectionDone && !appState.selectedRunId && initialState.runId) {
          appState.initialRunSelectionDone = true;
          await selectRun(initialState.runId, false);
          return;
        }

        appState.initialRunSelectionDone = true;
        if (!appState.selectedRunId) {
          renderEmptyDetail();
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

      function getManualStepFlags(run) {
        return {
          input: true,
          keywords: Boolean(findArtifact(run, 'keyword_hypotheses')),
          serp: Boolean(
            findArtifact(run, 'keyword_serp_preview_snapshots') ||
              findArtifact(run, 'first_keyword_serp_preview_snapshot'),
          ),
          candidates: Boolean(
            findArtifact(run, 'keyword_serp_derived_keywords') ||
              findArtifact(run, 'first_keyword_serp_derived_keywords'),
          ),
          rankedKeywords: Boolean(
            findArtifact(run, 'competitor_keyword_map') ||
              findArtifact(run, 'ranked_keywords_universe'),
          ),
          competitorMatching: Boolean(findArtifact(run, 'competitor_keyword_matches')),
          dirtyPool: Boolean(findArtifact(run, 'dirty_keyword_pool')),
          candidateScoring: Boolean(findArtifact(run, 'keyword_candidate_scoring')),
          clusters: Boolean(findArtifact(run, 'cluster_snapshot')),
          productFit: Boolean(findArtifact(run, 'cluster_product_fit_review')),
          selection: Boolean(findArtifact(run, 'cluster_selection_snapshot')),
          onPage: Boolean(findArtifact(run, 'onpage_research_snapshot')),
          onPageSynthesis: Boolean(findArtifact(run, 'onpage_synthesis_snapshot')),
          finalBrief: Boolean(findArtifact(run, 'final_brief_snapshot') || run.finalBrief),
        };
      }

      function getStepLoading(step) {
        return (
          (step === 'keywords' && appState.keywordHypothesesLoading) ||
          (step === 'serp' && appState.serpPreviewLoading) ||
          (step === 'candidates' && appState.serpDerivedCandidatesLoading) ||
          (step === 'rankedKeywords' && appState.rankedKeywordsLoading) ||
          (step === 'competitorMatching' && appState.competitorMatchingLoading) ||
          (step === 'dirtyPool' && appState.dirtyKeywordPoolLoading) ||
          (step === 'candidateScoring' && appState.candidateScoringLoading) ||
          (step === 'clusters' && appState.keywordClusteringLoading) ||
          (step === 'productFit' && appState.clusterProductFitLoading) ||
          (step === 'selection' && appState.clusterSelectionLoading) ||
          (step === 'onPage' && appState.onPageLoading) ||
          (step === 'onPageSynthesis' && appState.onPageSynthesisLoading) ||
          (step === 'finalBrief' && appState.finalBriefLoading)
        );
      }

      function normalizeActiveSeoStep() {
        if (!SEO_STEP_TABS.some((step) => step.id === appState.activeSeoStep)) {
          appState.activeSeoStep = 'input';
        }
      }

      function renderStepTabs(flags) {
        normalizeActiveSeoStep();
        return (
          '<section class="card full">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">Workflow</div><h3>Manual SEO Brief Flow</h3></div></div>' +
            '<div class="seo-step-tabs">' +
              SEO_STEP_TABS.map((step, index) => {
                const active = step.id === appState.activeSeoStep;
                const ready = Boolean(flags[step.id]);
                const loading = getStepLoading(step.id);
                const className = [
                  'seo-step-tab',
                  active ? 'is-active' : '',
                  ready ? 'is-ready' : '',
                  loading ? 'is-loading' : '',
                ].filter(Boolean).join(' ');
                return (
                  '<button type="button" class="' + escapeHtmlClient(className) + '" data-seo-step="' + escapeHtmlClient(step.id) + '">' +
                    '<span class="seo-step-dot"></span>' +
                    '<span>' + escapeHtmlClient(String(index) + ' ' + step.label) + '</span>' +
                  '</button>'
                );
              }).join('') +
            '</div>' +
          '</section>'
        );
      }

      function renderStepActionCard(run, flags) {
        const step = appState.activeSeoStep;
        const actionByStep = {
          input: {
            title: 'Input',
            message: 'This is the source context for the current run.',
            button: '',
            progress: '',
          },
          keywords: {
            title: 'Search Hypotheses',
            message: 'Generate Google-like search hypotheses from topic hint, manual user pains, manual scenarios, product context, and Brand Memory.',
            button:
              '<button type="button" class="' + escapeHtmlClient('primary ' + (appState.keywordHypothesesLoading ? 'is-loading' : '')) + '" id="generateKeywordHypothesesBtn" ' + (appState.keywordHypothesesLoading ? 'disabled' : '') + '>' + escapeHtmlClient(appState.keywordHypothesesLoading ? 'Generating hypotheses...' : flags.keywords ? 'Refresh Search Hypotheses' : 'Generate Search Hypotheses') + '</button>',
            progress: appState.keywordHypothesesLoading
              ? '<div class="inline-progress"><p>AI is generating search hypotheses from manual pains and scenarios.</p><div class="progress-track"><div class="progress-bar"></div></div></div>'
              : '',
          },
          serp: {
            title: 'SERP Snapshots',
            message: flags.keywords
              ? 'Select hypotheses by SERP enrichment count and fetch Google Organic SERP Advanced snapshots.'
              : 'Generate keywords first.',
            button:
              '<button type="button" class="' + escapeHtmlClient((flags.keywords ? 'primary ' : '') + (appState.serpPreviewLoading ? 'is-loading' : '')) + '" id="previewKeywordSerpsBtn" ' + (!flags.keywords || appState.serpPreviewLoading ? 'disabled' : '') + '>' + escapeHtmlClient(appState.serpPreviewLoading ? 'Fetching SERPs...' : flags.serp ? 'Refresh Selected SERPs' : 'Fetch Selected SERPs') + '</button>',
            progress: appState.serpPreviewLoading
              ? '<div class="inline-progress"><p>Selecting hypotheses and saving raw + normalized SERP snapshots.</p><div class="progress-track"><div class="progress-bar"></div></div></div>'
              : '',
          },
          candidates: {
            title: 'SERP Candidates',
            message: flags.serp
              ? 'Extract related queries, PAA questions, SERP features, and content themes from saved snapshots.'
              : 'Fetch SERP snapshots first.',
            button:
              '<button type="button" class="' + escapeHtmlClient((flags.serp ? 'primary ' : '') + (appState.serpDerivedCandidatesLoading ? 'is-loading' : '')) + '" id="extractSerpDerivedCandidatesBtn" ' + (!flags.serp || appState.serpDerivedCandidatesLoading ? 'disabled' : '') + '>' + escapeHtmlClient(appState.serpDerivedCandidatesLoading ? 'Extracting candidates...' : flags.candidates ? 'Refresh SERP Candidates' : 'Extract SERP Candidates') + '</button>',
            progress: appState.serpDerivedCandidatesLoading
              ? '<div class="inline-progress"><p>Extracting candidates from saved SERP snapshots.</p><div class="progress-track"><div class="progress-bar"></div></div></div>'
              : '',
          },
          rankedKeywords: {
            title: 'Competitor Keyword Map',
            message: 'Build reusable DataForSEO Ranked Keywords map from manual competitor domains in Step 0 input.',
            button:
              '<button type="button" class="' + escapeHtmlClient('primary ' + (appState.rankedKeywordsLoading ? 'is-loading' : '')) + '" id="buildCompetitorKeywordMapBtn" ' + (appState.rankedKeywordsLoading ? 'disabled' : '') + '>' + escapeHtmlClient(appState.rankedKeywordsLoading ? 'Building competitor map...' : flags.rankedKeywords ? 'Refresh Competitor Keyword Map' : 'Build Competitor Keyword Map') + '</button>',
            progress: appState.rankedKeywordsLoading
              ? '<div class="inline-progress"><p>Fetching Ranked Keywords from manual competitor domains and saving competitor_keywords_json_id.</p><div class="progress-track"><div class="progress-bar"></div></div></div>'
              : '',
          },
          competitorMatching: {
            title: 'Competitor Keyword Matching',
            message: flags.rankedKeywords && flags.keywords && flags.candidates
              ? 'Match AI/SERP candidate queries against competitor ranked keywords and calculate proxy demand evidence.'
              : 'Generate keywords, extract SERP candidates, and build Competitor Keyword Map first.',
            button:
              '<button type="button" class="' + escapeHtmlClient((flags.rankedKeywords && flags.keywords && flags.candidates ? 'primary ' : '') + (appState.competitorMatchingLoading ? 'is-loading' : '')) + '" id="matchCompetitorKeywordsBtn" ' + (!flags.rankedKeywords || !flags.keywords || !flags.candidates || appState.competitorMatchingLoading ? 'disabled' : '') + '>' + escapeHtmlClient(appState.competitorMatchingLoading ? 'Matching competitor keywords...' : flags.competitorMatching ? 'Refresh Competitor Matching' : 'Match Competitor Keywords') + '</button>',
            progress: appState.competitorMatchingLoading
              ? '<div class="inline-progress"><p>Matching candidate queries to competitor ranked keywords without copying competitor volume.</p><div class="progress-track"><div class="progress-bar"></div></div></div>'
              : '',
          },
          dirtyPool: {
            title: 'Dirty Keyword Pool',
            message: flags.competitorMatching
              ? 'Merge hypotheses, SERP-derived candidates, competitor matches, selected related queries, and Ranked Keywords into one dirty pool.'
              : 'Run Competitor Keyword Matching first.',
            button:
              '<button type="button" class="' + escapeHtmlClient((flags.competitorMatching ? 'primary ' : '') + (appState.dirtyKeywordPoolLoading ? 'is-loading' : '')) + '" id="buildDirtyKeywordPoolBtn" ' + (!flags.competitorMatching || appState.dirtyKeywordPoolLoading ? 'disabled' : '') + '>' + escapeHtmlClient(appState.dirtyKeywordPoolLoading ? 'Building dirty pool...' : flags.dirtyPool ? 'Refresh Dirty Keyword Pool' : 'Build Dirty Keyword Pool') + '</button>',
            progress: appState.dirtyKeywordPoolLoading
              ? '<div class="inline-progress"><p>Merging saved keyword evidence into one candidate pool.</p><div class="progress-track"><div class="progress-bar"></div></div></div>'
              : '',
          },
          candidateScoring: {
            title: 'Staged Candidate Filtering',
            message: flags.dirtyPool
              ? 'Filter dirty-pool candidates through noise removal, semantic buckets, product fit, and per-bucket shortlist caps.'
              : 'Build the dirty keyword pool first.',
            button:
              '<button type="button" class="' + escapeHtmlClient((flags.dirtyPool ? 'primary ' : '') + (appState.candidateScoringLoading ? 'is-loading' : '')) + '" id="scoreKeywordCandidatesBtn" ' + (!flags.dirtyPool || appState.candidateScoringLoading ? 'disabled' : '') + '>' + escapeHtmlClient(appState.candidateScoringLoading ? 'Filtering candidates...' : flags.candidateScoring ? 'Refresh Staged Filtering' : 'Run Staged Filtering') + '</button>',
            progress: appState.candidateScoringLoading
              ? '<div class="inline-progress"><p>Running deterministic staged filtering without an LLM scoring call.</p><div class="progress-track"><div class="progress-bar"></div></div></div>'
              : '',
          },
          clusters: {
            title: 'Intent Clusters',
            message: flags.candidateScoring
              ? 'Group accepted and maybe candidates into intent-based SEO clusters.'
              : 'Filter and score candidates first.',
            button:
              '<button type="button" class="' + escapeHtmlClient((flags.candidateScoring ? 'primary ' : '') + (appState.keywordClusteringLoading ? 'is-loading' : '')) + '" id="clusterKeywordCandidatesBtn" ' + (!flags.candidateScoring || appState.keywordClusteringLoading ? 'disabled' : '') + '>' + escapeHtmlClient(appState.keywordClusteringLoading ? 'Building clusters...' : flags.clusters ? 'Refresh Intent Clusters' : 'Build Intent Clusters') + '</button>',
            progress: appState.keywordClusteringLoading
              ? '<div class="inline-progress"><p>Grouping viable candidates by user intent and preserving evidence.</p><div class="progress-track"><div class="progress-bar"></div></div></div>'
              : '',
          },
          productFit: {
            title: 'Cluster Product Fit Review',
            message: flags.clusters
              ? 'Review whether Reinforce can naturally fit each whole intent cluster.'
              : 'Build intent clusters first.',
            button:
              '<button type="button" class="' + escapeHtmlClient((flags.clusters ? 'primary ' : '') + (appState.clusterProductFitLoading ? 'is-loading' : '')) + '" id="reviewClusterProductFitBtn" ' + (!flags.clusters || appState.clusterProductFitLoading ? 'disabled' : '') + '>' + escapeHtmlClient(appState.clusterProductFitLoading ? 'Reviewing Product Fit...' : flags.productFit ? 'Refresh Product Fit Review' : 'Review Product Fit') + '</button>',
            progress: appState.clusterProductFitLoading
              ? '<div class="inline-progress"><p>Reviewing whole clusters against product facts, Brand Memory, audience fit, and compliance constraints.</p><div class="progress-track"><div class="progress-bar"></div></div></div>'
              : '',
          },
          selection: {
            title: 'Main & Supporting Cluster Selection',
            message: flags.productFit
              ? 'Select 1 main cluster and 2-3 supporting clusters using Product Fit, proxy demand evidence, intent, SERP support, source confidence, and risk penalty.'
              : 'Review Product Fit first.',
            button:
              '<button type="button" class="' + escapeHtmlClient((flags.productFit ? 'primary ' : '') + (appState.clusterSelectionLoading ? 'is-loading' : '')) + '" id="selectSeoBriefClustersBtn" ' + (!flags.productFit || appState.clusterSelectionLoading ? 'disabled' : '') + '>' + escapeHtmlClient(appState.clusterSelectionLoading ? 'Selecting clusters...' : flags.selection ? 'Refresh Cluster Selection' : 'Select Main Cluster') + '</button>',
            progress: appState.clusterSelectionLoading
              ? '<div class="inline-progress"><p>Scoring clusters by Product Fit, proxy demand evidence, intent relevance, SERP support, source diversity, and risk penalty.</p><div class="progress-track"><div class="progress-bar"></div></div></div>'
              : '',
          },
          onPage: {
            title: 'Selected Cluster OnPage Evidence',
            message: flags.selection
              ? 'Fetch content parsing and instant page metadata for 3-5 selected SERP URLs from the chosen cluster.'
              : 'Select the main cluster first.',
            button:
              '<button type="button" class="' + escapeHtmlClient((flags.selection ? 'primary ' : '') + (appState.onPageLoading ? 'is-loading' : '')) + '" id="fetchSelectedClusterOnPageBtn" ' + (!flags.selection || appState.onPageLoading ? 'disabled' : '') + '>' + escapeHtmlClient(appState.onPageLoading ? 'Fetching OnPage evidence...' : flags.onPage ? 'Refresh OnPage Evidence' : 'Fetch OnPage Evidence') + '</button>',
            progress: appState.onPageLoading
              ? '<div class="inline-progress"><p>Parsing selected competitor pages through DataForSEO content parsing and instant pages.</p><div class="progress-track"><div class="progress-bar"></div></div></div>'
              : '',
          },
          onPageSynthesis: {
            title: 'OnPage Synthesis',
            message: flags.onPage
              ? 'AI turns parsed competitor pages into article structure requirements, gaps, FAQ ideas, and product insertion guardrails.'
              : 'Fetch selected cluster OnPage evidence first.',
            button:
              '<button type="button" class="' + escapeHtmlClient((flags.onPage ? 'primary ' : '') + (appState.onPageSynthesisLoading ? 'is-loading' : '')) + '" id="synthesizeOnPageBtn" ' + (!flags.onPage || appState.onPageSynthesisLoading ? 'disabled' : '') + '>' + escapeHtmlClient(appState.onPageSynthesisLoading ? 'Synthesizing OnPage...' : flags.onPageSynthesis ? 'Refresh OnPage Synthesis' : 'Synthesize OnPage') + '</button>',
            progress: appState.onPageSynthesisLoading
              ? '<div class="inline-progress"><p>AI is comparing competitor page structures and extracting brief requirements.</p><div class="progress-track"><div class="progress-bar"></div></div></div>'
              : '',
          },
          finalBrief: {
            title: 'Final SEO Brief',
            message: flags.onPageSynthesis
              ? 'Generate the production-ready SEO content brief from selected cluster, keyword evidence, Product Fit, and OnPage synthesis.'
              : 'Synthesize OnPage evidence first.',
            button:
              '<button type="button" class="' + escapeHtmlClient((flags.onPageSynthesis ? 'primary ' : '') + (appState.finalBriefLoading ? 'is-loading' : '')) + '" id="generateFinalBriefBtn" ' + (!flags.onPageSynthesis || appState.finalBriefLoading ? 'disabled' : '') + '>' + escapeHtmlClient(appState.finalBriefLoading ? 'Generating final brief...' : flags.finalBrief ? 'Refresh Final Brief' : 'Generate Final Brief') + '</button>',
            progress: appState.finalBriefLoading
              ? '<div class="inline-progress"><p>AI is assembling title, metadata, outline, FAQ, product insertion, gaps, risks, CTA, and source requirements.</p><div class="progress-track"><div class="progress-bar"></div></div></div>'
              : '',
          },
        };
        const current = actionByStep[step] || actionByStep.input;
        return (
          '<section class="card full">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">Step Action</div><h3>' + escapeHtmlClient(current.title) + '</h3></div><span class="badge ' + statusClass(run.status) + '">' + escapeHtmlClient(run.status) + '</span></div>' +
            '<p>' + escapeHtmlClient(current.message) + '</p>' +
            (current.button ? '<div class="actions">' + current.button + '</div>' : '') +
            current.progress +
          '</section>'
        );
      }

      function renderInputStep(run) {
        const inputArtifact = findArtifact(run, 'normalized_input');
        const inputPayload = inputArtifact?.payload || {};
        const manualPains = Array.isArray(inputPayload.userPains) ? inputPayload.userPains : [];
        const manualScenarios = Array.isArray(inputPayload.userScenarios) ? inputPayload.userScenarios : [];
        return (
          '<section class="card full">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">Input</div><h3>Run Context</h3></div></div>' +
            '<dl class="definition-list">' +
              '<dt>Topic</dt><dd>' + escapeHtmlClient(run.topicSeed) + '</dd>' +
              '<dt>Project</dt><dd>' + escapeHtmlClient(getProjectName(run.projectId)) + '</dd>' +
              '<dt>Market</dt><dd>' + escapeHtmlClient(run.market.country + ' · ' + run.market.language) + '</dd>' +
              '<dt>AI Model</dt><dd>' + escapeHtmlClient(aiModelModeLabel(readRunAiModelMode(run))) + '</dd>' +
              '<dt>Hypotheses / SERP Enrichment</dt><dd>' + escapeHtmlClient(String(inputPayload.hypothesesCount ?? '—') + ' / ' + String(inputPayload.serpEnrichmentCount ?? '—')) + '</dd>' +
              '<dt>Competitor Keyword Map</dt><dd>' + escapeHtmlClient(inputPayload.competitorKeywordsJsonId || '—') + '</dd>' +
              '<dt>Audience</dt><dd>' + escapeHtmlClient(run.audience || '—') + '</dd>' +
              '<dt>Product</dt><dd>' + escapeHtmlClient(run.product.name) + '</dd>' +
            '</dl>' +
            '<div class="brand-memory-grid">' +
              '<div class="brand-memory-block"><h4>Manual User Pains</h4>' + renderMemoryList(manualPains, 'No manual user pains saved.') + '</div>' +
              '<div class="brand-memory-block"><h4>Manual User Scenarios</h4>' + renderMemoryList(manualScenarios, 'No manual user scenarios saved.') + '</div>' +
            '</div>' +
          '</section>'
        );
      }

      function renderActiveStepContent(run, flags) {
        switch (appState.activeSeoStep) {
          case 'keywords':
            return flags.keywords
              ? '<section class="card full"><div class="section-head"><div class="stack"><div class="eyebrow">Output</div><h3>Search Hypotheses From Manual Input</h3></div></div>' + renderKeywordHypotheses(run) + '</section>'
              : '<section class="card full"><div class="empty">No keyword hypotheses generated yet.</div></section>';
          case 'serp':
            return flags.serp
              ? renderFirstKeywordSerpPreview(run)
              : '<section class="card full"><div class="empty">No SERP snapshots fetched yet.</div></section>';
          case 'candidates':
            return flags.candidates
              ? renderFirstKeywordSerpPreview(run)
              : '<section class="card full"><div class="empty">No SERP candidates extracted yet.</div></section>';
          case 'rankedKeywords':
            return renderRankedKeywordsUniverse(run);
          case 'competitorMatching':
            return renderCompetitorKeywordMatches(run);
          case 'dirtyPool':
            return renderDirtyKeywordPool(run);
          case 'candidateScoring':
            return renderKeywordCandidateScoring(run);
          case 'clusters':
            return renderIntentClusters(run);
          case 'productFit':
            return renderClusterProductFitReview(run);
          case 'selection':
            return renderClusterSelection(run);
          case 'onPage':
            return renderSelectedClusterOnPage(run);
          case 'onPageSynthesis':
            return renderOnPageSynthesis(run);
          case 'finalBrief':
            return renderFinalSeoBrief(run);
          default:
            return renderInputStep(run);
        }
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
        detachLaunchPanel();
        const manualStepFlags = getManualStepFlags(run);

        qs('detailContent').innerHTML =
          '<section class="card full">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">Run</div><h2>' + escapeHtmlClient(run.topicSeed) + '</h2></div><span class="badge ' + statusClass(run.status) + '">' + escapeHtmlClient(run.status) + '</span></div>' +
            '<dl class="definition-list">' +
              '<dt>Run ID</dt><dd class="mono">' + escapeHtmlClient(run.id) + '</dd>' +
              '<dt>Project</dt><dd>' + escapeHtmlClient(getProjectName(run.projectId)) + '</dd>' +
              '<dt>Market</dt><dd>' + escapeHtmlClient(run.market.country + ' · ' + run.market.language) + '</dd>' +
              '<dt>AI Model</dt><dd>' + escapeHtmlClient(aiModelModeLabel(readRunAiModelMode(run))) + '</dd>' +
              '<dt>Product</dt><dd>' + escapeHtmlClient(run.product.name) + '</dd>' +
              '<dt>Created</dt><dd>' + escapeHtmlClient(prettyDate(run.createdAt)) + '</dd>' +
              '<dt>Updated</dt><dd>' + escapeHtmlClient(prettyDate(run.updatedAt)) + '</dd>' +
              '<dt>Failure Reason</dt><dd>' + escapeHtmlClient(run.failureReason || '—') + '</dd>' +
            '</dl>' +
          '</section>' +

          renderStepTabs(manualStepFlags) +
          renderStepActionCard(run, manualStepFlags) +
          renderActiveStepContent(run, manualStepFlags);

        bindDetailActions(run);
      }

      function bindDetailActions(run) {
        document.querySelectorAll('[data-seo-step]').forEach((node) => {
          node.addEventListener('click', () => {
            const nextStep = node.getAttribute('data-seo-step');
            if (!nextStep) return;
            appState.activeSeoStep = nextStep;
            updateUrl(run.id);
            renderDetail(run);
          });
        });

        qs('generateKeywordHypothesesBtn')?.addEventListener('click', async () => {
          if (appState.keywordHypothesesLoading) return;
          appState.keywordHypothesesLoading = true;
          renderDetail(run);
          try {
            await fetchJson(
              '/seo-briefing/runs/' +
                encodeURIComponent(run.id) +
                '/generate-keyword-hypotheses',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
              },
            );
            showToast('Keyword hypotheses generated from user pains');
            await loadRuns();
            appState.keywordHypothesesLoading = false;
            appState.activeSeoStep = 'keywords';
            await selectRun(run.id, false);
          } catch (error) {
            appState.keywordHypothesesLoading = false;
            renderDetail(run);
            showToast(error instanceof Error ? error.message : 'Failed to generate keywords');
          }
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
            showToast('SERP snapshots saved for selected hypotheses');
            await loadRuns();
            appState.serpPreviewLoading = false;
            appState.activeSeoStep = 'serp';
            await selectRun(run.id, false);
          } catch (error) {
            appState.serpPreviewLoading = false;
            renderDetail(run);
            showToast(error instanceof Error ? error.message : 'Failed to fetch SERP snapshots');
          }
        });
        qs('extractSerpDerivedCandidatesBtn')?.addEventListener('click', async () => {
          if (appState.serpDerivedCandidatesLoading) return;
          appState.serpDerivedCandidatesLoading = true;
          renderDetail(run);
          try {
            await fetchJson(
              '/seo-briefing/runs/' +
                encodeURIComponent(run.id) +
                '/extract-serp-derived-candidates',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
              },
            );
            showToast('SERP-derived candidates extracted');
            await loadRuns();
            appState.serpDerivedCandidatesLoading = false;
            appState.activeSeoStep = 'candidates';
            await selectRun(run.id, false);
          } catch (error) {
            appState.serpDerivedCandidatesLoading = false;
            renderDetail(run);
            showToast(
              error instanceof Error ? error.message : 'Failed to extract SERP candidates',
            );
          }
        });
        qs('buildCompetitorKeywordMapBtn')?.addEventListener('click', async () => {
          if (appState.rankedKeywordsLoading) return;
          appState.rankedKeywordsLoading = true;
          renderDetail(run);
          try {
            await fetchJson(
              '/seo-briefing/runs/' +
                encodeURIComponent(run.id) +
                '/build-competitor-keyword-map',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
              },
            );
            showToast('Competitor keyword map built');
            await loadRuns();
            appState.rankedKeywordsLoading = false;
            appState.activeSeoStep = 'rankedKeywords';
            await selectRun(run.id, false);
          } catch (error) {
            appState.rankedKeywordsLoading = false;
            renderDetail(run);
            showToast(
              error instanceof Error ? error.message : 'Failed to build competitor keyword map',
            );
          }
        });
        qs('matchCompetitorKeywordsBtn')?.addEventListener('click', async () => {
          if (appState.competitorMatchingLoading) return;
          appState.competitorMatchingLoading = true;
          renderDetail(run);
          try {
            await fetchJson(
              '/seo-briefing/runs/' +
                encodeURIComponent(run.id) +
                '/match-competitor-keywords',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
              },
            );
            showToast('Competitor keyword matching saved');
            await loadRuns();
            appState.competitorMatchingLoading = false;
            appState.activeSeoStep = 'competitorMatching';
            await selectRun(run.id, false);
          } catch (error) {
            appState.competitorMatchingLoading = false;
            renderDetail(run);
            showToast(
              error instanceof Error ? error.message : 'Failed to match competitor keywords',
            );
          }
        });
        qs('buildDirtyKeywordPoolBtn')?.addEventListener('click', async () => {
          if (appState.dirtyKeywordPoolLoading) return;
          appState.dirtyKeywordPoolLoading = true;
          renderDetail(run);
          try {
            await fetchJson(
              '/seo-briefing/runs/' +
                encodeURIComponent(run.id) +
                '/build-dirty-keyword-pool',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
              },
            );
            showToast('Dirty keyword pool built');
            await loadRuns();
            appState.dirtyKeywordPoolLoading = false;
            appState.activeSeoStep = 'dirtyPool';
            await selectRun(run.id, false);
          } catch (error) {
            appState.dirtyKeywordPoolLoading = false;
            renderDetail(run);
            showToast(
              error instanceof Error ? error.message : 'Failed to build dirty keyword pool',
            );
          }
        });
        qs('scoreKeywordCandidatesBtn')?.addEventListener('click', async () => {
          if (appState.candidateScoringLoading) return;
          appState.candidateScoringLoading = true;
          renderDetail(run);
          try {
            await fetchJson(
              '/seo-briefing/runs/' +
                encodeURIComponent(run.id) +
                '/score-keyword-candidates',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
              },
            );
            showToast('Keyword candidates filtered and scored');
            await loadRuns();
            appState.candidateScoringLoading = false;
            appState.activeSeoStep = 'candidateScoring';
            await selectRun(run.id, false);
          } catch (error) {
            appState.candidateScoringLoading = false;
            renderDetail(run);
            showToast(
              error instanceof Error ? error.message : 'Failed to score keyword candidates',
            );
          }
        });
        qs('clusterKeywordCandidatesBtn')?.addEventListener('click', async () => {
          if (appState.keywordClusteringLoading) return;
          appState.keywordClusteringLoading = true;
          renderDetail(run);
          try {
            await fetchJson(
              '/seo-briefing/runs/' +
                encodeURIComponent(run.id) +
                '/cluster-keyword-candidates',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
              },
            );
            showToast('Intent clusters built');
            await loadRuns();
            appState.keywordClusteringLoading = false;
            appState.activeSeoStep = 'clusters';
            await selectRun(run.id, false);
          } catch (error) {
            appState.keywordClusteringLoading = false;
            renderDetail(run);
            showToast(
              error instanceof Error ? error.message : 'Failed to build intent clusters',
            );
          }
        });
        qs('reviewClusterProductFitBtn')?.addEventListener('click', async () => {
          if (appState.clusterProductFitLoading) return;
          appState.clusterProductFitLoading = true;
          renderDetail(run);
          try {
            await fetchJson(
              '/seo-briefing/runs/' +
                encodeURIComponent(run.id) +
                '/review-cluster-product-fit',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
              },
            );
            showToast('Cluster Product Fit review saved');
            await loadRuns();
            appState.clusterProductFitLoading = false;
            appState.activeSeoStep = 'productFit';
            await selectRun(run.id, false);
          } catch (error) {
            appState.clusterProductFitLoading = false;
            renderDetail(run);
            showToast(
              error instanceof Error ? error.message : 'Failed to review cluster Product Fit',
            );
          }
        });
        qs('selectSeoBriefClustersBtn')?.addEventListener('click', async () => {
          if (appState.clusterSelectionLoading) return;
          appState.clusterSelectionLoading = true;
          renderDetail(run);
          try {
            await fetchJson(
              '/seo-briefing/runs/' +
                encodeURIComponent(run.id) +
                '/select-seo-brief-clusters',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
              },
            );
            showToast('Main and supporting clusters selected');
            await loadRuns();
            appState.clusterSelectionLoading = false;
            appState.activeSeoStep = 'selection';
            await selectRun(run.id, false);
          } catch (error) {
            appState.clusterSelectionLoading = false;
            renderDetail(run);
            showToast(
              error instanceof Error ? error.message : 'Failed to select SEO brief clusters',
            );
          }
        });
        qs('fetchSelectedClusterOnPageBtn')?.addEventListener('click', async () => {
          if (appState.onPageLoading) return;
          appState.onPageLoading = true;
          renderDetail(run);
          try {
            await fetchJson(
              '/seo-briefing/runs/' +
                encodeURIComponent(run.id) +
                '/fetch-selected-cluster-onpage',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
              },
            );
            showToast('Selected cluster OnPage evidence saved');
            await loadRuns();
            appState.onPageLoading = false;
            appState.activeSeoStep = 'onPage';
            await selectRun(run.id, false);
          } catch (error) {
            appState.onPageLoading = false;
            renderDetail(run);
            showToast(
              error instanceof Error ? error.message : 'Failed to fetch selected cluster OnPage',
            );
          }
        });
        qs('synthesizeOnPageBtn')?.addEventListener('click', async () => {
          if (appState.onPageSynthesisLoading) return;
          appState.onPageSynthesisLoading = true;
          renderDetail(run);
          try {
            await fetchJson(
              '/seo-briefing/runs/' +
                encodeURIComponent(run.id) +
                '/synthesize-onpage',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
              },
            );
            showToast('OnPage synthesis saved');
            await loadRuns();
            appState.onPageSynthesisLoading = false;
            appState.activeSeoStep = 'onPageSynthesis';
            await selectRun(run.id, false);
          } catch (error) {
            appState.onPageSynthesisLoading = false;
            renderDetail(run);
            showToast(
              error instanceof Error ? error.message : 'Failed to synthesize OnPage evidence',
            );
          }
        });
        qs('generateFinalBriefBtn')?.addEventListener('click', async () => {
          if (appState.finalBriefLoading) return;
          appState.finalBriefLoading = true;
          renderDetail(run);
          try {
            await fetchJson(
              '/seo-briefing/runs/' +
                encodeURIComponent(run.id) +
                '/generate-final-brief',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
              },
            );
            showToast('Final SEO brief generated');
            await loadRuns();
            appState.finalBriefLoading = false;
            appState.activeSeoStep = 'finalBrief';
            await selectRun(run.id, false);
          } catch (error) {
            appState.finalBriefLoading = false;
            renderDetail(run);
            showToast(
              error instanceof Error ? error.message : 'Failed to generate final SEO brief',
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

      function startNewRun() {
        appState.selectedRunId = null;
        appState.selectedRun = null;
        appState.keywordHypothesesLoading = false;
        appState.serpPreviewLoading = false;
        appState.serpDerivedCandidatesLoading = false;
        appState.rankedKeywordsLoading = false;
        appState.competitorMatchingLoading = false;
        appState.dirtyKeywordPoolLoading = false;
        appState.candidateScoringLoading = false;
        appState.keywordClusteringLoading = false;
        appState.clusterProductFitLoading = false;
        appState.activeSeoStep = 'input';
        syncRunPolling(null);
        updateUrl(null);
        renderRunList();
        renderEmptyDetail();
        qs('topicHint').focus();
        showToast('Ready for a new SEO brief');
      }

      async function createRun(event) {
        event.preventDefault();
        const launchBtn = qs('launchBtn');
        launchBtn.disabled = true;
        try {
          const payload = {
            projectId: qs('projectId').value || null,
            aiModelMode: qs('aiModelMode').value,
            topicHint: qs('topicHint').value,
            hypothesesCount: Number(qs('hypothesesCount').value || '10'),
            serpEnrichmentCount: Number(qs('serpEnrichmentCount').value || '10'),
            competitorKeywordsJsonId: qs('competitorKeywordsJsonId').value || null,
            market: {
              country: qs('country').value,
              language: qs('language').value,
            },
            audience: qs('audience').value,
            userPains: parseListInput('userPains'),
            userScenarios: parseListInput('userScenarios'),
            keywordExpansionPrompt: qs('keywordExpansionPrompt').value || null,
            product: {
              name: qs('productName').value,
              description: qs('productDescription').value,
            },
            keyMessage: qs('keyMessage').value || null,
            knownCompetitors: {
              mustInclude: parseListInput('knownCompetitorsMustInclude'),
              optional: parseListInput('knownCompetitorsOptional'),
              exclude: parseListInput('knownCompetitorsExclude'),
            },
            brandConstraints: parseListInput('brandConstraints'),
            claimsConstraints: parseListInput('claimsConstraints'),
            preferredAngle: qs('preferredAngle').value || null,
            excludedTopics: parseListInput('excludedTopics'),
            campaignContext: qs('campaignContext').value || null,
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
          appState.selectedRunId = result.runId;
          appState.activeSeoStep = 'keywords';
          showToast(result.deduplicated ? 'Reused recent run: ' + result.runId : 'Run created. Generate search hypotheses next.');
          await loadRuns();
          await selectRun(result.runId);
        } catch (error) {
          showToast(error instanceof Error ? error.message : 'Failed to create run');
        } finally {
          launchBtn.disabled = false;
        }
      }

      function bindLaunchFormActions() {
        const launchForm = qs('launchForm');
        if (!launchForm || launchForm.dataset.bound === 'true') {
          return;
        }
        launchForm.dataset.bound = 'true';
        launchForm.addEventListener('submit', createRun);
        qs('balanceSlider')?.addEventListener('input', syncBalanceSlider);
        document.querySelectorAll('input[name="inputMode"]').forEach((input) => {
          input.addEventListener('change', syncInputMode);
        });
        qs('extractBriefTextBtn')?.addEventListener('click', async () => {
          try {
            await extractContextFromText(qs('briefContextText').value);
          } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to extract context');
          }
        });
        qs('extractFileBtn')?.addEventListener('click', async () => {
          const file = qs('briefContextFile').files?.[0] || null;
          if (!file) {
            showToast('Select a brief file first');
            return;
          }
          try {
            const text = await readTextFile(file);
            await extractContextFromText(text);
          } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to extract file context');
          }
        });
        qs('fillFromBrandMemoryBtn')?.addEventListener('click', fillFromBrandMemory);
      }

      async function boot() {
        bindLaunchFormActions();
        qs('startNewRunBtn').addEventListener('click', startNewRun);
        syncBalanceSlider();
        syncInputMode();
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
