## 🏦 Contas Bancárias de ONG (`/ongs/bank-account`)

### GET `/ongs/bank-account/:ongId/public` 🔓
- **Descrição**: Retorna dados seguros da(s) conta(s) bancária(s) de uma ONG para exibição em tela de transação
- **Autorização**: Público
- **Params**: `ongId: number`
- **Response**:
  ```json
  [
    {
      "bankName": "Banco do Brasil",
      "agencyNumber": "1234",
      "accountNumber": "56789-0",
      "accountType": "corrente"
    }
  ]
  ```

### POST `/ongs/bank-account/me` 🏢
- **Descrição**: Cria ou atualiza a conta bancária da ONG autenticada
- **Autorização**: Apenas ONGs
- **Body**: `CreateOngsBankAccountDto`
- **Response**: Dados da conta bancária criada/atualizada

### GET `/ongs/bank-account/me` 🏢
- **Descrição**: Lista todas as contas bancárias da ONG autenticada
- **Autorização**: Apenas ONGs
- **Response**: Array de contas bancárias

### PATCH `/ongs/bank-account/me` 🏢
- **Descrição**: Atualiza a conta bancária da ONG autenticada
- **Autorização**: Apenas ONGs
- **Body**: `UpdateOngsBankAccountDto`
- **Response**: Conta bancária atualizada

### DELETE `/ongs/bank-account/me` 🏢
- **Descrição**: Remove a conta bancária da ONG autenticada
- **Autorização**: Apenas ONGs
- **Response**: Conta bancária removida

# 🔐 DoeCerto API - Documentação Completa de Endpoints

**Versão**: 1.2.0  
**Data de Atualização**: 17 de janeiro de 2026  
**Status**: Em Produção

---

## 📋 Legenda de Autorização

| Símbolo | Significado |
|---------|-----------|
| 🔓 | **Public** - Sem autenticação |
| 🔒 | **Authenticated** - Requer JWT |
| 👤 | **Donor Only** - Apenas doadores |
| 🏢 | **ONG Only** - Apenas ONGs |
| 👑 | **Admin Only** - Apenas administradores |
| 🔑 | **Self or Admin** - Próprio usuário ou admin |

---

## 🔐 Autenticação (`/auth`)

### POST `/auth/login` 🔓
- **Descrição**: Login de usuário
- **Body**: `{ email: string, password: string }`
- **Response**: Cookie com JWT + mensagem de sucesso

### POST `/auth/register/donor` 🔓
- **Descrição**: Registro de novo doador
- **Body**: `{ name, email, password, cpf }`
- **Response**: Cookie com JWT + mensagem de sucesso

### POST `/auth/register/ong` 🔓
- **Descrição**: Registro de nova ONG
- **Body**: `{ name, email, password, cnpj }`
- **Response**: Cookie com JWT + mensagem de sucesso

### POST `/auth/logout` 🔒
- **Descrição**: Logout do usuário
- **Response**: Limpa cookie e retorna mensagem

### POST `/auth/forgot-password` 🔓
- **Descrição**: Solicita envio de link de recuperação de senha
- **Body**: `{ email: string }`
- **Response**: Mensagem genérica de envio (não revela existência do email)

### POST `/auth/validate-reset-token` 🔓
- **Descrição**: Valida token de reset recebido por email
- **Body**: `{ token: string }`
- **Response**: `{ valid: boolean }`

### POST `/auth/reset-password` 🔓
- **Descrição**: Redefine senha usando token válido
- **Body**: `{ token: string, newPassword: string }`
- **Response**: Mensagem de sucesso

---

## 👑 Admins (`/admins`)

> Todas as rotas abaixo exigem autenticação (`JwtAuthGuard`) e role `admin` (`RolesGuard`).

### POST `/admins` 👑
- **Descrição**: Criar novo administrador
- **Body**: `{ name: string, email: string, password: string }`
- **Response**: Admin criado

### DELETE `/admins/:adminId` 👑
- **Descrição**: Deletar administrador
- **Params**: `adminId: number`
- **Response**: `204 No Content`

### GET `/admins/ongs/status/pending` 👑
- **Descrição**: Listar ONGs pendentes de verificação

### GET `/admins/ongs/status/verified` 👑
- **Descrição**: Listar ONGs já verificadas/aprovadas

