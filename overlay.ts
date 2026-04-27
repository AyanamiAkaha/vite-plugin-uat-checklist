interface OverlayOptions {
  position: 'left' | 'right';
  width: number;
  collapsed: boolean;
}

export function getOverlayHtml(opts: OverlayOptions): string {
  return `
(function() {
  const POSITION = '${opts.position}';
  const WIDTH = ${opts.width};
  const START_COLLAPSED = ${opts.collapsed};
  const STORAGE_PREFIX = 'uat-checklist:';

  // --- Host element + Shadow DOM ---
  const host = document.createElement('div');
  host.id = 'uat-checklist-host';
  host.style.cssText = 'position:fixed;top:0;' + POSITION + ':0;z-index:2147483647;height:100vh;pointer-events:none;';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'closed' });

  // --- Styles ---
  const style = document.createElement('style');
  style.textContent = \`
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=DM+Sans:wght@400;500;600&display=swap');

    :host { all: initial; }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .uat-panel {
      position: fixed;
      top: 0;
      \${POSITION}: 0;
      width: \${WIDTH}px;
      height: 100vh;
      background: #0f1117;
      border-\${POSITION === 'right' ? 'left' : 'right'}: 1px solid #1e2130;
      font-family: 'DM Sans', system-ui, sans-serif;
      color: #c4c8d8;
      display: flex;
      flex-direction: column;
      pointer-events: auto;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: \${POSITION === 'right' ? '-' : ''}8px 0 32px rgba(0,0,0,0.4);
    }

    .uat-panel.collapsed {
      transform: translateX(\${POSITION === 'right' ? '' : '-'}100%);
    }

    .uat-toggle {
      position: fixed;
      top: 12px;
      \${POSITION}: 12px;
      width: 36px;
      height: 36px;
      background: #1a1d2e;
      border: 1px solid #2a2e42;
      border-radius: 8px;
      color: #7c83a1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
      transition: all 0.2s ease;
      z-index: 1;
      font-size: 16px;
    }

    .uat-toggle:hover {
      background: #252940;
      color: #a8afc8;
      border-color: #3d4260;
    }

    .uat-panel:not(.collapsed) ~ .uat-toggle {
      \${POSITION}: \${WIDTH + 12}px;
    }

    /* Header */
    .uat-header {
      padding: 16px 20px;
      border-bottom: 1px solid #1e2130;
      flex-shrink: 0;
    }

    .uat-title {
      font-size: 13px;
      font-weight: 600;
      color: #e2e5f0;
      letter-spacing: 0.03em;
      margin-bottom: 4px;
    }

    .uat-release {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #5a6080;
    }

    .uat-progress-bar {
      margin-top: 12px;
      height: 3px;
      background: #1a1d2e;
      border-radius: 2px;
      overflow: hidden;
    }

    .uat-progress-fill {
      height: 100%;
      background: #4ade80;
      border-radius: 2px;
      transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .uat-progress-text {
      margin-top: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #5a6080;
    }

    /* Scrollable body */
    .uat-body {
      flex: 1;
      overflow-y: auto;
      padding: 8px 0;
      scrollbar-width: thin;
      scrollbar-color: #2a2e42 transparent;
    }

    .uat-body::-webkit-scrollbar { width: 5px; }
    .uat-body::-webkit-scrollbar-track { background: transparent; }
    .uat-body::-webkit-scrollbar-thumb { background: #2a2e42; border-radius: 3px; }

    /* Sections */
    .uat-section { margin-bottom: 4px; }

    .uat-section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 20px;
      cursor: pointer;
      user-select: none;
      transition: background 0.15s;
    }

    .uat-section-header:hover { background: #151722; }

    .uat-section-arrow {
      font-size: 10px;
      color: #3d4260;
      transition: transform 0.2s;
      flex-shrink: 0;
    }

    .uat-section.open .uat-section-arrow { transform: rotate(90deg); }

    .uat-section-name {
      font-size: 11px;
      font-weight: 600;
      color: #8890ad;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      flex: 1;
    }

    .uat-section-count {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: #3d4260;
    }

    .uat-section-items {
      display: none;
      padding: 0 12px 8px 20px;
    }

    .uat-section.open .uat-section-items { display: block; }

    /* Items */
    .uat-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 6px 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .uat-item:hover { background: #151722; }

    .uat-checkbox {
      width: 16px;
      height: 16px;
      border: 1.5px solid #2a2e42;
      border-radius: 4px;
      flex-shrink: 0;
      margin-top: 1px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      background: transparent;
    }

    .uat-item.checked .uat-checkbox {
      background: #4ade80;
      border-color: #4ade80;
    }

    .uat-checkmark {
      display: none;
      color: #0f1117;
      font-size: 10px;
      font-weight: 700;
    }

    .uat-item.checked .uat-checkmark { display: block; }

    .uat-item-content { flex: 1; min-width: 0; }

    .uat-item-text {
      font-size: 13px;
      line-height: 1.4;
      color: #c4c8d8;
      transition: color 0.2s;
    }

    .uat-item.checked .uat-item-text {
      color: #4a5070;
      text-decoration: line-through;
      text-decoration-color: #2a2e42;
    }

    .uat-item-route {
      display: inline-block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: #6366f1;
      margin-top: 2px;
      text-decoration: none;
      opacity: 0.7;
      transition: opacity 0.15s;
    }

    .uat-item-route:hover { opacity: 1; text-decoration: underline; }

    .uat-item-notes {
      font-size: 11px;
      color: #5a6080;
      margin-top: 2px;
      font-style: italic;
    }

    /* Footer */
    .uat-footer {
      padding: 12px 20px;
      border-top: 1px solid #1e2130;
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }

    .uat-btn {
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 11px;
      font-weight: 500;
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid #2a2e42;
      background: #1a1d2e;
      color: #8890ad;
      cursor: pointer;
      transition: all 0.15s;
    }

    .uat-btn:hover {
      background: #252940;
      color: #a8afc8;
      border-color: #3d4260;
    }

    .uat-btn.danger:hover {
      background: #2a1520;
      color: #f87171;
      border-color: #5a2030;
    }

    /* Empty state */
    .uat-empty {
      padding: 40px 20px;
      text-align: center;
    }

    .uat-empty-icon {
      font-size: 32px;
      margin-bottom: 12px;
      opacity: 0.3;
    }

    .uat-empty-text {
      font-size: 13px;
      color: #5a6080;
      line-height: 1.5;
    }

    .uat-empty-code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      background: #1a1d2e;
      padding: 2px 6px;
      border-radius: 4px;
      color: #6366f1;
    }
  \`;

  shadow.appendChild(style);

  // --- State ---
  let checklist = null;
  let isCollapsed = START_COLLAPSED;

  function storageKey() {
    const rel = checklist?.release || 'default';
    const title = checklist?.title || 'uat';
    return STORAGE_PREFIX + title + ':' + rel;
  }

  function loadCheckedState() {
    try {
      const raw = localStorage.getItem(storageKey());
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }

  function saveCheckedState(state) {
    try {
      localStorage.setItem(storageKey(), JSON.stringify(state));
    } catch {}
  }

  // --- Render ---
  function render() {
    // Clear shadow (except style)
    const existing = shadow.querySelectorAll(':not(style)');
    existing.forEach(el => el.remove());

    // Toggle button
    const toggle = document.createElement('button');
    toggle.className = 'uat-toggle';
    toggle.innerHTML = POSITION === 'right' ? '☰' : '☰';
    toggle.title = 'Toggle UAT Checklist';
    toggle.onclick = () => {
      isCollapsed = !isCollapsed;
      panel.classList.toggle('collapsed', isCollapsed);
    };
    shadow.appendChild(toggle);

    // Panel
    const panel = document.createElement('div');
    panel.className = 'uat-panel' + (isCollapsed ? ' collapsed' : '');
    shadow.appendChild(panel);

    if (!checklist || !checklist.sections || checklist.sections.length === 0) {
      panel.innerHTML = \`
        <div class="uat-header">
          <div class="uat-title">UAT Checklist</div>
        </div>
        <div class="uat-empty">
          <div class="uat-empty-icon">📋</div>
          <div class="uat-empty-text">
            No checklist found.<br><br>
            Create <span class="uat-empty-code">uat-checklist.yaml</span><br>
            in your project root.
          </div>
        </div>
      \`;
      return;
    }

    const checked = loadCheckedState();

    // Count totals
    let totalItems = 0;
    let totalChecked = 0;
    checklist.sections.forEach((s, si) => {
      s.items.forEach((_, ii) => {
        totalItems++;
        if (checked[si + ':' + ii]) totalChecked++;
      });
    });

    const pct = totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : 0;

    // Header
    const header = document.createElement('div');
    header.className = 'uat-header';
    header.innerHTML = \`
      <div class="uat-title">\${checklist.title || 'UAT Checklist'}</div>
      \${checklist.release ? '<div class="uat-release">v' + checklist.release + '</div>' : ''}
      <div class="uat-progress-bar"><div class="uat-progress-fill" style="width:\${pct}%"></div></div>
      <div class="uat-progress-text">\${totalChecked}/\${totalItems} completed · \${pct}%</div>
    \`;
    panel.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'uat-body';
    panel.appendChild(body);

    checklist.sections.forEach((section, si) => {
      const sec = document.createElement('div');
      sec.className = 'uat-section open';

      const sectionChecked = section.items.filter((_, ii) => checked[si + ':' + ii]).length;

      const secHeader = document.createElement('div');
      secHeader.className = 'uat-section-header';
      secHeader.innerHTML = \`
        <span class="uat-section-arrow">▶</span>
        <span class="uat-section-name">\${section.name}</span>
        <span class="uat-section-count">\${sectionChecked}/\${section.items.length}</span>
      \`;
      secHeader.onclick = () => sec.classList.toggle('open');
      sec.appendChild(secHeader);

      const itemsDiv = document.createElement('div');
      itemsDiv.className = 'uat-section-items';

      section.items.forEach((item, ii) => {
        const key = si + ':' + ii;
        const isChecked = !!checked[key];

        const el = document.createElement('div');
        el.className = 'uat-item' + (isChecked ? ' checked' : '');

        let routeHtml = '';
        if (item.route) {
          routeHtml = '<a class="uat-item-route" href="' + item.route + '">→ ' + item.route + '</a>';
        }

        let notesHtml = '';
        if (item.notes) {
          notesHtml = '<div class="uat-item-notes">' + item.notes + '</div>';
        }

        el.innerHTML = \`
          <div class="uat-checkbox"><span class="uat-checkmark">✓</span></div>
          <div class="uat-item-content">
            <div class="uat-item-text">\${item.text}</div>
            \${routeHtml}
            \${notesHtml}
          </div>
        \`;

        el.onclick = (e) => {
          if (e.target.closest('.uat-item-route')) return; // let link navigate
          checked[key] = !checked[key];
          saveCheckedState(checked);
          render();
        };

        itemsDiv.appendChild(el);
      });

      sec.appendChild(itemsDiv);
      body.appendChild(sec);
    });

    // Footer
    const footer = document.createElement('div');
    footer.className = 'uat-footer';

    const resetBtn = document.createElement('button');
    resetBtn.className = 'uat-btn danger';
    resetBtn.textContent = 'Reset all';
    resetBtn.onclick = () => {
      if (confirm('Reset all UAT checklist items?')) {
        saveCheckedState({});
        render();
      }
    };

    const collapseAllBtn = document.createElement('button');
    collapseAllBtn.className = 'uat-btn';
    collapseAllBtn.textContent = 'Collapse all';
    collapseAllBtn.onclick = () => {
      body.querySelectorAll('.uat-section').forEach(s => s.classList.remove('open'));
    };

    const expandAllBtn = document.createElement('button');
    expandAllBtn.className = 'uat-btn';
    expandAllBtn.textContent = 'Expand all';
    expandAllBtn.onclick = () => {
      body.querySelectorAll('.uat-section').forEach(s => s.classList.add('open'));
    };

    footer.appendChild(resetBtn);
    footer.appendChild(collapseAllBtn);
    footer.appendChild(expandAllBtn);
    panel.appendChild(footer);
  }

  // --- Fetch + HMR ---
  async function loadChecklist() {
    try {
      const res = await fetch('/__uat-checklist/data');
      checklist = await res.json();
    } catch (e) {
      console.warn('[uat-checklist] Failed to load:', e);
      checklist = null;
    }
    render();
  }

  // Listen for HMR updates
  if (import.meta.hot) {
    import.meta.hot.on('uat-checklist:update', (data) => {
      checklist = data;
      render();
    });
  }

  loadChecklist();
})();
`;
}
