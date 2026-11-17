# Exercícios (faça você mesmo!)

Quem pratica entende e explica melhor depois, inclusive em entrevista.

## Já feitos no pacote (estude como ficaram)

| Antes era exercício | Onde está agora |
| :--- | :--- |
| `formatarPlaca` | `src/utils/placa.js` e testes em `tests/utils.test.js` |
| Teste de `hojeISO` | `tests/utils.test.js` |
| Cadastro por chassi | `src/utils/chassi.js`, `src/services/validacao.js`, migração `002` |

Para fixar: **apague** `formatarPlaca` e os testes dela numa branch de treino, escreva de novo sozinho (teste primeiro) e compare com o original. Depois descarte a branch.

## Exercício 1: ler o código (Rota → Banco)

Siga a rota `GET /api/exportar.csv` e liste, em ordem, os arquivos por onde a requisição passa. Depois confira com `docs/ARQUITETURA.md`.

## Exercício 2: chassi legível

Crie `formatarChassi` em `src/utils/chassi.js` que devolva o chassi em grupos para leitura, por exemplo `9BW ZZZ 377 VT0 04251`. Escreva primeiro os testes (entrada com 17 caracteres, entrada inválida devolvida como veio, `null`).

## Exercício 3: nova migração

Crie a migração `003_observacao_interna.js` que adiciona a coluna `obs_interna TEXT` em `agendamentos`. Registre em `migrations/index.js`, rode `npm run dev` e confirme no log: `Migração 003 aplicada`. Depois consulte `SELECT * FROM schema_migrations;`.

## Exercício 4: Git de verdade

1. `git switch -c feat/formatar-chassi`
2. Faça os commits do Exercício 2 (`feat:` e `test:`).
3. `git push -u origin feat/formatar-chassi` e abra um Pull Request no GitHub.
4. Revise as próprias mudanças, faça o merge e volte para a `main` com `git switch main && git pull`.

Quando terminar, me conte o que achou difícil. Posso revisar seu código e explicar o que fez diferença.
