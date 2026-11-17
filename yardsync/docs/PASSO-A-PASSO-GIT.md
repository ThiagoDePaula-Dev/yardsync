# Passo a passo: repositório novo, Git e GitHub

Faça no terminal (Git Bash no Windows, ou o terminal do VS Code). Evite o editor web do GitHub para subir vários arquivos: o terminal é mais confiável e é o que se usa no trabalho.

## 0. Preparação (uma vez só)

```bash
git --version                                   # precisa mostrar uma versão
git config --global user.name  "Seu Nome"
git config --global user.email "seu-email-do-github@exemplo.com"
```

## 1. Cuidar do repositório antigo

No GitHub, abra o repositório antigo, depois **Settings**:
1. Em **Repository name**, renomeie para `yardsync-prototipo` e clique em Rename.
2. Role até **Danger Zone** e clique em **Archive this repository**. Ele fica só para leitura, como registro da primeira versão.

Por que não apagar? O histórico mostra sua evolução.

## 2. Criar o repositório novo

1. GitHub: **New repository**.
2. Nome: `yardsync`. Visibilidade: **Private** por enquanto (você pode tornar público depois de conferir que não há segredos).
3. **Não** marque "Add a README", ".gitignore" nem "license": esses arquivos já estão prontos no projeto.
4. Clique em **Create repository** e copie o endereço (`https://github.com/SEU_USUARIO/yardsync.git`).

## 3. Preparar a pasta local

```bash
cd caminho/para/yardsync          # a pasta que você baixou e descompactou
git init -b main
git status
```

**Confira antes de continuar:** na lista do `git status` NÃO podem aparecer `.env` nem `node_modules/`. O `.gitignore` já cuida disso. Se aparecerem, pare e me avise.

## 4. Commits pequenos e com nome claro

Cada commit conta **uma** ideia. Faça nesta ordem:

```bash
git add .gitignore .env.example LICENSE package.json
git commit -m "chore: configuração inicial do projeto"

git add src/
git commit -m "feat: backend em camadas com migrações e cadastro por placa ou chassi"

git add public/ excel/
git commit -m "feat: adiciona interface web e macro de integração com Excel"

git add tests/
git commit -m "test: adiciona testes das regras de negócio e da autenticação"

git add README.md docs/
git commit -m "docs: adiciona README e guias do projeto"
```

Depois, instale as dependências para gerar o `package-lock.json` e confirme que tudo funciona:

```bash
npm install
npm test
git add package-lock.json
git commit -m "chore: adiciona package-lock.json"
```

O `package-lock.json` deve ir para o Git: ele garante que todo mundo instala exatamente as mesmas versões.

Veja o histórico: `git log --oneline`

## 5. Enviar para o GitHub

```bash
git remote add origin https://github.com/SEU_USUARIO/yardsync.git
git push -u origin main
```

O GitHub **não aceita senha da conta** no terminal. Duas saídas:
- Instalar o **GitHub CLI** e rodar `gh auth login`, ou
- Usar o **Git Credential Manager** (vem com o Git no Windows): ele abre o navegador para você entrar.

## 6. Marcar a versão

```bash
git tag -a v0.1.0 -m "Backend em camadas, login, scanner, etiquetas"
git push origin v0.1.0
```

## 7. Fluxo para toda mudança daqui para frente

```bash
git switch main && git pull               # começa atualizado
git switch -c feat/nome-da-tarefa         # uma branch por tarefa
# ...programa, testa...
git add <arquivos>
git commit -m "feat: descrição curta"
git push -u origin feat/nome-da-tarefa
```

No GitHub: **Compare & pull request** → leia suas próprias mudanças → **Squash and merge** → **Delete branch**. Depois:

```bash
git switch main && git pull
git branch -d feat/nome-da-tarefa
```

### Padrão das mensagens de commit

| Prefixo | Use quando |
| :--- | :--- |
| `feat:` | funcionalidade nova |
| `fix:` | correção de erro |
| `refactor:` | reorganizou sem mudar o comportamento |
| `test:` | testes |
| `docs:` | documentação |
| `chore:` | configuração, dependências |

### Nomes de branch

`feat/etiquetas-qr`, `fix/login-erro`, `docs/readme`.

## 8. Organizar o trabalho no GitHub

Em **Issues**, crie uma issue para cada item do Roadmap do README (migrações, CI, frontend modular, PWA...). Ao abrir um Pull Request, escreva `Closes #3` na descrição para fechar a issue sozinho.

## 9. Reconectar o Railway ao repositório novo

1. No Railway, abra o serviço do app, depois **Settings → Source** e troque o repositório para `yardsync`.
2. **Importante:** o arquivo de entrada mudou de `server.js` para `src/server.js`. Em **Settings → Deploy**, o comando de início deve ser `npm start` (ou vazio, para usar o do `package.json`). Se estiver `node server.js`, troque.
3. As variáveis de ambiente continuam as mesmas.

## 10. Segurança

- **Nunca** faça commit do `.env`.
- Se uma senha ou chave for para o GitHub por engano, ela está comprometida mesmo que você apague depois: **troque a senha/chave** no Railway.
- Antes de tornar o repositório público: `git log -p | grep -i "password\|secret"` para uma busca rápida (não substitui revisar com calma).

## Problemas comuns

| Mensagem | O que significa e o que fazer |
| :--- | :--- |
| `rejected ... non-fast-forward` | O GitHub tem commits que você não tem. Rode `git pull --rebase` e tente de novo. |
| `Permission denied` / `Authentication failed` | Falta autenticar. Veja o item 5. |
| `fatal: not a git repository` | Você não está na pasta do projeto. Use `cd`. |
| `nothing to commit` | Já estava tudo commitado, ou o `git add` não pegou os arquivos. |
| Apareceu `.env` no `git status` | O `.gitignore` não está na pasta. Pare e confira. |
