import { describe, it, expect } from 'vitest';
import { parseMarkdownChecklist } from '../index.js';

describe('parseMarkdownChecklist', () => {
  it('parses a full markdown checklist with title, sections, and checkbox items', () => {
    const md = `# My App UAT

## Auth

- [ ] Login works (route: /login)
- [x] Logout works

## Dashboard

- [ ] Charts render (route: /dashboard)
`;
    const result = parseMarkdownChecklist(md);
    expect(result.title).toBe('My App UAT');
    expect(result.sections).toHaveLength(2);
    expect(result.sections[0].name).toBe('Auth');
    expect(result.sections[0].items).toHaveLength(2);
    expect(result.sections[0].items[0]).toEqual({ text: 'Login works', route: '/login' });
    expect(result.sections[0].items[1]).toEqual({ text: 'Logout works' });
    expect(result.sections[1].name).toBe('Dashboard');
    expect(result.sections[1].items[0]).toEqual({ text: 'Charts render', route: '/dashboard' });
  });

  it('extracts route hint and strips it from text', () => {
    const md = `## Section
- [ ] Check page loads (route: /about)
`;
    const result = parseMarkdownChecklist(md);
    expect(result.sections[0].items[0].text).toBe('Check page loads');
    expect(result.sections[0].items[0].route).toBe('/about');
  });

  it('handles items without route hints', () => {
    const md = `## Section
- [ ] No route here
`;
    const result = parseMarkdownChecklist(md);
    expect(result.sections[0].items[0].text).toBe('No route here');
    expect(result.sections[0].items[0].route).toBeUndefined();
  });

  it('supports plain list items (no checkbox syntax)', () => {
    const md = `## Section
- Plain item (route: /foo)
- Another plain item
`;
    const result = parseMarkdownChecklist(md);
    expect(result.sections[0].items).toHaveLength(2);
    expect(result.sections[0].items[0]).toEqual({ text: 'Plain item', route: '/foo' });
    expect(result.sections[0].items[1]).toEqual({ text: 'Another plain item' });
  });

  it('supports asterisk bullet markers', () => {
    const md = `## Section
* [ ] Asterisk item
* Plain asterisk
`;
    const result = parseMarkdownChecklist(md);
    expect(result.sections[0].items).toHaveLength(2);
    expect(result.sections[0].items[0].text).toBe('Asterisk item');
    expect(result.sections[0].items[1].text).toBe('Plain asterisk');
  });

  it('wraps top-level items in a General section when no headings exist', () => {
    const md = `- [ ] Item one
- [ ] Item two
`;
    const result = parseMarkdownChecklist(md);
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].name).toBe('General');
    expect(result.sections[0].items).toHaveLength(2);
  });

  it('returns empty sections for empty input', () => {
    const result = parseMarkdownChecklist('');
    expect(result.sections).toHaveLength(0);
    expect(result.title).toBeUndefined();
  });

  it('returns empty sections for input with only a title', () => {
    const result = parseMarkdownChecklist('# Just a title');
    expect(result.title).toBe('Just a title');
    expect(result.sections).toHaveLength(0);
  });

  it('handles multiple heading levels (h2, h3)', () => {
    const md = `## Section A
- [ ] Item A

### Subsection B
- [ ] Item B
`;
    const result = parseMarkdownChecklist(md);
    expect(result.sections).toHaveLength(2);
    expect(result.sections[0].name).toBe('Section A');
    expect(result.sections[1].name).toBe('Subsection B');
  });

  it('ignores lines that are not headings or list items', () => {
    const md = `# Title

Some random paragraph text.

## Section
More text that should be ignored.
- [ ] Actual item
`;
    const result = parseMarkdownChecklist(md);
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].items).toHaveLength(1);
    expect(result.sections[0].items[0].text).toBe('Actual item');
  });

  it('handles checked checkboxes [x] the same as unchecked', () => {
    const md = `## Done
- [x] Already done item
- [X] Also done
- [ ] Not done
`;
    const result = parseMarkdownChecklist(md);
    expect(result.sections[0].items).toHaveLength(3);
    expect(result.sections[0].items[0].text).toBe('Already done item');
    expect(result.sections[0].items[1].text).toBe('Also done');
    expect(result.sections[0].items[2].text).toBe('Not done');
  });

  it('items before any section heading are ignored when sections exist later', () => {
    const md = `- [ ] Orphan item

## Real Section
- [ ] Real item
`;
    const result = parseMarkdownChecklist(md);
    // The orphan is ignored because sections DO exist
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].name).toBe('Real Section');
    expect(result.sections[0].items).toHaveLength(1);
  });
});
