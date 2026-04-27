import type { Plugin, ViteDevServer } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { getOverlayHtml } from './overlay.js';

export interface UatChecklistItem {
  text: string;
  route?: string;
  notes?: string;
}

export interface UatChecklistSection {
  name: string;
  items: UatChecklistItem[];
}

export interface UatChecklist {
  release?: string;
  title?: string;
  sections: UatChecklistSection[];
}

export interface UatChecklistOptions {
  /** Path to checklist file relative to project root. Supports .yaml, .yml, .json, .md */
  checklist?: string;
  /** Which side to pin the panel. Default: 'right' */
  position?: 'left' | 'right';
  /** Default panel width in px. Default: 360 */
  width?: number;
  /** Start collapsed. Default: false */
  collapsed?: boolean;
}

export const DEFAULT_FILENAMES = [
  'uat-checklist.yaml',
  'uat-checklist.yml',
  'uat-checklist.json',
  'uat-checklist.md',
];

export function resolveChecklistPath(root: string, explicit?: string): string | null {
  if (explicit) {
    const abs = path.resolve(root, explicit);
    return fs.existsSync(abs) ? abs : null;
  }
  for (const name of DEFAULT_FILENAMES) {
    const abs = path.resolve(root, name);
    if (fs.existsSync(abs)) return abs;
  }
  return null;
}

export function parseMarkdownChecklist(content: string): UatChecklist {
  const lines = content.split('\n');
  const sections: UatChecklistSection[] = [];
  let current: UatChecklistSection | null = null;
  let title: string | undefined;

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.+)/);
    if (h1) {
      title = h1[1].trim();
      continue;
    }

    const heading = line.match(/^#{2,}\s+(.+)/);
    if (heading) {
      current = { name: heading[1].trim(), items: [] };
      sections.push(current);
      continue;
    }

    const item = line.match(/^[-*]\s+\[[ x]?\]\s+(.+)/i);
    if (item && current) {
      const text = item[1].trim();
      // Extract route hint if present: `(route: /path)`
      const routeMatch = text.match(/\(route:\s*(\S+)\)/);
      const cleanText = text.replace(/\s*\(route:\s*\S+\)/, '').trim();
      current.items.push({
        text: cleanText,
        ...(routeMatch ? { route: routeMatch[1] } : {}),
      });
      continue;
    }

    // Also support plain list items without checkbox syntax
    const plainItem = line.match(/^[-*]\s+(?!\[)(.+)/);
    if (plainItem && current) {
      const text = plainItem[1].trim();
      const routeMatch = text.match(/\(route:\s*(\S+)\)/);
      const cleanText = text.replace(/\s*\(route:\s*\S+\)/, '').trim();
      current.items.push({
        text: cleanText,
        ...(routeMatch ? { route: routeMatch[1] } : {}),
      });
    }
  }

  // If no sections found but there are items at top level, wrap them
  if (sections.length === 0) {
    // Re-parse without requiring headings
    current = { name: 'General', items: [] };
    for (const line of lines) {
      const item = line.match(/^[-*]\s+(?:\[[ x]?\]\s+)?(.+)/i);
      if (item) {
        const text = item[1].trim();
        const routeMatch = text.match(/\(route:\s*(\S+)\)/);
        const cleanText = text.replace(/\s*\(route:\s*\S+\)/, '').trim();
        current.items.push({
          text: cleanText,
          ...(routeMatch ? { route: routeMatch[1] } : {}),
        });
      }
    }
    if (current.items.length > 0) sections.push(current);
  }

  return { title, sections };
}

export function parseChecklistFile(filePath: string): UatChecklist {
  const content = fs.readFileSync(filePath, 'utf-8');
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.json') {
    return JSON.parse(content) as UatChecklist;
  }
  if (ext === '.yaml' || ext === '.yml') {
    return parseYaml(content) as UatChecklist;
  }
  if (ext === '.md') {
    return parseMarkdownChecklist(content);
  }
  throw new Error(`Unsupported checklist format: ${ext}`);
}

export function uatChecklist(options: UatChecklistOptions = {}): Plugin {
  const {
    position = 'right',
    width = 360,
    collapsed = false,
  } = options;

  let root = '';
  let checklistPath: string | null = null;
  let server: ViteDevServer | null = null;

  return {
    name: 'vite-plugin-uat-checklist',
    apply: 'serve', // dev only — never runs in production build

    configResolved(config) {
      root = config.root;
      checklistPath = resolveChecklistPath(root, options.checklist);
      if (!checklistPath) {
        console.warn(
          '[uat-checklist] No checklist file found. Create uat-checklist.yaml in your project root.'
        );
      }
    },

    configureServer(srv) {
      server = srv;

      // API endpoint to get checklist data
      srv.middlewares.use('/__uat-checklist/data', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');

        if (!checklistPath || !fs.existsSync(checklistPath)) {
          res.end(JSON.stringify({ error: 'No checklist file found', sections: [] }));
          return;
        }

        try {
          const data = parseChecklistFile(checklistPath);
          res.end(JSON.stringify(data));
        } catch (e: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
      });

      // Watch checklist file for changes and notify via HMR
      if (checklistPath) {
        const watchPath = checklistPath;
        fs.watchFile(watchPath, { interval: 500 }, () => {
          try {
            const data = parseChecklistFile(watchPath);
            srv.ws.send({
              type: 'custom',
              event: 'uat-checklist:update',
              data,
            });
          } catch {
            // parse error — ignore, user is mid-edit
          }
        });

        // Cleanup on server close
        srv.httpServer?.on('close', () => {
          fs.unwatchFile(watchPath);
        });
      }
    },

    transformIndexHtml() {
      // Inject the overlay script and styles into the page
      return [
        {
          tag: 'script',
          attrs: { type: 'module' },
          children: getOverlayHtml({ position, width, collapsed }),
          injectTo: 'body',
        },
      ];
    },
  };
}
