# Diretrizes para Agentes de Desenvolvimento (BARBEOS)

Este arquivo define comportamentos, fluxos de trabalho e padrões obrigatórios para o desenvolvimento no projeto BARBEOS.

## Fluxo Obrigatório de Finalização de Tarefas (Auto-Deploy)

Sempre que uma tarefa, nova funcionalidade, correção ou ciclo de refatoração for concluído e validado com sucesso:

1. **Validação Técnica Local**:
   - Garantir que não há erros de tipagem e que a suite de testes passa (`npm test` / vitest e testes e2e relevantes).
2. **Commit Padronizado (Conventional Commits)**:
   - Criar um commit claro e objetivo seguindo o padrão de commits do repositório (ex: `feat(...)`, `fix(...)`, `docs(...)`, `refactor(...)`, `perf(...)`).
3. **Push Automático para o GitHub**:
   - Executar `git push origin main` imediatamente após a conclusão e validação da tarefa.
   - Isso garante que a integração contínua e o pipeline de deploy automático da **Vercel** sejam disparados a cada entrega concluída.
4. **Comunicação ao Usuário**:
   - Informar o hash do commit, o resumo das alterações entregues e a confirmação de que o push foi realizado para início do deploy na Vercel.
