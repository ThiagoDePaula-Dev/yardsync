# Arquitetura: como o código está organizado e por quê

## A ideia central

Antes, o `server.js` fazia **tudo** num único arquivo: ler configuração, falar com o banco, validar dados, autenticar, definir rotas. Funciona, mas cada mudança mexe num arquivo enorme, e fica difícil achar e testar as coisas.

Agora cada pasta tem **uma responsabilidade**:

| Pasta | Responsabilidade | Pergunta que responde |
| :--- | :--- | :--- |
| `config/` | Ler e validar variáveis de ambiente | "Com que configuração o sistema roda?" |
| `db/` | Conexão e **migrações** do banco | "Como falo com o banco? Qual é a versão da estrutura?" |
| `middlewares/` | Passos que toda requisição atravessa | "Quem é você? Pode entrar? Deu erro?" |
| `routes/` | Porta de entrada HTTP | "Qual URL faz o quê?" |
| `services/` | Regras de negócio | "Como o negócio funciona?" |
| `utils/` | Funções pequenas e puras | "Como formato/valido isto?" |
| `constants.js` | Valores fixos do negócio | "Quais status e locais existem?" |

## A jornada de uma requisição

Exemplo: o operador lê um QR Code e o app chama `POST /api/veiculos/scan`.

```
Celular
  │  POST /api/veiculos/scan  { placa, novaLocalizacao }
  ▼
src/app.js                      monta tudo e define a ordem dos passos
  ├─ middlewares/seguranca.js   força HTTPS e põe cabeçalhos de segurança
  ├─ express.json()             transforma o corpo em objeto JavaScript
  ▼
src/routes/index.js             encaminha /api/... para o arquivo certo
  ▼
src/routes/veiculos.routes.js   rota "POST /veiculos/scan"
  ├─ middlewares/auth.js        confere o token e o perfil do usuário
  ├─ utils/placa.js             normaliza a placa
  ├─ db/pool.js (transação)     busca o veículo, atualiza e grava o histórico "tudo ou nada"
  └─ services/veiculos.service  registra a movimentação
  ▼
Resposta JSON  { sucesso: true, mensagem: "..." }

Se algo falhar em qualquer ponto → middlewares/erros.js transforma em JSON claro (400, 401, 404...).
```

## Por que separar "montar" de "ligar" (app.js x server.js)?

`app.js` só **monta** o aplicativo. `server.js` **liga** a porta e o banco. Assim, no futuro, os testes podem montar o app sem abrir porta nenhuma.

## Por que validar a configuração na partida?

Se faltar `DATABASE_URL`, o `config/env.js` avisa na hora e encerra. É melhor falhar cedo e com mensagem clara do que descobrir no meio do uso.

## Funções puras: as mais fáceis de testar

`somarDias`, `normalizarPlaca` e `celulaCsv` não dependem de banco nem de internet: mesma entrada, mesma saída. Por isso já têm testes em `tests/`.

## Glossário rápido

- **Refatoração:** mudar a organização do código **sem mudar o comportamento**.
- **Middleware:** função que roda no meio do caminho entre a requisição e a resposta.
- **Camada:** grupo de código com uma responsabilidade bem definida.
- **Variável de ambiente:** configuração que fica fora do código (senhas, endereços).
- **Transação:** várias operações no banco que valem juntas ou não valem.
- **Função pura:** não tem efeito colateral e sempre devolve o mesmo resultado para a mesma entrada.

## Migrações: o banco também tem versão

O erro `column "chave" does not exist` aconteceu porque o código mudou mas o banco não: o `CREATE TABLE IF NOT EXISTS` não altera uma tabela que já existe.

A solução são **migrações**: arquivos numerados em `src/db/migrations/`, cada um descrevendo uma mudança no banco. Ao iniciar, `db/migrate.js`:

1. cria a tabela `schema_migrations`, que lembra quais migrações já rodaram;
2. aplica, em ordem, só as que faltam, cada uma "tudo ou nada";
3. usa uma trava (`pg_advisory_lock`) para duas instâncias não migrarem juntas.

Para mudar o banco no futuro: crie `003_nome.js`, registre em `migrations/index.js` e **nunca edite uma migração já aplicada** em produção.

A migração `002` é um exemplo real: tornou a placa opcional, padronizou o chassi, criou o índice único do chassi, exigiu "placa OU chassi" no banco e ligou o histórico ao id do veículo (a placa pode mudar quando o carro for emplacado).

## Placa ou chassi: como o sistema decide

`utils/chassi.js` → `identificar(texto)`: se o texto tem **17 caracteres** é um chassi; senão é tratado como placa. Por isso a mesma rota (`/api/agendamentos/:chave`) e o mesmo campo de busca servem para os dois.

## O que ainda não está perfeito (de propósito)

- Algumas rotas ainda contêm SQL. O próximo passo é mover isso para uma camada de acesso aos dados.
- Os testes cobrem funções puras e a validação. Depois vêm testes das rotas com um banco de teste.
- Chassis antigos fora do padrão de 17 caracteres continuam no banco, mas precisam ser corrigidos para poder editar o veículo.
