import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { uatChecklist } from '../index.js';
import { EventEmitter } from 'node:events';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'uat-mid-'));
}

function createMockServer() {
  const middlewareHandlers: Array<{ path: string; handler: Function }> = [];
  const httpServer = new EventEmitter();

  return {
    middlewares: {
      use(path: string, handler: Function) {
        middlewareHandlers.push({ path, handler });
      },
    },
    ws: {
      send: vi.fn(),
    },
    httpServer,
    _handlers: middlewareHandlers,
    getHandler(path: string) {
      return middlewareHandlers.find(h => h.path === path)?.handler;
    },
  };
}

function createMockResponse() {
  const headers: Record<string, string> = {};
  let statusCode = 200;
  let body = '';
  return {
    setHeader(key: string, val: string) { headers[key] = val; },
    end(data?: string) { body = data ?? ''; },
    get statusCode() { return statusCode; },
    set statusCode(v: number) { statusCode = v; },
    _headers: headers,
    _body: () => body,
  };
}

describe('configureServer middleware', () => {
  it('serves checklist data as JSON from the data endpoint', () => {
    const dir = makeTmpDir();
    const yamlContent = `release: "1.0.0"
title: Test
sections:
  - name: Auth
    items:
      - text: Login works
`;
    fs.writeFileSync(path.join(dir, 'uat-checklist.yaml'), yamlContent);

    const plugin = uatChecklist() as any;
    plugin.configResolved({ root: dir });

    const server = createMockServer();
    plugin.configureServer(server);

    const handler = server.getHandler('/__uat-checklist/data');
    expect(handler).toBeDefined();

    const res = createMockResponse();
    handler!({}, res);

    expect(res._headers['Content-Type']).toBe('application/json');
    const data = JSON.parse(res._body());
    expect(data.release).toBe('1.0.0');
    expect(data.title).toBe('Test');
    expect(data.sections[0].items[0].text).toBe('Login works');
  });

  it('returns error JSON when no checklist file exists', () => {
    const dir = makeTmpDir();
    const plugin = uatChecklist() as any;

    // Suppress the warning
    const origWarn = console.warn;
    console.warn = () => {};
    plugin.configResolved({ root: dir });
    console.warn = origWarn;

    const server = createMockServer();
    plugin.configureServer(server);

    const handler = server.getHandler('/__uat-checklist/data');
    const res = createMockResponse();
    handler!({}, res);

    const data = JSON.parse(res._body());
    expect(data.error).toContain('No checklist file found');
    expect(data.sections).toEqual([]);
  });

  it('returns 500 when checklist file has invalid content', () => {
    const dir = makeTmpDir();
    // Write invalid JSON to a .json file
    fs.writeFileSync(path.join(dir, 'uat-checklist.json'), '{invalid json!!!');

    const plugin = uatChecklist() as any;
    plugin.configResolved({ root: dir });

    const server = createMockServer();
    plugin.configureServer(server);

    const handler = server.getHandler('/__uat-checklist/data');
    const res = createMockResponse();
    handler!({}, res);

    expect(res.statusCode).toBe(500);
    const data = JSON.parse(res._body());
    expect(data.error).toBeDefined();
  });

  it('sets up file watcher when checklist path exists', () => {
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, 'uat-checklist.yaml'), 'sections: []');

    const plugin = uatChecklist() as any;
    plugin.configResolved({ root: dir });

    const watchSpy = vi.spyOn(fs, 'watchFile');
    const server = createMockServer();
    plugin.configureServer(server);

    expect(watchSpy).toHaveBeenCalled();
    const watchPath = watchSpy.mock.calls[0][0] as string;
    expect(watchPath).toBe(path.join(dir, 'uat-checklist.yaml'));

    // Cleanup
    fs.unwatchFile(watchPath);
    watchSpy.mockRestore();
  });

  it('unwatches file on server close', () => {
    const dir = makeTmpDir();
    const checklistPath = path.join(dir, 'uat-checklist.yaml');
    fs.writeFileSync(checklistPath, 'sections: []');

    const plugin = uatChecklist() as any;
    plugin.configResolved({ root: dir });

    const unwatchSpy = vi.spyOn(fs, 'unwatchFile');
    const server = createMockServer();
    plugin.configureServer(server);

    // Simulate server close
    server.httpServer.emit('close');

    expect(unwatchSpy).toHaveBeenCalledWith(checklistPath);
    unwatchSpy.mockRestore();
  });
});
