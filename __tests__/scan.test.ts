import { beforeEach, describe, expect, it, vi } from 'vitest';

const existsSyncMock = vi.fn();
const readdirSyncMock = vi.fn();
const statSyncMock = vi.fn();
const readFileSyncMock = vi.fn();

vi.mock('node:fs', () => ({
  default: {
    existsSync: existsSyncMock,
    readdirSync: readdirSyncMock,
    statSync: statSyncMock,
    readFileSync: readFileSyncMock
  }
}));

describe('scan.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normalizeFilePath retorna caminho relativo ao root', async () => {
    const { normalizeFilePath } = await import('../src/scan.js');

    const result = normalizeFilePath('/repo/src/app.ts', '/repo');
    expect(result).toBe('src/app.ts');
  });

  it('walk retorna arquivos válidos e ignora diretórios bloqueados', async () => {
    const { walk } = await import('../src/scan.js');

    readdirSyncMock.mockImplementation((dir: string) => {
      const normalized = dir.replace(/\\/g, '/');

      if (normalized === '/repo') return ['src', 'node_modules', 'package.json'];
      if (normalized === '/repo/src') return ['index.ts', 'helper.js'];
      return [];
    });

    statSyncMock.mockImplementation((full: string) => {
      const normalized = full.replace(/\\/g, '/');
      return {
        isDirectory: () => normalized === '/repo/src' || normalized === '/repo/node_modules'
      };
    });

    const files = walk('/repo').map((file) => file.replace(/\\/g, '/'));

    expect(files).toEqual([
      '/repo/src/index.ts',
      '/repo/src/helper.js',
      '/repo/package.json'
    ]);
  });

  it('scanProject encontra padrões de risco no código', async () => {
        // Mock fs.existsSync para garantir que o diretório e arquivo existem
        existsSyncMock.mockImplementation((file: string) => {
          const normalized = file.replace(/\\/g, '/');
          return normalized === '/repo/src' || normalized === '/repo/src/index.ts';
        });

        // Mock isFile para o statSync
        statSyncMock.mockImplementation((full: string) => {
          const normalized = full.replace(/\\/g, '/');
          return {
            isDirectory: () => normalized === '/repo/src',
            isFile: () => normalized === '/repo/src/index.ts'
          };
        });
    const { scanProject } = await import('../src/scan.js');

    readdirSyncMock.mockImplementation((dir: string) => {
      const normalized = dir.replace(/\\/g, '/');

      if (normalized === '/repo') return ['src'];
      if (normalized === '/repo/src') return ['index.ts'];
      return [];
    });

    statSyncMock.mockImplementation((full: string) => {
      const normalized = full.replace(/\\/g, '/');
      return {
        isDirectory: () => normalized === '/repo/src'
      };
    });

    readFileSyncMock.mockImplementation((file: string) => {
      const normalized = file.replace(/\\/g, '/');
      if (normalized === '/repo/src/index.ts') {
        return [
          'const safe = true;',
          'eval("danger")',
          'const token = "1234567890123456";'
        ].join('\n');
      }
      return '';
    });

    const findings = scanProject('/repo');

    expect(findings).toHaveLength(2);
    expect(findings[0]).toMatchObject({
      arquivo: 'src/index.ts',
      linha: 2,
      tipo: 'Uso de eval'
    });
    expect(findings[1]).toMatchObject({
      arquivo: 'src/index.ts',
      linha: 3,
      tipo: 'Token hardcoded'
    });
  });

  it('scanProject retorna vazio quando não encontra risco', async () => {
    const { scanProject } = await import('../src/scan.js');

    readdirSyncMock.mockImplementation((dir: string) => {
      const normalized = dir.replace(/\\/g, '/');

      if (normalized === '/repo') return ['src'];
      if (normalized === '/repo/src') return ['clean.ts'];
      return [];
    });

    statSyncMock.mockImplementation((full: string) => {
      const normalized = full.replace(/\\/g, '/');
      return {
        isDirectory: () => normalized === '/repo/src'
      };
    });

    readFileSyncMock.mockImplementation((file: string) => {
      const normalized = file.replace(/\\/g, '/');

      if (normalized === '/repo/src/clean.ts') {
        return 'const ok = true;';
      }

      return '';
    });

    const findings = scanProject('/repo');
    expect(findings).toEqual([]);
  });
});