### GET `/admins/ongs/status/rejected` 👑
- **Descrição**: Listar ONGs rejeitadas

### PATCH `/admins/ongs/:ongId/verification/approve` 👑
- **Descrição**: Aprovar e marcar ONG como `verified`
- **Params**: `ongId: number`
- **Response**: ONG atualizada como `verified`

### PATCH `/admins/ongs/:ongId/verification/reject` 👑
- **Descrição**: Rejeitar ONG com justificativa (marca como `rejected`)
- **Params**: `ongId: number`
- **Body**: `{ reason: string }`

### GET `/admins/me/stats` 👑
- **Descrição**: Estatísticas do admin logado (aprovações/rejeições realizadas)

### GET `/admins/:adminId/stats` 👑
- **Descrição**: Estatísticas de um admin específico
- **Params**: `adminId: number`

## 👥 Users (`/users`)

### POST `/users` 👑
- **Descrição**: Criar usuário diretamente (não via registro)
- **Autorização**: Admin only
- **Body**: `CreateUserDto`

### GET `/users` 👑
- **Descrição**: Listar todos os usuários
- **Autorização**: Admin only

### GET `/users/me` 🔒
- **Descrição**: Visualizar próprio perfil
- **Autorização**: Usuário autenticado
- **Response**: Dados do usuário logado (ID vem do JWT)

### GET `/users/:id` 👑
- **Descrição**: Visualizar perfil de qualquer usuário
- **Autorização**: Admin only
- **Params**: `id: number`

### PATCH `/users/me` 🔒
- **Descrição**: Atualizar próprio perfil
- **Autorização**: Usuário autenticado
- **Body**: `UpdateUserDto`
- **Nota**: ID vem do JWT, não da URL

### PATCH `/users/:id` 👑
- **Descrição**: Atualizar perfil de qualquer usuário
- **Autorização**: Admin only
- **Params**: `id: number`
- **Body**: `UpdateUserDto`

### DELETE `/users/:id` 👑
- **Descrição**: Deletar usuário
- **Autorização**: Admin only
- **Params**: `id: number`

---

## 👤 Donors (`/donors`)

### POST `/donors` 🔓
- **Descrição**: Criar doador (usado apenas via `/auth/register/donor`)
- **Body**: `CreateDonorDto`
- **Nota**: Em produção, remover este endpoint público

### GET `/donors` 👑
- **Descrição**: Listar todos os doadores
- **Autorização**: Admin only
- **Query**: `skip` (default 0), `take` (default 20)

### GET `/donors/:id` 🔒
- **Descrição**: Visualizar perfil de doador
- **Autorização**: Qualquer usuário autenticado
- **Params**: `id: number`

### PATCH `/donors/me` 👤
- **Descrição**: Atualizar próprio perfil de doador
- **Autorização**: Apenas doadores
- **Body**: `UpdateDonorDto`
- **Nota**: ID do doador vem do JWT (user.id), não da URL

### DELETE `/donors/:id` 👑
- **Descrição**: Deletar doador
- **Autorização**: Admin only
- **Params**: `id: number`

---

## 🏢 ONGs (`/ongs`)

### POST `/ongs` 🔓
- **Descrição**: Criar ONG (usado apenas via `/auth/register/ong`)
- **Body**: `CreateOngDto`
- **Nota**: Em produção, remover este endpoint público

### GET `/ongs` 🔓
- **Descrição**: Listar todas as ONGs
- **Query**: `skip` (default 0), `take` (default 20)
- **Público**: Para que doadores possam navegar

### GET `/ongs/:id` 🔓
- **Descrição**: Visualizar perfil da ONG
- **Público**: Para que doadores vejam detalhes
- **Params**: `id: number`

### GET `/ongs/nearby` �
- **Descrição**: Listar ONGs verificadas dentro de 10km da localização do usuário logado
- **Autorização**: Autenticado (doador, ONG ou admin)
- **Pré-requisito**: Usuário deve ter um `address` com `latitude` e `longitude` configurados
- **Response**: 
  ```json
  {
    "data": [
      {
        "id": 1,
        "userId": 1,
        "name": "ONG Example",
        "avatarUrl": "...",
        "bannerUrl": "...",
        "bio": "...",
        "averageRating": 4.5,
        "numberOfRatings": 10,
        "distance": 2.35,
        "address": {
          "street": "Rua A",
          "number": "123",
          "neighborhood": "Centro",
          "city": "São Paulo",
          "state": "SP",
          "zipCode": "01310-100"
        }
      }
    ],
    "pagination": {
      "skip": 0,
      "take": 20,
      "total": 5,
      "pages": 1
    }
  }
  ```
