import { describe, expect, it } from 'vitest';
import { auditProject } from '../src/audit';

describe('auditProject', () => {
  it('executa auditoria e retorna resultados', () => {
    const result = auditProject();
    expect(result).toHaveProperty('npm audit');
    expect(result).toHaveProperty('eslint');
  });
});
