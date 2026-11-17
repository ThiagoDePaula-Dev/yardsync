# 🚘 YardSync

> **Protótipo em desenvolvimento.** Gestão de pátio e rastreio de veículos para concessionárias: a equipe de campo escaneia o QR Code do veículo pelo celular e a posição é atualizada no servidor, com exportação para o Excel.

## O que já funciona

- **Login e perfis:** operador de pátio, administrador e TI/gestor (token assinado, senhas com `scrypt`).
- **Scanner de QR Code** pela câmera do celular, com entrada manual da placa como alternativa.
- **Painel do pátio:** contadores por localização, entregas do dia, atrasados, busca e filtros.
- **Cadastro por placa ou chassi:** o veículo pode ser cadastrado só pelo chassi (17 caracteres) quando ainda não tem placa; a placa é preenchida depois. Busca, scanner e etiquetas aceitam os dois.
- **Cadastro e edição** de veículos, com **previsão de entrega automática** (faturamento + dias de SLA configuráveis).
- **Histórico de movimentação:** quem moveu o veículo, de onde para onde e quando.
- **Etiquetas QR** para impressão (QR contém só a placa, em respeito à LGPD).
- **Exportação para Excel** (CSV + macro VBA).
- **Acessibilidade:** alvos de toque grandes, temas claro/escuro/alto contraste, suporte a leitor de tela.

## Stack

| Camada | Tecnologia |
| :--- | :--- |
| Backend | Node.js 20+ e Express 5 |
| Banco de dados | PostgreSQL (`pg`) |
| Frontend | HTML, CSS e JavaScript puros |
| QR Code | `html5-qrcode` (leitura) e `qrcode-generator` (etiquetas) |
| Testes | `node:test` (nativo do Node), 27 testes das regras e da validação |
| Hospedagem | Railway |

## Estrutura

```
src/
  config/        variáveis de ambiente validadas
  db/            conexão, migrações versionadas e preparação do banco
  middlewares/   login/perfis, limite de tentativas, segurança, erros
  routes/        a "porta de entrada" HTTP de cada assunto
  services/      regras de negócio (autenticação, veículos, SLA)
  utils/         funções puras (placa, datas, CSV)
public/          interface web (index.html)
excel/           macro VBA de sincronização
tests/           testes automáticos
docs/            guias do projeto
```

## Como rodar localmente

Requisitos: Node.js 20.6 ou superior e um PostgreSQL (local ou do Railway).

```bash
npm install
cp .env.example .env     # preencha DATABASE_URL e AUTH_SECRET
npm run dev
```

No primeiro start são criadas as tabelas e o usuário `admin` (perfil TI). Se `ADMIN_PASSWORD` não estiver definida, a senha gerada aparece **uma única vez** no terminal.

```bash
npm test                 # roda os testes automáticos
```

## Documentação

- [Arquitetura: como o código está organizado e por quê](docs/ARQUITETURA.md)
- [Passo a passo de Git e GitHub](docs/PASSO-A-PASSO-GIT.md)
- [Exercícios para praticar](docs/EXERCICIOS.md)

## Roadmap

- [x] Estrutura do backend em camadas
- [x] Migrações versionadas do banco
- [x] Cadastro e busca por chassi (placa opcional)
- [ ] Integração contínua (GitHub Actions) com lint e testes
- [ ] Frontend dividido em módulos e componentes
- [ ] Pesquisa de UX com usuários do pátio
- [ ] Modo offline (PWA)
- [ ] Indicadores para o gestor
- [ ] Importação de planilhas

## Segurança e LGPD

Armazena apenas o essencial para o fluxo logístico (placa, chassi, cliente, datas e localização). Nunca versione o arquivo `.env`.

## Licença

MIT. Veja o arquivo [LICENSE](LICENSE).
