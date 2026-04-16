import fs from 'fs';
import { afterAll, describe, expect, it } from 'vitest';
import { generateMarkdownReport } from '../src/report';

describe('generateMarkdownReport', () => {
  const file = '.security-reports/test-report.md';
  afterAll(() => {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  });
  it('gera um relatório markdown', () => {
    const path = generateMarkdownReport({ foo: 'bar' }, file);
    expect(fs.existsSync(path)).toBe(true);
    const content = fs.readFileSync(path, 'utf8');
    expect(content).toContain('foo');
    expect(content).toContain('bar');
  });
});
