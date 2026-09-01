# API de Pesquisa Científica

API que consulta a base do PubMed (NCBI E-utilities) por temas de saúde e exercício físico, com autenticação de usuário e sistema de favoritos.

## Tecnologias

- Node.js + Express
- Supabase (PostgreSQL)
- JWT + bcrypt (autenticação)
- Jest + Supertest (testes)

## Rodando localmente

```bash
npm install
npm run start
```

## Pipeline de DevOps

Este projeto usa um pipeline completo de CI/CD, containerização e monitoramento.

### Containerização (Docker)

A API roda dentro de um container Docker, definido no `Dockerfile` na raiz do projeto.

Para rodar localmente via Docker:

```bash
docker build -t api-pesquisa-cientifica .
docker run -p 3000:3000 --env-file .env api-pesquisa-cientifica
```

### Integração Contínua (CI)

A cada `push` na branch `main`, um workflow do GitHub Actions (`.github/workflows/ci.yml`) executa automaticamente:

1. Baixa o código
2. Instala as dependências
3. Roda a suíte de testes (Jest + Supertest)

As credenciais necessárias (Supabase, JWT) são injetadas via **GitHub Secrets**, nunca expostas no código.

### Deploy contínuo (condicional)

Se — e somente se — os testes passarem, um segundo job do mesmo workflow dispara um deploy automático no [Render](https://render.com), via um Deploy Hook.

Isso garante que nenhuma versão com testes quebrados chega a ser publicada.

**URL em produção:** https://api-pesquisa-cientifica.onrender.com

### Monitoramento

A disponibilidade da API é monitorada continuamente pelo [UptimeRobot](https://uptimerobot.com), com checagens a cada 5 minutos e alertas por email em caso de queda.

### Fluxo resumido

```
git push origin main
      │
      ▼
GitHub Actions: job "test"
      │  (só continua se passar)
      ▼
GitHub Actions: job "deploy"
      │
      ▼
Render: build + deploy da imagem Docker
      │
      ▼
UptimeRobot: monitoramento contínuo
```