# Security Audit Toolkit

Toolkit para auditoria e análise de segurança de projetos Node.js, disponível como CLI e biblioteca npm.

## Instalação

```sh
npm install security-audit-toolkit
```

## Uso via CLI

```sh
npx security-audit audit
npx security-audit scan
```

## Uso como biblioteca

```ts
import { auditProject, scanProject } from 'security-audit-toolkit';

const resultado = await auditProject();
```

## Funcionalidades
- Auditoria de dependências (npm audit)
- Verificação de dependências desatualizadas
- Análise de código morto (ts-prune)
- Scan de padrões de risco em código
- Relatórios em Markdown/JSON

## Scripts
- `npm run audit` — Executa auditoria completa
- `npm run scan` — Executa scan avançado

## Licença
MIT
