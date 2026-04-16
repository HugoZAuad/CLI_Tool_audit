# Auditoria de Segurança

Este documento explica como rodar a varredura de segurança do projeto, o que cada comando faz, o que é analisado e boas práticas para manter o sistema seguro.

---

## Comandos principais

- `npm run security-all`
  - Executa toda a auditoria automatizada:
    - Verifica vulnerabilidades em dependências (`npm audit`)
    - Verifica dependências desatualizadas (`npm outdated`)
    - Roda o ESLint com plugins de segurança (security, no-secrets, xss)
    - Detecta código morto (`ts-prune`)
    - Executa o scanner avançado para padrões contextuais do projeto
    - Gera relatório consolidado em `security/analysis/relatorio-seguranca-AAAA-MM-DD.md`

- `npm run lint`
  - Roda apenas o ESLint com regras de segurança e boas práticas.

- `npm run security-audit`
  - Executa apenas a auditoria principal (dependências, lint, código morto).

- `npm run security-audit:advanced`
  - Executa apenas o scanner avançado (regras contextuais, ex: Firestore permissivo, webhooks sem assinatura).

- `npm run security-audit:md`
  - Gera o relatório markdown consolidado a partir dos resultados dos comandos anteriores.

---

## O que é analisado

- **Dependências:**
  - Vulnerabilidades conhecidas (npm audit)
  - Dependências desatualizadas (npm outdated)
- **Código fonte:**
  - Padrões perigosos (eval, new Buffer, child_process, regex inseguro, etc)
  - Vazamento de segredos (keys, tokens, senhas)
  - Riscos de XSS (HTML dinâmico, dangerouslySetInnerHTML)
  - Uso de any, @ts-ignore, código morto
  - Outras más práticas via ESLint
- **Regras contextuais:**
  - Regras permissivas em Firestore
  - Endpoints de webhook sem validação de assinatura
  - Outros padrões específicos do negócio

---

## Relatórios gerados

- `security/analysis/relatorio-seguranca-AAAA-MM-DD.md`: Relatório consolidado (automatizado)
- `RELATORIO-SEGURANCA.md`: Relatório manual/histórico, pode ser atualizado com achados específicos ou recomendações do time

---

## Boas práticas

- Sempre rode `npm run security-all` antes de deploys importantes ou releases
- Corrija vulnerabilidades e problemas apontados antes de subir para produção
- Mantenha dependências sempre atualizadas
- Use o scanner avançado para regras específicas do seu negócio
- Revise periodicamente endpoints sensíveis, regras do Firestore e integrações externas
- Considere integrar esse fluxo ao CI/CD para garantir segurança contínua

---
