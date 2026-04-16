/// <reference types="node" />
import { beforeEach, describe, expect, it, vi } from 'vitest';
// @ts-ignore: Buffer é global em Node.js

const execSyncMock = vi.fn();

vi.mock('node:child_process', () => ({
  execSync: execSyncMock
}));

describe('audit.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runCommand retorna objeto detalhado quando comando executa com sucesso', async () => {
    execSyncMock.mockReturnValue('ok');

    const { runCommand } = await import('../src/audit.js');
    const result = runCommand('echo test');

    expect(result).toEqual({
      command: 'echo test',
      output: 'ok',
      success: true
    });
    expect(execSyncMock).toHaveBeenCalledWith(
      'echo test',
      expect.objectContaining({
        stdio: 'pipe',
        encoding: 'utf-8',
        shell: expect.any(String)
      })
    );
  });

  it('runCommand retorna objeto detalhado com stdout do erro quando existir', async () => {
    execSyncMock.mockImplementation((): never => {
      throw { stdout: Buffer.from('erro com stdout') };
    });

    const { runCommand } = await import('../src/audit.js');
    const result = runCommand('comando quebrado');

    expect(result).toEqual({
      command: 'comando quebrado',
      output: 'erro com stdout',
      success: false
    });
  });

  it('runCommand retorna objeto detalhado com message quando erro não tiver stdout', async () => {
    execSyncMock.mockImplementation((): never => {
      throw new Error('falhou');
    });

    const { runCommand } = await import('../src/audit.js');
    const result = runCommand('comando quebrado');

    expect(result).toEqual({
      command: 'comando quebrado',
      output: 'falhou',
      success: false
    });
  });

  it('auditProject executa os 4 comandos esperados', async () => {
    execSyncMock
      .mockReturnValueOnce('audit result')
      .mockReturnValueOnce('outdated result')
      .mockReturnValueOnce('eslint result')
      .mockReturnValueOnce('ts-prune result');

    const { auditProject } = await import('../src/audit.js');
    const result = auditProject();

    expect(result).toEqual({
      'npm audit': {
        command: 'npm audit --json',
        output: 'audit result',
        success: true
      },
      'npm outdated': {
        command: 'npm outdated',
        output: 'outdated result',
        success: true
      },
      eslint: {
        command: 'npx eslint --ext .ts,.tsx,.js,.jsx src/',
        output: 'eslint result',
        success: true
      },
      'ts-prune': {
        command: 'npx ts-prune',
        output: 'ts-prune result',
        success: true
      }
    });

    expect(execSyncMock).toHaveBeenCalledTimes(4);
  });
});