# 🎁 DoeCerto - Backend API

**Backend API para a plataforma DoeCerto - Conectando doadores e ONGs de forma transparente e segura.**

<div align="center">

[![NestJS](https://img.shields.io/badge/NestJS-v11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-v6-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-20.10+-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

## 📋 Índice

- [Sobre](#sobre)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Executando](#executando)
- [Documentação da API](#documentação-da-api)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Segurança](#segurança)
- [Troubleshooting](#troubleshooting)
- [Repositório Frontend](#repositório-frontend)

---

## Sobre

O **DoeCerto Backend** é uma API RESTful de alta performance que gerencia doações entre doadores e ONGs de forma segura, transparente e eficiente. A plataforma facilita conexões significativas entre pessoas que desejam ajudar e organizações que precisam de suporte.

### Características Principais

- ✅ **Autenticação Segura** - JWT com cookies httpOnly e refresh tokens
- ✅ **Gestão de Usuários** - Doadores, ONGs e Administradores com roles específicos
- ✅ **Doações Flexíveis** - Suporte para doações materiais e monetárias
- ✅ **Verificação de ONGs** - Sistema robusto de aprovação por administradores
- ✅ **Rastreamento de Status** - Estados completos de doações (pendente, concluída, cancelada)
- ✅ **Controle de Acesso Granular** - RBAC (Role-Based Access Control)
- ✅ **Auditoria Completa** - Histórico integrado de todas as transações
- ✅ **Busca Inteligente** - Catálogo com ranking inteligente e filtros
- ✅ **Localização Geográfica** - Busca de ONGs próximas com geocodificação automática
- ✅ **Avaliações e Ratings** - Sistema transparente de avaliações comunitárias
- ✅ **Perfis Customizáveis** - Avatares, banners e informações detalhadas

### Otimizações de Performance

- ⚡ **Queries Otimizadas** - Prevenção de N+1 queries com seleção específica
- ⚡ **Paginação Eficiente** - Todos os endpoints com suporte a paginação validada
- ⚡ **Cache Multi-camada** - L1 (memória) + L2 (Redis) para catálogo
- ⚡ **Validação Robusta** - CPF/CNPJ validados no nível de aplicação
- ⚡ **Stateless Scaling** - JWT permite escalabilidade horizontal

---

## Tecnologias

### Core Framework

| Tecnologia | Versão | Função |
|-----------|--------|--------|
| **NestJS** | 11.1.8 | Framework Node.js progressivo e escalável |
| **TypeScript** | 5.9.3 | Superset JavaScript com tipagem forte |
| **Prisma** | 6.19.1 | ORM moderno com migrações automáticas |
| **MySQL** | 8 | Banco de dados relacional |

### Autenticação & Segurança

- **@nestjs/jwt** - Gestão de tokens JWT
- **Passport.js** - Middleware de autenticação estratégico
- **bcrypt** - Hash seguro de senhas (10 rounds)

### Validação & Transformação

- **class-validator** - Validação automática baseada em decorators
- **class-transformer** - Transformação de objetos DTO
- **@sh4rkzy/brazilian-validator** - Validação de CPF/CNPJ

### Cache & Performance

- **@nestjs/cache-manager** - Gerenciador de cache
- **cache-manager-ioredis-yet** - Driver Redis para cache
- **Keyv** - Camada de abstração de cache

### Processamento de Imagens

- **sharp** - Processamento de imagens (redimensionamento, compressão)

### Comunicação

- **nodemailer** - Envio de emails
- **class-transformer/class-validator** - Validação em pipeline

### Desenvolvimento

- **ESLint** - Linting e qualidade de código
- **Prettier** - Formatação consistente
- **Docker** - Containerização para ambiente isolado

---

## Requisitos

### Mínimo

- **Node.js** >= 18.x LTS
- **npm** >= 9.x ou **yarn** >= 1.22.x
- **Git** >= 2.0

### Recomendado para Desenvolvimento

- **Docker** >= 20.x
- **Docker Compose** >= 2.x
- **MySQL Client** (para operações manuais)

---

## Instalação

### 1. Clone o Repositório

```bash
git clone https://github.com/feliperasilva/DoeCerto-Mobile.git
cd DoeCerto-Mobile/backend
```

### 2. Instale as Dependências

```bash
npm install
```

Ou com yarn:
```bash
yarn install
```

### 3. Crie o Arquivo de Ambiente

```bash
cp .env.example .env
```

---

## Configuração

### Variáveis de Ambiente (`.env`)

```env
# =========================
# Banco de Dados
# =========================
DATABASE_URL="mysql://root:senha_root@localhost:3309/doecerto"

# =========================
# Redis (Cache)
# =========================
REDIS_HOST=localhost
REDIS_PORT=6379

# =========================
# Aplicação
# =========================
PORT=3001
NODE_ENV=development
APP_URL=http://localhost:3001

# =========================
# Frontend
# =========================
FRONTEND_URL=http://localhost:3000

# =========================
# JWT (Autenticação)
# =========================
JWT_SECRET=sua_chave_secreta_super_segura_aqui_123456
JWT_EXPIRES_IN=24h
JWT_ALGORITHM=HS256

# =========================
# Email (SMTP)
# =========================
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=seu_usuario_smtp
EMAIL_PASS=sua_senha_smtp
EMAIL_FROM=noreply@doecerto.com

# =========================
# Docker MySQL
# =========================
MYSQL_DATABASE=doecerto_development
MYSQL_PASSWORD=doecerto_development
MYSQL_ROOT_PASSWORD=doecerto_development
```

### ⚠️ Recomendações de Segurança

- Altere `JWT_SECRET` para uma chave forte e única
- Use senhas fortes em produção
- **Nunca** commite o arquivo `.env`
- Em produção, use variáveis de ambiente seguras (AWS Secrets Manager, HashiCorp Vault)

### Banco de Dados com Docker (Recomendado)

#### Inicie os Serviços

```bash
docker-compose up -d
```

Isso iniciará:
- **MySQL 8** na porta 3309
- **Redis 7** na porta 6479

#### Verifique o Status

```bash
docker-compose ps
```

#### Parar Serviços

```bash
docker-compose down
```

#### Parar e Remover Dados (⚠️ Apaga tudo)

```bash
docker-compose down -v
```

### Banco de Dados Manual (Alternativa)

Se preferir não usar Docker:

```bash
# Instale MySQL localmente
# No MySQL:
CREATE DATABASE doecerto CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Atualize `DATABASE_URL` no `.env` com suas credenciais.

### Executar Migrations

Após o banco estar pronto:

```bash
npx prisma migrate dev
```

Isso irá:
- Criar todas as tabelas
- Gerar o Prisma Client
- Aplicar todas as migrations

### Seed do Banco (Opcional)

Para popular com dados de exemplo:

```bash
npx prisma db seed
```

Isto cria:
- 5 administradores
- 10 doadores
- 15 ONGs (verificadas, pendentes, rejeitadas)
- 12 categorias
- 8 contas bancárias
- Doações e avaliações de exemplo

---

## Executando

### Desenvolvimento

```bash
npm run start:dev
```

API disponível em: `http://localhost:3001`

### Produção

```bash
# Build
npm run build

# Iniciar
npm run start:prod
```

### Debugging

```bash
npm run start:debug
```

---

## Documentação da API

A documentação completa de todos os endpoints está em **[API_ENDPOINTS.md](./API_ENDPOINTS.md)**

### Endpoints Principais

#### Autenticação
- `POST /auth/login` - Login
- `POST /auth/register/donor` - Registrar doador
- `POST /auth/register/ong` - Registrar ONG
- `POST /auth/logout` - Logout
- `POST /auth/forgot-password` - Recuperar senha

#### Doações
- `POST /donations` - Criar doação
- `GET /donations` - Listar todas
- `GET /donations/me/sent` - Minhas doações (doador)
- `GET /donations/me/received` - Doações recebidas (ONG)
- `PATCH /donations/:id` - Atualizar doação
- `DELETE /donations/:id` - Cancelar doação

#### ONGs
- `GET /ongs` - Listar ONGs
- `GET /ongs/:id` - Detalhes ONG
- `GET /ongs/nearby` - ONGs próximas
- `POST /ongs/me/profile` - Atualizar perfil ONG
- `GET /ongs/:id/profile` - Perfil público ONG

#### Catálogo
- `GET /catalog` - Busca inteligente com ranking

#### Administração
- `GET /admins/ongs/status/pending` - ONGs pendentes
- `GET /admins/ongs/status/verified` - ONGs aprovadas
- `PATCH /admins/ongs/:id/verification/approve` - Aprovar ONG
- `PATCH /admins/ongs/:id/verification/reject` - Rejeitar ONG
- `GET /admins/metrics` - Métricas do sistema

---

## Estrutura do Projeto

```
src/
├── admins/                 # Módulo de administração
│   ├── admins.controller.ts
│   ├── admins.service.ts
│   ├── dto/
│   └── admins.module.ts
├── auth/                   # Autenticação e autorização
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── decorators/         # @CurrentUser, @Roles
│   ├── dto/                # LoginDto, RegisterDto
│   ├── guards/             # JwtAuthGuard, RolesGuard
│   ├── strategies/         # JWT Strategy
│   └── auth.module.ts
├── modules/                # Módulos de domínio
│   ├── users/              # Gestão de usuários
│   ├── donors/             # Perfis de doadores
│   ├── ongs/               # Perfis de ONGs
│   ├── donations/          # Gestão de doações
│   ├── categories/         # Categorias de ONGs
│   ├── ratings/            # Sistema de avaliações
│   ├── wishlist-items/     # Lista de desejos
│   ├── addresses/          # Endereços com geocodificação
│   ├── ong-profiles/       # Perfis detalhados ONG
│   ├── donor-profiles/     # Perfis detalhados doadores
│   ├── ongs-bank-account/  # Contas bancárias
│   ├── catalog/            # Catálogo com ranking
│   └── metrics/            # Métricas do dashboard
├── common/                 # Código compartilhado
│   ├── services/           # Serviços reutilizáveis
│   │   ├── image-processing.service.ts
│   │   ├── mailer.service.ts
│   │   └── geocoding.service.ts
│   ├── utils/              # Utilitários
│   │   ├── exclude-password.util.ts
│   │   ├── validation.util.ts
│   │   └── sorting.util.ts
│   └── common.module.ts
├── cache/                  # Configuração de cache
│   ├── cache.service.ts
│   └── cache.module.ts
├── config/                 # Configurações de multer
│   ├── multer-avatar.config.ts
│   ├── multer-banner.config.ts
│   └── multer-payment-proof.config.ts
├── prisma/                 # Prisma ORM
│   ├── prisma.service.ts
│   └── prisma.module.ts
├── app.controller.ts       # Controller principal
├── app.service.ts          # Service principal
├── app.module.ts           # Módulo raiz
└── main.ts                 # Entry point
```

### Padrões Adotados

- **Separação de Responsabilidades** - Controllers → Services → Repository
- **DTOs** - Validação automática de entrada/saída
- **Guards** - Autenticação e autorização por rota
- **Decorators Customizados** - `@CurrentUser()`, `@Roles()`
- **Transações** - Para operações multi-tabela críticas
- **Paginação** - Em todos os endpoints de listagem
- **Índices de BD** - Otimizados para queries frequentes

---

## Segurança

### Implementações Presentes

#### Autenticação
- ✅ **Passwords** - Hash com bcrypt (10 salt rounds)
- ✅ **JWT** - Tokens assinados com secret forte, expiração 24h
- ✅ **Cookies** - httpOnly, secure em produção, sameSite: strict
- ✅ **Stateless** - Permite escalabilidade horizontal

#### Autorização
- ✅ **RBAC** - Roles (admin, donor, ong) com Guards
- ✅ **Verificação de Propriedade** - Usuários podem atualizar apenas dados próprios
- ✅ **Validação em Camadas** - DTO → Service → Database

#### Proteção de Dados
- ✅ **SQL Injection** - Prisma ORM com prepared statements
- ✅ **Constraints de BD** - Unique, foreign keys, not null
- ✅ **Transações** - Operações críticas envolvidas
- ✅ **Sanitização** - Remoção automática de campos extras

#### API
- ✅ **CORS** - Restrito à origem do frontend
- ✅ **Validação de Email** - Formato e unicidade
- ✅ **Validação de CPF/CNPJ** - Algoritmos brasileiros
- ✅ **Proteção de Senhas** - Nunca retornadas em responses

### Recomendações para Produção

- [ ] Implementar **Rate Limiting** - 100 requisições/minuto por IP
- [ ] Configurar **Helmet** - Headers de segurança HTTP
- [ ] Ativar **HTTPS/TLS** - Certificados SSL válidos
- [ ] Usar **WAF** - Web Application Firewall
- [ ] Implementar **Logging** - Winston ou Pino
- [ ] Configurar **Monitoring** - Prometheus/Grafana
- [ ] Usar **Secrets Manager** - AWS Secrets, HashiCorp Vault
- [ ] Ativar **CORS Rigoroso** - Apenas domínios específicos

---

## Comandos Úteis

### Desenvolvimento

```bash
# Build do projeto
npm run build

# Executar em desenvolvimento
npm run start:dev

# Executar em modo debug
npm run start:debug

# Executar em produção
npm run start:prod

# Formatar código (Prettier)
npm run format

# Lint com correção automática
npm run lint

# Executar testes
npm run test

# Testes em watch mode
npm run test:watch

# Cobertura de testes
npm run test:cov
```

### Banco de Dados

```bash
# Criar migration
npx prisma migrate dev --name nome_migration

# Ver status das migrations
npx prisma migrate status

# Reset completo (⚠️ apaga dados)
npx prisma migrate reset

# Gerar Prisma Client
npx prisma generate

# Acessar Prisma Studio (interface gráfica)
npx prisma studio

# Seed do banco
npm run db:seed
```

### Docker

```bash
# Iniciar serviços
docker-compose up -d

# Ver status
docker-compose ps

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down

# Parar e remover volumes
docker-compose down -v
```

---

## Troubleshooting

### Erro: "ECONNREFUSED" ao conectar ao banco

**Causa:** Banco de dados não está rodando

**Solução:**
```bash
docker-compose up -d
docker-compose ps  # Verificar se MySQL está healthy
```

### Erro: "Prisma Client not found"

**Causa:** Cliente Prisma não foi gerado

**Solução:**
```bash
npx prisma generate
# Se persistir:
rm -rf node_modules generated
npm install
npx prisma generate
```

### Erro: "Port 3001 already in use"

**Solução:**
```bash
# Linux/Mac
lsof -ti:3001 | xargs kill -9

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

Ou altere a porta no `.env`: `PORT=3002`

### Erro: "JWT malformed" ou "Unauthorized"

**Solução:**
1. Faça login novamente
2. Verifique se `JWT_SECRET` no `.env` é consistente
3. Limpe cookies do navegador
4. Confirme que o token está sendo enviado

### Migrations Falhando

```bash
# Ver status
npx prisma migrate status

# Reset completo (⚠️ APAGA DADOS)
npx prisma migrate reset

# Resolver drift manualmente
npx prisma migrate resolve --applied <migration_name>
```

### Performance Lenta

- Verifique paginação em todos os endpoints de listagem
- Use `npx prisma studio` para analisar queries
- Ative logs do Prisma: `DEBUG=prisma:* npm run start:dev`
- Considere adicionar índices no schema

---

## Repositório Frontend

O repositório do frontend pode ser acessado em:

🔗 **[DoeCerto-Frontend](https://github.com/PauloRC0/DoeCerto-Frontend)**

---

## Boas Práticas Implementadas

### Código

- ✅ **Tipagem Forte** - TypeScript em 100% do código
- ✅ **Padrão MVC** - Separação clara de responsabilidades
- ✅ **DRY** - Evitação de repetição de código
- ✅ **SOLID** - Princípios de design aplicados
- ✅ **Nomenclatura Clara** - Nomes descritivos em inglês
- ✅ **Documentação** - Comentários explicativos onde necessário

### Banco de Dados

- ✅ **Índices Estratégicos** - Em colunas frequentemente consultadas
- ✅ **Relacionamentos Definidos** - Foreign keys e cascata
- ✅ **Constraints** - Unique, not null, default values
- ✅ **Migrations Versionadas** - Histórico completo

### Performance

- ⚡ **Queries Otimizadas** - Select específico, sem N+1
- ⚡ **Paginação** - Todos endpoints de listagem
- ⚡ **Cache** - L1 (memória) + L2 (Redis)
- ⚡ **Índices** - Estratégicos na maioria das colunas
- ⚡ **Transações** - Para operações críticas

### Segurança

- 🔐 **Autenticação Robusta** - JWT + bcrypt
- 🔐 **Autorização Granular** - RBAC com Guards
- 🔐 **Validação Multi-camada** - DTO + Service
- 🔐 **Proteção de Dados** - Nunca exponha senhas
- 🔐 **Sanitização** - Remoção automática de campos

---

## Roadmap

### Próximas Funcionalidades

- [ ] Notificações em tempo real (Socket.io/WebSockets)
- [ ] Sistema de recomendação de ONGs
- [ ] Dashboard de estatísticas para ONGs
- [ ] Chat entre doador e ONG
- [ ] Campanhas de arrecadação com metas
- [ ] Relatórios de impacto social
- [ ] Integração com gateways de pagamento
- [ ] API de webhooks para eventos
- [ ] Sistema de pontos/gamificação

### Melhorias Técnicas

- [ ] Rate limiting com Redis
- [ ] Cache avançado com estratégias
- [ ] Logs estruturados (Winston/Pino)
- [ ] Monitoramento com Prometheus/Grafana
- [ ] Testes E2E completos
- [ ] CI/CD automatizado com GitHub Actions
- [ ] Documentação Swagger/OpenAPI
- [ ] Health checks e métricas Kubernetes
- [ ] GraphQL como alternativa à REST

---

## Contribuindo

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: descrição'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

### Padrão de Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração sem mudança funcional
- `test:` Adição de testes
- `chore:` Manutenção, dependências
- `perf:` Melhorias de performance

---

## Licença

MIT License - veja o arquivo [LICENSE](LICENSE)

---

## Suporte

Para questões e suporte:

- 📧 **Email:** suporte@doecerto.com
- 🐛 **Issues:** [GitHub Issues](https://github.com/feliperasilva/DoeCerto-Mobile/issues)
- 📖 **Documentação:** [API_ENDPOINTS.md](./API_ENDPOINTS.md)

---

## Autores

- **Felipe Silva** - [@feliperasilva](https://github.com/feliperasilva)

---

<div align="center">

Desenvolvido com ❤️ usando **NestJS**

[Voltar ao Topo](#-doecerto---backend-api)

</div>
