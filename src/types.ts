export type AuditResults = Record<string, string>;

export type Finding = {
  arquivo: string;
  linha: number;
  trecho: string;
  tipo: string;
  risco: string;
  correcao: string;
};

export type Pattern = {
  name: string;
  regex: RegExp;
  risk: string;
  fix: string;
};

export type ScanType = 'audit' | 'scan' | 'full' | 'exit';

export type CliCommand = 'deps-audit' | 'code-scan' | 'full-check' | 'help';