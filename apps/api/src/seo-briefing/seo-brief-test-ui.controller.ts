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
    @Query('markerId') markerId?: string,
    @Query('step') step?: string,
  ): string {
    const initialState = JSON.stringify({
      runId: runId?.trim() || null,
      projectId: projectId?.trim() || null,
      markerId: markerId?.trim() || null,
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
      .run-library-panel {
        display: grid;
        gap: 14px;
        padding-top: 16px;
        border-top: 1px solid var(--line);
      }
      .run-library-panel[hidden] {
        display: none;
      }
      .run-library-panel .run-list {
        max-height: 520px;
        overflow: auto;
        padding-right: 4px;
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
      .mode-guide {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin-top: 2px;
      }
      .mode-card {
        border: 1px solid var(--line);
        border-radius: 20px;
        padding: 14px;
        background: rgba(255, 255, 255, 0.62);
        display: grid;
        gap: 8px;
        cursor: default;
        text-align: left;
        transition: 140ms ease;
      }
      .mode-card:hover {
        border-color: var(--line-strong);
      }
      .mode-card.is-selected {
        border-color: rgba(27, 107, 75, 0.36);
        background: rgba(27, 107, 75, 0.08);
      }
      .mode-card.is-disabled {
        cursor: not-allowed;
        opacity: 0.58;
        transform: none;
      }
      .mode-card strong {
        font-size: 14px;
      }
      .mode-card p {
        margin: 0;
        color: var(--muted);
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
      .json-editor {
        min-height: 420px;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
        font-size: 13px;
        line-height: 1.5;
        white-space: pre;
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
      details.advanced-field summary {
        cursor: pointer;
        color: var(--warning);
        font-weight: 700;
      }
      details.advanced-field > p {
        margin-top: 8px;
      }
      .advanced-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        margin-top: 14px;
      }
      .advanced-grid .full {
        grid-column: 1 / -1;
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
      .model-picker {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }
      .workflow-mode-picker {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .model-option {
        position: relative;
        min-height: 104px;
        border: 1px solid var(--line);
        border-radius: 22px;
        padding: 14px;
        background: rgba(255, 255, 255, 0.58);
        cursor: pointer;
        display: grid;
        gap: 8px;
        transition: 140ms ease;
      }
      .model-option:hover {
        transform: translateY(-1px);
        border-color: var(--line-strong);
        background: rgba(255, 255, 255, 0.78);
      }
      .model-option.is-selected {
        border-color: rgba(20, 19, 17, 0.34);
        background: linear-gradient(135deg, rgba(20, 19, 17, 0.92), rgba(20, 19, 17, 0.72));
        color: #fffaf2;
        box-shadow: 0 14px 32px rgba(20, 19, 17, 0.12);
      }
      .model-option input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }
      .model-option strong {
        font-size: 15px;
      }
      .model-option span {
        color: inherit;
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        opacity: 0.72;
      }
      .model-option p {
        color: var(--muted);
        font-size: 13px;
      }
      .model-option.is-selected p {
        color: rgba(255, 250, 242, 0.74);
      }
      .auto-flow-progress {
        border-color: rgba(27, 107, 75, 0.26);
        background: linear-gradient(135deg, rgba(27, 107, 75, 0.1), rgba(255, 255, 255, 0.72));
      }
      .auto-flow-progress strong {
        display: block;
        margin-bottom: 6px;
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
      .prompt-inventory {
        border: 1px solid rgba(180, 132, 41, 0.22);
        border-radius: 22px;
        background: rgba(255, 248, 232, 0.72);
        padding: 0;
      }
      .prompt-inventory > summary {
        cursor: pointer;
        list-style: none;
        padding: 16px 18px;
        font-weight: 700;
      }
      .prompt-inventory > summary::-webkit-details-marker {
        display: none;
      }
      .prompt-inventory-body {
        border-top: 1px solid rgba(180, 132, 41, 0.16);
        display: grid;
        gap: 14px;
        padding: 16px 18px 18px;
      }
      .prompt-group {
        display: grid;
        gap: 8px;
      }
      .prompt-group h4 {
        margin: 0;
      }
      .prompt-card {
        border: 1px solid var(--line);
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.72);
        padding: 12px 14px;
        display: grid;
        gap: 7px;
      }
      .prompt-card-head {
        display: flex;
        gap: 8px;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
      }
      .prompt-card code {
        border-radius: 999px;
        background: rgba(18, 18, 18, 0.06);
        color: var(--muted);
        font-size: 12px;
        padding: 5px 8px;
      }
      .prompt-card p {
        color: var(--muted);
      }
      .prompt-meta {
        display: grid;
        gap: 5px;
      }
      .prompt-meta span {
        color: var(--muted);
      }
      .cost-receipt {
        border-color: rgba(20, 19, 17, 0.16);
        background: rgba(255, 255, 255, 0.72);
      }
      .cost-receipt > summary {
        cursor: pointer;
        list-style: none;
      }
      .cost-receipt > summary::-webkit-details-marker {
        display: none;
      }
      .cost-summary-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
        margin-top: 14px;
      }
      .cost-summary-grid article,
      .cost-row {
        border: 1px solid var(--line);
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.62);
        padding: 12px 14px;
      }
      .cost-summary-grid strong {
        display: block;
        font-size: 24px;
        letter-spacing: -0.04em;
      }
      .cost-summary-grid span,
      .cost-row small {
        color: var(--muted);
      }
      .cost-rows {
        display: grid;
        gap: 8px;
        margin-top: 12px;
      }
      .cost-row {
        display: grid;
        grid-template-columns: minmax(180px, 1.3fr) repeat(3, minmax(90px, 0.5fr)) minmax(220px, 1.4fr);
        gap: 10px;
        align-items: start;
      }
      .cost-row strong {
        display: block;
      }
      .cost-row code {
        display: inline-block;
        color: var(--muted);
        font-size: 12px;
        word-break: break-word;
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
      .progress-bar.is-determinate {
        animation: none;
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
      .ai-progress-steps {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
      }
      .ai-progress-step {
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 9px 10px;
        color: var(--muted);
        background: rgba(255, 255, 255, 0.44);
        font-size: 13px;
      }
      .ai-progress-step.is-active {
        border-color: rgba(18, 18, 18, 0.36);
        color: var(--text);
        background: rgba(18, 18, 18, 0.06);
      }
      .ai-progress-step.is-done {
        border-color: rgba(27, 107, 75, 0.24);
        color: var(--accent);
        background: rgba(27, 107, 75, 0.08);
      }
      .ai-progress-meta {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .ai-progress-meta span {
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 5px 9px;
        color: var(--muted);
        background: rgba(255, 255, 255, 0.5);
        font-size: 13px;
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
      .cluster-table-wrap {
        overflow-x: auto;
        margin-top: 14px;
      }
      .cluster-table {
        width: 100%;
        min-width: 980px;
        border-collapse: separate;
        border-spacing: 0 8px;
      }
      .cluster-table th {
        padding: 0 12px 6px;
        color: var(--muted);
        font-size: 12px;
        text-align: left;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .cluster-table td {
        padding: 13px 12px;
        border-top: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
        background: rgba(255,255,255,0.68);
        vertical-align: middle;
      }
      .cluster-table td:first-child {
        border-left: 1px solid var(--line);
        border-radius: 18px 0 0 18px;
      }
      .cluster-table td:last-child {
        border-right: 1px solid var(--line);
        border-radius: 0 18px 18px 0;
      }
      .cluster-summary-row {
        cursor: pointer;
      }
      .cluster-summary-row:hover td {
        border-color: var(--line-strong);
        background: rgba(255,255,255,0.88);
      }
      .cluster-name-cell {
        display: grid;
        gap: 4px;
      }
      .cluster-name-cell strong {
        font-size: 14px;
      }
      .cluster-name-cell span {
        color: var(--muted);
        font-size: 13px;
      }
      .cluster-pill {
        display: inline-flex;
        width: fit-content;
        border-radius: 999px;
        border: 1px solid var(--line);
        padding: 5px 9px;
        background: rgba(255,255,255,0.72);
        color: var(--muted);
        font-size: 12px;
        white-space: nowrap;
      }
      .cluster-pill.is-good {
        border-color: rgba(27, 107, 75, 0.26);
        background: rgba(27, 107, 75, 0.10);
        color: var(--accent);
      }
      .cluster-pill.is-bad {
        border-color: rgba(181, 56, 40, 0.25);
        background: rgba(181, 56, 40, 0.08);
        color: var(--danger);
      }
      .cluster-pill.is-warn {
        border-color: rgba(154, 100, 16, 0.25);
        background: rgba(154, 100, 16, 0.10);
        color: var(--warning);
      }
      .cluster-row-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }
      .cluster-row-actions button {
        padding: 8px 12px;
      }
      .adaptation-schedule-grid {
        display: grid;
        grid-template-columns: minmax(150px, 0.7fr) minmax(220px, 1fr) auto;
        gap: 10px;
        align-items: end;
        margin-top: 10px;
      }
      .adaptation-schedule-grid label {
        display: grid;
        gap: 6px;
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .adaptation-schedule-grid input,
      .adaptation-schedule-grid select {
        min-height: 42px;
      }
      .adaptation-schedule-grid button {
        min-height: 42px;
      }
      .modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: rgba(20, 19, 17, 0.44);
        padding: 32px;
        display: grid;
        place-items: center;
      }
      .modal-backdrop[hidden] {
        display: none;
      }
      .modal-card {
        width: min(1180px, 100%);
        max-height: calc(100vh - 64px);
        overflow: auto;
        background: var(--panel-strong);
        border: 1px solid var(--line);
        border-radius: 28px;
        box-shadow: 0 32px 80px rgba(18, 18, 18, 0.24);
        padding: 20px;
        display: grid;
        gap: 14px;
      }
      .modal-card .stage-output-list {
        margin-top: 8px;
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
      .batch-progress {
        border: 1px solid var(--line);
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.66);
        padding: 14px;
        display: grid;
        gap: 10px;
      }
      .batch-progress[hidden] {
        display: none;
      }
      .batch-progress-list {
        display: grid;
        gap: 12px;
      }
      .batch-workflow-card {
        display: grid;
        gap: 12px;
        border: 1px solid var(--line);
        border-radius: 20px;
        padding: 14px;
        background: rgba(255, 255, 255, 0.7);
      }
      .batch-workflow-card.is-failed {
        border-color: rgba(180, 35, 24, 0.3);
        background: rgba(180, 35, 24, 0.06);
      }
      .batch-workflow-card.is-done {
        border-color: rgba(17, 122, 67, 0.28);
        background: rgba(17, 122, 67, 0.06);
      }
      .batch-workflow-head {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: flex-start;
      }
      .batch-workflow-head h4 {
        margin: 2px 0 0;
        font-size: 20px;
      }
      .batch-workflow-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        color: var(--muted);
      }
      .batch-step-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
      }
      .batch-step-tabs .seo-step-tab {
        padding: 8px 11px;
        font-size: 13px;
        pointer-events: none;
      }
      .batch-diagnostics {
        border-radius: 16px;
        background: rgba(18, 18, 18, 0.035);
      }
      .batch-diagnostics summary {
        padding: 10px 12px;
      }
      .batch-diagnostics ul {
        margin: 0;
        padding: 0 16px 12px 28px;
      }
      .seo-step-tab.is-ready:not(.is-active) .seo-step-dot {
        background: #117a43;
        opacity: 1;
      }
      .seo-step-tab.is-article:not(.is-active) {
        border-color: rgba(137, 93, 20, 0.28);
        background: rgba(255, 247, 225, 0.7);
        color: #7a4f06;
      }
      .seo-step-tab.is-article.is-ready:not(.is-active) {
        border-color: rgba(17, 122, 67, 0.34);
        background: rgba(17, 122, 67, 0.08);
        color: #117a43;
      }
      .seo-step-tab.is-article.is-active {
        background: #5f3d07;
        border-color: #5f3d07;
        color: white;
      }
      .article-generation-card {
        border-color: rgba(137, 93, 20, 0.2);
        background: rgba(255, 250, 238, 0.82);
      }
      .article-generation-card pre {
        white-space: pre-wrap;
      }
      .seo-step-tab.is-audit:not(.is-active) {
        border-color: rgba(18, 18, 18, 0.18);
        background: rgba(255, 255, 255, 0.72);
        color: var(--text);
      }
      .audit-grid {
        display: grid;
        gap: 12px;
      }
      .audit-section {
        border: 1px solid var(--line);
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.62);
        overflow: hidden;
      }
      .audit-section > summary {
        cursor: pointer;
        list-style: none;
        padding: 14px 16px;
        font-weight: 700;
      }
      .audit-section > summary::-webkit-details-marker {
        display: none;
      }
      .audit-section-body {
        border-top: 1px solid var(--line);
        display: grid;
        gap: 9px;
        padding: 12px;
      }
      .audit-row {
        border: 1px solid var(--line);
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.66);
        padding: 10px 12px;
        display: grid;
        gap: 7px;
      }
      .audit-row.is-failed {
        border-color: rgba(180, 35, 24, 0.35);
        background: rgba(180, 35, 24, 0.06);
      }
      .audit-row details {
        border-top: 1px solid var(--line);
        padding-top: 8px;
      }
      .audit-row summary {
        cursor: pointer;
        color: var(--muted);
      }
      .audit-row pre {
        max-height: 520px;
        overflow: auto;
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
        .main, .detail-grid, .metrics, .filters, .launch-grid, .model-picker, .cost-summary-grid, .cost-row {
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
            <button type="button" id="runLibraryBtn" aria-expanded="false" aria-controls="runLibraryPanel">Run Library</button>
            <button type="button" id="refreshAllBtn">Refresh</button>
            <a class="button-like" href="/seo-briefing/health">Health</a>
          </div>
        </div>
        <section class="run-library-panel" id="runLibraryPanel" hidden>
          <div class="section-head">
            <div class="stack">
              <div class="eyebrow">Library</div>
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
            <div id="launchStatus" class="context-result full" hidden></div>
            <div id="launchPromptInventory"></div>
            <form id="launchForm" class="launch-grid" novalidate>
              <label class="field full">
                <span>Project</span>
                <select id="projectId">
                  <option value="">No project context</option>
                </select>
              </label>
              <div class="field full">
                <span>AI Model</span>
                <input id="aiModelMode" type="hidden" value="pro" />
                <div class="model-picker" role="radiogroup" aria-label="AI Model">
                  <label class="model-option" data-model-option="flash">
                    <input type="radio" name="aiModelModeChoice" value="flash" />
                    <span>Fast</span>
                    <strong>Flash</strong>
                    <p>Cheaper and quicker. Good for drafts and low-risk checks.</p>
                  </label>
                  <label class="model-option is-selected" data-model-option="pro">
                    <input type="radio" name="aiModelModeChoice" value="pro" checked />
                    <span>Balanced</span>
                    <strong>Pro</strong>
                    <p>Default quality mode. Better reasoning without thinking mode.</p>
                  </label>
                  <label class="model-option" data-model-option="pro_thinking">
                    <input type="radio" name="aiModelModeChoice" value="pro_thinking" />
                    <span>Deep</span>
                    <strong>Pro Thinking</strong>
                    <p>Slowest and most expensive. Use for hard semantic decisions.</p>
                  </label>
                </div>
              </div>
              <div class="field full">
                <span>DeepSeek Pricing</span>
                <em>USD per 1M tokens. Used only for Log Audit cost estimates; marketers can override before launch.</em>
                <div class="filters">
                  <label class="field">
                    <span>Input / 1M tokens</span>
                    <input id="deepSeekInputUsdPerMillionTokens" type="number" min="0" step="0.000001" value="0.435" />
                  </label>
                  <label class="field">
                    <span>Output / 1M tokens</span>
                    <input id="deepSeekOutputUsdPerMillionTokens" type="number" min="0" step="0.000001" value="0.87" />
                  </label>
                </div>
              </div>
              <div class="field full">
                <span>Workflow Mode</span>
                <input id="workflowMode" type="hidden" value="manual" />
                <div class="model-picker workflow-mode-picker" role="radiogroup" aria-label="Workflow Mode">
                  <label class="model-option is-selected" data-workflow-mode-option="manual">
                    <input type="radio" name="workflowModeChoice" value="manual" checked />
                    <span>Controlled</span>
                    <strong>Manual clicking</strong>
                    <p>You run each semantic step yourself and inspect the output before moving on.</p>
                  </label>
                  <label class="model-option" data-workflow-mode-option="auto_until_selection">
                    <input type="radio" name="workflowModeChoice" value="auto_until_selection" />
                    <span>Auto</span>
                    <strong>Auto to final brief</strong>
                    <p>Runs the workflow automatically, selects the best cluster, and generates the final brief.</p>
                  </label>
                </div>
              </div>
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
              <div id="markerPlanContext" class="context-result full" hidden></div>
              <textarea id="campaignContext" hidden></textarea>
              <label class="field full">
                <span>Topic Hint</span>
                <em>Research direction from the marketer. This is not a final keyword and not an article title.</em>
                <textarea id="topicHint" required>How people in emerging markets can make idle USDT productive</textarea>
              </label>
              <input id="country" type="hidden" value="United States" />
              <label class="field full">
                <span>Languages</span>
                <em>Select one or more languages. Hold Cmd/Ctrl to select multiple; the UI will create one SEO brief run per language.</em>
                <select id="language" required multiple size="8">
                  <option value="English" selected>English (en)</option>
                  <option value="Portuguese">Português (pt)</option>
                  <option value="Indonesian">Bahasa Indonesia (id)</option>
                  <option value="Spanish">Español (es)</option>
                  <option value="Vietnamese">Tiếng Việt (vi)</option>
                  <option value="Urdu">اردو (ur)</option>
                  <option value="Tagalog">Tagalog (tl)</option>
                  <option value="Pidgin">Naijá / Pidgin (pcm)</option>
                  <option value="Hausa">Hausa (ha)</option>
                  <option value="Punjabi">ਪੰਜਾਬੀ (pa)</option>
                  <option value="Yoruba">Yorùbá (yo)</option>
                  <option value="Pashto">پښتو (ps)</option>
                  <option value="Zulu">isiZulu (zu)</option>
                  <option value="Turkish">Türkçe (tr)</option>
                  <option value="Arabic">العربية (ar)</option>
                  <option value="Russian">Русский (ru)</option>
                  <option value="Hindi">हिन्दी (hi)</option>
                  <option value="Japanese">日本語 (ja)</option>
                  <option value="Korean">한국어 (ko)</option>
                  <option value="French">Français (fr)</option>
                  <option value="German">Deutsch (de)</option>
                  <option value="Italian">Italiano (it)</option>
                  <option value="Dutch">Nederlands (nl)</option>
                  <option value="Malay">Bahasa Melayu (ms)</option>
                  <option value="Thai">ไทย (th)</option>
                  <option value="Afrikaans">Afrikaans (af)</option>
                  <option value="Xhosa">isiXhosa (xh)</option>
                  <option value="Igbo">Igbo (ig)</option>
                  <option value="Polish">Polski (pl)</option>
                  <option value="Romanian">Română (ro)</option>
                </select>
              </label>
              <div id="marketCountryPreview" class="context-result full"></div>
              <label class="field full">
                <span>Blog cover image URL</span>
                <em>Optional. If this SEO run is published to Blog, this HTTPS image will be sent as the article cover.</em>
                <input id="blogCoverImageUrl" type="url" placeholder="https://cdn.example.com/cover.webp" />
              </label>
              <div id="languageBatchProgress" class="batch-progress full" hidden></div>
              <label class="field full">
                <span>User Pains</span>
                <em>Manual input from marketer. One per line or comma-separated. AI does not generate this step anymore.</em>
                <textarea id="userPains" required>Save money in dollars
Avoid naira devaluation
Make idle USDT useful without hype</textarea>
              </label>
              <details class="field full advanced-field">
                <summary>Advanced overrides and additional run context</summary>
                <p>Brand Memory override fields are filled from the selected project and can be changed for this one SEO brief. Additional fields are run-specific extras.</p>
                <div class="advanced-grid">
                  <label class="field full">
                    <span>Audience Override</span>
                    <em>Brand Memory override. Leave as-is unless this run needs a different audience.</em>
                    <textarea id="audience">Beginners holding USDT who want simple earning options.</textarea>
                  </label>
                  <label class="field full">
                    <span>User Scenarios</span>
                    <em>Run-specific additional context. Optional search, behavior, ecosystem, comparison, or action scenarios.</em>
                    <textarea id="userScenarios">Uses Binance P2P
Stores USDT in Trust Wallet
Needs to understand TRC20 vs BEP20</textarea>
                  </label>
                  <label class="field">
                    <span>Product Name Override</span>
                    <em>Brand Memory override.</em>
                    <input id="productName" required value="Reinforce" />
                  </label>
                  <label class="field full">
                    <span>Product Description Override</span>
                    <em>Brand Memory override.</em>
                    <textarea id="productDescription">Reinforce helps users make idle USDT productive without relying on hype or vague promises.</textarea>
                  </label>
                  <label class="field">
                    <span>CTA Override</span>
                    <em>Brand Memory override.</em>
                    <input id="cta" value="See how Reinforce works" />
                  </label>
                  <label class="field full">
                    <span>Key Message Override</span>
                    <em>Brand Memory override.</em>
                    <textarea id="keyMessage">Idle USDT can become productive if users understand the options and risks clearly.</textarea>
                  </label>
                  <label class="field full">
                    <span>Brand Constraints Override</span>
                    <em>Brand Memory override.</em>
                    <textarea id="brandConstraints">No hype
No get-rich-quick framing
Keep trust and proof central</textarea>
                  </label>
                  <label class="field full">
                    <span>Claims / Compliance Constraints Override</span>
                    <em>Brand Memory override.</em>
                    <textarea id="claimsConstraints">Do not promise guaranteed returns
Explain risks clearly
Do not present yield as risk-free</textarea>
                  </label>
                  <label class="field full">
                    <span>Preferred Angle</span>
                    <em>Run-specific additional context.</em>
                    <input id="preferredAngle" value="Educational comparison for cautious USDT holders" />
                  </label>
                  <label class="field full">
                    <span>Excluded Topics</span>
                    <em>Run-specific additional context.</em>
                    <textarea id="excludedTopics">Airdrops
Faucets
High-risk leverage</textarea>
                  </label>
                  <label class="field">
                    <span>Audience Before</span>
                    <em>Run-specific additional context.</em>
                    <input id="audienceBefore" value="User holds USDT but does not understand earning options." />
                  </label>
                  <label class="field">
                    <span>Audience After</span>
                    <em>Run-specific additional context.</em>
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
                  <label class="field">
                    <span>Request Timeout, sec</span>
                    <em>Advanced override for AI and DataForSEO requests.</em>
                    <input id="requestTimeoutSeconds" type="number" min="30" max="900" step="10" value="300" />
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
                  <label class="field full">
                    <span>Operator Prompt Override</span>
                    <em>This is not marketer context. It only tunes how AI generates initial keyword hypotheses.</em>
                    <textarea id="keywordExpansionPrompt">${defaultKeywordExpansionPrompt}</textarea>
                  </label>
                </div>
              </details>
              <div class="actions full">
                <button type="button" id="fillFromBrandMemoryBtn">Fill From Brand Memory</button>
              </div>
            </form>
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
    <div id="clusterDetailModal" class="modal-backdrop" hidden>
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="clusterDetailModalTitle">
        <div class="section-head">
          <div class="stack">
            <div class="eyebrow">Cluster</div>
            <h2 id="clusterDetailModalTitle">Cluster Details</h2>
          </div>
          <button type="button" id="clusterDetailModalClose">Close</button>
        </div>
        <div id="clusterDetailModalBody"></div>
      </div>
    </div>

    <script>
      const initialState = ${initialState};
      const appState = {
        projects: [],
        runs: [],
        selectedRun: null,
        selectedRunId: null,
        filterProjectId: null,
        filterStatus: null,
        markerPlan: null,
        initialRunSelectionDone: false,
        activeSeoStep: initialState.step || 'input',
        keywordHypothesesLoading: false,
        serpPreviewLoading: false,
        serpDerivedCandidatesLoading: false,
        rankedKeywordsLoading: false,
        competitorMatchingLoading: false,
        competitorMatchingMode: 'algorithmic',
        dirtyKeywordPoolLoading: false,
        candidateScoringLoading: false,
        keywordClusteringLoading: false,
        clusterProductFitLoading: false,
        clusterSelectionLoading: false,
        onPageLoading: false,
        onPageSynthesisLoading: false,
        finalBriefLoading: false,
        finalBriefEditLoading: false,
        longreadDraftLoading: false,
        longreadCleanupLoading: false,
        longreadPackageLoading: false,
        longreadAdaptationsLoading: false,
        longreadPublicationLoadingId: null,
        blogPublishLoading: false,
        languageBatchItems: [],
        languageBatchWorkflowMode: 'manual',
        languageBatchFinalizing: false,
        autoFlowLoading: false,
        autoFlowTitle: null,
        autoFlowDescription: null,
        autoFlowCurrentLabel: null,
        autoFlowCurrentIndex: 0,
        autoFlowTotal: 0,
      };
      let launchPanelNode = null;
      const DEFAULT_KEYWORD_EXPANSION_PROMPT = ${defaultKeywordExpansionPromptJson};
      const SEO_BRIEF_LANGUAGE_PRESETS = [
        { code: 'en', name: 'English', label: 'English', country: 'United States' },
        { code: 'pt', name: 'Portuguese', label: 'Português', country: 'Brazil' },
        { code: 'id', name: 'Indonesian', label: 'Bahasa Indonesia', country: 'Indonesia' },
        { code: 'es', name: 'Spanish', label: 'Español', country: 'Mexico' },
        { code: 'vi', name: 'Vietnamese', label: 'Tiếng Việt', country: 'Vietnam' },
        { code: 'ur', name: 'Urdu', label: 'اردو', country: 'Pakistan' },
        { code: 'tl', name: 'Tagalog', label: 'Tagalog', country: 'Philippines' },
        { code: 'pcm', name: 'Pidgin', label: 'Naijá / Pidgin', country: 'Nigeria' },
        { code: 'ha', name: 'Hausa', label: 'Hausa', country: 'Nigeria' },
        { code: 'pa', name: 'Punjabi', label: 'ਪੰਜਾਬੀ', country: 'India' },
        { code: 'yo', name: 'Yoruba', label: 'Yorùbá', country: 'Nigeria' },
        { code: 'ps', name: 'Pashto', label: 'پښتو', country: 'Afghanistan' },
        { code: 'zu', name: 'Zulu', label: 'isiZulu', country: 'South Africa' },
        { code: 'tr', name: 'Turkish', label: 'Türkçe', country: 'Turkiye' },
        { code: 'ar', name: 'Arabic', label: 'العربية', country: 'Saudi Arabia' },
        { code: 'ru', name: 'Russian', label: 'Русский', country: 'Kazakhstan' },
        { code: 'hi', name: 'Hindi', label: 'हिन्दी', country: 'India' },
        { code: 'ja', name: 'Japanese', label: '日本語', country: 'Japan' },
        { code: 'ko', name: 'Korean', label: '한국어', country: 'South Korea' },
        { code: 'fr', name: 'French', label: 'Français', country: 'France' },
        { code: 'de', name: 'German', label: 'Deutsch', country: 'Germany' },
        { code: 'it', name: 'Italian', label: 'Italiano', country: 'Italy' },
        { code: 'nl', name: 'Dutch', label: 'Nederlands', country: 'Netherlands' },
        { code: 'ms', name: 'Malay', label: 'Bahasa Melayu', country: 'Malaysia' },
        { code: 'th', name: 'Thai', label: 'ไทย', country: 'Thailand' },
        { code: 'af', name: 'Afrikaans', label: 'Afrikaans', country: 'South Africa' },
        { code: 'xh', name: 'Xhosa', label: 'isiXhosa', country: 'South Africa' },
        { code: 'ig', name: 'Igbo', label: 'Igbo', country: 'Nigeria' },
        { code: 'pl', name: 'Polish', label: 'Polski', country: 'Poland' },
        { code: 'ro', name: 'Romanian', label: 'Română', country: 'Romania' },
      ];
      const UI_LOGS_HIDDEN_STORAGE_KEY = 'seoBriefing.hiddenUiLogRunIds';
      const AUTO_FLOW_RUN_IDS_STORAGE_KEY = 'seoBriefing.autoFlowRunIds';
      const SEO_STEP_TABS = [
        { id: 'input', label: 'Input', number: '0' },
        { id: 'keywords', label: 'Keywords', number: '1' },
        { id: 'serpGroup', label: 'SERP', number: '2' },
        { id: 'competitionGroup', label: 'Competition', number: '3' },
        { id: 'clusterGroup', label: 'Clusters', number: '4' },
        { id: 'onPageGroup', label: 'OnPage', number: '5' },
        { id: 'finalBrief', label: 'Final Brief', number: '6' },
        { id: 'articleGroup', label: 'Article', number: '7', kind: 'article' },
        { id: 'audit', label: 'Audit', number: 'Log', kind: 'audit' },
      ];
      const SEO_STEP_GROUPS = {
        input: ['input'],
        keywords: ['keywords'],
        serpGroup: ['serp', 'candidates'],
        competitionGroup: ['rankedKeywords', 'competitorMatching', 'dirtyPool', 'candidateScoring'],
        clusterGroup: ['clusters', 'productFit', 'selection'],
        onPageGroup: ['onPage', 'onPageSynthesis'],
        finalBrief: ['finalBrief'],
        articleGroup: ['longreadDraft', 'longreadCleanup', 'longreadPackage', 'longreadAdaptations'],
        audit: ['audit'],
      };
      const SEO_STEP_TO_GROUP = Object.entries(SEO_STEP_GROUPS).reduce((acc, entry) => {
        const groupId = entry[0];
        entry[1].forEach((stepId) => {
          acc[stepId] = groupId;
        });
        return acc;
      }, {});
      const AI_PROMPT_INVENTORY = [
        {
          group: 'Main SEO brief flow',
          prompts: [
            {
              step: 'Step 0 · Input extraction',
              operation: 'extractContext',
              version: 'seo-brief.extract-context.v1',
              why: 'Used only when the marketer pastes one big brief text or uploads a file. AI extracts fields into the normal form.',
              input: 'Raw marketer text/file content.',
              output: 'Topic hint, market, audience, product facts, manual pains/scenarios, constraints, competitors, missing fields.',
            },
            {
              step: 'Step 1 · Search hypotheses',
              operation: 'expandKeywords',
              version: 'seo-brief.expand-keywords.v6',
              why: 'Turns marketer context, manual pains, scenarios, product facts, and Brand Memory into Google-like keyword hypotheses.',
              input: 'Topic hint, audience, manual pains/scenarios, product context, constraints, optional operator prompt.',
              output: 'Initial keyword hypotheses grouped by search intent / scenario.',
            },
            {
              step: 'Step 5 · AI competitor matching',
              operation: 'groupCompetitorKeywordEvidence',
              version: 'seo-brief.group-competitor-keyword-evidence.v1',
              why: 'First AI pass for AI Evidence Matching. AI groups competitor ranked keywords into market themes.',
              input: 'Ranked keywords from competitor domains with DataForSEO metrics.',
              output: 'Competitor evidence buckets with evidence IDs.',
            },
            {
              step: 'Step 5 · AI competitor matching',
              operation: 'groupCandidateKeywords',
              version: 'seo-brief.group-candidate-keywords.v1',
              why: 'Second AI pass for AI Evidence Matching. AI groups our candidate keywords by meaning.',
              input: 'Our hypotheses and SERP-derived candidates.',
              output: 'Candidate buckets with candidate IDs.',
            },
            {
              step: 'Step 5 · AI competitor matching',
              operation: 'matchKeywordGroups',
              version: 'seo-brief.match-keyword-groups.v1',
              why: 'Third AI pass for AI Evidence Matching. AI links our candidate groups to competitor evidence groups.',
              input: 'Candidate buckets and competitor evidence buckets.',
              output: 'Group-to-group matches and match strength.',
            },
            {
              step: 'Step 5 · AI competitor matching',
              operation: 'scoreCompetitorKeywordCandidateGroup',
              version: 'seo-brief.score-competitor-keyword-candidate-group.v1',
              why: 'Fourth AI pass for AI Evidence Matching. AI scores candidate keywords only against provided competitor evidence.',
              input: 'One candidate bucket plus relevant competitor evidence rows.',
              output: 'Proxy demand score, match type, matched evidence IDs, risk label, reason.',
            },
            {
              step: 'Step 7 · AI filtering',
              operation: 'scoreDirtyKeywordCandidates',
              version: 'seo-brief.score-dirty-keyword-candidates.v1',
              why: 'Used three times: eligibility, fit scoring, and final calibration of the dirty keyword pool.',
              input: 'Dirty-pool candidates with SERP evidence, competitor match signals, metrics, product context, Brand Memory.',
              output: 'Accepted / maybe / rejected candidates with topic/product/audience/intent/risk/evidence scores.',
            },
            {
              step: 'Step 8 · Clusters',
              operation: 'clusterKeywords',
              version: 'seo-brief.cluster-keywords.v2',
              why: 'AI groups accepted/maybe keywords into article-level SEO clusters.',
              input: 'Scored accepted/maybe candidates, rejected keywords, market, product, Brand Memory.',
              output: 'Clusters with primary keyword, secondary keywords, questions, intent, competitor URLs, rationale.',
            },
            {
              step: 'Step 9 · Product Fit',
              operation: 'reviewClusterProductFit',
              version: 'seo-brief.review-cluster-product-fit.v1',
              why: 'AI checks which clusters can honestly connect to the product and which should be rejected or supporting only.',
              input: 'Clusters, supporting keywords, product facts, audience, Brand Memory, constraints.',
              output: 'Cluster decisions, product fit score/type, insertion angle, what not to claim.',
            },
            {
              step: 'Step 10 · Selection',
              operation: 'explainClusterSelection',
              version: 'seo-brief.cluster-selection.v1',
              why: 'AI explains why the selected main cluster won and why others were rejected/supporting.',
              input: 'Cluster candidates with SEO/product/total scores.',
              output: 'Human-readable selection summary and rejected cluster reasons.',
            },
            {
              step: 'Step 12 · OnPage synthesis',
              operation: 'synthesizeOnPage',
              version: 'seo-brief.synthesize-onpage.v1',
              why: 'AI summarizes competitor on-page structure for the selected cluster.',
              input: 'Fetched competitor pages, headings, text blocks, links, selected cluster, product context.',
              output: 'Common content blocks, H2 patterns, FAQ, content gaps, recommended structure.',
            },
            {
              step: 'Step 13 · Final SEO brief',
              operation: 'generateSeoBrief',
              version: 'seo-brief.generate-brief.v1',
              why: 'AI creates the production-ready SEO brief from all approved evidence.',
              input: 'Selected cluster, keyword evidence, product fit, on-page synthesis, Brand Memory, constraints.',
              output: 'Final SEO brief: title/H1, meta, outline, FAQs, SERP insights, product placement, compliance notes.',
            },
          ],
        },
        {
          group: 'Article generation extension',
          prompts: [
            {
              step: 'Step 14 · Draft Article',
              operation: 'draftLongreadArticle',
              version: 'article-generation.draft.v1',
              why: 'AI writes the first longread draft from the final SEO brief.',
              input: 'Final SEO brief, selected cluster, product context, audience, constraints.',
              output: 'Draft longread article with sections, intro, body, conclusion, FAQ/product mentions.',
            },
            {
              step: 'Step 15 · Safety Cleanup',
              operation: 'cleanupLongreadArticle',
              version: 'article-generation.cleanup.v1',
              why: 'AI edits the draft for clarity, compliance, brand safety, and unsupported claims.',
              input: 'Draft article plus final SEO brief and claims/brand constraints.',
              output: 'Cleaned article, warnings, removed/changed claims, editorial notes.',
            },
            {
              step: 'Step 16 · Final Package',
              operation: 'packageLongreadArticle',
              version: 'article-generation.package.v1',
              why: 'AI packages the reviewed article into a CMS-ready object.',
              input: 'Cleaned article, SEO brief, safety notes, product placement plan.',
              output: 'Final article package with SEO fields, article body, metadata, checklist.',
            },
          ],
        },
        {
          group: 'Auxiliary / legacy AI tools',
          prompts: [
            {
              step: 'Optional · Related queries',
              operation: 'selectRelatedKeywords',
              version: 'seo-brief.select-related-keywords.v1',
              why: 'Selects the best related queries from SERP People Also Ask / related searches. Not part of the current main 13-step flow.',
              input: 'Seed keyword and SERP-derived related query candidates.',
              output: 'Selected and rejected related queries with reasons.',
            },
            {
              step: 'Optional · SERP domain classification',
              operation: 'classifySerpDomains',
              version: 'seo-brief.classify-serp-domains.v1',
              why: 'Classifies aggregated SERP domains into ranked-keyword targets, on-page targets, pain signals, or ignored domains. Not part of the simplified current flow.',
              input: 'Aggregated SERP domains and URL examples.',
              output: 'Domain classes and priorities.',
            },
            {
              step: 'Legacy · User pain generation',
              operation: 'extractUserPainScenarios',
              version: 'seo-brief.extract-user-pain-scenarios.v1',
              why: 'Older flow generated user pains from topic hint. Current flow expects marketer-provided pains in Step 0.',
              input: 'Topic hint, market, audience, product context, Brand Memory.',
              output: 'Generated user pains and scenarios.',
            },
            {
              step: 'Legacy · Keyword triage',
              operation: 'triageKeywords',
              version: 'seo-brief.triage-keywords.v1',
              why: 'Older flow triaged keyword suggestions. Current flow uses dirty pool, competitor matching, and Step 7 filtering.',
              input: 'Keyword suggestions with volume/competition.',
              output: 'Accepted/rejected keyword candidates.',
            },
            {
              step: 'Legacy · Product bridge',
              operation: 'buildProductBridge',
              version: 'seo-brief.product-bridge.v1',
              why: 'Older helper for explaining product connection to one cluster. Current Step 9 product fit covers this more completely.',
              input: 'Cluster label, primary keyword, product context, Brand Memory.',
              output: 'Fit, positioning angle, CTA, talking points, risks.',
            },
            {
              step: 'Legacy · One-shot competitor matching',
              operation: 'evaluateCompetitorKeywordMatches',
              version: 'seo-brief.evaluate-competitor-keyword-matches.v1',
              why: 'Older one-shot AI competitor matching prompt. Current Step 5 uses the safer four-pass AI matching flow.',
              input: 'Candidate keywords and competitor ranked keyword evidence.',
              output: 'Candidate scores, buckets, matched evidence IDs.',
            },
          ],
        },
      ];

      function qs(id) {
        return document.getElementById(id);
      }

      function openClusterDetailModal(templateId) {
        const template = qs(templateId);
        const modal = qs('clusterDetailModal');
        const body = qs('clusterDetailModalBody');
        if (!template || !modal || !body) return;
        body.innerHTML = template.innerHTML;
        modal.hidden = false;
      }

      function closeClusterDetailModal() {
        const modal = qs('clusterDetailModal');
        const body = qs('clusterDetailModalBody');
        if (body) body.innerHTML = '';
        if (modal) modal.hidden = true;
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

      function toDateTimeLocalValue(value) {
        const date = value ? new Date(value) : new Date(Date.now() + 60 * 60 * 1000);
        if (Number.isNaN(date.getTime())) return '';
        const offsetMs = date.getTimezoneOffset() * 60 * 1000;
        return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
      }

      function defaultAdaptationPublishAt(index) {
        const date = new Date(Date.now() + (index + 1) * 60 * 60 * 1000);
        date.setMinutes(0, 0, 0);
        return toDateTimeLocalValue(date);
      }

      function normalizePublicationChannelId(channelId) {
        const normalized = String(channelId || '').trim().toLowerCase();
        const known = {
          telegram: 'channel_telegram',
          channel_telegram: 'channel_telegram',
          x: 'channel_x',
          twitter: 'channel_x',
          channel_x: 'channel_x',
          discord: 'channel_discord',
          channel_discord: 'channel_discord',
          blog: 'channel_blog',
          channel_blog: 'channel_blog',
        };
        return known[normalized] || normalized;
      }

      function publishingScheduleEndpoint(channelId) {
        const normalized = normalizePublicationChannelId(channelId);
        if (normalized === 'channel_discord') return '/publishing/discord/schedule';
        if (normalized === 'channel_x') return '/publishing/x/schedule';
        if (normalized === 'channel_blog') return '/publishing/blog/schedule';
        return '/publishing/telegram/schedule';
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

      function readAutoFlowRunIds() {
        try {
          const parsed = JSON.parse(localStorage.getItem(AUTO_FLOW_RUN_IDS_STORAGE_KEY) || '[]');
          return Array.isArray(parsed) ? new Set(parsed.filter((item) => typeof item === 'string')) : new Set();
        } catch (_error) {
          return new Set();
        }
      }

      function setAutoFlowRun(runId, enabled) {
        if (!runId) return;
        const ids = readAutoFlowRunIds();
        if (enabled) {
          ids.add(runId);
        } else {
          ids.delete(runId);
        }
        localStorage.setItem(AUTO_FLOW_RUN_IDS_STORAGE_KEY, JSON.stringify([...ids]));
      }

      function isAutoFlowRun(runId) {
        return Boolean(runId) && readAutoFlowRunIds().has(runId);
      }

      function statusClass(status) {
        return 'status-' + String(status || 'created');
      }

      function prettyJson(value) {
        return JSON.stringify(value, null, 2);
      }

      function renderAiPromptInventory() {
        return (
          '<details class="prompt-inventory">' +
            '<summary>AI prompts used in this flow</summary>' +
            '<div class="prompt-inventory-body">' +
              '<p>Prompt map: where AI is called, what each prompt receives, and why it exists. DataForSEO-only and pure algorithm steps do not have prompts.</p>' +
              AI_PROMPT_INVENTORY.map((group) => (
                '<section class="prompt-group">' +
                  '<h4>' + escapeHtmlClient(group.group) + '</h4>' +
                  group.prompts.map((prompt) => (
                    '<article class="prompt-card">' +
                      '<div class="prompt-card-head">' +
                        '<strong>' + escapeHtmlClient(prompt.step) + '</strong>' +
                        '<code>' + escapeHtmlClient(prompt.version) + '</code>' +
                      '</div>' +
                      '<p><strong>' + escapeHtmlClient(prompt.operation) + '</strong> — ' + escapeHtmlClient(prompt.why) + '</p>' +
                      '<div class="prompt-meta">' +
                        '<span><strong>Input:</strong> ' + escapeHtmlClient(prompt.input) + '</span>' +
                        '<span><strong>Output:</strong> ' + escapeHtmlClient(prompt.output) + '</span>' +
                      '</div>' +
                    '</article>'
                  )).join('') +
                '</section>'
              )).join('') +
            '</div>' +
          '</details>'
        );
      }

      function renderLaunchPromptInventory() {
        const target = qs('launchPromptInventory');
        if (target) {
          target.innerHTML = renderAiPromptInventory();
        }
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

      function syncAiModelMode() {
        const selected = document.querySelector('input[name="aiModelModeChoice"]:checked');
        const value = selected?.value === 'flash' || selected?.value === 'pro_thinking'
          ? selected.value
          : 'pro';
        qs('aiModelMode').value = value;
        const pricing = value === 'flash'
          ? { input: '0.14', output: '0.28' }
          : { input: '0.435', output: '0.87' };
        qs('deepSeekInputUsdPerMillionTokens').value = pricing.input;
        qs('deepSeekOutputUsdPerMillionTokens').value = pricing.output;
        document.querySelectorAll('[data-model-option]').forEach((option) => {
          option.classList.toggle('is-selected', option.getAttribute('data-model-option') === value);
        });
      }

      function getWorkflowMode() {
        return document.querySelector('input[name="workflowModeChoice"]:checked')?.value || 'manual';
      }

      function syncWorkflowMode() {
        const value = getWorkflowMode() === 'auto_until_selection' ? 'auto_until_selection' : 'manual';
        qs('workflowMode').value = value;
        document.querySelectorAll('[data-workflow-mode-option]').forEach((option) => {
          option.classList.toggle(
            'is-selected',
            option.getAttribute('data-workflow-mode-option') === value,
          );
        });
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

      function setLanguageIfPresent(value) {
        if (typeof value !== 'string' || !value.trim()) return;
        const preset = resolveLanguagePreset(value);
        const languageSelect = qs('language');
        const targetValue = preset?.name || value.trim();
        [...languageSelect.options].forEach((option) => {
          option.selected = option.value === targetValue;
        });
        syncCountryFromSelectedLanguages();
      }

      function resolveLanguagePreset(value) {
        const normalized = normalizeLanguageLookup(value);
        const candidatesByLanguage = SEO_BRIEF_LANGUAGE_PRESETS.map((language) => ({
          language,
          candidates: [
            language.code,
            language.name,
            language.label,
            language.name.toLowerCase(),
            language.label.toLowerCase(),
          ].map(normalizeLanguageLookup),
        }));
        const exactMatch = candidatesByLanguage.find((entry) => entry.candidates.includes(normalized));
        if (exactMatch) return exactMatch.language;
        if (normalized.length > 2) {
          return candidatesByLanguage.find((entry) =>
            entry.candidates.some((candidate) => candidate.length > 2 && (candidate.includes(normalized) || normalized.includes(candidate)))
          )?.language || null;
        }
        return null;
      }

      function normalizeLanguageLookup(value) {
        return String(value || '')
          .trim()
          .normalize('NFD')
          .replace(/[\\u0300-\\u036f]/g, '')
          .toLowerCase()
          .replace(/[()]/g, ' ')
          .replace(/[_-]/g, ' ')
          .replace(/\\s+/g, ' ');
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

      function getSelectedLanguagePresets() {
        const selectedValues = [...qs('language').selectedOptions].map((option) => option.value);
        const selected = selectedValues
          .map((value) => resolveLanguagePreset(value) || {
            code: value.toLowerCase(),
            country: qs('country').value || 'United States',
            name: value,
            label: value,
          })
          .filter((language) => language.name);
        return selected.length > 0 ? selected : [SEO_BRIEF_LANGUAGE_PRESETS[0]];
      }

      function resolveRunLanguagePreset(language) {
        if (language && typeof language === 'object') {
          return language;
        }
        const value = String(language || 'English');
        return resolveLanguagePreset(value) || {
          code: value.toLowerCase(),
          country: qs('country').value || 'United States',
          name: value,
          label: value,
        };
      }

      function syncCountryFromSelectedLanguages() {
        const countryInput = qs('country');
        if (!countryInput) return;
        const selectedLanguages = getSelectedLanguagePresets();
        const selectedLanguage = selectedLanguages[0];
        if (selectedLanguage?.country) {
          countryInput.value = selectedLanguage.country;
        }
        renderMarketCountryPreview(selectedLanguages);
      }

      function renderMarketCountryPreview(languages = getSelectedLanguagePresets()) {
        const node = qs('marketCountryPreview');
        if (!node) return;
        node.hidden = false;
        node.innerHTML =
          '<strong>DataForSEO markets</strong>' +
          '<p>Each selected language creates its own SEO brief run with its own supported Google SERP country.</p>' +
          '<ul>' + languages.map((language) =>
            '<li>' + escapeHtmlClient(language.label + ' (' + language.code + ') → ' + language.country) + '</li>'
          ).join('') + '</ul>';
      }

      function validateLaunchForm() {
        const requiredFields = [
          { id: 'topicHint', label: 'Topic Hint' },
          { id: 'userPains', label: 'User Pains' },
          { id: 'productName', label: 'Product Name Override' },
        ];
        const invalidField = requiredFields.find((field) => !String(qs(field.id)?.value || '').trim());
        if (invalidField) {
          const element = qs(invalidField.id);
          const details = element?.closest('details');
          if (details) {
            details.open = true;
          }
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element?.focus();
          showToast('Fill required field: ' + invalidField.label);
          return false;
        }
        if (getSelectedLanguagePresets().length === 0) {
          qs('language')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          qs('language')?.focus();
          showToast('Select at least one language');
          return false;
        }
        return true;
      }

      function applyExtractedContext(result) {
        setIfPresent('topicHint', result.topicHint || result.topicSeed);
        setIfPresent('country', result.country);
        setLanguageIfPresent(result.language);
        setIfPresent('audience', result.audience);
        setListIfPresent('userPains', result.userPains);
        setListIfPresent('userScenarios', result.userScenarios);
        setIfPresent('productName', result.productName);
        setIfPresent('productDescription', result.productDescription);
        setIfPresent('keyMessage', result.keyMessage);
        setIfPresent('audienceBefore', result.audienceBefore);
        setIfPresent('audienceAfter', result.audienceAfter);
        setIfPresent('cta', result.cta);
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
            requestTimeoutMs: Number(qs('requestTimeoutSeconds').value || '300') * 1000,
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

      function readRunWorkflowMode(run) {
        const artifact = findArtifact(run, 'normalized_input');
        const value = artifact?.payload?.workflowMode;
        return value === 'auto_until_selection' ? 'auto_until_selection' : 'manual';
      }

      function shouldAutoContinueAfterClusterSelection(run) {
        return (
          readRunWorkflowMode(run) === 'auto_until_selection' ||
          isAutoFlowRun(run.id) ||
          qs('workflowMode')?.value === 'auto_until_selection'
        );
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

      function setLaunchStatus(message, tone = 'info') {
        const node = qs('launchStatus');
        if (!node) return;
        node.hidden = false;
        node.innerHTML =
          '<strong>' + escapeHtmlClient(tone === 'error' ? 'Launch error' : 'Launch status') + '</strong>' +
          '<p>' + escapeHtmlClient(message) + '</p>';
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
            '<div class="section-subhead"><h4>Target domains</h4><p>These came from Project Brand Memory. Step 4 does not call DataForSEO directly.</p></div>' +
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
        const matchingMode = payload?.matchingMode === 'ai' ? 'AI' : 'Algorithmic';
        const topCandidates = candidates
          .slice()
          .sort((left, right) =>
            Number(right?.proxyEvaluation?.proxyDemandScore ?? 0) -
              Number(left?.proxyEvaluation?.proxyDemandScore ?? 0),
          )
          .slice(0, 80);

        return (
          '<section class="card full">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">' + escapeHtmlClient(matchingMode + ' Step 5') + '</div><h3>Competitor Keyword Matching</h3></div><span class="badge">' + escapeHtmlClient(payload?.artifactVersion || 'competitor_keyword_matches') + '</span></div>' +
            '<p>' + escapeHtmlClient(payload?.matchingMode === 'ai' ? 'Primary output: AI evaluates candidate queries only against provided competitor ranked keyword evidence. Competitor volume is used only as proxy evidence.' : 'Primary output: candidate queries matched to competitor ranked keywords. Competitor volume is used only as proxy evidence, not copied onto candidate queries.') + '</p>' +
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

      function renderCompetitorMatchingProgress(run, mode) {
        if (mode !== 'ai') {
          return '<div class="inline-progress"><p>Matching candidate queries to competitor ranked keywords without copying competitor volume.</p><div class="progress-track"><div class="progress-bar"></div></div></div>';
        }

        const artifact = findArtifact(run, 'competitor_keyword_matching_progress');
        const payload = artifact?.payload || {};
        const steps = [
          { id: 'group_competitor_keywords', label: 'Competitor groups' },
          { id: 'group_candidate_keywords', label: 'Candidate groups' },
          { id: 'match_groups', label: 'Group matching' },
          { id: 'score_candidates_by_group', label: 'Group scoring' },
        ];
        const currentStep = typeof payload.currentStep === 'string'
          ? payload.currentStep
          : 'group_competitor_keywords';
        const currentStepIndex = Number.isFinite(Number(payload.currentStepIndex))
          ? Math.max(1, Math.min(4, Number(payload.currentStepIndex)))
          : 1;
        const totalSteps = Number.isFinite(Number(payload.totalSteps))
          ? Math.max(1, Number(payload.totalSteps))
          : 4;
        const scoreGroupIndex = Number.isFinite(Number(payload.scoreGroupIndex))
          ? Math.max(0, Number(payload.scoreGroupIndex))
          : 0;
        const scoreGroupTotal = Number.isFinite(Number(payload.scoreGroupTotal))
          ? Math.max(0, Number(payload.scoreGroupTotal))
          : 0;
        const stepProgress =
          currentStep === 'score_candidates_by_group' && scoreGroupTotal > 0
            ? (currentStepIndex - 1 + Math.min(scoreGroupIndex, scoreGroupTotal) / scoreGroupTotal) / totalSteps
            : (currentStepIndex - 1) / totalSteps;
        const progressWidth = Math.max(8, Math.min(100, Math.round(stepProgress * 100)));
        const message = typeof payload.message === 'string' && payload.message.trim()
          ? payload.message
          : 'AI is evaluating candidates only against provided competitor ranked keyword evidence.';
        const meta = [
          ['Candidates', payload.aiCandidateCount ?? payload.candidateCount ?? '—'],
          ['Competitor evidence', payload.aiCompetitorEvidenceCount ?? payload.competitorKeywordCount ?? '—'],
          ['Competitor buckets', payload.competitorBucketCount ?? '—'],
          ['Candidate buckets', payload.candidateBucketCount ?? '—'],
          ['Score groups', scoreGroupTotal > 0 ? String(scoreGroupIndex) + '/' + String(scoreGroupTotal) : '—'],
          ['AI scored', payload.aiEvaluatedCandidateCount ?? '—'],
          ['Fallback', payload.algorithmicFallbackCandidateCount ?? '—'],
        ];

        return (
          '<div class="inline-progress">' +
            '<p>' + escapeHtmlClient(message) + '</p>' +
            '<div class="progress-track"><div class="progress-bar is-determinate" style="width: ' + escapeHtmlClient(progressWidth) + '%"></div></div>' +
            '<div class="ai-progress-steps">' +
              steps.map((step, index) => {
                const className = [
                  'ai-progress-step',
                  index + 1 < currentStepIndex || currentStep === 'completed' ? 'is-done' : '',
                  index + 1 === currentStepIndex && currentStep !== 'completed' ? 'is-active' : '',
                ].filter(Boolean).join(' ');
                return '<div class="' + escapeHtmlClient(className) + '">' + escapeHtmlClient(String(index + 1) + '. ' + step.label) + '</div>';
              }).join('') +
            '</div>' +
            '<div class="ai-progress-meta">' +
              meta.map(([label, value]) => '<span>' + escapeHtmlClient(label + ': ' + String(value)) + '</span>').join('') +
            '</div>' +
            (payload.lastWarning ? '<p>Last fallback: ' + escapeHtmlClient(payload.lastWarning) + '</p>' : '') +
          '</div>'
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
            '<div class="section-head"><div class="stack"><div class="eyebrow">' + escapeHtmlClient(payload?.filteringMode === 'ai_staged_filtering' ? 'AI Step 7' : 'Algorithm Step 7') + '</div><h3>Candidate Filtering</h3></div><span class="badge">' + escapeHtmlClient(payload?.artifactVersion || 'keyword_candidate_scoring') + '</span></div>' +
            '<p>Primary output: dirty-pool candidates split into accepted, maybe, and rejected. In AI mode this uses eligibility, fit scoring, and final calibration passes.</p>' +
            '<div class="metric-grid compact">' +
              '<div><strong>' + escapeHtmlClient(payload?.acceptedCount ?? accepted.length) + '</strong><span>Accepted</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload?.maybeCount ?? maybe.length) + '</strong><span>Maybe</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload?.rejectedCount ?? rejected.length) + '</strong><span>Rejected</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload?.keptAfterNoiseCount ?? 0) + '</strong><span>AI eligible</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload?.hardExcludedCandidateCount ?? 0) + '</strong><span>AI rejected early</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload?.llmScoredCandidateCount ?? payload?.aiScoredCandidateCount ?? 0) + '</strong><span>AI calls</span></div>' +
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
          return '<section class="card full"><div class="empty">No ranked cluster choices prepared yet.</div></section>';
        }

        const main = payload?.mainCluster || null;
        const supporting = Array.isArray(payload?.supportingClusters) ? payload.supportingClusters : [];
        const rejected = Array.isArray(payload?.rejectedClusters) ? payload.rejectedClusters : [];
        const ranked = Array.isArray(payload?.rankedClusters) ? payload.rankedClusters : [];
        const selectedClusterName = String(payload?.selectedClusterName || main?.clusterName || '');
        const autoSelected = payload?.selectionMode === 'auto_selected';

        return (
          '<section class="card full">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">' + escapeHtmlClient(autoSelected ? 'Auto Step 10' : 'Manual Step 10') + '</div><h3>Topic Choice From Ranked Clusters</h3></div><span class="badge">' + escapeHtmlClient(payload?.artifactVersion || 'cluster_selection_snapshot') + '</span></div>' +
            '<p>' + escapeHtmlClient(autoSelected ? 'Primary output: the highest-ranked approved/supporting cluster was selected automatically for OnPage and final brief generation.' : 'Primary output: ranked cluster choices. Choose one topic manually; OnPage and the final brief will use that selected cluster.') + '</p>' +
            '<div class="metric-grid compact">' +
              '<div><strong>' + escapeHtmlClient(main ? 'Yes' : 'No') + '</strong><span>Main selected</span></div>' +
              '<div><strong>' + escapeHtmlClient(supporting.length) + '</strong><span>Supporting</span></div>' +
              '<div><strong>' + escapeHtmlClient(rejected.length) + '</strong><span>Rejected</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload?.inputClusterCount ?? ranked.length) + '</strong><span>Input clusters</span></div>' +
            '</div>' +
            (main ? renderSelectedClusterCard('Selected topic', main, true, selectedClusterName) : '<div class="empty">No topic selected yet. Pick one of the ranked approved/supporting clusters below.</div>') +
            renderSelectedClusterList('Ranked selectable clusters', ranked.filter((item) => item?.decision !== 'rejected'), true, selectedClusterName) +
            renderSelectedClusterList('Supporting clusters', supporting, false, selectedClusterName) +
            renderSelectedClusterList('Rejected clusters', rejected, false) +
            '<details><summary>Ranked clusters and raw selection</summary><div>' +
              renderSelectedClusterList('All ranked clusters', ranked, false) +
              '<pre>' + escapeHtmlClient(prettyJson(payload)) + '</pre>' +
            '</div></details>' +
          '</section>'
        );
      }

      function renderSelectedClusterList(label, items, openByDefault, selectedClusterName) {
        return (
          '<details class="keyword-serp-item" ' + (openByDefault ? 'open' : '') + '>' +
            '<summary>' + escapeHtmlClient(label + ' · ' + items.length) + '</summary>' +
            '<div class="keyword-serp-body">' +
              (items.length
                ? '<div class="stage-output-list">' + items.map((item, index) => renderSelectedClusterCard(String(index + 1).padStart(2, '0'), item, false, selectedClusterName)).join('') + '</div>'
                : '<div class="empty">No clusters in this bucket.</div>') +
            '</div>' +
          '</details>'
        );
      }

      function renderSelectedClusterCard(label, item, prominent, selectedClusterName) {
        const breakdown = item?.scoreBreakdown || {};
        const cluster = item?.sourceCluster || {};
        const keywords = Array.isArray(cluster?.keywords) ? cluster.keywords : [];
        const clusterName = String(item?.clusterName || '');
        const isRejected = item?.decision === 'rejected';
        const isSelected = selectedClusterName && clusterName === selectedClusterName;
        const chooseButton = isRejected
          ? ''
          : '<button type="button" class="primary select-cluster-topic-btn" data-cluster-name="' + escapeHtmlClient(clusterName) + '" ' + (isSelected || appState.clusterSelectionLoading ? 'disabled' : '') + '>' + escapeHtmlClient(isSelected ? 'Selected topic' : 'Use this topic') + '</button>';
        return (
          '<div class="stage-output-item ' + (prominent ? 'is-prominent' : '') + '">' +
            '<div class="inline-meta"><strong>' + escapeHtmlClient(label + '. ' + (clusterName || 'Cluster')) + '</strong><span>' + escapeHtmlClient((item?.priorityScore ?? '—') + '/100') + '</span></div>' +
            '<p><strong>' + escapeHtmlClient(item?.primaryKeyword || 'No primary keyword') + '</strong></p>' +
            '<p>' + escapeHtmlClient(item?.reason || 'No reason saved.') + '</p>' +
            '<p class="muted">Product Fit: ' + escapeHtmlClient(item?.productFitType || '—') + ' · decision: ' + escapeHtmlClient(item?.productFitDecision || '—') + (item?.role ? ' · role: ' + escapeHtmlClient(item.role) : '') + '</p>' +
            renderSelectionScoreBreakdown(breakdown) +
            renderCompactStringList('Cluster keywords', keywords.slice(0, 6)) +
            chooseButton +
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

      function clusterKey(value) {
        return String(value || '').trim().toLowerCase();
      }

      function putClusterMapEntry(map, name, value) {
        const key = clusterKey(name);
        if (key) map.set(key, value);
      }

      function clusterPillClass(value) {
        const normalized = String(value || '').toLowerCase();
        if (['approve', 'approved', 'main', 'selected', 'high'].includes(normalized)) return ' is-good';
        if (['reject', 'rejected', 'low'].includes(normalized)) return ' is-bad';
        if (['supporting_only', 'supporting', 'medium', 'maybe'].includes(normalized)) return ' is-warn';
        return '';
      }

      function renderClusterDecisionTable(run) {
        const clusterArtifact = findArtifact(run, 'cluster_snapshot');
        const clusterPayload = clusterArtifact?.payload || null;
        const productFitArtifact = findArtifact(run, 'cluster_product_fit_review');
        const productFitPayload = productFitArtifact?.payload || null;
        const selectionArtifact = findArtifact(run, 'cluster_selection_snapshot');
        const selectionPayload = selectionArtifact?.payload || null;

        if (!clusterArtifact) {
          return '<section class="card full"><div class="empty">No intent clusters built yet.</div></section>';
        }

        const clusters = Array.isArray(clusterPayload?.clusters) ? clusterPayload.clusters : [];
        const reviews = Array.isArray(productFitPayload?.clusterProductFit) ? productFitPayload.clusterProductFit : [];
        const ranked = Array.isArray(selectionPayload?.rankedClusters) ? selectionPayload.rankedClusters : [];
        const supporting = Array.isArray(selectionPayload?.supportingClusters) ? selectionPayload.supportingClusters : [];
        const rejected = Array.isArray(selectionPayload?.rejectedClusters) ? selectionPayload.rejectedClusters : [];
        const main = selectionPayload?.mainCluster || null;
        const selectedClusterName = String(selectionPayload?.selectedClusterName || main?.clusterName || '');

        const productByCluster = new Map();
        reviews.forEach((item) => putClusterMapEntry(productByCluster, item?.clusterName, item));

        const selectionByCluster = new Map();
        ranked.forEach((item) => putClusterMapEntry(selectionByCluster, item?.clusterName, { ...item, selectionBucket: item?.decision || item?.role || 'ranked' }));
        supporting.forEach((item) => putClusterMapEntry(selectionByCluster, item?.clusterName, { ...item, selectionBucket: 'supporting' }));
        rejected.forEach((item) => putClusterMapEntry(selectionByCluster, item?.clusterName, { ...item, selectionBucket: 'rejected' }));
        if (main?.clusterName) {
          putClusterMapEntry(selectionByCluster, main.clusterName, { ...main, selectionBucket: 'main' });
        }

        const rows = clusters.map((cluster, index) => {
          const clusterName = String(cluster?.clusterName || cluster?.label || 'Intent cluster');
          const productFit = productByCluster.get(clusterKey(clusterName)) || null;
          const selection = selectionByCluster.get(clusterKey(clusterName)) || null;
          return { cluster, clusterName, index, productFit, selection };
        });

        const approvedCount = reviews.filter((item) => item?.decision === 'approve').length;
        const supportingOnlyCount = reviews.filter((item) => item?.decision === 'supporting_only').length;
        const rejectedCount = reviews.filter((item) => item?.decision === 'reject').length;

        return (
          '<section class="card full">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">Cluster Decision Table</div><h3>Clusters</h3></div><span class="badge">' + escapeHtmlClient(selectedClusterName ? 'topic_selected' : selectionArtifact ? 'ready_for_topic_choice' : productFitArtifact ? 'product_fit_ready' : 'intent_clusters_ready') + '</span></div>' +
            '<p>One table combines Intent Clusters, Product Fit Review, and manual topic selection. Click a cluster row to inspect all saved details.</p>' +
            '<div class="metric-grid compact">' +
              '<div><strong>' + escapeHtmlClient(clusters.length) + '</strong><span>Intent clusters</span></div>' +
              '<div><strong>' + escapeHtmlClient(productFitArtifact ? approvedCount + '/' + supportingOnlyCount + '/' + rejectedCount : '—') + '</strong><span>Product approve/support/reject</span></div>' +
              '<div><strong>' + escapeHtmlClient(selectionArtifact ? ranked.length : '—') + '</strong><span>Ranked choices</span></div>' +
              '<div><strong>' + escapeHtmlClient(selectedClusterName || '—') + '</strong><span>Selected topic</span></div>' +
            '</div>' +
            (rows.length
              ? '<div class="cluster-table-wrap"><table class="cluster-table">' +
                  '<thead><tr>' +
                    '<th>Cluster</th>' +
                    '<th>Intent cluster</th>' +
                    '<th>Product fit review</th>' +
                    '<th>Selection</th>' +
                    '<th>Priority</th>' +
                    '<th></th>' +
                  '</tr></thead>' +
                  '<tbody>' + rows.map((row) => renderClusterDecisionRow(row, selectedClusterName, Boolean(selectionArtifact))).join('') + '</tbody>' +
                '</table></div>' +
                rows.map((row) => renderClusterDecisionTemplate(row)).join('')
              : '<div class="empty">No clusters saved.</div>') +
            '<details><summary>Raw cluster artifacts</summary><div>' +
              '<h4>Intent clusters</h4><pre>' + escapeHtmlClient(prettyJson(clusterPayload)) + '</pre>' +
              '<h4>Product Fit review</h4><pre>' + escapeHtmlClient(prettyJson(productFitPayload || {})) + '</pre>' +
              '<h4>Selection</h4><pre>' + escapeHtmlClient(prettyJson(selectionPayload || {})) + '</pre>' +
            '</div></details>' +
          '</section>'
        );
      }

      function renderClusterDecisionRow(row, selectedClusterName, hasSelection) {
        const cluster = row.cluster || {};
        const productFit = row.productFit || {};
        const selection = row.selection || {};
        const detailId = 'clusterDetailTemplate-' + row.index;
        const clusterName = row.clusterName;
        const isSelected = selectedClusterName && clusterName === selectedClusterName;
        const hasSelectionEntry = Boolean(selection && Object.keys(selection).length);
        const isRejected = selection?.selectionBucket === 'rejected' || selection?.decision === 'rejected' || productFit?.decision === 'reject';
        const canSelect = hasSelection && hasSelectionEntry && !isRejected;
        const productLabel = productFit?.decision
          ? productFit.decision + (productFit?.productFitScore !== undefined ? ' · ' + productFit.productFitScore + '/100' : '')
          : 'not reviewed';
        const selectionLabel = isSelected
          ? 'selected'
          : selection?.selectionBucket || selection?.decision || (hasSelection ? 'not ranked' : 'not prepared');
        const priorityLabel = selection?.priorityScore !== undefined ? selection.priorityScore + '/100' : '—';

        return (
          '<tr class="cluster-summary-row" data-cluster-detail-id="' + escapeHtmlClient(detailId) + '">' +
            '<td><div class="cluster-name-cell"><strong>' + escapeHtmlClient(String(row.index + 1).padStart(2, '0') + '. ' + clusterName) + '</strong><span>' + escapeHtmlClient(cluster?.primaryKeywordCandidate || cluster?.primaryKeyword || 'No primary keyword') + '</span></div></td>' +
            '<td><span class="cluster-pill' + clusterPillClass(cluster?.sourceConfidence) + '">' + escapeHtmlClient((cluster?.intent || 'intent n/a') + ' · ' + (cluster?.sourceConfidence || 'confidence n/a')) + '</span></td>' +
            '<td><span class="cluster-pill' + clusterPillClass(productFit?.decision) + '">' + escapeHtmlClient(productLabel) + '</span></td>' +
            '<td><span class="cluster-pill' + clusterPillClass(selectionLabel) + '">' + escapeHtmlClient(selectionLabel) + '</span></td>' +
            '<td>' + escapeHtmlClient(priorityLabel) + '</td>' +
            '<td><div class="cluster-row-actions">' +
              '<button type="button" data-cluster-detail-id="' + escapeHtmlClient(detailId) + '">Details</button>' +
              (hasSelection
                ? '<button type="button" class="primary select-cluster-topic-btn" data-cluster-name="' + escapeHtmlClient(clusterName) + '" ' + (!canSelect || isSelected || appState.clusterSelectionLoading ? 'disabled' : '') + '>' + escapeHtmlClient(isSelected ? 'Selected' : isRejected ? 'Rejected' : hasSelectionEntry ? 'Use' : 'Not ranked') + '</button>'
                : '') +
            '</div></td>' +
          '</tr>'
        );
      }

      function renderClusterDecisionTemplate(row) {
        return (
          '<template id="clusterDetailTemplate-' + row.index + '">' +
            renderClusterDecisionDetail(row) +
          '</template>'
        );
      }

      function renderClusterDecisionDetail(row) {
        const cluster = row.cluster || {};
        const productFit = row.productFit || {};
        const selection = row.selection || {};
        const secondary = Array.isArray(cluster?.secondaryKeywords) ? cluster.secondaryKeywords : [];
        const questions = Array.isArray(cluster?.questions) ? cluster.questions : [];
        const supporting = Array.isArray(cluster?.supportingItems) ? cluster.supportingItems : [];
        const supportingDetails = Array.isArray(cluster?.supportingItemDetails) ? cluster.supportingItemDetails : [];
        const competitorUrls = Array.isArray(cluster?.competitorUrls) ? cluster.competitorUrls : [];
        const keywords = Array.isArray(cluster?.keywords) ? cluster.keywords : [];
        const whatNotToClaim = Array.isArray(productFit?.whatNotToClaim) ? productFit.whatNotToClaim : [];
        const breakdown = selection?.scoreBreakdown || {};
        return (
          '<div class="stack">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">Cluster details</div><h3>' + escapeHtmlClient(row.clusterName) + '</h3></div><span class="badge">' + escapeHtmlClient(selection?.selectionBucket || selection?.decision || productFit?.decision || cluster?.sourceConfidence || 'cluster') + '</span></div>' +
            '<dl class="definition-list">' +
              '<dt>Primary keyword</dt><dd>' + escapeHtmlClient(cluster?.primaryKeywordCandidate || cluster?.primaryKeyword || selection?.primaryKeyword || '—') + '</dd>' +
              '<dt>Intent</dt><dd>' + escapeHtmlClient(cluster?.intent || '—') + '</dd>' +
              '<dt>User intent</dt><dd>' + escapeHtmlClient(cluster?.userIntent || '—') + '</dd>' +
              '<dt>Evidence summary</dt><dd>' + escapeHtmlClient(cluster?.evidenceSummary || cluster?.rationale || '—') + '</dd>' +
              '<dt>Product Fit</dt><dd>' + escapeHtmlClient([productFit?.decision, productFit?.productFitType, productFit?.productFitScore !== undefined ? productFit.productFitScore + '/100' : null].filter(Boolean).join(' · ') || '—') + '</dd>' +
              '<dt>Product Fit reason</dt><dd>' + escapeHtmlClient(productFit?.reason || '—') + '</dd>' +
              '<dt>Product insertion angle</dt><dd>' + escapeHtmlClient(productFit?.productInsertionAngle || '—') + '</dd>' +
              '<dt>Where to insert</dt><dd>' + escapeHtmlClient(productFit?.whereToInsert || '—') + '</dd>' +
              '<dt>Selection priority</dt><dd>' + escapeHtmlClient(selection?.priorityScore !== undefined ? selection.priorityScore + '/100' : '—') + '</dd>' +
              '<dt>Selection reason</dt><dd>' + escapeHtmlClient(selection?.reason || '—') + '</dd>' +
            '</dl>' +
            (Object.keys(breakdown).length ? renderSelectionScoreBreakdown(breakdown) : '') +
            renderCompactStringList('Cluster keywords', keywords.length ? keywords : secondary) +
            renderCompactStringList('Questions', questions) +
            renderCompactStringList('Supporting items', supporting) +
            renderCompactStringList('What not to claim', whatNotToClaim) +
            renderSupportingItemDetails(supportingDetails) +
            (competitorUrls.length
              ? '<div class="section-subhead"><h4>Competitor URLs</h4></div><div class="stage-output-list">' + competitorUrls.slice(0, 8).map((url) => (
                  '<div class="stage-output-item">' +
                    '<div class="inline-meta"><strong>' + escapeHtmlClient(url?.domain || 'domain') + '</strong><span>' + escapeHtmlClient(url?.rankAbsolute ?? '—') + '</span></div>' +
                    '<p>' + escapeHtmlClient(url?.title || url?.url || 'Untitled') + '</p>' +
                    '<p class="mono">' + escapeHtmlClient(url?.url || '—') + '</p>' +
                  '</div>'
                )).join('') + '</div>'
              : '') +
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
            '<details open><summary>Manual edit final brief JSON</summary>' +
              '<div class="field-block">' +
                '<p class="muted">Edit this JSON and save it. Article generation will use the saved manual version.</p>' +
                '<textarea id="finalBriefEditPayload" class="json-editor" spellcheck="false">' + escapeHtmlClient(prettyJson(brief)) + '</textarea>' +
                '<button type="button" class="primary ' + escapeHtmlClient(appState.finalBriefEditLoading ? 'is-loading' : '') + '" id="saveFinalBriefEditBtn" ' + (appState.finalBriefEditLoading ? 'disabled' : '') + '>' + escapeHtmlClient(appState.finalBriefEditLoading ? 'Saving edit...' : 'Save Manual Brief Edit') + '</button>' +
              '</div>' +
            '</details>' +
            '<details><summary>Raw final brief</summary><div><pre>' + escapeHtmlClient(prettyJson(brief)) + '</pre></div></details>' +
          '</section>'
        );
      }

      function renderLongreadDraft(run) {
        const artifact = findArtifact(run, 'longread_draft_article');
        const payload = artifact?.payload || null;
        const markdown = typeof payload?.draftArticleMarkdown === 'string' ? payload.draftArticleMarkdown : '';
        if (!artifact || !markdown) {
          return '<section class="card full article-generation-card"><div class="empty">No longread draft generated yet.</div></section>';
        }

        return (
          '<section class="card full article-generation-card">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">Article Step 1</div><h3>Draft Article</h3></div><span class="badge">' + escapeHtmlClient(payload?.artifactVersion || 'longread_draft_article_v1') + '</span></div>' +
            '<div class="metric-grid compact">' +
              '<div><strong>' + escapeHtmlClient(String(markdown.length)) + '</strong><span>Markdown chars</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload?.targetLength || '1800-2500 words') + '</strong><span>Target length</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload?.publishingFormat || 'website_blog') + '</strong><span>Format</span></div>' +
            '</div>' +
            '<details open><summary>Draft Markdown</summary><div><pre>' + escapeHtmlClient(markdown) + '</pre></div></details>' +
            '<details><summary>Raw draft artifact</summary><div><pre>' + escapeHtmlClient(prettyJson(payload)) + '</pre></div></details>' +
          '</section>'
        );
      }

      function renderLongreadCleanup(run) {
        const artifact = findArtifact(run, 'longread_cleanup');
        const payload = artifact?.payload || null;
        const markdown = typeof payload?.articleMarkdown === 'string' ? payload.articleMarkdown : '';
        const warnings = Array.isArray(payload?.warnings) ? payload.warnings : [];
        const changesMade = Array.isArray(payload?.changesMade) ? payload.changesMade : [];
        const reviewAttempts = Array.isArray(payload?.reviewAttempts) ? payload.reviewAttempts : [];
        const blockerCount = Number(payload?.blockerCount ?? warnings.filter((warning) => warning?.severity === 'blocker').length);
        if (!artifact || !markdown) {
          return '<section class="card full article-generation-card"><div class="empty">No longread review loop saved yet.</div></section>';
        }

        return (
          '<section class="card full article-generation-card">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">Article Step 2</div><h3>AI Review Loop</h3></div><span class="badge">' + escapeHtmlClient(payload?.status || '—') + '</span></div>' +
            '<div class="metric-grid compact">' +
              '<div><strong>' + escapeHtmlClient(payload?.status || '—') + '</strong><span>Status</span></div>' +
              '<div><strong>' + escapeHtmlClient(String(reviewAttempts.length || 1)) + '/' + escapeHtmlClient(String(payload?.maxReviewAttempts || 5)) + '</strong><span>Review attempts</span></div>' +
              '<div><strong>' + escapeHtmlClient(String(blockerCount)) + '</strong><span>Blockers</span></div>' +
              '<div><strong>' + escapeHtmlClient(String(warnings.length)) + '</strong><span>Warnings</span></div>' +
              '<div><strong>' + escapeHtmlClient(String(changesMade.length)) + '</strong><span>Changes</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload?.modelStatus || payload?.status || '—') + '</strong><span>Model status</span></div>' +
            '</div>' +
            renderCleanupAttempts(reviewAttempts) +
            renderCleanupWarnings(warnings) +
            renderCompactStringList('Changes made', changesMade) +
            '<details open><summary>Reviewed Markdown</summary><div><pre>' + escapeHtmlClient(markdown) + '</pre></div></details>' +
            '<details><summary>Raw cleanup artifact</summary><div><pre>' + escapeHtmlClient(prettyJson(payload)) + '</pre></div></details>' +
          '</section>'
        );
      }

      function renderCleanupAttempts(attempts) {
        return attempts.length
          ? '<details open><summary>AI review attempts</summary><div class="stage-output-list">' + attempts.map((attempt) => {
              const warnings = Array.isArray(attempt?.warnings) ? attempt.warnings : [];
              const changes = Array.isArray(attempt?.changesMade) ? attempt.changesMade : [];
              return (
                '<div class="stage-output-item">' +
                  '<div class="inline-meta"><strong>Attempt ' + escapeHtmlClient(attempt?.attempt || '—') + '</strong><span>' + escapeHtmlClient(attempt?.status || '—') + '</span></div>' +
                  '<p>Warnings: ' + escapeHtmlClient(String(warnings.length)) + ' · Changes: ' + escapeHtmlClient(String(changes.length)) + ' · Markdown chars: ' + escapeHtmlClient(String(attempt?.markdownLength || '—')) + '</p>' +
                  renderCleanupWarnings(warnings) +
                '</div>'
              );
            }).join('') + '</div></details>'
          : '';
      }

      function renderCleanupWarnings(warnings) {
        return warnings.length
          ? '<div class="stage-output-list">' + warnings.map((warning, index) => (
              '<div class="stage-output-item">' +
                '<div class="inline-meta"><strong>' + escapeHtmlClient(String(index + 1).padStart(2, '0') + '. ' + (warning?.type || 'warning')) + '</strong><span>' + escapeHtmlClient(warning?.severity || 'warning') + '</span></div>' +
                '<p>' + escapeHtmlClient(warning?.message || 'No warning message saved.') + '</p>' +
              '</div>'
            )).join('') + '</div>'
          : '<div class="empty">No cleanup warnings.</div>';
      }

      function renderLongreadPackage(run) {
        const artifact = findArtifact(run, 'longread_final_package');
        const payload = artifact?.payload || null;
        const article = payload?.article || {};
        const seo = payload?.seo || {};
        const productInsertion = payload?.productInsertion || {};
        const claimsReview = payload?.claimsReview || {};
        const checklist = payload?.publishingChecklist || {};
        if (!artifact || !article?.bodyMarkdown) {
          return '<section class="card full article-generation-card"><div class="empty">No final article package saved yet.</div></section>';
        }

        return (
          '<section class="card full article-generation-card">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">Article Step 3</div><h3>Final Article Package</h3></div><span class="badge">' + escapeHtmlClient(checklist?.readyToPublish ? 'ready' : 'review_needed') + '</span></div>' +
            '<div class="metric-grid compact">' +
              '<div><strong>' + escapeHtmlClient(checklist?.readyToPublish ? 'Yes' : 'No') + '</strong><span>Ready</span></div>' +
              '<div><strong>' + escapeHtmlClient(claimsReview?.status || '—') + '</strong><span>Claims</span></div>' +
              '<div><strong>' + escapeHtmlClient(seo?.primaryKeyword || '—') + '</strong><span>Primary keyword</span></div>' +
              '<div><strong>' + escapeHtmlClient(article?.slug || '—') + '</strong><span>Slug</span></div>' +
            '</div>' +
            '<dl class="definition-list">' +
              '<dt>Title</dt><dd>' + escapeHtmlClient(article?.title || '—') + '</dd>' +
              '<dt>H1</dt><dd>' + escapeHtmlClient(article?.h1 || '—') + '</dd>' +
              '<dt>Meta title</dt><dd>' + escapeHtmlClient(article?.metaTitle || '—') + '</dd>' +
              '<dt>Meta description</dt><dd>' + escapeHtmlClient(article?.metaDescription || '—') + '</dd>' +
              '<dt>Product insertion</dt><dd>' + escapeHtmlClient((productInsertion?.whereInserted || '—') + ' · ' + (productInsertion?.angleUsed || '—')) + '</dd>' +
            '</dl>' +
            renderCompactStringList('Secondary keywords used', Array.isArray(seo?.secondaryKeywordsUsed) ? seo.secondaryKeywordsUsed : []) +
            renderCompactStringList('Internal links', Array.isArray(seo?.internalLinks) ? seo.internalLinks : []) +
            renderCompactStringList('External sources needed', Array.isArray(seo?.externalSourcesNeeded) ? seo.externalSourcesNeeded : []) +
            renderCompactStringList('Claims warnings', Array.isArray(claimsReview?.warnings) ? claimsReview.warnings : []) +
            renderCompactStringList('Publishing notes', Array.isArray(checklist?.notes) ? checklist.notes : []) +
            renderBlogPublishPanel(run) +
            '<details open><summary>Body Markdown</summary><div><pre>' + escapeHtmlClient(article.bodyMarkdown) + '</pre></div></details>' +
            '<details><summary>Raw final package</summary><div><pre>' + escapeHtmlClient(prettyJson(payload)) + '</pre></div></details>' +
          '</section>'
        );
      }

      function renderBlogPublishPanel(run) {
        const blogPlacements = markerPlanBlogPlacementsForRun(run);
        const publishArtifact = findArtifact(run, 'blog_publish_result');
        const inputArtifact = findArtifact(run, 'normalized_input');
        const payload = publishArtifact?.payload || null;
        const inputPayload = inputArtifact?.payload || null;
        const shouldShow = blogPlacements.length > 0 || Boolean(payload?.url);
        if (!shouldShow) {
          return '';
        }
        const locale = blogPlacements[0]?.targetLanguage || normalizeTargetLanguage(run?.market?.language || 'en');
        const plannedAt = blogPlacements[0]?.publishAt || null;
        const publishedUrl = typeof payload?.url === 'string' ? payload.url : '';
        const savedCoverImageUrl = typeof inputPayload?.coverImageUrl === 'string' ? inputPayload.coverImageUrl : '';
        return (
          '<div class="stage-output-item">' +
            '<div class="inline-meta"><strong>Blog publication</strong><span>' + escapeHtmlClient(locale) + '</span></div>' +
            '<p>' + escapeHtmlClient(plannedAt ? 'Marker placement: ' + new Date(plannedAt).toLocaleString() : 'Publish the final longread package to Blog admin API.') + '</p>' +
            (publishedUrl
              ? '<p><a href="' + escapeHtmlClient(publishedUrl) + '" target="_blank" rel="noreferrer">Open published blog article</a></p>'
              : '') +
            '<div class="adaptation-schedule-grid" data-blog-publish-row data-locale="' + escapeHtmlClient(locale) + '">' +
              '<label>Cover image URL' +
                '<input type="url" data-blog-cover-image-url placeholder="https://cdn.example.com/cover.webp" value="' + escapeHtmlClient(savedCoverImageUrl) + '" />' +
              '</label>' +
              '<button type="button" class="' + escapeHtmlClient(appState.blogPublishLoading ? 'is-loading' : '') + '" data-publish-blog-article ' + (appState.blogPublishLoading ? 'disabled' : '') + '>' + escapeHtmlClient(appState.blogPublishLoading ? 'Publishing...' : publishedUrl ? 'Publish Blog Again' : 'Publish to Blog') + '</button>' +
            '</div>' +
          '</div>'
        );
      }

      function renderLongreadAdaptations(run) {
        const artifact = findArtifact(run, 'longread_adaptations_export');
        const payload = artifact?.payload || null;
        const adaptations = Array.isArray(payload?.adaptations) ? payload.adaptations : [];
        if (!artifact || !payload?.articleId) {
          return '<section class="card full article-generation-card"><div class="empty">No dashboard adaptations created yet.</div></section>';
        }

        const dashboardUrl = payload.dashboardUrl || (run.projectId ? '/test-ui/project?projectId=' + encodeURIComponent(run.projectId) : null);
        return (
          '<section class="card full article-generation-card">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">Article Step 4</div><h3>Dashboard Adaptations</h3></div><span class="badge">exported</span></div>' +
            '<div class="metric-grid compact">' +
              '<div><strong>' + escapeHtmlClient(payload.articleId || '—') + '</strong><span>Article</span></div>' +
              '<div><strong>' + escapeHtmlClient(String(adaptations.length)) + '</strong><span>Adaptations</span></div>' +
              '<div><strong>' + escapeHtmlClient(prettyDate(artifact.createdAt)) + '</strong><span>Created</span></div>' +
              '<div><strong>' + escapeHtmlClient(payload.sourceArtifactType || '—') + '</strong><span>Source</span></div>' +
            '</div>' +
            (dashboardUrl ? '<div class="actions"><a class="button secondary" href="' + escapeHtmlClient(dashboardUrl) + '">Open Project Dashboard</a></div>' : '') +
            renderAdaptationExportList(adaptations, payload.articleId, run.market?.language) +
            '<details><summary>Raw adaptations export</summary><div><pre>' + escapeHtmlClient(prettyJson(payload)) + '</pre></div></details>' +
          '</section>'
        );
      }

      function renderAdaptationExportList(adaptations, articleId, defaultLanguage) {
        return adaptations.length
          ? '<div class="stage-output-list">' + adaptations.map((adaptation, index) => (
              '<div class="stage-output-item">' +
                '<div class="inline-meta"><strong>' + escapeHtmlClient(String(index + 1).padStart(2, '0') + '. ' + (adaptation?.displayName || adaptation?.channelId || 'Adaptation')) + '</strong><span>' + escapeHtmlClient(adaptation?.channelId || 'channel') + '</span></div>' +
                '<p>' + escapeHtmlClient(adaptation?.preview || 'No preview saved.') + '</p>' +
                '<p class="muted mono">' + escapeHtmlClient(adaptation?.adaptationId || '—') + '</p>' +
                renderAdaptationScheduleControls(adaptation, articleId, defaultLanguage, index) +
              '</div>'
            )).join('') + '</div>'
          : '<div class="empty">No adaptations saved in this export.</div>';
      }

      function renderAdaptationScheduleControls(adaptation, articleId, defaultLanguage, index) {
        const adaptationId = adaptation?.adaptationId || '';
        const channelId = adaptation?.channelId || '';
        const isLoading = appState.longreadPublicationLoadingId === adaptationId;
        const disabled = !articleId || !adaptationId || isLoading;
        return (
          '<div class="adaptation-schedule-grid" data-adaptation-schedule-row data-article-id="' + escapeHtmlClient(articleId || '') + '" data-adaptation-id="' + escapeHtmlClient(adaptationId) + '" data-channel-id="' + escapeHtmlClient(channelId) + '">' +
            '<label>Language' +
              '<select data-adaptation-language ' + (disabled ? 'disabled' : '') + '>' +
                SEO_BRIEF_LANGUAGE_PRESETS.map((language) => renderLanguageOption(language, defaultLanguage)).join('') +
              '</select>' +
            '</label>' +
            '<label>Publish at' +
              '<input type="datetime-local" data-adaptation-publish-at value="' + escapeHtmlClient(defaultAdaptationPublishAt(index)) + '" ' + (disabled ? 'disabled' : '') + ' />' +
            '</label>' +
            '<button type="button" class="' + escapeHtmlClient(isLoading ? 'is-loading' : '') + '" data-schedule-longread-adaptation ' + (disabled ? 'disabled' : '') + '>' + escapeHtmlClient(isLoading ? 'Scheduling...' : 'Schedule') + '</button>' +
          '</div>'
        );
      }

      function renderLanguageOption(language, defaultLanguage) {
        const normalizedDefault = normalizeTargetLanguage(defaultLanguage || 'en');
        return '<option value="' + escapeHtmlClient(language.code) + '" ' + (normalizedDefault === language.code ? 'selected' : '') + '>' + escapeHtmlClient(language.label + ' (' + language.code + ')') + '</option>';
      }

      function normalizeTargetLanguage(language) {
        const normalized = String(language || '').trim().toLowerCase();
        const preset = resolveLanguagePreset(normalized);
        return preset?.code || normalized || 'en';
      }

      function setLanguagesIfPresent(values) {
        const languageSelect = qs('language');
        const codes = new Set(
          values
            .map((value) => resolveLanguagePreset(value)?.code || normalizeTargetLanguage(value))
            .filter(Boolean),
        );
        if (codes.size === 0) return;
        [...languageSelect.options].forEach((option) => {
          const optionCode = resolveLanguagePreset(option.value)?.code || normalizeTargetLanguage(option.value);
          option.selected = codes.has(optionCode);
        });
        syncCountryFromSelectedLanguages();
      }

      function channelDisplayName(channelId) {
        const normalized = normalizePublicationChannelId(channelId);
        if (normalized === 'channel_telegram') return 'Telegram';
        if (normalized === 'channel_x') return 'X';
        if (normalized === 'channel_discord') return 'Discord';
        if (normalized === 'channel_blog') return 'Blog';
        return channelId || 'Channel';
      }

      function normalizeMarkerPlacement(placement) {
        const publishAt = placement?.publishAt || placement?.publish_at || placement?.date || null;
        const publishAtDate = publishAt ? new Date(publishAt) : null;
        const channelId = normalizePublicationChannelId(placement?.channelId || placement?.channel_id || '');
        const targetLanguage = normalizeTargetLanguage(placement?.targetLanguage || placement?.target_language || '');
        return {
          id: String(placement?.id || ''),
          markerId: String(placement?.markerId || placement?.marker_id || ''),
          channelId,
          targetLanguage,
          publishAt:
            publishAtDate && !Number.isNaN(publishAtDate.getTime())
              ? publishAtDate.toISOString()
              : null,
        };
      }

      function renderMarkerPlanContext() {
        const node = qs('markerPlanContext');
        if (!node) return;
        const markerPlan = appState.markerPlan;
        if (!markerPlan) {
          node.hidden = true;
          node.innerHTML = '';
          return;
        }
        const languages = [...new Set(markerPlan.placements.map((placement) => placement.targetLanguage))];
        const channels = [...new Set(markerPlan.placements.map((placement) => channelDisplayName(placement.channelId)))];
        node.hidden = false;
        node.innerHTML =
          '<strong>Marker plan loaded: ' + escapeHtmlClient(markerPlan.markerTitle) + '</strong>' +
          '<p>' + escapeHtmlClient(String(markerPlan.placements.length) + ' placement(s), ' + languages.join(', ') + ', channels: ' + channels.join(', ')) + '</p>' +
          '<ul>' + markerPlan.placements.map((placement) =>
            '<li>' +
              escapeHtmlClient(new Date(placement.publishAt).toLocaleString() + ' · ' + channelDisplayName(placement.channelId) + ' · ' + placement.targetLanguage) +
            '</li>'
          ).join('') + '</ul>';
      }

      function buildMarkerPlanCampaignContext(markerPlan) {
        const lines = [
          'SEO brief was created from a dashboard draft marker.',
          'Marker: ' + markerPlan.markerTitle,
        ];
        if (markerPlan.markerNotes) {
          lines.push('Marker notes: ' + markerPlan.markerNotes);
        }
        lines.push('Use the selected language for SEO research, SEO brief, longread, and adaptations.');
        lines.push('Final dashboard adaptations must follow this publication plan:');
        markerPlan.placements.forEach((placement) => {
          lines.push(
            '- ' +
              placement.publishAt +
              ' | ' +
              channelDisplayName(placement.channelId) +
              ' | ' +
              placement.channelId +
              ' | ' +
              placement.targetLanguage,
          );
        });
        return lines.join('\\n').slice(0, 8000);
      }

      async function applyMarkerPlanFromInitialState() {
        if (!initialState.projectId || !initialState.markerId) {
          renderMarkerPlanContext();
          return;
        }

        const [markers, rawPlacements] = await Promise.all([
          fetchJson('/projects/' + encodeURIComponent(initialState.projectId) + '/markers').catch(() => []),
          fetchJson('/projects/' + encodeURIComponent(initialState.projectId) + '/marker-placements').catch(() => []),
        ]);
        const marker = Array.isArray(markers)
          ? markers.find((item) => String(item?.id || '') === initialState.markerId)
          : null;
        const placements = (Array.isArray(rawPlacements) ? rawPlacements : [])
          .map(normalizeMarkerPlacement)
          .filter((placement) => placement.markerId === initialState.markerId && placement.channelId && placement.targetLanguage && placement.publishAt)
          .sort((left, right) => new Date(left.publishAt).getTime() - new Date(right.publishAt).getTime());

        if (!marker) {
          showToast('Marker not found for SEO brief');
          renderMarkerPlanContext();
          return;
        }

        appState.markerPlan = {
          projectId: initialState.projectId,
          markerId: initialState.markerId,
          markerTitle: String(marker.title || 'Draft marker'),
          markerNotes: String(marker.notes || ''),
          placements,
        };
        if (qs('projectId')) qs('projectId').value = initialState.projectId;
        if (qs('projectFilter')) qs('projectFilter').value = initialState.projectId;
        appState.filterProjectId = initialState.projectId;
        qs('topicHint').value = appState.markerPlan.markerTitle;
        qs('campaignContext').value = buildMarkerPlanCampaignContext(appState.markerPlan);
        if (placements.length > 0) {
          setLanguagesIfPresent(placements.map((placement) => placement.targetLanguage));
        }
        await fillFromBrandMemory({ silent: true }).catch(() => undefined);
        renderMarkerPlanContext();
        showToast(
          placements.length > 0
            ? 'Marker plan loaded into SEO brief'
            : 'Marker loaded, but it has no placements yet',
        );
      }

      function markerPlanPlacementsForRun(run) {
        const markerPlan = appState.markerPlan;
        if (!markerPlan?.placements?.length) return [];
        const runLanguage = normalizeTargetLanguage(run?.market?.language || qs('language')?.value || 'en');
        return markerPlan.placements.filter((placement) => placement.targetLanguage === runLanguage);
      }

      function markerPlanBlogPlacementsForRun(run) {
        return markerPlanPlacementsForRun(run).filter(
          (placement) => placement.channelId === 'channel_blog',
        );
      }

      function markerPlanChannelsForRun(run) {
        const seen = new Set();
        return markerPlanPlacementsForRun(run)
          .filter((placement) => {
            if (seen.has(placement.channelId)) return false;
            seen.add(placement.channelId);
            return true;
          })
          .map((placement) => ({
            channelId: placement.channelId,
            displayName: channelDisplayName(placement.channelId),
            promptInstructions: null,
          }));
      }

      async function scheduleLongreadAdaptation(articleId, adaptationId, channelId, language, publishAtIso) {
        const normalizedChannelId = normalizePublicationChannelId(channelId);
        const payload = {
          articleId,
          adaptationId,
          targetLanguage: normalizeTargetLanguage(language),
          publishAt: publishAtIso,
        };

        await fetchJson('/publishing/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            articleId,
            channelId: normalizedChannelId,
            targetLanguage: payload.targetLanguage,
            publishAt: payload.publishAt,
          }),
        });

        await fetchJson(publishingScheduleEndpoint(normalizedChannelId), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      async function cleanupScheduledMarkerPlacement(placement) {
        const markerPlan = appState.markerPlan;
        if (!markerPlan?.projectId || !placement?.id) {
          return { placementDeleted: false, markerDeleted: false };
        }

        await fetchJson(
          '/projects/' +
            encodeURIComponent(markerPlan.projectId) +
            '/marker-placements/' +
            encodeURIComponent(placement.id),
          { method: 'DELETE' },
        );

        markerPlan.placements = markerPlan.placements.filter((item) => item.id !== placement.id);
        let markerDeleted = false;
        const remainingPlacements = markerPlan.placements.filter(
          (item) => item.markerId === markerPlan.markerId,
        );
        if (remainingPlacements.length === 0 && markerPlan.markerId) {
          await fetchJson(
            '/projects/' +
              encodeURIComponent(markerPlan.projectId) +
              '/markers/' +
              encodeURIComponent(markerPlan.markerId),
            { method: 'DELETE' },
          ).catch(() => undefined);
          markerDeleted = true;
          appState.markerPlan = null;
        }
        renderMarkerPlanContext();

        return { placementDeleted: true, markerDeleted };
      }

      async function autoScheduleMarkerPlanAdaptations(run, result) {
        const placements = markerPlanPlacementsForRun(run);
        const adaptations = Array.isArray(result?.adaptations) ? result.adaptations : [];
        const details = [];
        if (!result?.articleId) {
          details.push('Cannot schedule: adaptation export has no articleId.');
          return { scheduled: 0, skipped: 0, failed: 1, details };
        }
        if (placements.length === 0) {
          details.push('Cannot schedule: marker plan has no placements for this language.');
          return { scheduled: 0, skipped: 0, failed: 0, details };
        }
        if (adaptations.length === 0) {
          details.push('Cannot schedule: dashboard adaptations export is empty.');
          return { scheduled: 0, skipped: 0, failed: 1, details };
        }

        let scheduled = 0;
        let skipped = 0;
        let failed = 0;
        let markerCleanupFailed = 0;
        let markerDeleted = false;
        let markerPlacementsDeleted = 0;
        for (const placement of placements) {
          const placementLabel =
            channelDisplayName(placement.channelId) +
            ' / ' +
            placement.targetLanguage +
            ' / ' +
            placement.publishAt;
          if (placement.channelId === 'channel_blog') {
            const inputArtifact = findArtifact(run, 'normalized_input');
            const coverImageUrl = inputArtifact?.payload?.coverImageUrl;
            if (typeof coverImageUrl !== 'string' || !coverImageUrl.startsWith('https://')) {
              skipped += 1;
              details.push(placementLabel + ': skipped because Blog requires a cover image URL in SEO input.');
              continue;
            }
          }
          const publishAt = new Date(placement.publishAt);
          if (Number.isNaN(publishAt.getTime())) {
            skipped += 1;
            details.push(placementLabel + ': skipped because publishAt is invalid.');
            continue;
          }
          if (publishAt.getTime() <= Date.now()) {
            skipped += 1;
            details.push(placementLabel + ': skipped because publish time is in the past.');
            continue;
          }
          const adaptation = adaptations.find(
            (item) => normalizePublicationChannelId(item?.channelId) === placement.channelId,
          );
          if (!adaptation?.adaptationId) {
            skipped += 1;
            details.push(placementLabel + ': skipped because no matching adaptation was created.');
            continue;
          }
          try {
            await scheduleLongreadAdaptation(
              result.articleId,
              adaptation.adaptationId,
              placement.channelId,
              placement.targetLanguage,
              publishAt.toISOString(),
            );
            scheduled += 1;
            details.push(placementLabel + ': scheduled.');
            try {
              const cleanupResult = await cleanupScheduledMarkerPlacement(placement);
              if (cleanupResult.placementDeleted) {
                markerPlacementsDeleted += 1;
                details.push(placementLabel + ': marker placement removed.');
              }
              if (cleanupResult.markerDeleted) {
                markerDeleted = true;
                details.push('Marker removed because all its placements were scheduled.');
              }
            } catch (error) {
              markerCleanupFailed += 1;
              details.push(
                placementLabel +
                  ': scheduled, but failed to remove marker placement: ' +
                  (error instanceof Error ? error.message : 'unknown error'),
              );
            }
          } catch (error) {
            failed += 1;
            details.push(
              placementLabel +
                ': failed to schedule: ' +
                (error instanceof Error ? error.message : 'unknown error'),
            );
          }
        }
        return {
          scheduled,
          skipped,
          failed,
          details,
          markerCleanupFailed,
          markerDeleted,
          markerPlacementsDeleted,
        };
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

      function startCompetitorMatchingProgressPolling(runId) {
        stopCompetitorMatchingProgressPolling();
        startCompetitorMatchingProgressPolling.timer = setInterval(async () => {
          if (!appState.competitorMatchingLoading || appState.selectedRunId !== runId) {
            stopCompetitorMatchingProgressPolling();
            return;
          }
          if (startCompetitorMatchingProgressPolling.busy) {
            return;
          }

          startCompetitorMatchingProgressPolling.busy = true;
          try {
            const latestRun = await fetchJson('/seo-briefing/runs/' + encodeURIComponent(runId));
            if (appState.selectedRunId !== runId || !appState.competitorMatchingLoading) {
              return;
            }
            appState.selectedRun = latestRun;
            renderDetail(latestRun);
          } catch {
            // Keep the primary request in control; polling is only for progress visibility.
          } finally {
            startCompetitorMatchingProgressPolling.busy = false;
          }
        }, 1400);
      }

      function stopCompetitorMatchingProgressPolling() {
        clearInterval(startCompetitorMatchingProgressPolling.timer);
        startCompetitorMatchingProgressPolling.timer = null;
        startCompetitorMatchingProgressPolling.busy = false;
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
        if (appState.markerPlan?.markerId) {
          url.searchParams.set('markerId', appState.markerPlan.markerId);
        } else {
          url.searchParams.delete('markerId');
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

      async function fillFromBrandMemory(options = {}) {
        const silent = Boolean(options.silent);
        const projectId = qs('projectId').value;
        if (!projectId) {
          if (!silent) showToast('Select a project first');
          return;
        }

        const payload = await fetchJson('/projects/' + encodeURIComponent(projectId) + '/brand-memory');
        const brandMemory = payload.brandMemory || {};
        if (brandMemory.brandName) qs('productName').value = brandMemory.brandName;
        if (brandMemory.productDescription) qs('productDescription').value = brandMemory.productDescription;
        if (brandMemory.targetAudience) qs('audience').value = brandMemory.targetAudience;
        if (brandMemory.keyMessage) qs('keyMessage').value = brandMemory.keyMessage;
        if (brandMemory.defaultCta) qs('cta').value = brandMemory.defaultCta;
        if (Array.isArray(brandMemory.brandConstraints) && brandMemory.brandConstraints.length > 0) {
          qs('brandConstraints').value = brandMemory.brandConstraints.join('\\n');
        }
        const claimDefaults =
          Array.isArray(brandMemory.claimsConstraints) && brandMemory.claimsConstraints.length > 0
            ? brandMemory.claimsConstraints
            : brandMemory.forbiddenClaims;
        if (Array.isArray(claimDefaults) && claimDefaults.length > 0) {
          qs('claimsConstraints').value = claimDefaults.join('\\n');
        }
        if (!silent) showToast('Brand memory loaded');
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

      function setRunLibraryOpen(open) {
        const panel = qs('runLibraryPanel');
        const button = qs('runLibraryBtn');
        if (!panel) return;
        panel.hidden = !open;
        button?.setAttribute('aria-expanded', open ? 'true' : 'false');
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
          node.addEventListener('click', () => {
            setRunLibraryOpen(false);
            selectRun(node.getAttribute('data-run-id'));
          });
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
        const clusterSelection = findArtifact(run, 'cluster_selection_snapshot');
        const clusterSelectionPayload = clusterSelection?.payload || null;
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
          clusterSelectionPrepared: Boolean(clusterSelection),
          selection: Boolean(clusterSelectionPayload?.mainCluster),
          onPage: Boolean(findArtifact(run, 'onpage_research_snapshot')),
          onPageSynthesis: Boolean(findArtifact(run, 'onpage_synthesis_snapshot')),
          finalBrief: Boolean(findArtifact(run, 'final_brief_snapshot') || run.finalBrief),
          longreadDraft: Boolean(findArtifact(run, 'longread_draft_article')),
          longreadCleanup: Boolean(findArtifact(run, 'longread_cleanup')),
          longreadPackage: Boolean(findArtifact(run, 'longread_final_package')),
          longreadAdaptations: Boolean(findArtifact(run, 'longread_adaptations_export')),
          audit: true,
        };
      }

      function getStepLoading(step) {
        const groupedSteps = SEO_STEP_GROUPS[step];
        if (Array.isArray(groupedSteps) && groupedSteps.length > 1) {
          return groupedSteps.some((groupedStep) => getStepLoading(groupedStep));
        }
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
          (step === 'finalBrief' && appState.finalBriefLoading) ||
          (step === 'longreadDraft' && appState.longreadDraftLoading) ||
          (step === 'longreadCleanup' && appState.longreadCleanupLoading) ||
          (step === 'longreadPackage' && appState.longreadPackageLoading) ||
          (step === 'longreadAdaptations' && appState.longreadAdaptationsLoading)
        );
      }

      function normalizeActiveSeoStep() {
        if (SEO_STEP_TO_GROUP[appState.activeSeoStep]) {
          appState.activeSeoStep = SEO_STEP_TO_GROUP[appState.activeSeoStep];
        }
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
              SEO_STEP_TABS.map((step) => {
                const active = step.id === appState.activeSeoStep;
                const groupedSteps = SEO_STEP_GROUPS[step.id] || [step.id];
                const ready = groupedSteps.some((stepId) => Boolean(flags[stepId]));
                const loading = getStepLoading(step.id);
                const className = [
                  'seo-step-tab',
                  active ? 'is-active' : '',
                  ready ? 'is-ready' : '',
                  loading ? 'is-loading' : '',
                  step.kind === 'article' ? 'is-article' : '',
                  step.kind === 'audit' ? 'is-audit' : '',
                ].filter(Boolean).join(' ');
                return (
                  '<button type="button" class="' + escapeHtmlClient(className) + '" data-seo-step="' + escapeHtmlClient(step.id) + '">' +
                    '<span class="seo-step-dot"></span>' +
                    '<span>' + escapeHtmlClient(String(step.number) + ' ' + step.label) + '</span>' +
                  '</button>'
                );
              }).join('') +
            '</div>' +
          '</section>'
        );
      }

      function renderStepActionCard(run, flags) {
        const step = appState.activeSeoStep;
        const cleanupArtifact = findArtifact(run, 'longread_cleanup');
        const cleanupPayload = cleanupArtifact?.payload || {};
        const cleanupStatus = String(cleanupPayload?.status || '');
        const cleanupPassed = cleanupStatus === 'passed' || cleanupStatus === 'passed_with_warnings';
        const actionByStep = {
          input: {
            title: 'Input',
            message: 'This is the source context for the current run.',
            button: '',
            progress: '',
          },
          audit: {
            title: 'Run Audit Log',
            message: 'Inspect every saved attempt, artifact snapshot, AI call, DataForSEO call, and score log for this run.',
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
            message: 'Load the pre-fetched competitor Ranked Keywords map from Project Brand Memory.',
            button:
              '<button type="button" class="' + escapeHtmlClient('primary ' + (appState.rankedKeywordsLoading ? 'is-loading' : '')) + '" id="buildCompetitorKeywordMapBtn" ' + (appState.rankedKeywordsLoading ? 'disabled' : '') + '>' + escapeHtmlClient(appState.rankedKeywordsLoading ? 'Building competitor map...' : flags.rankedKeywords ? 'Refresh Competitor Keyword Map' : 'Build Competitor Keyword Map') + '</button>',
            progress: appState.rankedKeywordsLoading
              ? '<div class="inline-progress"><p>Reading competitor ranked keywords from Project Brand Memory.</p><div class="progress-track"><div class="progress-bar"></div></div></div>'
              : '',
          },
          competitorMatching: {
            title: 'Competitor Keyword Matching',
            message: flags.rankedKeywords && flags.keywords && flags.candidates
              ? 'Choose algorithmic matching or AI evidence evaluation against competitor ranked keywords.'
              : 'Generate keywords, extract SERP candidates, and build Competitor Keyword Map first.',
            details:
              '<div class="mode-guide">' +
                '<div class="mode-card">' +
                  '<strong>Algorithmic matching</strong>' +
                  '<p>1. Compares our candidates with competitor keywords by rules.</p>' +
                  '<p>2. Uses text similarity, rank, volume, and traffic signals.</p>' +
                  '<p>3. Fast and cheap, but less nuanced.</p>' +
                '</div>' +
                '<div class="mode-card">' +
                  '<strong>AI evidence evaluation</strong>' +
                  '<p>1. Sends our candidates and competitor keyword evidence to the selected AI model.</p>' +
                  '<p>2. AI groups the market and matches candidates only to provided evidence.</p>' +
                  '<p>3. Slower and costs more, but understands meaning better.</p>' +
                '</div>' +
              '</div>',
            button:
              '<div class="actions">' +
                '<button type="button" class="' + escapeHtmlClient((flags.rankedKeywords && flags.keywords && flags.candidates ? 'primary ' : '') + (appState.competitorMatchingLoading && appState.competitorMatchingMode === 'algorithmic' ? 'is-loading' : '')) + '" id="matchCompetitorKeywordsAlgorithmicBtn" ' + (!flags.rankedKeywords || !flags.keywords || !flags.candidates || appState.competitorMatchingLoading ? 'disabled' : '') + '>' + escapeHtmlClient(appState.competitorMatchingLoading && appState.competitorMatchingMode === 'algorithmic' ? 'Running algorithmic matching...' : flags.competitorMatching ? 'Refresh Algorithmic Matching' : 'Run Algorithmic Matching') + '</button>' +
                '<button type="button" class="' + escapeHtmlClient((flags.rankedKeywords && flags.keywords && flags.candidates ? 'primary ' : '') + (appState.competitorMatchingLoading && appState.competitorMatchingMode === 'ai' ? 'is-loading' : '')) + '" id="matchCompetitorKeywordsAiBtn" ' + (!flags.rankedKeywords || !flags.keywords || !flags.candidates || appState.competitorMatchingLoading ? 'disabled' : '') + '>' + escapeHtmlClient(appState.competitorMatchingLoading && appState.competitorMatchingMode === 'ai' ? 'Running AI evidence matching...' : flags.competitorMatching ? 'Refresh AI Evidence Matching' : 'Run AI Evidence Matching') + '</button>' +
              '</div>',
            progress: appState.competitorMatchingLoading
              ? renderCompetitorMatchingProgress(run, appState.competitorMatchingMode)
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
            title: 'AI Candidate Filtering',
            message: flags.dirtyPool
              ? 'Filter dirty-pool candidates with three AI passes: eligibility, fit scoring, and final calibration.'
              : 'Build the dirty keyword pool first.',
            button:
              '<button type="button" class="' + escapeHtmlClient((flags.dirtyPool ? 'primary ' : '') + (appState.candidateScoringLoading ? 'is-loading' : '')) + '" id="scoreKeywordCandidatesBtn" ' + (!flags.dirtyPool || appState.candidateScoringLoading ? 'disabled' : '') + '>' + escapeHtmlClient(appState.candidateScoringLoading ? 'AI filtering candidates...' : flags.candidateScoring ? 'Refresh AI Filtering' : 'Run AI Filtering') + '</button>',
            progress: appState.candidateScoringLoading
              ? '<div class="inline-progress"><p>Running AI eligibility, fit scoring, and final calibration passes.</p><div class="progress-track"><div class="progress-bar"></div></div></div>'
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
            title: 'Manual Topic Selection',
            message: flags.productFit
              ? flags.selection
                ? 'Main topic is selected. You can choose another ranked cluster below if needed.'
                : flags.clusterSelectionPrepared
                  ? 'Ranked cluster choices are ready. Choose one topic below before OnPage.'
                  : 'Prepare ranked cluster choices, then choose one topic manually.'
              : 'Review Product Fit first.',
            button:
              '<button type="button" class="' + escapeHtmlClient((flags.productFit ? 'primary ' : '') + (appState.clusterSelectionLoading ? 'is-loading' : '')) + '" id="selectSeoBriefClustersBtn" ' + (!flags.productFit || appState.clusterSelectionLoading ? 'disabled' : '') + '>' + escapeHtmlClient(appState.clusterSelectionLoading ? 'Preparing choices...' : flags.clusterSelectionPrepared ? 'Refresh Cluster Choices' : 'Prepare Cluster Choices') + '</button>',
            progress: appState.clusterSelectionLoading
              ? '<div class="inline-progress"><p>Scoring clusters by Product Fit, proxy demand evidence, intent relevance, SERP support, source diversity, and risk penalty.</p><div class="progress-track"><div class="progress-bar"></div></div></div>'
              : '',
          },
          onPage: {
            title: 'Selected Cluster OnPage Evidence',
            message: flags.selection
              ? 'Fetch content parsing and instant page metadata for 3-5 selected SERP URLs from the chosen cluster.'
              : flags.clusterSelectionPrepared
                ? 'Choose the main topic first.'
                : 'Prepare cluster choices and choose the main topic first.',
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
          longreadDraft: {
            title: 'Longread Draft',
            message: flags.finalBrief
              ? 'AI writes the first full Markdown longread from the final SEO brief, product profile, claims policy, and brand voice.'
              : 'Generate the final SEO brief first.',
            button:
              '<button type="button" class="' + escapeHtmlClient((flags.finalBrief ? 'primary ' : '') + (appState.longreadDraftLoading ? 'is-loading' : '')) + '" id="generateLongreadDraftBtn" ' + (!flags.finalBrief || appState.longreadDraftLoading ? 'disabled' : '') + '>' + escapeHtmlClient(appState.longreadDraftLoading ? 'Writing draft...' : flags.longreadDraft ? 'Refresh Draft Article' : 'Generate Draft Article') + '</button>',
            progress: appState.longreadDraftLoading
              ? '<div class="inline-progress"><p>AI is writing the full Markdown article from the approved brief.</p><div class="progress-track"><div class="progress-bar"></div></div></div>'
              : '',
          },
          longreadCleanup: {
            title: 'AI Review Loop',
            message: flags.longreadDraft
              ? 'AI iteratively reviews and regenerates the longread for SEO fit, claims safety, US compliance risk, tone, product insertion, and factual-check warnings.'
              : 'Generate the draft article first.',
            button:
              '<button type="button" class="' + escapeHtmlClient((flags.longreadDraft ? 'primary ' : '') + (appState.longreadCleanupLoading ? 'is-loading' : '')) + '" id="cleanupLongreadArticleBtn" ' + (!flags.longreadDraft || appState.longreadCleanupLoading ? 'disabled' : '') + '>' + escapeHtmlClient(appState.longreadCleanupLoading ? 'Running review loop...' : flags.longreadCleanup ? 'Refresh AI Review Loop' : 'Run AI Review Loop') + '</button>',
            progress: appState.longreadCleanupLoading
              ? '<div class="inline-progress"><p>AI is reviewing, revising, and rechecking the article until it passes or reaches the attempt limit.</p><div class="progress-track"><div class="progress-bar"></div></div></div>'
              : '',
          },
          longreadPackage: {
            title: 'Final Article Package',
            message: cleanupPassed
              ? 'AI packages the passed reviewed article into CMS-ready JSON: article fields, SEO fields, product insertion, claims review, and checklist.'
              : flags.longreadCleanup
                ? 'The AI review loop could not resolve publish-blocking issues. The longread was cancelled; refresh the review loop to retry from the draft.'
                : 'Run the AI review loop first.',
            button:
              '<button type="button" class="' + escapeHtmlClient((cleanupPassed ? 'primary ' : '') + (appState.longreadPackageLoading ? 'is-loading' : '')) + '" id="packageLongreadArticleBtn" ' + (!cleanupPassed || appState.longreadPackageLoading ? 'disabled' : '') + '>' + escapeHtmlClient(appState.longreadPackageLoading ? 'Packaging article...' : flags.longreadPackage ? 'Refresh Final Package' : 'Create Final Package') + '</button>',
            progress: appState.longreadPackageLoading
              ? '<div class="inline-progress"><p>AI is creating the CMS-ready article package.</p><div class="progress-track"><div class="progress-bar"></div></div></div>'
              : '',
          },
          longreadAdaptations: {
            title: 'Dashboard Adaptations',
            message: flags.longreadPackage
              ? 'Create a normal dashboard article from the final longread package and generate channel adaptations using both the longread and SEO brief context.'
              : 'Create the final article package first.',
            button:
              '<button type="button" class="' + escapeHtmlClient((flags.longreadPackage ? 'primary ' : '') + (appState.longreadAdaptationsLoading ? 'is-loading' : '')) + '" id="createLongreadAdaptationsBtn" ' + (!flags.longreadPackage || appState.longreadAdaptationsLoading ? 'disabled' : '') + '>' + escapeHtmlClient(appState.longreadAdaptationsLoading ? 'Creating adaptations...' : flags.longreadAdaptations ? 'Create Another Adaptation Set' : 'Create Dashboard Adaptations') + '</button>',
            progress: appState.longreadAdaptationsLoading
              ? '<div class="inline-progress"><p>Creating an editorial article and generating Telegram, X, Discord, and Blog adaptations from the longread plus SEO brief.</p><div class="progress-track"><div class="progress-bar"></div></div></div>'
              : '',
          },
        };
        const steps = SEO_STEP_GROUPS[step] || [step];
        return steps.map((stepId, index) => {
          const current = actionByStep[stepId] || actionByStep.input;
          return (
            '<section class="card full">' +
              '<div class="section-head"><div class="stack"><div class="eyebrow">' + escapeHtmlClient(steps.length > 1 ? 'Grouped Step Action' : 'Step Action') + '</div><h3>' + escapeHtmlClient(current.title) + '</h3></div>' + (index === 0 ? '<span class="badge ' + statusClass(run.status) + '">' + escapeHtmlClient(run.status) + '</span>' : '') + '</div>' +
              '<p>' + escapeHtmlClient(current.message) + '</p>' +
              (current.details ? current.details : '') +
              (current.button ? '<div class="actions">' + current.button + '</div>' : '') +
              current.progress +
            '</section>'
          );
        }).join('');
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
              '<dt>Request Timeout</dt><dd>' + escapeHtmlClient(String(Math.round(Number(inputPayload.requestTimeoutMs ?? 300000) / 1000)) + ' sec') + '</dd>' +
              '<dt>Audience</dt><dd>' + escapeHtmlClient(run.audience || '—') + '</dd>' +
              '<dt>Product</dt><dd>' + escapeHtmlClient(run.product.name) + '</dd>' +
            '</dl>' +
            '<div class="brand-memory-grid">' +
              '<div class="brand-memory-block"><h4>Manual User Pains</h4>' + renderMemoryList(manualPains, 'No manual user pains saved.') + '</div>' +
              '<div class="brand-memory-block"><h4>Manual User Scenarios</h4>' + renderMemoryList(manualScenarios, 'No manual user scenarios saved.') + '</div>' +
            '</div>' +
            renderAiPromptInventory() +
          '</section>'
        );
      }

      function renderActiveStepContent(run, flags) {
        switch (appState.activeSeoStep) {
          case 'keywords':
            return flags.keywords
              ? '<section class="card full"><div class="section-head"><div class="stack"><div class="eyebrow">Output</div><h3>Search Hypotheses From Manual Input</h3></div></div>' + renderKeywordHypotheses(run) + '</section>'
              : '<section class="card full"><div class="empty">No keyword hypotheses generated yet.</div></section>';
          case 'serpGroup':
            return (flags.serp || flags.candidates)
              ? renderFirstKeywordSerpPreview(run)
              : '<section class="card full"><div class="empty">No SERP snapshots or SERP candidates saved yet.</div></section>';
          case 'serp':
            return flags.serp
              ? renderFirstKeywordSerpPreview(run)
              : '<section class="card full"><div class="empty">No SERP snapshots fetched yet.</div></section>';
          case 'candidates':
            return flags.candidates
              ? renderFirstKeywordSerpPreview(run)
              : '<section class="card full"><div class="empty">No SERP candidates extracted yet.</div></section>';
          case 'competitionGroup':
            return [
              renderRankedKeywordsUniverse(run),
              renderCompetitorKeywordMatches(run),
              renderDirtyKeywordPool(run),
              renderKeywordCandidateScoring(run),
            ].join('');
          case 'rankedKeywords':
            return renderRankedKeywordsUniverse(run);
          case 'competitorMatching':
            return renderCompetitorKeywordMatches(run);
          case 'dirtyPool':
            return renderDirtyKeywordPool(run);
          case 'candidateScoring':
            return renderKeywordCandidateScoring(run);
          case 'clusterGroup':
            return renderClusterDecisionTable(run);
          case 'clusters':
            return renderIntentClusters(run);
          case 'productFit':
            return renderClusterProductFitReview(run);
          case 'selection':
            return renderClusterSelection(run);
          case 'onPageGroup':
            return [
              renderSelectedClusterOnPage(run),
              renderOnPageSynthesis(run),
            ].join('');
          case 'onPage':
            return renderSelectedClusterOnPage(run);
          case 'onPageSynthesis':
            return renderOnPageSynthesis(run);
          case 'finalBrief':
            return renderFinalSeoBrief(run);
          case 'articleGroup':
            return [
              renderLongreadDraft(run),
              renderLongreadCleanup(run),
              renderLongreadPackage(run),
              renderLongreadAdaptations(run),
            ].join('');
          case 'audit':
            return renderRunAuditLog(run);
          case 'longreadDraft':
            return renderLongreadDraft(run);
          case 'longreadCleanup':
            return renderLongreadCleanup(run);
          case 'longreadPackage':
            return renderLongreadPackage(run);
          case 'longreadAdaptations':
            return renderLongreadAdaptations(run);
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

      const AUTO_FLOW_STEPS = [
        {
          label: 'Generating search hypotheses',
          step: 'keywords',
          loadingKey: 'keywordHypothesesLoading',
          path: '/generate-keyword-hypotheses',
          readyFlag: 'keywords',
          payload: {},
        },
        {
          label: 'Fetching selected SERP snapshots',
          step: 'serpGroup',
          loadingKey: 'serpPreviewLoading',
          path: '/preview-keyword-serps',
          readyFlag: 'serp',
          payload: {},
        },
        {
          label: 'Extracting SERP candidates',
          step: 'serpGroup',
          loadingKey: 'serpDerivedCandidatesLoading',
          path: '/extract-serp-derived-candidates',
          readyFlag: 'candidates',
          payload: {},
        },
        {
          label: 'Loading competitor keyword map from Brand Memory',
          step: 'competitionGroup',
          loadingKey: 'rankedKeywordsLoading',
          path: '/build-competitor-keyword-map',
          readyFlag: 'rankedKeywords',
          payload: {},
        },
        {
          label: 'Matching candidates to competitor keyword evidence',
          step: 'competitionGroup',
          loadingKey: 'competitorMatchingLoading',
          path: '/match-competitor-keywords',
          readyFlag: 'competitorMatching',
          payload: () => ({ mode: 'algorithmic' }),
        },
        {
          label: 'Building dirty keyword pool',
          step: 'competitionGroup',
          loadingKey: 'dirtyKeywordPoolLoading',
          path: '/build-dirty-keyword-pool',
          readyFlag: 'dirtyPool',
          payload: {},
        },
        {
          label: 'Filtering and scoring candidates',
          step: 'competitionGroup',
          loadingKey: 'candidateScoringLoading',
          path: '/score-keyword-candidates',
          readyFlag: 'candidateScoring',
          payload: {},
        },
        {
          label: 'Building intent clusters',
          step: 'clusterGroup',
          loadingKey: 'keywordClusteringLoading',
          path: '/cluster-keyword-candidates',
          readyFlag: 'clusters',
          payload: {},
        },
        {
          label: 'Reviewing cluster Product Fit',
          step: 'clusterGroup',
          loadingKey: 'clusterProductFitLoading',
          path: '/review-cluster-product-fit',
          readyFlag: 'productFit',
          payload: {},
        },
        {
          label: 'Selecting the main cluster automatically',
          step: 'clusterGroup',
          loadingKey: 'clusterSelectionLoading',
          path: '/select-seo-brief-clusters',
          readyFlag: 'selection',
          payload: {},
        },
      ];
      const AUTO_FLOW_AFTER_CLUSTER_SELECTION_STEPS = [
        {
          label: 'Fetching selected cluster OnPage evidence',
          step: 'onPageGroup',
          loadingKey: 'onPageLoading',
          path: '/fetch-selected-cluster-onpage',
          readyFlag: 'onPage',
          payload: {},
        },
        {
          label: 'Synthesizing OnPage requirements',
          step: 'onPageGroup',
          loadingKey: 'onPageSynthesisLoading',
          path: '/synthesize-onpage',
          readyFlag: 'onPageSynthesis',
          payload: {},
        },
        {
          label: 'Generating final SEO brief',
          step: 'finalBrief',
          loadingKey: 'finalBriefLoading',
          path: '/generate-final-brief',
          readyFlag: 'finalBrief',
          payload: {},
        },
      ];

      function getAutoFlowPayload(stepConfig) {
        return typeof stepConfig.payload === 'function' ? stepConfig.payload() : stepConfig.payload || {};
      }

      function shouldSkipAutoFlowStep(run, stepConfig) {
        if (!run || !stepConfig.readyFlag) return false;
        return Boolean(getManualStepFlags(run)[stepConfig.readyFlag]);
      }

      async function fetchRunSnapshot(runId) {
        return fetchJson('/seo-briefing/runs/' + encodeURIComponent(runId));
      }

      async function executeAutoFlowStep(runId, stepConfig) {
        const beforeRun = await fetchRunSnapshot(runId);
        if (shouldSkipAutoFlowStep(beforeRun, stepConfig)) {
          return { skipped: true, run: beforeRun };
        }

        await fetchJson('/seo-briefing/runs/' + encodeURIComponent(runId) + stepConfig.path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(getAutoFlowPayload(stepConfig)),
        });

        const afterRun = await fetchRunSnapshot(runId);
        return { skipped: false, run: afterRun };
      }

      function clearAutoFlowStepLoading() {
        [...AUTO_FLOW_STEPS, ...AUTO_FLOW_AFTER_CLUSTER_SELECTION_STEPS].forEach((stepConfig) => {
          appState[stepConfig.loadingKey] = false;
        });
      }

      function renderAutoFlowProgress() {
        if (!appState.autoFlowLoading) {
          return '';
        }
        const total = appState.autoFlowTotal || AUTO_FLOW_STEPS.length;
        const index = Math.min(total, Math.max(1, appState.autoFlowCurrentIndex || 1));
        return (
          '<section class="card full auto-flow-progress">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">Auto Workflow</div><h3>' + escapeHtmlClient(appState.autoFlowTitle || 'Running workflow') + '</h3></div><span class="badge">' +
              escapeHtmlClient(String(index) + ' / ' + String(total)) +
            '</span></div>' +
            '<strong>' + escapeHtmlClient(appState.autoFlowCurrentLabel || 'Preparing next step') + '</strong>' +
            '<p>' + escapeHtmlClient(appState.autoFlowDescription || 'The UI is calling the same step endpoints automatically.') + '</p>' +
            '<div class="progress-track"><div class="progress-bar"></div></div>' +
          '</section>'
        );
      }

      async function runAutoFlowSequence(runId, steps, config) {
        appState.autoFlowLoading = true;
        appState.autoFlowTitle = config.title;
        appState.autoFlowDescription = config.description;
        appState.autoFlowTotal = steps.length;
        clearAutoFlowStepLoading();
        showToast(config.startedToast || 'Auto workflow started');

        try {
          for (let index = 0; index < steps.length; index += 1) {
            const stepConfig = steps[index];
            clearAutoFlowStepLoading();
            appState.autoFlowCurrentIndex = index + 1;
            appState.autoFlowCurrentLabel = stepConfig.label;
            appState.activeSeoStep = stepConfig.step;
            appState[stepConfig.loadingKey] = true;
            updateUrl(runId);
            if (stepConfig.path === '/match-competitor-keywords') {
              appState.competitorMatchingMode = 'algorithmic';
            }
            if (appState.selectedRun) {
              renderDetail(appState.selectedRun);
            }

            const stepResult = await executeAutoFlowStep(runId, stepConfig);
            if (stepResult.skipped) {
              showToast('Skipped completed step: ' + stepConfig.label);
            }

            appState[stepConfig.loadingKey] = false;
            await loadRuns();
            await selectRun(runId, false);
          }

          clearAutoFlowStepLoading();
          appState.autoFlowLoading = false;
          appState.autoFlowTitle = null;
          appState.autoFlowDescription = null;
          appState.autoFlowCurrentLabel = null;
          appState.autoFlowCurrentIndex = 0;
          appState.activeSeoStep = config.finalStep;
          updateUrl(runId);
          await loadRuns();
          await selectRun(runId, false);
          showToast(config.finishedToast || 'Auto workflow finished');
        } catch (error) {
          clearAutoFlowStepLoading();
          appState.autoFlowLoading = false;
          appState.autoFlowTitle = null;
          appState.autoFlowDescription = null;
          appState.autoFlowCurrentLabel = null;
          appState.autoFlowCurrentIndex = 0;
          try {
            await loadRuns();
            await selectRun(runId, false);
          } catch (_refreshError) {
            if (appState.selectedRun) {
              renderDetail(appState.selectedRun);
            }
          }
          showToast(error instanceof Error ? error.message : 'Auto workflow failed');
        }
      }

      async function runAutoFlowUntilClusterSelection(runId) {
        await runAutoFlowSequence(runId, [...AUTO_FLOW_STEPS, ...AUTO_FLOW_AFTER_CLUSTER_SELECTION_STEPS], {
          title: 'Running to final brief',
          description: 'The UI is calling the same step endpoints automatically, including cluster selection, OnPage evidence, and final brief generation.',
          finalStep: 'finalBrief',
          startedToast: 'Auto workflow started',
          finishedToast: 'Final SEO brief generated automatically',
        });
      }

      async function runAutoFlowToFinalBrief(runId) {
        await runAutoFlowSequence(runId, AUTO_FLOW_AFTER_CLUSTER_SELECTION_STEPS, {
          title: 'Running from selected topic to final brief',
          description: 'The UI will fetch selected-cluster OnPage evidence, synthesize requirements, and generate the final SEO brief.',
          finalStep: 'finalBrief',
          startedToast: 'Auto workflow resumed after topic selection',
          finishedToast: 'Final SEO brief generated automatically',
        });
      }

      async function runAutoFlowHeadless(runId, onProgress) {
        const steps = [...AUTO_FLOW_STEPS, ...AUTO_FLOW_AFTER_CLUSTER_SELECTION_STEPS];
        for (let index = 0; index < steps.length; index += 1) {
          const stepConfig = steps[index];
          if (typeof onProgress === 'function') {
            onProgress({
              index: index + 1,
              label: stepConfig.label,
              status: 'running',
              total: steps.length,
            });
          }
          setLaunchStatus(
            'Auto flow ' +
              String(index + 1) +
              '/' +
              String(steps.length) +
              ': ' +
              stepConfig.label,
          );
          const stepResult = await executeAutoFlowStep(runId, stepConfig);
          if (stepResult.skipped) {
            if (typeof onProgress === 'function') {
              onProgress({
                index: index + 1,
                label: stepConfig.label,
                status: 'skipped',
                total: steps.length,
              });
            }
            setLaunchStatus('Skipped completed step: ' + stepConfig.label);
          }
        }
      }

      function renderCostReceipt(run) {
        const metrics = run.metrics || {};
        const rows = Array.isArray(metrics.costBreakdownByStep)
          ? metrics.costBreakdownByStep
          : [];
        const totalLlmCost = Number(metrics.totalLlmCost || 0);
        const totalExternalCost = Number(metrics.totalExternalCost || 0);
        const totalCost = Number(metrics.totalCost || 0);
        const hasAnyCostData = rows.length > 0 || metrics.llmCallCount || metrics.externalCallCount;

        if (!hasAnyCostData) {
          return (
            '<details class="card full cost-receipt">' +
              '<summary><div class="section-head"><div class="stack"><div class="eyebrow">Cost Receipt</div><h3>Run Cost</h3></div><span class="badge">No calls yet</span></div></summary>' +
              '<div class="empty">No DeepSeek or DataForSEO calls have been logged for this run yet.</div>' +
            '</details>'
          );
        }

        return (
          '<details class="card full cost-receipt" open>' +
            '<summary><div class="section-head"><div class="stack"><div class="eyebrow">Cost Receipt</div><h3>DeepSeek + DataForSEO Check</h3></div><span class="badge">' + escapeHtmlClient(formatMoney(totalCost)) + '</span></div></summary>' +
            '<div class="cost-summary-grid">' +
              '<article><strong>' + escapeHtmlClient(formatMoney(totalLlmCost)) + '</strong><span>DeepSeek total</span></article>' +
              '<article><strong>' + escapeHtmlClient(formatMoney(totalExternalCost)) + '</strong><span>DataForSEO total</span></article>' +
              '<article><strong>' + escapeHtmlClient(formatMoney(totalCost)) + '</strong><span>Total</span></article>' +
              '<article><strong>' + escapeHtmlClient(String((metrics.llmCallCount || 0) + (metrics.externalCallCount || 0))) + '</strong><span>Logged calls</span></article>' +
            '</div>' +
            '<div class="cost-rows">' +
              rows.map((row, index) => renderCostReceiptRow(row, index)).join('') +
            '</div>' +
          '</details>'
        );
      }

      function renderCostReceiptRow(row, index) {
        const operationText = [
          ...(Array.isArray(row.llmOperations) ? row.llmOperations.map((item) => 'AI: ' + item) : []),
          ...(Array.isArray(row.externalEndpoints) ? row.externalEndpoints.map((item) => 'DFSEO: ' + item) : []),
        ].join(' · ') || 'No operation metadata';
        const callsText =
          String(row.llmCallCount || 0) + ' AI' +
          ' / ' +
          String(row.externalCallCount || 0) + ' DFSEO' +
          (row.cacheHitCount ? ' · ' + String(row.cacheHitCount) + ' cache hits' : '');

        return (
          '<div class="cost-row">' +
            '<div><strong>' + escapeHtmlClient(String(index + 1).padStart(2, '0') + '. ' + getStageLabel(row.stage)) + '</strong><small>' + escapeHtmlClient(callsText) + '</small></div>' +
            '<div><strong>' + escapeHtmlClient(formatMoney(row.llmCost || 0)) + '</strong><small>DeepSeek</small></div>' +
            '<div><strong>' + escapeHtmlClient(formatMoney(row.externalCost || 0)) + '</strong><small>DataForSEO</small></div>' +
            '<div><strong>' + escapeHtmlClient(formatMoney(row.totalCost || 0)) + '</strong><small>Total</small></div>' +
            '<div><code>' + escapeHtmlClient(operationText) + '</code></div>' +
          '</div>'
        );
      }

      function getStageLabel(stage) {
        const labels = {
          created: 'Input',
          keyword_expansion: 'Keywords / SERP candidates',
          keyword_research: 'Competitor keywords / Matching / Dirty pool',
          related_keyword_research: 'Related queries',
          serp_research: 'SERP domains',
          domain_metrics_research: 'Domain metrics',
          onpage_research: 'OnPage evidence',
          keyword_triage: 'Filtering',
          clustering: 'Clusters',
          cluster_scoring: 'Product Fit',
          cluster_selection: 'Selection',
          brief_generation: 'Brief / Article generation',
        };
        return labels[stage] || 'Run-level call';
      }

      function formatMoney(value) {
        const numberValue = Number(value || 0);
        if (!Number.isFinite(numberValue)) return '$0.000000';
        return '$' + numberValue.toFixed(6);
      }

      function formatDurationMs(startedAt, finishedAt) {
        if (!startedAt) return '—';
        const started = new Date(startedAt).getTime();
        const finished = finishedAt ? new Date(finishedAt).getTime() : Date.now();
        if (!Number.isFinite(started) || !Number.isFinite(finished)) return '—';
        const ms = Math.max(0, finished - started);
        if (ms < 1000) return String(ms) + 'ms';
        if (ms < 60000) return String((ms / 1000).toFixed(1)) + 's';
        return String((ms / 60000).toFixed(1)) + 'm';
      }

      function renderRunAuditLog(run) {
        const steps = Array.isArray(run.steps) ? run.steps : [];
        const artifacts = Array.isArray(run.artifacts) ? run.artifacts : [];
        const llmCalls = Array.isArray(run.llmCalls) ? run.llmCalls : [];
        const externalCalls = Array.isArray(run.externalCalls) ? run.externalCalls : [];
        const scoreLogs = Array.isArray(run.scoreLogs) ? run.scoreLogs : [];
        const failedSteps = steps.filter((step) => step.status === 'failed').length;
        const failedLlmCalls = llmCalls.filter((call) => call.status === 'failed').length;
        const failedExternalCalls = externalCalls.filter((call) => call.status === 'failed').length;
        const llmCost = sumEstimatedCost(llmCalls);
        const externalCost = sumEstimatedCost(externalCalls);

        return (
          '<section class="card full">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">Audit Store</div><h3>Run Attempts & Snapshots</h3></div><span class="badge">' + escapeHtmlClient(String(steps.length) + ' attempts') + '</span></div>' +
            '<p>Saved history for this run: successful and failed step attempts, artifacts, AI calls, DataForSEO calls, and score snapshots.</p>' +
            '<div class="metric-grid compact">' +
              '<div><strong>' + escapeHtmlClient(String(steps.length)) + '</strong><span>Step attempts</span></div>' +
              '<div><strong>' + escapeHtmlClient(String(artifacts.length)) + '</strong><span>Artifacts</span></div>' +
              '<div><strong>' + escapeHtmlClient(String(llmCalls.length) + ' · ' + formatMoney(llmCost)) + '</strong><span>DeepSeek calls</span></div>' +
              '<div><strong>' + escapeHtmlClient(String(externalCalls.length) + ' · ' + formatMoney(externalCost)) + '</strong><span>DataForSEO calls</span></div>' +
              '<div><strong>' + escapeHtmlClient(String(scoreLogs.length)) + '</strong><span>Score logs</span></div>' +
              '<div><strong>' + escapeHtmlClient(String(failedSteps + failedLlmCalls + failedExternalCalls)) + '</strong><span>Failures</span></div>' +
            '</div>' +
            '<div class="audit-grid">' +
              renderAuditStepAttempts(steps) +
              renderAuditArtifacts(artifacts) +
              renderAuditLlmCalls(llmCalls) +
              renderAuditExternalCalls(externalCalls) +
              renderAuditScoreLogs(scoreLogs) +
            '</div>' +
          '</section>'
        );
      }

      function renderAuditSection(title, count, rows, open) {
        return (
          '<details class="audit-section" ' + (open ? 'open' : '') + '>' +
            '<summary>' + escapeHtmlClient(title + ' · ' + String(count)) + '</summary>' +
            '<div class="audit-section-body">' +
              (rows || '<div class="empty">No records saved.</div>') +
            '</div>' +
          '</details>'
        );
      }

      function renderAuditCostSection(title, calls, rows, open) {
        return (
          '<details class="audit-section" ' + (open ? 'open' : '') + '>' +
            '<summary>' + escapeHtmlClient(title + ' · ' + String(calls.length) + ' · ' + formatMoney(sumEstimatedCost(calls))) + '</summary>' +
            '<div class="audit-section-body">' +
              (rows || '<div class="empty">No records saved.</div>') +
            '</div>' +
          '</details>'
        );
      }

      function sumEstimatedCost(calls) {
        return (Array.isArray(calls) ? calls : []).reduce((sum, call) => {
          const value = Number(call?.estimatedCost || 0);
          return sum + (Number.isFinite(value) ? value : 0);
        }, 0);
      }

      function renderAuditStepAttempts(steps) {
        const rows = steps.map((step, index) => {
          const failed = step.status === 'failed';
          return (
            '<article class="audit-row ' + escapeHtmlClient(failed ? 'is-failed' : '') + '">' +
              '<div class="inline-meta"><strong>' + escapeHtmlClient(String(index + 1).padStart(2, '0') + '. ' + getStageLabel(step.stage)) + '</strong><span class="badge ' + statusClass(step.status) + '">' + escapeHtmlClient(step.status) + '</span></div>' +
              '<div class="inline-meta">' +
                '<span>attempt ' + escapeHtmlClient(step.attemptNumber) + '</span>' +
                '<span>' + escapeHtmlClient(prettyDate(step.startedAt)) + '</span>' +
                '<span>' + escapeHtmlClient(formatDurationMs(step.startedAt, step.finishedAt)) + '</span>' +
                '<span class="mono">' + escapeHtmlClient(step.id) + '</span>' +
              '</div>' +
              (step.errorMessage ? '<p class="muted">Error: ' + escapeHtmlClient(step.errorMessage) + '</p>' : '') +
            '</article>'
          );
        }).join('');
        return renderAuditSection('Step attempts', steps.length, rows, true);
      }

      function renderAuditArtifacts(artifacts) {
        const rows = artifacts.map((artifact, index) => (
          '<article class="audit-row">' +
            '<div class="inline-meta"><strong>' + escapeHtmlClient(String(index + 1).padStart(2, '0') + '. ' + artifact.artifactType) + '</strong><span>' + escapeHtmlClient(getStageLabel(artifact.stage)) + '</span></div>' +
            '<div class="inline-meta">' +
              '<span>attempt ' + escapeHtmlClient(artifact.attempt) + '</span>' +
              '<span>' + escapeHtmlClient(prettyDate(artifact.createdAt)) + '</span>' +
              '<span class="mono">' + escapeHtmlClient(artifact.id) + '</span>' +
            '</div>' +
            '<details><summary>Payload</summary><pre>' + escapeHtmlClient(prettyJson(artifact.payload)) + '</pre></details>' +
          '</article>'
        )).join('');
        return renderAuditSection('Artifact snapshots', artifacts.length, rows, false);
      }

      function renderAuditLlmCalls(calls) {
        const rows = calls.map((call, index) => {
          const failed = call.status === 'failed';
          return (
            '<article class="audit-row ' + escapeHtmlClient(failed ? 'is-failed' : '') + '">' +
              '<div class="inline-meta"><strong>' + escapeHtmlClient(String(index + 1).padStart(2, '0') + '. ' + call.operation) + '</strong><span class="badge ' + statusClass(call.status) + '">' + escapeHtmlClient(call.status) + '</span></div>' +
              '<div class="inline-meta">' +
                '<span>' + escapeHtmlClient(call.model) + '</span>' +
                '<span>' + escapeHtmlClient(call.promptVersion) + '</span>' +
                '<span>' + escapeHtmlClient(formatMoney(call.estimatedCost || 0)) + '</span>' +
                '<span>tokens ' + escapeHtmlClient(String(call.tokenUsageInput ?? '—') + ' / ' + String(call.tokenUsageOutput ?? '—')) + '</span>' +
                '<span>' + escapeHtmlClient(formatDurationMs(call.startedAt, call.finishedAt)) + '</span>' +
              '</div>' +
              (call.errorMessage ? '<p class="muted">Error: ' + escapeHtmlClient(call.errorMessage) + '</p>' : '') +
              '<details><summary>Request / response</summary><pre>' + escapeHtmlClient(prettyJson({ request: call.requestPayload, response: call.responsePayload })) + '</pre></details>' +
            '</article>'
          );
        }).join('');
        return renderAuditCostSection('DeepSeek calls', calls, rows, calls.some((call) => call.status === 'failed'));
      }

      function renderAuditExternalCalls(calls) {
        const rows = calls.map((call, index) => {
          const failed = call.status === 'failed';
          return (
            '<article class="audit-row ' + escapeHtmlClient(failed ? 'is-failed' : '') + '">' +
              '<div class="inline-meta"><strong>' + escapeHtmlClient(String(index + 1).padStart(2, '0') + '. ' + call.provider) + '</strong><span class="badge ' + statusClass(call.status) + '">' + escapeHtmlClient(call.status) + '</span></div>' +
              '<div class="inline-meta">' +
                '<span class="mono">' + escapeHtmlClient(call.endpoint) + '</span>' +
                '<span>' + escapeHtmlClient(formatMoney(call.estimatedCost || 0)) + '</span>' +
                '<span>' + escapeHtmlClient(call.cacheHit ? 'cache hit' : 'live') + '</span>' +
                '<span>' + escapeHtmlClient(formatDurationMs(call.startedAt, call.finishedAt)) + '</span>' +
              '</div>' +
              (call.errorMessage ? '<p class="muted">Error: ' + escapeHtmlClient(call.errorMessage) + '</p>' : '') +
              '<details><summary>Request / response</summary><pre>' + escapeHtmlClient(prettyJson({ request: call.requestPayload, response: call.responsePayload })) + '</pre></details>' +
            '</article>'
          );
        }).join('');
        return renderAuditCostSection('DataForSEO / external calls', calls, rows, calls.some((call) => call.status === 'failed'));
      }

      function renderAuditScoreLogs(logs) {
        const rows = logs.map((log, index) => (
          '<article class="audit-row">' +
            '<div class="inline-meta"><strong>' + escapeHtmlClient(String(index + 1).padStart(2, '0') + '. ' + log.formulaName) + '</strong><span>' + escapeHtmlClient(prettyDate(log.createdAt)) + '</span></div>' +
            '<div class="inline-meta"><span class="mono">' + escapeHtmlClient(log.id) + '</span>' + (log.stepId ? '<span class="mono">' + escapeHtmlClient(log.stepId) + '</span>' : '') + '</div>' +
            '<details><summary>Input / result</summary><pre>' + escapeHtmlClient(prettyJson({ input: log.inputPayload, result: log.resultPayload })) + '</pre></details>' +
          '</article>'
        )).join('');
        return renderAuditSection('Score logs', logs.length, rows, false);
      }

      function renderDetail(run) {
        detachLaunchPanel();
        const manualStepFlags = getManualStepFlags(run);
        const actionContent = renderStepActionCard(run, manualStepFlags);
        const activeStepContent = renderActiveStepContent(run, manualStepFlags);
        const shouldShowArticleResultsFirst = appState.activeSeoStep === 'articleGroup'
          && (manualStepFlags.longreadDraft
            || manualStepFlags.longreadCleanup
            || manualStepFlags.longreadPackage
            || manualStepFlags.longreadAdaptations);

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
          renderAutoFlowProgress() +
          renderAutoFlowResumeCard(run, manualStepFlags) +
          (shouldShowArticleResultsFirst ? activeStepContent + actionContent : actionContent + activeStepContent) +
          renderCostReceipt(run);

        bindDetailActions(run);
      }

      function renderAutoFlowResumeCard(run, flags) {
        const isAutoRun = readRunWorkflowMode(run) === 'auto_until_selection';
        if (!isAutoRun || flags.finalBrief || appState.autoFlowLoading) {
          return '';
        }
        const nextStep = [...AUTO_FLOW_STEPS, ...AUTO_FLOW_AFTER_CLUSTER_SELECTION_STEPS].find(
          (stepConfig) => !flags[stepConfig.readyFlag],
        );
        return (
          '<section class="card full">' +
            '<div class="section-head"><div class="stack"><div class="eyebrow">Auto Workflow</div><h3>Resume Auto to Final Brief</h3></div><span class="badge">auto</span></div>' +
            '<p>' + escapeHtmlClient(nextStep ? 'Next missing step: ' + nextStep.label : 'All auto steps look complete. Refresh the run if final brief is not visible.') + '</p>' +
            '<div class="actions"><button type="button" class="primary" id="resumeAutoFlowBtn">Resume Auto to Final Brief</button></div>' +
          '</section>'
        );
      }

      function bindDetailActions(run) {
        document.querySelectorAll('[data-cluster-detail-id]').forEach((node) => {
          node.addEventListener('click', (event) => {
            const target = event.target;
            if (target instanceof HTMLElement && target.closest('.select-cluster-topic-btn')) return;
            const templateId = node.getAttribute('data-cluster-detail-id');
            if (templateId) openClusterDetailModal(templateId);
          });
        });
        qs('clusterDetailModalClose')?.addEventListener('click', closeClusterDetailModal);
        qs('clusterDetailModal')?.addEventListener('click', (event) => {
          if (event.target === qs('clusterDetailModal')) {
            closeClusterDetailModal();
          }
        });
        document.querySelectorAll('[data-seo-step]').forEach((node) => {
          node.addEventListener('click', () => {
            const nextStep = node.getAttribute('data-seo-step');
            if (!nextStep) return;
            appState.activeSeoStep = nextStep;
            updateUrl(run.id);
            renderDetail(run);
          });
        });
        qs('resumeAutoFlowBtn')?.addEventListener('click', () => {
          void runAutoFlowUntilClusterSelection(run.id);
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
            appState.keywordHypothesesLoading = false;
            appState.activeSeoStep = 'keywords';
            await loadRuns();
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
            appState.serpPreviewLoading = false;
            appState.activeSeoStep = 'serp';
            await loadRuns();
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
            appState.serpDerivedCandidatesLoading = false;
            appState.activeSeoStep = 'candidates';
            await loadRuns();
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
            appState.rankedKeywordsLoading = false;
            appState.activeSeoStep = 'rankedKeywords';
            await loadRuns();
            await selectRun(run.id, false);
          } catch (error) {
            appState.rankedKeywordsLoading = false;
            renderDetail(run);
            showToast(
              error instanceof Error ? error.message : 'Failed to build competitor keyword map',
            );
          }
        });
        const runCompetitorKeywordMatching = async (mode) => {
          if (appState.competitorMatchingLoading) return;
          const normalizedMode = mode === 'ai' ? 'ai' : 'algorithmic';
          appState.competitorMatchingMode = normalizedMode;
          appState.competitorMatchingLoading = true;
          renderDetail(run);
          if (normalizedMode === 'ai') {
            startCompetitorMatchingProgressPolling(run.id);
          }
          try {
            await fetchJson(
              '/seo-briefing/runs/' +
                encodeURIComponent(run.id) +
                '/match-competitor-keywords',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: normalizedMode }),
              },
            );
            showToast(normalizedMode === 'ai' ? 'AI competitor keyword evaluation saved' : 'Competitor keyword matching saved');
            appState.competitorMatchingLoading = false;
            stopCompetitorMatchingProgressPolling();
            appState.activeSeoStep = 'competitorMatching';
            await loadRuns();
            await selectRun(run.id, false);
          } catch (error) {
            appState.competitorMatchingLoading = false;
            stopCompetitorMatchingProgressPolling();
            try {
              const latestRun = await fetchJson('/seo-briefing/runs/' + encodeURIComponent(run.id));
              appState.selectedRun = latestRun;
              renderDetail(latestRun);
            } catch {
              renderDetail(run);
            }
            showToast(
              error instanceof Error ? error.message : 'Failed to match competitor keywords',
            );
          }
        };
        qs('matchCompetitorKeywordsAlgorithmicBtn')?.addEventListener('click', () => {
          void runCompetitorKeywordMatching('algorithmic');
        });
        qs('matchCompetitorKeywordsAiBtn')?.addEventListener('click', () => {
          void runCompetitorKeywordMatching('ai');
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
            appState.dirtyKeywordPoolLoading = false;
            appState.activeSeoStep = 'dirtyPool';
            await loadRuns();
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
            appState.candidateScoringLoading = false;
            appState.activeSeoStep = 'candidateScoring';
            await loadRuns();
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
            appState.keywordClusteringLoading = false;
            appState.activeSeoStep = 'clusters';
            await loadRuns();
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
            appState.clusterProductFitLoading = false;
            appState.activeSeoStep = 'productFit';
            await loadRuns();
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
            const autoWorkflowMode = readRunWorkflowMode(run) === 'auto_until_selection';
            showToast(autoWorkflowMode ? 'Main topic selected automatically' : 'Ranked cluster choices prepared');
            appState.clusterSelectionLoading = false;
            appState.activeSeoStep = autoWorkflowMode ? 'onPageGroup' : 'selection';
            await loadRuns();
            await selectRun(run.id, false);
            if (autoWorkflowMode) {
              void runAutoFlowToFinalBrief(run.id);
            }
          } catch (error) {
            appState.clusterSelectionLoading = false;
            renderDetail(run);
            showToast(
              error instanceof Error ? error.message : 'Failed to select SEO brief clusters',
            );
          }
        });
        document.querySelectorAll('.select-cluster-topic-btn').forEach((button) => {
          button.addEventListener('click', async (event) => {
            event.stopPropagation();
            if (appState.clusterSelectionLoading) return;
            const selectedClusterName = button.getAttribute('data-cluster-name');
            if (!selectedClusterName) return;
            const shouldContinueAutomatically = shouldAutoContinueAfterClusterSelection(run);
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
                  body: JSON.stringify({ selectedClusterName }),
                },
              );
              showToast('Main topic selected');
              appState.clusterSelectionLoading = false;
              appState.activeSeoStep = shouldContinueAutomatically ? 'onPageGroup' : 'selection';
              await loadRuns();
              await selectRun(run.id, false);
              if (shouldContinueAutomatically) {
                void runAutoFlowToFinalBrief(run.id);
              }
            } catch (error) {
              appState.clusterSelectionLoading = false;
              renderDetail(run);
              showToast(error instanceof Error ? error.message : 'Failed to select main topic');
            }
          });
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
            appState.onPageLoading = false;
            appState.activeSeoStep = 'onPage';
            await loadRuns();
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
            appState.onPageSynthesisLoading = false;
            appState.activeSeoStep = 'onPageSynthesis';
            await loadRuns();
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
            appState.finalBriefLoading = false;
            appState.activeSeoStep = 'finalBrief';
            await loadRuns();
            await selectRun(run.id, false);
          } catch (error) {
            appState.finalBriefLoading = false;
            renderDetail(run);
            showToast(
              error instanceof Error ? error.message : 'Failed to generate final SEO brief',
            );
          }
        });
        qs('saveFinalBriefEditBtn')?.addEventListener('click', async () => {
          if (appState.finalBriefEditLoading) return;
          const textarea = qs('finalBriefEditPayload');
          let briefPayload;
          try {
            briefPayload = JSON.parse(textarea?.value || '');
          } catch (error) {
            showToast('Final brief JSON is invalid');
            return;
          }

          appState.finalBriefEditLoading = true;
          renderDetail(run);
          try {
            await fetchJson(
              '/seo-briefing/runs/' +
                encodeURIComponent(run.id) +
                '/final-brief/manual-edit',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ briefPayload }),
              },
            );
            showToast('Manual final brief edit saved');
            appState.finalBriefEditLoading = false;
            appState.activeSeoStep = 'finalBrief';
            await loadRuns();
            await selectRun(run.id, false);
          } catch (error) {
            appState.finalBriefEditLoading = false;
            renderDetail(run);
            showToast(
              error instanceof Error ? error.message : 'Failed to save final brief edit',
            );
          }
        });
        qs('generateLongreadDraftBtn')?.addEventListener('click', async () => {
          if (appState.longreadDraftLoading) return;
          appState.longreadDraftLoading = true;
          renderDetail(run);
          try {
            await fetchJson(
              '/seo-briefing/runs/' +
                encodeURIComponent(run.id) +
                '/generate-longread-draft',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
              },
            );
            showToast('Longread draft generated');
            appState.longreadDraftLoading = false;
            appState.activeSeoStep = 'longreadDraft';
            await loadRuns();
            await selectRun(run.id, false);
          } catch (error) {
            appState.longreadDraftLoading = false;
            renderDetail(run);
            showToast(
              error instanceof Error ? error.message : 'Failed to generate longread draft',
            );
          }
        });
        qs('cleanupLongreadArticleBtn')?.addEventListener('click', async () => {
          if (appState.longreadCleanupLoading) return;
          appState.longreadCleanupLoading = true;
          renderDetail(run);
          try {
            await fetchJson(
              '/seo-briefing/runs/' +
                encodeURIComponent(run.id) +
                '/cleanup-longread-article',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
              },
            );
            showToast('Longread safety cleanup saved');
            appState.longreadCleanupLoading = false;
            appState.activeSeoStep = 'longreadCleanup';
            await loadRuns();
            await selectRun(run.id, false);
          } catch (error) {
            appState.longreadCleanupLoading = false;
            renderDetail(run);
            showToast(
              error instanceof Error ? error.message : 'Failed to cleanup longread article',
            );
          }
        });
        qs('packageLongreadArticleBtn')?.addEventListener('click', async () => {
          if (appState.longreadPackageLoading) return;
          appState.longreadPackageLoading = true;
          renderDetail(run);
          try {
            await fetchJson(
              '/seo-briefing/runs/' +
                encodeURIComponent(run.id) +
                '/package-longread-article',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
              },
            );
            showToast('Final article package created');
            appState.longreadPackageLoading = false;
            appState.activeSeoStep = 'longreadPackage';
            await loadRuns();
            await selectRun(run.id, false);
          } catch (error) {
            appState.longreadPackageLoading = false;
            renderDetail(run);
            showToast(
              error instanceof Error ? error.message : 'Failed to package longread article',
            );
          }
        });
        qs('createLongreadAdaptationsBtn')?.addEventListener('click', async () => {
          if (appState.longreadAdaptationsLoading) return;
          appState.longreadAdaptationsLoading = true;
          renderDetail(run);
          try {
            const markerChannels = markerPlanChannelsForRun(run);
            if (appState.markerPlan && markerChannels.length === 0) {
              appState.longreadAdaptationsLoading = false;
              renderDetail(run);
              showToast('No social adaptations needed for this marker. Use Publish to Blog.');
              return;
            }
            const result = await fetchJson(
              '/seo-briefing/runs/' +
                encodeURIComponent(run.id) +
                '/create-longread-adaptations',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  channels: markerChannels,
                }),
              },
            );
            showToast('Dashboard adaptations created for article ' + (result.articleId || ''));
            const markerScheduleResult = await autoScheduleMarkerPlanAdaptations(run, result);
            if (
              markerScheduleResult.scheduled > 0 ||
              markerScheduleResult.skipped > 0 ||
              markerScheduleResult.failed > 0
            ) {
              showToast(
                'Marker plan scheduled ' +
                  String(markerScheduleResult.scheduled) +
                  ', skipped ' +
                  String(markerScheduleResult.skipped) +
                  ', failed ' +
                  String(markerScheduleResult.failed),
              );
            }
            appState.longreadAdaptationsLoading = false;
            appState.activeSeoStep = 'articleGroup';
            await loadRuns();
            await selectRun(run.id, false);
          } catch (error) {
            appState.longreadAdaptationsLoading = false;
            renderDetail(run);
            showToast(
              error instanceof Error ? error.message : 'Failed to create dashboard adaptations',
            );
          }
        });
        document.querySelectorAll('[data-schedule-longread-adaptation]').forEach((button) => {
          button.addEventListener('click', async () => {
            const row = button.closest('[data-adaptation-schedule-row]');
            if (!row || appState.longreadPublicationLoadingId) return;
            const articleId = row.getAttribute('data-article-id') || '';
            const adaptationId = row.getAttribute('data-adaptation-id') || '';
            const channelId = row.getAttribute('data-channel-id') || '';
            const language = row.querySelector('[data-adaptation-language]')?.value?.trim() || 'en';
            const publishAtValue = row.querySelector('[data-adaptation-publish-at]')?.value || '';
            const publishAt = new Date(publishAtValue);

            if (!articleId || !adaptationId || !channelId) {
              showToast('Missing article, adaptation, or channel id');
              return;
            }
            if (Number.isNaN(publishAt.getTime())) {
              showToast('Choose a valid publication date and time');
              return;
            }
            if (publishAt.getTime() <= Date.now()) {
              showToast('Publication time must be in the future');
              return;
            }

            appState.longreadPublicationLoadingId = adaptationId;
            renderDetail(run);
            try {
              await scheduleLongreadAdaptation(
                articleId,
                adaptationId,
                channelId,
                language,
                publishAt.toISOString(),
              );
              showToast('Adaptation scheduled and sent to dashboard');
              appState.longreadPublicationLoadingId = null;
              await loadRuns();
              await selectRun(run.id, false);
            } catch (error) {
              appState.longreadPublicationLoadingId = null;
              renderDetail(run);
              showToast(error instanceof Error ? error.message : 'Failed to schedule adaptation');
            }
          });
        });
        document.querySelectorAll('[data-publish-blog-article]').forEach((button) => {
          button.addEventListener('click', async () => {
            const row = button.closest('[data-blog-publish-row]');
            if (!row || appState.blogPublishLoading) return;
            const coverImageUrl = row.querySelector('[data-blog-cover-image-url]')?.value?.trim() || '';
            const locale = row.getAttribute('data-locale') || normalizeTargetLanguage(run?.market?.language || 'en');
            appState.blogPublishLoading = true;
            renderDetail(run);
            try {
              const result = await fetchJson(
                '/seo-briefing/runs/' + encodeURIComponent(run.id) + '/publish-blog',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    coverImageUrl: coverImageUrl || null,
                    locale,
                    status: 'published',
                  }),
                },
              );
              showToast('Blog published' + (result.url ? ': ' + result.url : ''));
              appState.blogPublishLoading = false;
              await loadRuns();
              await selectRun(run.id, false);
            } catch (error) {
              appState.blogPublishLoading = false;
              renderDetail(run);
              showToast(error instanceof Error ? error.message : 'Failed to publish Blog article');
            }
          });
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
        stopCompetitorMatchingProgressPolling();
        appState.dirtyKeywordPoolLoading = false;
        appState.candidateScoringLoading = false;
        appState.keywordClusteringLoading = false;
        appState.clusterProductFitLoading = false;
        appState.clusterSelectionLoading = false;
        appState.onPageLoading = false;
        appState.onPageSynthesisLoading = false;
        appState.finalBriefLoading = false;
        appState.finalBriefEditLoading = false;
        appState.longreadDraftLoading = false;
        appState.longreadCleanupLoading = false;
        appState.longreadPackageLoading = false;
        appState.longreadAdaptationsLoading = false;
        appState.blogPublishLoading = false;
        appState.autoFlowLoading = false;
        appState.autoFlowTitle = null;
        appState.autoFlowDescription = null;
        appState.autoFlowCurrentLabel = null;
        appState.autoFlowCurrentIndex = 0;
        appState.autoFlowTotal = 0;
        appState.languageBatchItems = [];
        appState.languageBatchWorkflowMode = 'manual';
        appState.languageBatchFinalizing = false;
        clearAutoFlowStepLoading();
        appState.activeSeoStep = 'input';
        syncRunPolling(null);
        updateUrl(null);
        renderRunList();
        renderEmptyDetail();
        const batchProgress = qs('languageBatchProgress');
        if (batchProgress) {
          batchProgress.hidden = true;
          batchProgress.innerHTML = '';
        }
        qs('topicHint').focus();
        showToast('Ready for a new SEO brief');
      }

      async function createRun(event) {
        event.preventDefault();
        setLaunchStatus('Button clicked. Validating launch form...');
        if (!validateLaunchForm()) {
          setLaunchStatus('Validation stopped the launch. Check the highlighted required field.', 'error');
          return;
        }
        const launchBtn = qs('launchBtn');
        launchBtn.disabled = true;
        try {
          const workflowMode = qs('workflowMode')?.value === 'auto_until_selection'
            ? 'auto_until_selection'
            : 'manual';
          const selectedLanguages = getSelectedLanguagePresets();
          setLaunchStatus(
            selectedLanguages.length > 1
              ? 'Creating ' + String(selectedLanguages.length) + ' SEO brief runs in parallel...'
              : 'Creating one SEO brief run...',
          );
          showToast(
            selectedLanguages.length > 1
              ? 'Creating ' + String(selectedLanguages.length) + ' SEO brief runs'
              : 'Creating SEO brief run',
          );
          if (selectedLanguages.length > 1) {
            await createLanguageBatch(selectedLanguages, workflowMode);
            return;
          }
          const result = await createSeoBriefRunForLanguage(selectedLanguages[0] || SEO_BRIEF_LANGUAGE_PRESETS[0], workflowMode);
          setLaunchStatus('Run created: ' + result.runId);
          appState.selectedRunId = result.runId;
          appState.activeSeoStep = 'keywords';
          setAutoFlowRun(result.runId, workflowMode === 'auto_until_selection');
          showToast(
            workflowMode === 'auto_until_selection'
              ? 'Run created. Auto workflow will start now.'
              : result.deduplicated
                ? 'Reused recent run: ' + result.runId
                : 'Run created. Generate search hypotheses next.',
          );
          await loadRuns();
          await selectRun(result.runId);
          if (workflowMode === 'auto_until_selection') {
            void runAutoFlowUntilClusterSelection(result.runId);
          }
        } catch (error) {
          setLaunchStatus(error instanceof Error ? error.message : 'Failed to create run', 'error');
          showToast(error instanceof Error ? error.message : 'Failed to create run');
        } finally {
          launchBtn.disabled = false;
        }
      }

      function buildCreateRunPayload(language, workflowMode, country) {
        return {
          projectId: qs('projectId').value || null,
          aiModelMode: qs('aiModelMode').value,
          workflowMode,
          topicHint: qs('topicHint').value,
          hypothesesCount: Number(qs('hypothesesCount').value || '10'),
          serpEnrichmentCount: Number(qs('serpEnrichmentCount').value || '10'),
          requestTimeoutMs: Number(qs('requestTimeoutSeconds').value || '300') * 1000,
          coverImageUrl: qs('blogCoverImageUrl').value.trim() || null,
          deepSeekPricing: {
            inputUsdPerMillionTokens: Number(qs('deepSeekInputUsdPerMillionTokens').value || '0'),
            outputUsdPerMillionTokens: Number(qs('deepSeekOutputUsdPerMillionTokens').value || '0'),
          },
          market: {
            country: country || qs('country').value,
            language,
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
      }

      async function createSeoBriefRunForLanguage(language, workflowMode) {
        const preset = resolveRunLanguagePreset(language);
        return fetchJson('/seo-briefing/runs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildCreateRunPayload(preset.name, workflowMode, preset.country)),
        });
      }

      async function createLanguageBatch(languages, workflowMode) {
        appState.selectedRunId = null;
        appState.selectedRun = null;
        appState.activeSeoStep = 'input';
        updateUrl(null);
        syncRunPolling(null);
        renderEmptyDetail();
        const batchItems = languages.map((language) => ({
          code: language.code,
          country: language.country,
          label: language.label,
          name: language.name,
          runId: null,
          readyForFinalize: false,
          diagnostics: [],
          stage: 'Queued',
          status: 'queued',
          message: 'Waiting',
        }));
        appState.languageBatchItems = batchItems;
        appState.languageBatchWorkflowMode = workflowMode;
        setLaunchStatus('Language batch queued: ' + batchItems.map((item) => item.label + ' → ' + item.country).join(', '));
        renderLanguageBatchProgress();
        qs('languageBatchProgress')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        showToast('Creating ' + String(batchItems.length) + ' language runs');

        await runWithConcurrency(batchItems, 3, async (item) => {
          item.status = 'running';
          item.stage = 'Create run';
          item.message = 'Creating run';
          renderLanguageBatchProgress();
          try {
            setLaunchStatus('Sending create-run request for ' + item.label + ' → ' + item.country);
            const result = await createSeoBriefRunForLanguage(item, workflowMode);
            item.runId = result.runId;
            setLaunchStatus('Run created for ' + item.label + ': ' + result.runId);
            setAutoFlowRun(result.runId, workflowMode === 'auto_until_selection');
            item.status = workflowMode === 'auto_until_selection' ? 'running' : 'done';
            item.stage = workflowMode === 'auto_until_selection' ? 'Auto flow' : 'Run created';
            item.message = workflowMode === 'auto_until_selection'
              ? 'Running auto flow'
              : result.deduplicated
                ? 'Reused existing run'
                : 'Run created';
            renderLanguageBatchProgress();

            if (workflowMode === 'auto_until_selection') {
              await runAutoFlowHeadless(result.runId, (progress) => {
                item.stage = progress.label;
                item.message =
                  progress.status === 'skipped'
                    ? 'Skipped completed step ' + String(progress.index) + '/' + String(progress.total)
                    : 'Step ' + String(progress.index) + '/' + String(progress.total);
                renderLanguageBatchProgress();
              });
              item.readyForFinalize = true;
              item.status = 'done';
              item.stage = 'Final brief';
              item.message = 'Final brief generated';
              renderLanguageBatchProgress();
            }
          } catch (error) {
            item.status = 'failed';
            item.stage = item.stage || 'Failed';
            item.message = error instanceof Error ? error.message : 'Failed';
            renderLanguageBatchProgress();
          }
        });

        await loadRuns();
        renderLanguageBatchProgress();
        qs('languageBatchProgress')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const failedCount = batchItems.filter((item) => item.status === 'failed').length;
        showToast(failedCount > 0
          ? 'Language batch finished with ' + String(failedCount) + ' failed run(s)'
          : 'Language batch finished');
      }

      async function postRunAction(runId, path, payload = {}) {
        return fetchJson('/seo-briefing/runs/' + encodeURIComponent(runId) + path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      function setBatchItemProgress(item, stage, message, status = 'running') {
        item.stage = stage;
        item.message = message;
        item.status = status;
        renderLanguageBatchProgress();
      }

      async function finalizeLanguageBatch() {
        if (appState.languageBatchFinalizing) return;
        const items = appState.languageBatchItems.filter((item) => item.runId);
        if (!items.length) {
          showToast('No batch runs to finalize');
          return;
        }
        appState.languageBatchFinalizing = true;
        renderLanguageBatchProgress();
        try {
          await runWithConcurrency(items, 2, async (item) => {
            try {
              await finalizeLanguageBatchItem(item);
              if (item.status !== 'done') {
                setBatchItemProgress(item, 'Calendar', 'Finalized and scheduled', 'done');
              }
            } catch (error) {
              item.diagnostics = [
                error instanceof Error ? error.message : 'Failed to finalize this language',
              ];
              setBatchItemProgress(
                item,
                item.stage || 'Finalize failed',
                error instanceof Error ? error.message : 'Failed to finalize',
                'failed',
              );
            }
          });
          showToast('Batch finalization finished');
        } finally {
          appState.languageBatchFinalizing = false;
          renderLanguageBatchProgress();
          await loadRuns();
          if (appState.selectedRunId) {
            await selectRun(appState.selectedRunId, false);
          }
        }
      }

      async function finalizeLanguageBatchItem(item) {
        let run = await fetchRunSnapshot(item.runId);
        let flags = getManualStepFlags(run);
        if (!flags.longreadDraft) {
          setBatchItemProgress(item, 'Longread Draft', 'Generating longread');
          await postRunAction(item.runId, '/generate-longread-draft');
          run = await fetchRunSnapshot(item.runId);
          flags = getManualStepFlags(run);
        }
        if (!flags.longreadCleanup) {
          setBatchItemProgress(item, 'AI Review Loop', 'Reviewing and revising longread');
          await postRunAction(item.runId, '/cleanup-longread-article');
          run = await fetchRunSnapshot(item.runId);
          flags = getManualStepFlags(run);
        }
        if (!flags.longreadPackage) {
          setBatchItemProgress(item, 'Final Package', 'Packaging final article');
          await postRunAction(item.runId, '/package-longread-article');
          run = await fetchRunSnapshot(item.runId);
          flags = getManualStepFlags(run);
        }

        const socialChannels = markerPlanChannelsForRun(run);
        if (socialChannels.length > 0) {
          setBatchItemProgress(item, 'Adaptations', 'Creating dashboard adaptations');
          let adaptationResult = null;
          const existingArtifact = findArtifact(run, 'longread_adaptations_export');
          const existingAdaptations = Array.isArray(existingArtifact?.payload?.adaptations)
            ? existingArtifact.payload.adaptations
            : [];
          const existingArtifactCoversChannels = socialChannels.every((channel) =>
            existingAdaptations.some(
              (adaptation) =>
                normalizePublicationChannelId(adaptation?.channelId) === channel.channelId &&
                adaptation?.adaptationId,
            ),
          );
          if (existingArtifact?.payload?.articleId && existingArtifactCoversChannels) {
            adaptationResult = existingArtifact.payload;
          } else {
            adaptationResult = await postRunAction(item.runId, '/create-longread-adaptations', {
              channels: socialChannels,
            });
            run = await fetchRunSnapshot(item.runId);
          }
          setBatchItemProgress(item, 'Calendar', 'Scheduling marker placements');
          const scheduleResult = await autoScheduleMarkerPlanAdaptations(run, adaptationResult);
          item.diagnostics = Array.isArray(scheduleResult.details) ? scheduleResult.details : [];
          item.message =
            'Scheduled ' +
            String(scheduleResult.scheduled) +
            ', skipped ' +
            String(scheduleResult.skipped) +
            ', failed ' +
            String(scheduleResult.failed) +
            ', marker placements removed ' +
            String(scheduleResult.markerPlacementsDeleted || 0);
          item.status =
            scheduleResult.failed > 0 ||
            scheduleResult.markerCleanupFailed > 0 ||
            scheduleResult.scheduled === 0
              ? 'failed'
              : 'done';
          renderLanguageBatchProgress();
        } else if (markerPlanBlogPlacementsForRun(run).length > 0) {
          item.diagnostics = ['Blog placement found. Final package is ready, but Blog publish needs the Blog publish action and cover URL.'];
          setBatchItemProgress(item, 'Blog', 'Final package ready; publish Blog with cover URL', 'done');
        } else {
          item.diagnostics = ['No marker placements matched this language.'];
          setBatchItemProgress(item, 'Calendar', 'No marker placements for this language', 'done');
        }
      }

      async function runWithConcurrency(items, concurrency, worker) {
        let nextIndex = 0;
        const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
          while (nextIndex < items.length) {
            const item = items[nextIndex];
            nextIndex += 1;
            await worker(item);
          }
        });
        await Promise.all(workers);
      }

      function getBatchWorkflowStep(item) {
        const stage = String(item?.stage || '').toLowerCase();
        if (stage.includes('longread') || stage.includes('review') || stage.includes('package') || stage.includes('adaptation') || stage.includes('calendar') || stage.includes('blog')) {
          return 'articleGroup';
        }
        if (stage.includes('final brief') || stage.includes('final seo brief')) {
          return 'finalBrief';
        }
        if (stage.includes('onpage')) {
          return 'onPageGroup';
        }
        if (stage.includes('cluster') || stage.includes('product fit') || stage.includes('selecting')) {
          return 'clusterGroup';
        }
        if (stage.includes('competitor') || stage.includes('dirty') || stage.includes('filtering') || stage.includes('scoring')) {
          return 'competitionGroup';
        }
        if (stage.includes('serp')) {
          return 'serpGroup';
        }
        if (stage.includes('keyword') || stage.includes('hypotheses')) {
          return 'keywords';
        }
        return 'input';
      }

      function getBatchStepIndex(stepId) {
        const order = SEO_STEP_TABS.map((step) => step.id);
        const index = order.indexOf(stepId);
        return index >= 0 ? index : 0;
      }

      function renderBatchWorkflowTabs(item) {
        const activeStep = getBatchWorkflowStep(item);
        const activeIndex = getBatchStepIndex(activeStep);
        const isFinalized = item.status === 'done' && activeStep === 'articleGroup';
        return (
          '<div class="batch-step-tabs">' +
            SEO_STEP_TABS.map((step) => {
              const stepIndex = getBatchStepIndex(step.id);
              const active = step.id === activeStep;
              const ready =
                stepIndex < activeIndex ||
                (item.readyForFinalize && stepIndex <= getBatchStepIndex('finalBrief')) ||
                (isFinalized && stepIndex <= getBatchStepIndex('articleGroup'));
              const loading = item.status === 'running' && active;
              const className = [
                'seo-step-tab',
                active ? 'is-active' : '',
                ready ? 'is-ready' : '',
                loading ? 'is-loading' : '',
                step.kind === 'article' ? 'is-article' : '',
                step.kind === 'audit' ? 'is-audit' : '',
              ].filter(Boolean).join(' ');
              return (
                '<span class="' + escapeHtmlClient(className) + '">' +
                  '<span class="seo-step-dot"></span>' +
                  '<span>' + escapeHtmlClient(String(step.number) + ' ' + step.label) + '</span>' +
                '</span>'
              );
            }).join('') +
          '</div>'
        );
      }

      function renderLanguageBatchItem(item) {
        const className = [
          'batch-workflow-card',
          item.status === 'failed' ? 'is-failed' : '',
          item.status === 'done' ? 'is-done' : '',
        ].filter(Boolean).join(' ');
        const statusLabel = item.status === 'running'
          ? 'running'
          : item.status === 'done'
            ? 'done'
            : item.status === 'failed'
              ? 'failed'
              : 'queued';
        const diagnostics = Array.isArray(item.diagnostics) ? item.diagnostics.filter(Boolean) : [];
        return (
          '<section class="' + escapeHtmlClient(className) + '">' +
            '<div class="batch-workflow-head">' +
              '<div>' +
                '<div class="eyebrow">Language Workflow</div>' +
                '<h4>' + escapeHtmlClient(item.label + ' (' + item.code + ')') + '</h4>' +
                '<div class="batch-workflow-meta">' +
                  '<span>DataForSEO: ' + escapeHtmlClient(item.country) + '</span>' +
                  (item.runId ? '<span class="mono">' + escapeHtmlClient(item.runId) + '</span>' : '<span>No run yet</span>') +
                '</div>' +
              '</div>' +
              '<span class="badge">' + escapeHtmlClient(statusLabel) + '</span>' +
            '</div>' +
            renderBatchWorkflowTabs(item) +
            '<p>' + escapeHtmlClient((item.stage || statusLabel) + ' · ' + (item.message || statusLabel)) + '</p>' +
            (diagnostics.length
              ? '<details class="batch-diagnostics" open><summary>Diagnostics</summary><ul>' +
                diagnostics.map((detail) => '<li>' + escapeHtmlClient(detail) + '</li>').join('') +
                '</ul></details>'
              : '') +
          '</section>'
        );
      }

      function renderLanguageBatchProgress(items = appState.languageBatchItems, workflowMode = appState.languageBatchWorkflowMode) {
        const node = qs('languageBatchProgress');
        if (!node) return;
        if (!Array.isArray(items) || items.length === 0) {
          node.hidden = true;
          node.innerHTML = '';
          return;
        }
        const counts = {
          queued: items.filter((item) => item.status === 'queued').length,
          running: items.filter((item) => item.status === 'running').length,
          done: items.filter((item) => item.status === 'done').length,
          failed: items.filter((item) => item.status === 'failed').length,
        };
        const canFinalize =
          appState.markerPlan &&
          items.length > 0 &&
          items.every((item) => item.status === 'done' && item.runId && item.readyForFinalize);
        node.hidden = false;
        node.innerHTML =
          '<div class="inline-meta"><strong>Language batch</strong><span>' + escapeHtmlClient(workflowMode === 'auto_until_selection' ? 'auto to final brief' : 'create runs only') + '</span></div>' +
          '<p>' + escapeHtmlClient(String(counts.running) + ' running / ' + String(counts.queued) + ' queued / ' + String(counts.done) + ' done / ' + String(counts.failed) + ' failed') + '</p>' +
          '<div class="batch-progress-list">' + items.map(renderLanguageBatchItem).join('') + '</div>' +
          (canFinalize
            ? '<div class="actions"><button type="button" class="primary ' + escapeHtmlClient(appState.languageBatchFinalizing ? 'is-loading' : '') + '" id="finalizeLanguageBatchBtn" ' + (appState.languageBatchFinalizing ? 'disabled' : '') + '>' + escapeHtmlClient(appState.languageBatchFinalizing ? 'Finalizing...' : 'Finalize all + send marker publications to calendar') + '</button></div>'
            : appState.markerPlan
              ? '<p class="muted">Finalize button appears when every language reaches final brief.</p>'
              : '<p class="muted">Calendar scheduling requires launching from a marker plan.</p>');
      }

      function bindLaunchFormActions() {
        const launchForm = qs('launchForm');
        if (!launchForm || launchForm.dataset.bound === 'true') {
          return;
        }
        launchForm.dataset.bound = 'true';
        launchForm.addEventListener('submit', createRun);
        qs('launchBtn')?.addEventListener('click', (event) => {
          event.preventDefault();
          void createRun(event);
        });
        document.addEventListener('click', (event) => {
          const target = event.target;
          if (target instanceof HTMLElement && target.closest('#finalizeLanguageBatchBtn')) {
            event.preventDefault();
            void finalizeLanguageBatch();
          }
        });
        qs('balanceSlider')?.addEventListener('input', syncBalanceSlider);
        document.querySelectorAll('input[name="inputMode"]').forEach((input) => {
          input.addEventListener('change', syncInputMode);
        });
        document.querySelectorAll('input[name="aiModelModeChoice"]').forEach((input) => {
          input.addEventListener('change', syncAiModelMode);
        });
        document.querySelectorAll('[data-workflow-mode-option]').forEach((option) => {
          option.addEventListener('click', () => {
            const value = option.getAttribute('data-workflow-mode-option') === 'auto_until_selection'
              ? 'auto_until_selection'
              : 'manual';
            const input = document.querySelector('input[name="workflowModeChoice"][value="' + value + '"]');
            if (input) {
              input.checked = true;
            }
            syncWorkflowMode();
          });
        });
        document.querySelectorAll('input[name="workflowModeChoice"]').forEach((input) => {
          input.addEventListener('change', syncWorkflowMode);
        });
        qs('language')?.addEventListener('change', syncCountryFromSelectedLanguages);
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
        qs('projectId')?.addEventListener('change', () => {
          if (appState.markerPlan && qs('projectId')?.value !== appState.markerPlan.projectId) {
            appState.markerPlan = null;
            qs('campaignContext').value = '';
            renderMarkerPlanContext();
            updateUrl(appState.selectedRunId);
          }
          fillFromBrandMemory({ silent: true }).catch(() => undefined);
        });
        qs('fillFromBrandMemoryBtn')?.addEventListener('click', () => {
          fillFromBrandMemory().catch((error) => {
            showToast(error instanceof Error ? error.message : 'Failed to load Brand Memory');
          });
        });
      }

      async function boot() {
        bindLaunchFormActions();
        renderLaunchPromptInventory();
        qs('startNewRunBtn').addEventListener('click', startNewRun);
        qs('runLibraryBtn')?.addEventListener('click', () => {
          setRunLibraryOpen(Boolean(qs('runLibraryPanel')?.hidden));
        });
        syncBalanceSlider();
        syncInputMode();
        syncAiModelMode();
        syncWorkflowMode();
        syncCountryFromSelectedLanguages();
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
        await applyMarkerPlanFromInitialState();
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
