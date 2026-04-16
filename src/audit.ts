import { execSync } from 'child_process';

export type AuditToolResult = {
  command: string;
  output: string;
  success: boolean;
};

export type AuditResults = Record<string, AuditToolResult>;

function getShell(): string {
  return process.platform === 'win32' ? 'cmd.exe' : '/bin/sh';
}

export function runCommand(command: string): AuditToolResult {
  try {
    const output = execSync(command, {
      stdio: 'pipe',
      encoding: 'utf-8',
      shell: getShell()
    });

    return {
      command,
      output: output?.trim() || 'Comando executado sem saída.',
      success: true
    };
  } catch (error) {
    let output = '';

    if (error && typeof error === 'object' && 'stdout' in error) {
      const stdout = (error as { stdout?: Buffer | string }).stdout;
      if (stdout) {
        output = stdout.toString().trim();
      }
    }

    if (!output) {
      output = error instanceof Error ? error.message : String(error);
    }

    return {
      command,
      output: output || 'Falha ao executar comando.',
      success: false
    };
  }
}

export function auditProject(): AuditResults {
  return {
    'npm audit': runCommand('npm audit --json'),
    'npm outdated': runCommand('npm outdated'),
    eslint: runCommand('npx eslint --ext .ts,.tsx,.js,.jsx src/'),
    'ts-prune': runCommand('npx ts-prune')
  };
}