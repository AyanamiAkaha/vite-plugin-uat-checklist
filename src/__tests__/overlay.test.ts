import { describe, it, expect } from 'vitest';
import { getOverlayHtml } from '../overlay.js';

describe('getOverlayHtml', () => {
  it('returns a string containing an IIFE', () => {
    const html = getOverlayHtml({ position: 'right', width: 360, collapsed: false });
    expect(html).toContain('(function()');
    expect(html).toContain('})();');
  });

  it('embeds the position option', () => {
    const html = getOverlayHtml({ position: 'left', width: 400, collapsed: false });
    expect(html).toContain("const POSITION = 'left'");
  });

  it('embeds the width option', () => {
    const html = getOverlayHtml({ position: 'right', width: 500, collapsed: true });
    expect(html).toContain('const WIDTH = 500');
  });

  it('embeds the collapsed option', () => {
    const collapsed = getOverlayHtml({ position: 'right', width: 360, collapsed: true });
    expect(collapsed).toContain('const START_COLLAPSED = true');

    const expanded = getOverlayHtml({ position: 'right', width: 360, collapsed: false });
    expect(expanded).toContain('const START_COLLAPSED = false');
  });

  it('includes Shadow DOM setup', () => {
    const html = getOverlayHtml({ position: 'right', width: 360, collapsed: false });
    expect(html).toContain('attachShadow');
  });

  it('includes localStorage persistence logic', () => {
    const html = getOverlayHtml({ position: 'right', width: 360, collapsed: false });
    expect(html).toContain('localStorage');
    expect(html).toContain('uat-checklist:');
  });

  it('includes HMR listener', () => {
    const html = getOverlayHtml({ position: 'right', width: 360, collapsed: false });
    expect(html).toContain('import.meta.hot');
    expect(html).toContain('uat-checklist:update');
  });

  it('includes the esc() HTML sanitization function', () => {
    const html = getOverlayHtml({ position: 'right', width: 360, collapsed: false });
    expect(html).toContain('function esc(');
    // Verify esc is used on user content
    expect(html).toContain('esc(checklist.title');
    expect(html).toContain('esc(checklist.release)');
    expect(html).toContain('esc(section.name)');
    expect(html).toContain('esc(item.text)');
    expect(html).toContain('esc(item.route)');
    expect(html).toContain('esc(item.notes)');
  });

  it('fetches from /__uat-checklist/data endpoint', () => {
    const html = getOverlayHtml({ position: 'right', width: 360, collapsed: false });
    expect(html).toContain('/__uat-checklist/data');
  });

  it('includes CSS styles within the script', () => {
    const html = getOverlayHtml({ position: 'right', width: 360, collapsed: false });
    expect(html).toContain('.uat-panel');
    expect(html).toContain('.uat-toggle');
    expect(html).toContain('.uat-checkbox');
  });
});
