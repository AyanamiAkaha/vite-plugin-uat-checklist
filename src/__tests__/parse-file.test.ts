import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { parseChecklistFile } from '../index.js';

function writeTmpFile(name: string, content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'uat-test-'));
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('parseChecklistFile', () => {
  it('parses a JSON checklist file', () => {
    const data = {
      release: '1.0.0',
      title: 'JSON Test',
      sections: [
        { name: 'Auth', items: [{ text: 'Login', route: '/login' }] },
      ],
    };
    const filePath = writeTmpFile('checklist.json', JSON.stringify(data));
    const result = parseChecklistFile(filePath);
    expect(result.release).toBe('1.0.0');
    expect(result.title).toBe('JSON Test');
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].items[0].text).toBe('Login');
  });

  it('parses a YAML checklist file', () => {
    const yaml = `release: "2.0.0"
title: "YAML Test"
sections:
  - name: Dashboard
    items:
      - text: Charts load
        route: /dashboard
        notes: Check performance
`;
    const filePath = writeTmpFile('checklist.yaml', yaml);
    const result = parseChecklistFile(filePath);
    expect(result.release).toBe('2.0.0');
    expect(result.title).toBe('YAML Test');
    expect(result.sections[0].name).toBe('Dashboard');
    expect(result.sections[0].items[0]).toEqual({
      text: 'Charts load',
      route: '/dashboard',
      notes: 'Check performance',
    });
  });

  it('parses a .yml file the same as .yaml', () => {
    const yaml = `sections:
  - name: Test
    items:
      - text: Item
`;
    const filePath = writeTmpFile('checklist.yml', yaml);
    const result = parseChecklistFile(filePath);
    expect(result.sections).toHaveLength(1);
  });

  it('parses a markdown checklist file', () => {
    const md = `# MD Test

## Section
- [ ] Item one (route: /page)
`;
    const filePath = writeTmpFile('checklist.md', md);
    const result = parseChecklistFile(filePath);
    expect(result.title).toBe('MD Test');
    expect(result.sections[0].items[0].text).toBe('Item one');
    expect(result.sections[0].items[0].route).toBe('/page');
  });

  it('throws for unsupported file extensions', () => {
    const filePath = writeTmpFile('checklist.txt', 'hello');
    expect(() => parseChecklistFile(filePath)).toThrow('Unsupported checklist format: .txt');
  });
});