- **Exemplo de Requisição**:
  ```
  GET /ongs/nearby
  Cookie: seu_jwt_token
  ```
- **Erro**: `400 Bad Request` se o usuário não tiver um endereço com localização
- **Nota**: Retorna apenas ONGs com status `verified` e endereço com latitude/longitude. Resultado ordenado por distância crescente

### PATCH `/ongs/me` 🏢
- **Descrição**: Atualizar próprio perfil da ONG
- **Autorização**: Apenas ONGs
- **Body**: `UpdateOngDto`
- **Nota**: ID da ONG vem do JWT (user.id), não da URL

### DELETE `/ongs/:id` 👑
- **Descrição**: Deletar ONG
- **Autorização**: Admin only
- **Params**: `id: number`

---

## 🎁 Donations (`/donations`)

> Todas as rotas estão protegidas por `JwtAuthGuard`; os ícones indicam requisitos adicionais de role.

### POST `/donations` 👤
- **Descrição**: Criar nova doação
- **Upload opcional**: `proofFile` (comprovante de pagamento) em `multipart/form-data`
- **Validação**: 
  - `donorId` é automaticamente o ID do usuário logado
  - ⚠️ **A ONG deve estar verificada** (`isVerified: true`)
  - A ONG deve existir no sistema

### GET `/donations` 🔒
- **Descrição**: Listar todas as doações
- **Autorização**: Qualquer usuário autenticado
- **Query**: `skip` (default 0), `take` (default 20)
- **Descrição**: Listar todas as doações
- **Autorização**: Qualquer usuário autenticado

### GET `/donations/me/sent` 👤
- **Descrição**: Listar doações enviadas pelo doa, `skip` (default 0), `take` (default 20)
- **Lógica**: Retorna doações onde `donorId` = ID do usuário logado

