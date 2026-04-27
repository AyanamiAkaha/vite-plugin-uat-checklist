import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { resolveChecklistPath, DEFAULT_FILENAMES } from '../index.js';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'uat-resolve-'));
}

describe('resolveChecklistPath', () => {
  it('returns null when no checklist file exists and none specified', () => {
    const dir = makeTmpDir();
    expect(resolveChecklistPath(dir)).toBeNull();
  });

  it('finds uat-checklist.yaml by default', () => {
    const dir = makeTmpDir();
    const target = path.join(dir, 'uat-checklist.yaml');
    fs.writeFileSync(target, 'sections: []');
    expect(resolveChecklistPath(dir)).toBe(target);
  });

  it('finds uat-checklist.yml when .yaml does not exist', () => {
    const dir = makeTmpDir();
    const target = path.join(dir, 'uat-checklist.yml');
    fs.writeFileSync(target, 'sections: []');
    expect(resolveChecklistPath(dir)).toBe(target);
  });

  it('finds uat-checklist.json when .yaml and .yml do not exist', () => {
    const dir = makeTmpDir();
    const target = path.join(dir, 'uat-checklist.json');
    fs.writeFileSync(target, '{"sections":[]}');
    expect(resolveChecklistPath(dir)).toBe(target);
  });

  it('finds uat-checklist.md as last priority', () => {
    const dir = makeTmpDir();
    const target = path.join(dir, 'uat-checklist.md');
    fs.writeFileSync(target, '# UAT');
    expect(resolveChecklistPath(dir)).toBe(target);
  });

  it('prefers .yaml over .yml when both exist', () => {
    const dir = makeTmpDir();
    const yamlPath = path.join(dir, 'uat-checklist.yaml');
    const ymlPath = path.join(dir, 'uat-checklist.yml');
    fs.writeFileSync(yamlPath, 'sections: []');
    fs.writeFileSync(ymlPath, 'sections: []');
    expect(resolveChecklistPath(dir)).toBe(yamlPath);
  });

  it('resolves an explicit path relative to root', () => {
    const dir = makeTmpDir();
    const custom = path.join(dir, 'custom', 'my-checklist.yaml');
    fs.mkdirSync(path.dirname(custom), { recursive: true });
    fs.writeFileSync(custom, 'sections: []');
    expect(resolveChecklistPath(dir, 'custom/my-checklist.yaml')).toBe(custom);
  });

  it('returns null when explicit path does not exist', () => {
    const dir = makeTmpDir();
    expect(resolveChecklistPath(dir, 'nonexistent.yaml')).toBeNull();
  });

  it('DEFAULT_FILENAMES contains the expected entries in order', () => {
    expect(DEFAULT_FILENAMES).toEqual([
      'uat-checklist.yaml',
      'uat-checklist.yml',
      'uat-checklist.json',
      'uat-checklist.md',
    ]);
  });
});
