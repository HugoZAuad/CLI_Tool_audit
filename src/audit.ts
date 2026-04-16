import { execSync } from 'child_process';

export function auditProject(): Record<string, string> {
  function run(cmd: string): string {
    try {
      return execSync(cmd, { stdio: 'pipe' }).toString();
    } catch (err) {
      if (err && typeof err === 'object' && 'stdout' in err) {
        // @ts-ignore
        return err.stdout?.toString() || (err as Error).message;
      }
      return (err as Error).message;
    }
  }
  const results: Record<string, string> = {};
  results['npm audit'] = run('npm audit --json');
  results['npm outdated'] = run('npm outdated || echo "Nenhuma dependência desatualizada"');
  results['eslint'] = run('npx eslint --ext .ts,.tsx src/ || echo "ESLint encontrou problemas"');
  results['ts-prune'] = run('npx ts-prune || echo "ts-prune encontrou código morto"');
  return results;
}