### GET `/donations/me/received` 🏢
- **Descrição**: Listar doações recebidas pela ONG logada
- **Autorização**: Apenas ONGs
- **Query**: `?type=monetary|material` (opcional), `skip` (default 0), `take` (default 20NG logada
- **Autorização**: Apenas ONGs
- **Query**: `?type=monetary|material` (opcional)
- **Lógica**: Retorna doações onde `ongId` = ID do usuário logado

### GET `/donations/donors/:donorId` 🔒
- **Descrição**: Listar doações de um doador específico
- **Autorização**: Próprio doador ou admin
- **Params**: `donorId: number`
- **Query**: `?type=monetary|material` (opcional)
- **Validação**: Verifica se `user.id === donorId` ou `user.role === 'admin'`

### GET `/donations/ongs/:ongId` 🔒
- **Descrição**: Listar doações para uma ONG específica
- **Autorização**: Própria ONG ou admin
- **Params**: `ongId: number`
- **Query**: `?type=monetary|material` (opcional)
- **Validação**: Verifica se `user.id === ongId` ou `user.role === 'admin'`

### GET `/donations/:id` 🔒
- **Descrição**: Visualizar doação específica
- **Autorização**: Qualquer usuário autenticado
- **Params**: `id: number`
- **Response**: Detalhes completos da doação

### PATCH `/donations/:id` 🔒
- **Descrição**: Atualizar doação
- **Autorização**: Donor (proprietário) ou ONG (destinatária)
- **Params**: `id: number`
- **Body**: `UpdateDonationDto { donationStatus?, materialDescription?, materialQuantity? }`
- **Regras de Negócio** (validadas no service):
  - **Donors** podem:
    - Atualizar descrição/quantidade de doações materiais pendentes
    - Cancelar doações pendentes
  - **ONGs** podem:
    - Marcar doações como COMPLETED ou CANCELED
    - Não podem alterar descrição/quantidade
  - **Doações monetárias**: Apenas podem ser canceladas
  - **Status terminal**: CANCELED e COMPLETED não podem ser alterados

### PATCH `/donations/:id/accept` 🏢
- **Descrição**: Aceitar doação (marca como COMPLETED)
- **Autorização**: Apenas ONG receptora
- **Params**: `id: number`
- **Status HTTP**: 200 OK
- **Validação**: ONG verificada e dona da doação

### PATCH `/donations/:id/reject` 🏢
- **Descrição**: Rejeitar doação (marca como CANCELED)
- **Autorização**: Apenas ONG receptora
- **Params**: `id: number`
- **Status HTTP**: 200 OK
- **Validação**: Doação em status PENDING

### DELETE `/donations/:id` 👤
- **Descrição**: Cancelar doação (marca como CANCELED)
- **Autorização**: Apenas doadores
- **Params**: `id: number`
- **Lógica**: Internamente chama `update` com `status: CANCELED`

---

## 👥 ONG Profiles (`/ongs`)


### POST `/ongs/me/profile` 🏢
- **Descrição**: Criar ou atualizar o perfil da ONG autenticada. Agora também permite criar/atualizar a conta bancária da ONG no mesmo request!
- **Autorização**: Apenas ONGs
- **Content-Type**: `multipart/form-data` (suporta upload de avatar)
- **Body**:
  ```json
  {
    "bio": "string (máx 500 caracteres)",
    "contactNumber": "string (máx 20 caracteres)",
    "websiteUrl": "string (máx 255 caracteres)",
    "address": "string (máx 255 caracteres)",
    "categoryIds": [1,2,3],
    "bankAccount": {
      "bankName": "Banco do Brasil",
      "agencyNumber": "1234",
      "accountNumber": "56789-0",
      "accountType": "corrente"
    },
    "file": "image file (opcional)"
  }
  ```
- **Response**: Perfil completo da ONG, incluindo avatar processado e, se enviado, dados bancários atualizados.
- **Nota**: ID da ONG vem do JWT (user.id), não da URL
- **Processamento de Imagem**:
  - Recorte automático para 1:1
  - Redimensionamento para 512x512px
  - Compressão JPEG
  - Salvo em `/uploads/profiles/`
- **Novidade**: Se o campo `bankAccount` for enviado, a conta bancária da ONG será criada ou atualizada junto com o perfil, de forma atômica.


### GET `/ongs/:ongId/profile` 🔓
- **Descrição**: Visualizar perfil público de uma ONG. Agora também retorna os dados bancários públicos da ONG!
- **Autorização**: Público (qualquer pessoa pode ver)
- **Params**: `ongId: number`
- **Response**: Perfil da ONG com avatar, dados públicos e array `bankAccounts` com as contas bancárias públicas:
  ```json
  {
    "id": 1,
    "name": "ONG Esperança",
    "avatarUrl": "/uploads/profiles/ong1.jpg",
    ...,
    "bankAccounts": [
      {
        "bankName": "Banco do Brasil",
        "agencyNumber": "1234",
        "accountNumber": "56789-0",
        "accountType": "corrente"
      }
    ]
  }
  ```

---

## 👤 Donor Profiles (`/donors`)

### POST `/donors/me/profile` 👤
- **Descrição**: Criar ou atualizar perfil do doador autenticado
- **Autorização**: Apenas doadores
- **Content-Type**: `multipart/form-data` (suporta upload de avatar em `file`)
- **Body**: `UpdateDonorProfileDto` (bio/opcionais) + `file` (imagem opcional)
- **Processamento de Imagem**: Corta 1:1, 512x512px, JPEG, salvo em `/uploads/profiles/`

### GET `/donors/me/profile` 👤
- **Descrição**: Buscar perfil do doador autenticado
- **Autorização**: Apenas doadores

### GET `/donors/:donorId/profile` 🔓
- **Descrição**: Visualizar perfil público de um doador
- **Autorização**: Público
- **Params**: `donorId: number`

---

## 🎁 Wishlist Items (`/ongs/:ongId/wishlist-items`)

### POST `/ongs/:ongId/wishlist-items` 🏢
- **Descrição**: Criar item na lista de desejos da ONG
- **Autorização**: Apenas ONGs
- **Params**: `ongId: number` (usado apenas para rota pública GET)
- **Body**:
  ```json
  {
    "description": "string (obrigatório, máx 255 caracteres)",
    "quantity": "number (obrigatório, inteiro positivo)"
  }
  ```
- **Response**: Item criado com ID
- **Nota**: Para POST, o ID da ONG vem do JWT (user.id). O `ongId` na URL é ignorado na criação.

### GET `/ongs/:ongId/wishlist-items` 🔓
- **Descrição**: Listar todos os itens da wishlist de uma ONG
- **Autorização**: Público
- **Params**: `ongId: number`
- **Response**: Array de wishlist items da ONG
- **Uso**: Doadores podem ver o que a ONG precisa

### GET `/ongs/:ongId/wishlist-items/:id` 🔓
- **Descrição**: Visualizar item específico da wishlist
- **Autorização**: Público
- **Params**: `ongId: number`, `id: number`
- **Response**: Detalhes do item

### PATCH `/ongs/:ongId/wishlist-items/:id` 🏢
- **Descrição**: Atualizar item da wishlist
- **Autorização**: Apenas ONG proprietária
- **Params**: `ongId: number`, `id: number`
- **Body**: `{ description?: string, quantity?: number }`
- **Validação**: ONG do item deve ser a mesma do path e do usuário logado

### DELETE `/ongs/:ongId/wishlist-items/:id` 🏢
- **Descrição**: Remover item da wishlist
- **Autorização**: Apenas ONG proprietária
- **Params**: `ongId: number`, `id: number`
- **Status HTTP**: 200 OK
- **Validação**: ONG do item deve ser a mesma do path e do usuário logado

---

## 📚 Catálogo de ONGs (`/catalog`)

### GET `/catalog` 🔓
- **Descrição**: Busca ONGs verificadas organizadas em 4 seções com ranking inteligente
- **Autorização**: Público
- **Query Parameters**:
  - `categoryIds` (opcional): IDs de categorias separados por vírgula (ex: `1,2,3`)
  - `limit` (opcional, default: 10): Quantidade de resultados por seção
  - `offset` (opcional, default: 0): Paginação offset-based para "ver mais"
- **Response**:
  ```json
  [
    {
      "title": "Melhor Avaliadas",
      "type": "topRated",
      "data": [
        {
          "id": 16,
          "userId": 16,
          "name": "Instituto Viver Bem",
          "averageRating": 4.5,
          "numberOfRatings": 10,
          "createdAt": "2024-12-01T03:43:26.000Z",
          "matchCount": 2,
          "user": {
            "id": 16,
            "name": "Instituto Viver Bem",
            "email": "contato@viverbem.org.br"
          },
          "categories": [
            { "id": 1, "name": "Educação" },
            { "id": 2, "name": "Saúde" }
          ]
        }
      ]
    },
    {
      "title": "Mais Recentes",
      "type": "newest",
      "data": [...]
    },
    {
      "title": "Mais Favoritas",
      "type": "topFavored",
      "data": [...]
    },
    {
      "title": "Mais Antigas",
      "type": "oldest",
      "data": [...]
    }
  ]
  ```
- **Seções Retornadas**:
  - **Melhor Avaliadas** (`topRated`): Ordenadas por `averageRating` descendente
  - **Mais Recentes** (`newest`): Ordenadas por `createdAt` descendente
  - **Mais Favoritas** (`topFavored`): Ordenadas por `numberOfRatings` descendente
  - **Mais Antigas** (`oldest`): Ordenadas por `createdAt` ascendente
- **Ranking Inteligente**:
  - Quando `categoryIds` é fornecido, ONGs com mais categorias correspondentes aparecem primeiro
  - Campo `matchCount` indica quantas categorias da ONG correspondem ao filtro
  - Dentro do mesmo `matchCount`, aplica-se a ordenação específica da seção
  - Tie-breaker final: `userId` ascendente para resultados determinísticos
- **Exemplos de Uso**:
  - Todas as ONGs: `GET /catalog`
  - Com filtro: `GET /catalog?categoryIds=1,2,3`
  - Paginação: `GET /catalog?limit=10&offset=10`
  - Completo: `GET /catalog?categoryIds=1,2&limit=5&offset=0`

---

## 🏷️ Categorias (`/categories`)

### POST `/categories` 👑
- **Descrição**: Criar nova categoria
- **Autorização**: Admin only
- **Body**: `{ name: string }`
- **Response**: Categoria criada
- **Validação**: Nome único (conflict se já existe)

### GET `/categories` 🔓
- **Descrição**: Listar categorias paginadas
- **Autorização**: Público
- **Query**: `skip` (default: 0), `take` (default: 10, max: 100)
- **Response**:
  ```json
  {
    "data": [
      { "id": 1, "name": "Educação", "createdAt": "...", "updatedAt": "..." }
    ],
    "pagination": {
      "skip": 0,
      "take": 10,
      "total": 12,
      "pages": 2
    }
  }
  ```
- **Nota**: Ordenação alfabética por nome

### GET `/categories/:id` 🔓
- **Descrição**: Buscar categoria específica
- **Autorização**: Público
- **Params**: `id: number`

### PATCH `/categories/:id` 👑
- **Descrição**: Atualizar categoria
- **Autorização**: Admin only
- **Params**: `id: number`
- **Body**: `{ name: string }`

### DELETE `/categories/:id` 👑
- **Descrição**: Deletar categoria
- **Autorização**: Admin only
- **Params**: `id: number`

---

## ⭐ Ratings de ONG (`/ongs/:ongId/ratings`)

### POST `/ongs/:ongId/ratings` 👤
- **Descrição**: Criar ou atualizar nota de uma ONG
- **Autorização**: Apenas doadores
- **Params**: `ongId: number`
- **Body**: `RatingDto { score: number, comment?: string }`

### GET `/ongs/:ongId/ratings` 🔓
- **Descrição**: Listar todas as notas/comentários de uma ONG
- **Autorização**: Público
- **Params**: `ongId: number`
- **Query**: `skip` (default: 0), `take` (default: 20)

---

## 🔒 Sistema de Autenticação e Autorização

### Guards Implementados

#### JwtAuthGuard
- Valida JWT do cookie/header
- Injeta usuário no contexto
- Retorna 401 se inválido/ausente

#### RolesGuard
- Verifica role do usuário contra `@Roles()`
- Retorna 403 se não autorizado
- Sempre usado em conjunto com JwtAuthGuard

### Roles Disponíveis

| Role | Descrição | Permissões |
|------|-----------|-----------|
| `donor` | Doador | Criar doações, ver próprio histórico |
| `ong` | Organização | Receber doações, gerenciar perfil e wishlist |
| `admin` | Administrador | Verificar ONGs, gerenciar admins, ver estatísticas |

### Decorators Personalizados

```typescript
@Roles('donor', 'ong')  // Controla autorização
@CurrentUser()           // Injeta usuário logado
@UseGuards(JwtAuthGuard, RolesGuard) // Aplica guards
```

---

## 📊 Estrutura de Dados

### Enums Importantes

#### DonationType
- `monetary`: Doação em dinheiro
- `material`: Doação de materiais

#### DonationStatus
- `pending`: Aguardando resposta da ONG
- `completed`: Aceita pela ONG
- `canceled`: Cancelada pelo doador ou ONG

#### VerificationStatus
- `pending`: Aguardando verificação admin
- `verified`: Aprovada por admin
- `rejected`: Rejeitada por admin

#### Role
- `donor`: Pessoa física doadora
- `ong`: Organização não-governamental
- `admin`: Administrador do sistema

---

## 🎯 Fluxos de Negócio

### 1️⃣ Fluxo de Registro e Autenticação
```
Novo Usuário → POST /auth/register/donor|ong 
            → Valida dados (email, CPF/CNPJ)
            → Hash senha (bcrypt 10 rounds)
            → Transação: cria User + Donor/Ong
            → Gera JWT
            → Retorna token em cookie httpOnly
            → Usuário autenticado ✅
```

### 2️⃣ Fluxo de Doação Monetária
```
Doador → POST /donations (monetário)
      → Valida ONG existe e está verificada
      → Cria doação com status PENDING
      → ONG recebe notificação (futura)
      
ONG → GET /donations/received
   → Vê doação
   → PATCH /donations/:id/accept
   → Status muda para COMPLETED ✅
```

### 3️⃣ Fluxo de Doação Material
```
Doador → POST /donations (material)
       → Inclui description e quantity
       → Cria doação com status PENDING
       
ONG → PATCH /donations/:id (atualiza description/quantity)
   → Ou PATCH /donations/:id/accept
   
Doador → Pode PATCH para atualizar enquanto PENDING
       → Ou DELETE para cancelar
```

### 4️⃣ Fluxo de Verificação de ONG (Admin)
```
ONG registra → verificationStatus = pending

Admin → GET /admins/ongs/pending
     → Vê lista de ONGs aguardando
     → PATCH /admins/ongs/:ongId/approve
     → VerificationStatus = verified
     
Agora ONGs podem receber doações ✅
```

### 5️⃣ Fluxo de Perfil e Wishlist da ONG
```
ONG (autenticada) → POST /ongs/me/profile
  → ID da ONG vem do JWT
  → Envia: bio, contactNumber, websiteUrl, address, avatar
  → Avatar processado: 512x512px, JPEG
  → Salvo em /uploads/profiles/
    
ONG (autenticada) → POST /ongs/:ongId/wishlist-items
  → ongId na URL é ignorado para POST, usa user.id do JWT
  → Adiciona itens que precisa
    
Doadores (público) → GET /ongs/:ongId/profile
    → Vê perfil e avatar
    → GET /ongs/:ongId/wishlist-items
    → Vê o que a ONG precisa
    → GET /ongs/:ongId/ratings
    → Vê avaliações da ONG
```

---

## 💡 Exemplos de Uso com cURL

### 1. Registrar como Doador
```bash
curl -X POST http://localhost:3000/auth/register/donor \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "senha123",
    "cpf": "12345678901"
  }' \
  -c cookies.txt
```

### 2. Registrar como ONG
```bash
curl -X POST http://localhost:3000/auth/register/ong \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ONG Esperança",
    "email": "ong@example.com",
    "password": "senha123",
    "cnpj": "12345678000195"
  }' \
  -c cookies.txt
```

### 3. Criar Doação Monetária
```bash
curl -X POST http://localhost:3000/donations \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "ongId": 1,
    "donationType": "monetary",
    "monetaryAmount": 100.00,
    "monetaryCurrency": "BRL"
  }'
```

### 4. Criar Doação Material
```bash
curl -X POST http://localhost:3000/donations \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "ongId": 1,
    "donationType": "material",
    "materialDescription": "5 caixas de alimentos não-perecíveis",
    "materialQuantity": 5
  }'
```

### 5. Enviar Comprovante de Pagamento
```bash
curl -X POST http://localhost:3000/donations \
  -F "proofFile=@/caminho/para/comprovante.jpg" \
  -F 'createDonationDto={
    "ongId": 1,
    "donationType": "monetary",
    "monetaryAmount": 50.00,
    "monetaryCurrency": "BRL"
  };type=application/json' \
  -b cookies.txt
```

### 6. Atualizar Perfil de ONG
```bash
curl -X POST http://localhost:3000/ongs/1/profile \
  -F "file=@/caminho/para/avatar.jpg" \
  -F 'createOngProfileDto={
    "bio": "ONG focada em educação infantil",
    "contactNumber": "(11) 98765-4321",
    "websiteUrl": "https://exemplo.org",
    "address": "Rua das Flores, 123, São Paulo"
  };type=application/json' \
  -b cookies.txt
```

### 7. Listar Doações Enviadas (Doador)
```bash
curl -X GET http://localhost:3000/donations/me/sent \
  -b cookies.txt
```

### 8. Listar Doações Recebidas (ONG)
```bash
curl -X GET http://localhost:3000/donations/me/received \
  -b cookies.txt
```

### 9. Aceitar Doação (ONG)
```bash
curl -X PATCH http://localhost:3000/donations/1/accept \
  -b cookies.txt
```

### 10. Listar ONGs Pendentes (Admin)
```bash
curl -X GET http://localhost:3000/admins/ongs/status/pending \
  -b cookies.txt
```

### 11. Aprovar ONG (Admin)
```bash
curl -X PATCH http://localhost:3000/admins/ongs/1/verification/approve \
  -b cookies.txt
```

### 12. Rejeitar ONG (Admin)
```bash
curl -X PATCH http://localhost:3000/admins/ongs/1/verification/reject \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"reason": "Documentação incompleta"}'
```

### 13. Ver Wishlist de ONG
```bash
curl -X GET http://localhost:3000/ongs/1/wishlist-items
```

### 14. Adicionar Item à Wishlist (ONG)
```bash
curl -X POST http://localhost:3000/ongs/1/wishlist-items \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "description": "Notebooks para aula de informática",
    "quantity": 10
  }'
```

### 15. Avaliar ONG (Doador)
```bash
curl -X POST http://localhost:3000/ongs/1/ratings \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "score": 5,
    "comment": "Excelente transparência"
  }'
```

### 16. Listar Avaliações de ONG
```bash
curl -X GET http://localhost:3000/ongs/1/ratings
```

---

## ⚠️ Códigos de Status HTTP e Tratamento de Erros

### Sucesso (2xx)
- `200 OK`: Requisição bem-sucedida, retorna dados
- `201 Created`: Recurso criado (POST bem-sucedido)
- `204 No Content`: Operação bem-sucedida, sem corpo

### Erros de Cliente (4xx)

#### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Cannot donate to an unverified ONG. Please choose a verified organization."
}
```
Causas comuns:
- ONG não verificada
- Doação monetária com campos materiais
- Atualizar doação COMPLETED/CANCELED
- CPF/CNPJ inválido
- Email já registrado

#### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```
Causas:
- JWT ausente ou inválido
- Cookie expirado
- Credenciais incorretas no login

#### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```
Causas:
- Role insuficiente (ex: donor tentando ser ONG)
- Tentando atualizar perfil de outro usuário
- ONG tentando alterar dados de outro item wishlist

#### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "ONG with id 999 not found"
}
```

#### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Email already in use"
}
```

### Erros de Servidor (5xx)
- `500 Internal Server Error`: Erro no servidor

---

## 🔐 Segurança Implementada

### Autenticação
- ✅ JWT com assinatura HMAC
- ✅ Senhas hasheadas com bcrypt (10 rounds)
- ✅ Cookies httpOnly (não acessível via JavaScript)
- ✅ CORS configurado apenas para frontend

### Autorização
- ✅ Guards em todos os endpoints protegidos
- ✅ Verificação de propriedade (pode-se atualizar apenas próprios dados)
- ✅ Validação de role em controllers

### Validação de Dados
- ✅ DTOs com class-validator
- ✅ Validações brasileiras (CPF, CNPJ)
- ✅ ParseIntPipe para IDs
- ✅ Whitelist de campos em DTOs

### Proteção de Dados
- ✅ Senhas nunca retornadas em responses
- ✅ Transações Prisma para atomicidade
- ✅ Soft delete não implementado (dados históricos mantidos)

---

## 📝 Notas Importantes de Implementação

