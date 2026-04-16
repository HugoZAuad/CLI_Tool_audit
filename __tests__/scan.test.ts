import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { scanProject } from '../src/scan';

describe('scanProject', () => {
  const testFile = path.join(__dirname, 'scan-test-file.js');
  beforeEach(() => {
    fs.writeFileSync(testFile, 'eval("alert(1)");\nconst token = "process.env.token";');
  });
  afterEach(() => {
    if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
  });
  it('detecta padrões de risco', () => {
    const findings = scanProject(__dirname);
    expect(findings.some(f => f.tipo === 'Uso de eval')).toBe(true);
    expect(findings.some(f => f.tipo === 'Token hardcoded')).toBe(true);
  });
});
