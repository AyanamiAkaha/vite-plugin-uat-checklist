import { describe, it, expect } from 'vitest';
import { uatChecklist } from '../index.js';
import type { Plugin } from 'vite';

describe('uatChecklist plugin', () => {
  it('returns a plugin with the correct name', () => {
    const plugin = uatChecklist() as Plugin & Record<string, unknown>;
    expect(plugin.name).toBe('vite-plugin-uat-checklist');
  });

  it('only applies during dev (serve)', () => {
    const plugin = uatChecklist() as Plugin & Record<string, unknown>;
    expect(plugin.apply).toBe('serve');
  });

  it('has configResolved, configureServer, and transformIndexHtml hooks', () => {
    const plugin = uatChecklist() as Plugin & Record<string, unknown>;
    expect(typeof plugin.configResolved).toBe('function');
    expect(typeof plugin.configureServer).toBe('function');
    expect(typeof plugin.transformIndexHtml).toBe('function');
  });

  it('accepts default options without error', () => {
    expect(() => uatChecklist()).not.toThrow();
  });

  it('accepts all option fields', () => {
    expect(() =>
      uatChecklist({
        checklist: 'custom.yaml',
        position: 'left',
        width: 500,
        collapsed: true,
      })
    ).not.toThrow();
  });

  it('transformIndexHtml returns script tags for body injection', () => {
    const plugin = uatChecklist({ position: 'left', width: 400, collapsed: true });
    // Need to call configResolved first to set up root
    const configResolved = (plugin as any).configResolved;
    configResolved({ root: '/tmp' });

    const transform = (plugin as any).transformIndexHtml;
    const tags = transform();
    expect(tags).toHaveLength(1);
    expect(tags[0].tag).toBe('script');
    expect(tags[0].attrs.type).toBe('module');
    expect(tags[0].injectTo).toBe('body');
    expect(tags[0].children).toContain("const POSITION = 'left'");
    expect(tags[0].children).toContain('const WIDTH = 400');
    expect(tags[0].children).toContain('const START_COLLAPSED = true');
  });

  it('configResolved warns when no checklist file is found', () => {
    const plugin = uatChecklist();
    const warnings: string[] = [];
    const origWarn = console.warn;
    console.warn = (...args: unknown[]) => warnings.push(String(args[0]));
    try {
      (plugin as any).configResolved({ root: '/nonexistent/path/for/test' });
      expect(warnings.some(w => w.includes('[uat-checklist]'))).toBe(true);
    } finally {
      console.warn = origWarn;
    }
  });
});