### 1. Endpoints para Remover em Produção
Os seguintes endpoints são públicos e devem ser removidos/protegidos:
- `POST /donors` - Use apenas `/auth/register/donor`
- `POST /ongs` - Use apenas `/auth/register/ong`

### 2. Tratamento de Imagens
- **Avatares**: Processados com Sharp, reduzidos para 512x512px
- **Comprovantes**: Armazenados originais em `/uploads/payment-proofs/`
- **Localização**: `/uploads/` na raiz do backend

### 3. Regras de Negócio Críticas
- ❌ Não é possível doar para ONG não verificada
- ❌ Doações monetárias só podem ser canceladas
- ❌ Doações em status COMPLETED/CANCELED não podem ser alteradas
- ✅ Doações nunca são deletadas, apenas marcadas como CANCELED

### 4. Transações Garantidas
- Criação de User + Donor/Ong é atômica
- Se falhar, nada é criado

### 5. Histórico e Auditoria
- Todas as doações são mantidas (incluindo canceladas)
- Campo `updatedAt` registra últimas mudanças
- Campo `verifiedAt` registra quando ONG foi verificada

### 6. Performance
Para otimização, ver: `PERFORMANCE_OPTIMIZATION_REPORT.md`

---

## 📞 Suporte e Contato

Para dúvidas sobre a API, consulte:
- 📖 [Relatório de Otimização](./PERFORMANCE_OPTIMIZATION_REPORT.md)
- 📋 [README](./README.md)

---

**Última atualização**: 17 de janeiro de 2026  
**Versão da API**: 1.2.0  
**Status**: Em Produção ✅
