# 🎁 DoeCerto API - Documentação Completa

**Versão**: 1.2.0  
**Data de Atualização**: 13 de fevereiro de 2026  
**Status**: Em Produção  
**Base URL**: `http://localhost:3001` (desenvolvimento) | `https://api.doecerto.com.br` (produção)

---

## 📋 Índice

1. [Legenda de Autorização](#legenda-de-autorização)
2. [Autenticação](#autenticação)
3. [Usuários](#usuários)
4. [Doadores](#doadores)
5. [ONGs](#ongs)
6. [Perfis](#perfis)
7. [Doações](#doações)
8. [Categorias](#categorias)
9. [Avaliações](#avaliações)
10. [Endereços](#endereços)
11. [Contas Bancárias](#contas-bancárias)
12. [Wishlist](#wishlist)
13. [Catálogo](#catálogo)
14. [Administração](#administração)
15. [Códigos de Status HTTP](#códigos-de-status-http)
16. [Exemplos de Requisições](#exemplos-de-requisições)

---

## Legenda de Autorização

| Símbolo | Significado | Descrição |
|---------|-----------|-----------|
| 🔓 | **Public** | Sem autenticação obrigatória |
| 🔒 | **Authenticated** | Requer JWT válido |
| 👤 | **Donor Only** | Apenas doadores |
| 🏢 | **ONG Only** | Apenas ONGs |
| 👑 | **Admin Only** | Apenas administradores |
| 🔑 | **Self or Admin** | Próprio usuário ou administrador |

---

# 🔐 AUTENTICAÇÃO

## POST `/auth/login` 🔓

Autentica um usuário existente.

**Request Body:**
```json
{
  "email": "usuario@example.com",
  "password": "senha123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@example.com",
    "role": "donor"
  }
}
```

**Erros Possíveis:**
- `401 Unauthorized` - Email ou senha inválidos

---

## POST `/auth/register/donor` 🔓

Registra um novo doador.

**Request Body:**
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123",
  "cpf": "123.456.789-00"
}
```

**Response (201 Created):**
```json
{
  "message": "Donor registered successfully",
  "accessToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@example.com",
    "role": "donor"
  },
  "profile": {
    "userId": 1,
    "cpf": "123.456.789-00"
  }
}
```

**Validações:**
- CPF deve ser válido (formato: 000.000.000-00)
- Email deve ser único
- Senha mínimo 8 e máximo 128 caracteres

**Erros Possíveis:**
- `409 Conflict` - Email ou CPF já registrado
- `400 Bad Request` - CPF ou email inválidos

---

## POST `/auth/register/ong` 🔓

Registra uma nova ONG.

**Request Body:**
```json
{
  "name": "ONG Esperança",
  "email": "contato@ongesperanca.com",
  "password": "senha123",
  "cnpj": "12.345.678/0001-90"
}
```

**Response (201 Created):**
```json
{
  "message": "ONG registered successfully",
  "accessToken": "eyJhbGc...",
  "user": {
    "id": 2,
    "name": "ONG Esperança",
    "email": "contato@ongesperanca.com",
    "role": "ong"
  },
  "profile": {
    "userId": 2,
    "cnpj": "12.345.678/0001-90",
    "verificationStatus": "pending"
  }
}
```

**Validações:**
- CNPJ deve ser válido (formato: 00.000.000/0000-00)
- Email deve ser único
- Senha mínimo 8 e máximo 128 caracteres

**Erros Possíveis:**
- `409 Conflict` - Email ou CNPJ já registrado
- `400 Bad Request` - CNPJ ou email inválidos

---

## POST `/auth/logout` 🔒

Realiza logout do usuário autenticado.

**Response (200 OK):**
```json
{
  "message": "Logout successful"
}
```

---

## POST `/auth/forgot-password` 🔓

Solicita link de recuperação de senha.

**Request Body:**
```json
{
  "email": "usuario@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Se o email existir na plataforma, um link de recuperação será enviado"
}
```

**Nota:** Resposta genérica por segurança (não revela se email existe)

---

## POST `/auth/validate-reset-token` 🔓

Valida um token de reset de senha.

**Request Body:**
```json
{
  "token": "token_hash_aqui"
}
```

**Response (200 OK):**
```json
{
  "valid": true
}
```

---

## POST `/auth/reset-password` 🔓

Redefine a senha usando um token válido.

**Request Body:**
```json
{
  "token": "token_hash_aqui",
  "newPassword": "nova_senha_123"
}
```

**Response (200 OK):**
```json
{
  "message": "Senha atualizada com sucesso"
}
```

**Validações:**
- Nova senha mínimo 8 e máximo 128 caracteres

**Erros Possíveis:**
- `400 Bad Request` - Token inválido ou expirado

---

# 👥 USUÁRIOS

## POST `/users` 👑

Cria um novo usuário diretamente (uso administrativo).

**Request Body:**
```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "senha123",
  "role": "admin"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "name": "Admin User",
  "email": "admin@example.com",
  "role": "admin",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

## GET `/users` 👑

Lista todos os usuários (com paginação).

**Query Parameters:**
- `skip` (int, default: 0) - Número de registros a pular
- `take` (int, default: 20, máx: 100) - Quantidade de registros

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "João Silva",
      "email": "joao@example.com",
      "role": "donor",
      "createdAt": "2024-01-01T08:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "skip": 0,
    "take": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## GET `/users/me` 🔒

Obtém dados do usuário autenticado.

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "João Silva",
  "email": "joao@example.com",
  "role": "donor",
  "createdAt": "2024-01-01T08:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

## GET `/users/:id` 👑

Obtém dados de um usuário específico.

**Response (200 OK):**
```json
{
  "id": 5,
  "name": "Maria Santos",
  "email": "maria@example.com",
  "role": "ong",
  "createdAt": "2024-01-05T12:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

## PATCH `/users/me` 🔒

Atualiza dados do usuário autenticado.

**Request Body:**
```json
{
  "name": "João Silva Atualizado",
  "email": "joao.novo@example.com"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "João Silva Atualizado",
  "email": "joao.novo@example.com",
  "role": "donor",
  "createdAt": "2024-01-01T08:00:00Z",
  "updatedAt": "2024-01-15T15:45:00Z"
}
```

---

## PATCH `/users/:id` 👑

Atualiza dados de um usuário específico (admin).

**Request Body:**
```json
{
  "name": "Nome Atualizado",
  "password": "nova_senha"
}
```

**Response (200 OK):**
Similar ao PATCH `/users/me`

---

## DELETE `/users/:id` 👑

Deleta um usuário.

**Response (204 No Content)**

---

# 👤 DOADORES

## POST `/donors` 🔓

Cria um novo doador (geralmente via `POST /auth/register/donor`).

**Request Body:**
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123",
  "cpf": "123.456.789-00"
}
```

**Response (201 Created):**
```json
{
  "userId": 1,
  "cpf": "123.456.789-00",
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@example.com"
  }
}
```

---

## GET `/donors` 👑

Lista todos os doadores.

**Query Parameters:**
- `skip` (int, default: 0)
- `take` (int, default: 20, máx: 100)

**Response (200 OK):**
```json
{
  "data": [
    {
      "userId": 1,
      "cpf": "123.456.789-00",
      "user": {
        "id": 1,
        "name": "João Silva",
        "email": "joao@example.com"
      }
    }
  ],
  "pagination": {
    "skip": 0,
    "take": 20,
    "total": 500,
    "pages": 25
  }
}
```

---

## GET `/donors/:id` 🔒

Obtém dados de um doador específico.

**Response (200 OK):**
```json
{
  "userId": 1,
  "cpf": "123.456.789-00",
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@example.com"
  }
}
```

---

## PATCH `/donors/me` 👤

Atualiza dados do doador autenticado.

**Request Body:**
```json
{
  "cpf": "987.654.321-00"
}
```

**Response (200 OK):**
```json
{
  "userId": 1,
  "cpf": "987.654.321-00",
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@example.com"
  }
}
```

---

## DELETE `/donors/:id` 👑

Deleta um doador.

**Response (204 No Content)**

---

# 🏢 ONGs

## POST `/ongs` 🔓

Cria uma nova ONG (geralmente via `POST /auth/register/ong`).

**Request Body:**
```json
{
  "name": "ONG Esperança",
  "email": "contato@ongesperanca.com",
  "password": "senha123",
  "cnpj": "12.345.678/0001-90"
}
```

**Response (201 Created):**
```json
{
  "userId": 2,
  "cnpj": "12.345.678/0001-90",
  "verificationStatus": "pending",
  "user": {
    "id": 2,
    "name": "ONG Esperança",
    "email": "contato@ongesperanca.com"
  }
}
```

---

## GET `/ongs` 🔓

Lista todas as ONGs (paginado).

**Query Parameters:**
- `skip` (int, default: 0)
- `take` (int, default: 20, máx: 100)

**Response (200 OK):**
```json
{
  "data": [
    {
      "userId": 2,
      "cnpj": "12.345.678/0001-90",
      "verificationStatus": "verified",
      "verifiedAt": "2024-01-10T14:00:00Z",
      "user": {
        "id": 2,
        "name": "ONG Esperança",
        "email": "contato@ongesperanca.com"
      }
    }
  ],
  "pagination": {
    "skip": 0,
    "take": 20,
    "total": 250,
    "pages": 13
  }
}
```

---

## GET `/ongs/:id` 🔓

Obtém dados de uma ONG específica.

**Response (200 OK):**
```json
{
  "userId": 2,
  "cnpj": "12.345.678/0001-90",
  "verificationStatus": "verified",
  "verifiedAt": "2024-01-10T14:00:00Z",
  "user": {
    "id": 2,
    "name": "ONG Esperança",
    "email": "contato@ongesperanca.com"
  }
}
```

---

## GET `/ongs/nearby` 🔒

Lista ONGs verificadas dentro de 10km da localização do usuário.

**Pré-requisitos:**
- Usuário autenticado
- Usuário deve ter endereço com latitude e longitude configurados

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 2,
      "userId": 2,
      "name": "ONG Esperança",
      "avatarUrl": "/uploads/profiles/ong-esperanca.jpg",
      "bannerUrl": "/uploads/profiles/ong-esperanca-banner.jpg",
      "bio": "Dedicada à educação infantil",
      "averageRating": 4.5,
      "numberOfRatings": 10,
      "distance": 2.35,
      "address": {
        "street": "Rua das Flores",
        "number": "123",
        "neighborhood": "Centro",
        "city": "São Paulo",
        "state": "SP",
        "zipCode": "01234-567"
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

**Erros Possíveis:**
- `400 Bad Request` - Usuário sem endereço com localização

---

## PATCH `/ongs/me` 🏢

Atualiza dados da ONG autenticada.

**Request Body:**
```json
{
  "cnpj": "98.765.432/0001-10"
}
```

**Response (200 OK):**
```json
{
  "userId": 2,
  "cnpj": "98.765.432/0001-10",
  "verificationStatus": "verified",
  "verifiedAt": "2024-01-10T14:00:00Z",
  "user": {
    "id": 2,
    "name": "ONG Esperança",
    "email": "contato@ongesperanca.com"
  }
}
```

---

## DELETE `/ongs/:id` 👑

Deleta uma ONG.

**Response (204 No Content)**

---

# 👤 PERFIS

## POST `/donors/me/profile` 👤

Cria ou atualiza o perfil do doador autenticado.

⚠️ **IMPORTANTE:** O perfil do doador é **OPCIONAL** e pode ser criado a qualquer momento após o registro. Não é necessário criar o perfil no cadastro.

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `file` (file, opcional) - Imagem de avatar
- `bio` (string, max 500 caracteres, opcional)
- `contactNumber` (string, max 20 caracteres, opcional)

**Response (200 OK):**
```json
{
  "id": 1,
  "donorId": 1,
  "bio": "Apaixonado por causas sociais",
  "avatarUrl": "/uploads/profiles/avatar-12345.jpg",
  "contactNumber": "(11) 9 9999-8888",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "donor": {
    "userId": 1,
    "cpf": "123.456.789-00",
    "user": {
      "id": 1,
      "name": "João Silva",
      "email": "joao@example.com"
    }
  }
}
```

---

## GET `/donors/me/profile` 👤

Obtém o perfil do doador autenticado.

**Response (200 OK):** Retorna o perfil quando ele existe
Similar ao POST, sem o campo `createdAt`

**Response (204 No Content):** Quando o doador ainda não criou seu perfil (é opcional)

---

## GET `/donors/:donorId/profile` 🔓

Obtém o perfil público de um doador.

**Response (200 OK):** Retorna o perfil quando ele existe
Similar ao GET `/donors/me/profile`

**Erros Possíveis:**
- `404 Not Found` - Quando o doador não tem um perfil criado (perfil é opcional)

---

## POST `/ongs/me/profile` 🏢

Cria ou atualiza o perfil da ONG autenticada.

⚠️ **IMPORTANTE:** O perfil da ONG é **OPCIONAL** e pode ser criado a qualquer momento após o registro.

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `avatar` (file, opcional) - Imagem do avatar (512x512)
- `banner` (file, opcional) - Imagem do banner (1920x1080)
- `bio` (string, max 500 caracteres, opcional)
- `contactNumber` (string, max 20 caracteres, opcional)
- `websiteUrl` (string, max 255 caracteres, opcional)
- `categoryIds[]` (integer array, opcional) - IDs das categorias
- `bankAccount` (JSON object, opcional) - Dados da conta bancária

**Exemplo com cURL:**
```bash
curl -X POST http://localhost:3001/ongs/me/profile \
  -H "Authorization: Bearer TOKEN" \
  -F "avatar=@avatar.jpg" \
  -F "banner=@banner.jpg" \
  -F "bio=ONG dedicada à educação" \
  -F "contactNumber=(11) 98765-4321" \
  -F "categoryIds=1" \
  -F "categoryIds=2"
```

**Response (200 OK):**
```json
{
  "id": 1,
  "ongId": 2,
  "bio": "ONG dedicada à educação",
  "avatarUrl": "/uploads/profiles/avatar-12345.jpg",
  "bannerUrl": "/uploads/profiles/banner-12345.jpg",
  "contactNumber": "(11) 98765-4321",
  "websiteUrl": "https://ongesperanca.com.br",
  "categories": [
    {
      "id": 1,
      "name": "Educação"
    },
    {
      "id": 2,
      "name": "Saúde"
    }
  ],
  "ong": {
    "userId": 2,
    "cnpj": "12.345.678/0001-90",
    "averageRating": 4.5,
    "numberOfRatings": 10,
    "user": {
      "id": 2,
      "name": "ONG Esperança",
      "email": "contato@ongesperanca.com"
    }
  }
}
```

---

## GET `/ongs/:ongId/profile` 🔓

Obtém o perfil completo e público de uma ONG.

**Response (200 OK):**
```json
{
  "id": 2,
  "name": "ONG Esperança",
  "email": "contato@ongesperanca.com",
  "avatarUrl": "/uploads/profiles/avatar-12345.jpg",
  "bannerUrl": "/uploads/profiles/banner-12345.jpg",
  "about": "ONG dedicada à educação infantil",
  "contactNumber": "(11) 98765-4321",
  "websiteUrl": "https://ongesperanca.com.br",
  "receivedDonations": 45,
  "rating": {
    "average": 4.5,
    "count": 10
  },
  "categories": [
    {
      "id": 1,
      "name": "Educação"
    },
    {
      "id": 2,
      "name": "Saúde"
    }
  ],
  "address": {
    "street": "Rua das Flores",
    "number": "123",
    "neighborhood": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234-567",
    "latitude": -23.5505,
    "longitude": -46.6333
  },
  "bankAccounts": [
    {
      "bankName": "Banco do Brasil",
      "agencyNumber": "1234-5",
      "accountNumber": "12345-6",
      "accountType": "Corrente",
      "pixKey": "contato@ongesperanca.com.br"
    }
  ],
  "createdAt": "2024-01-10T14:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Erros Possíveis:**
- `404 Not Found` - Quando a ONG ainda não criou o perfil (perfil é opcional)

---

# 💝 DOAÇÕES

## POST `/donations` 👤

Cria uma nova doação.

**Content-Type:** `multipart/form-data` (se houver comprovante)

**Form Fields:**
- `proofFile` (file, opcional) - Comprovante de pagamento (JPG, PNG, PDF)
- `createDonationDto` (JSON, obrigatório)

**JSON Body (createDonationDto):**
```json
{
  "ongId": 2,
  "donationType": "monetary",
  "monetaryAmount": 150.50,
  "monetaryCurrency": "BRL"
}
```

**Ou para material:**
```json
{
  "ongId": 2,
  "donationType": "material",
  "materialDescription": "Alimentos não-perecíveis",
  "materialQuantity": 10
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "donationType": "monetary",
  "donationStatus": "pending",
  "monetaryAmount": 150.50,
  "monetaryCurrency": "BRL",
  "materialDescription": null,
  "materialQuantity": null,
  "proofOfPaymentUrl": "/uploads/payment-proofs/proof-12345.jpg",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "ong": {
    "userId": 2,
    "cnpj": "12.345.678/0001-90",
    "verificationStatus": "verified",
    "user": {
      "id": 2,
      "name": "ONG Esperança",
      "email": "contato@ongesperanca.com"
    }
  },
  "donor": {
    "userId": 1,
    "cpf": "123.456.789-00",
    "user": {
      "id": 1,
      "name": "João Silva",
      "email": "joao@example.com"
    }
  }
}
```

**Validações:**
- ONG deve estar verificada (`verificationStatus: "verified"`)
- ONG deve existir
- Campos adequados ao tipo de doação

**Erros Possíveis:**
- `400 Bad Request` - ONG não verificada ou dados inválidos
- `404 Not Found` - ONG não encontrada

---

## GET `/donations` 🔒

Lista todas as doações (paginado).

**Query Parameters:**
- `skip` (int, default: 0)
- `take` (int, default: 20, máx: 100)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "donationType": "monetary",
      "donationStatus": "pending",
      "monetaryAmount": 150.50,
      "monetaryCurrency": "BRL",
      "createdAt": "2024-01-15T10:30:00Z",
      "ong": { ... },
      "donor": { ... }
    }
  ],
  "pagination": {
    "skip": 0,
    "take": 20,
    "total": 1000,
    "pages": 50
  }
}
```

---

## GET `/donations/me/sent` 👤

Lista doações enviadas pelo doador autenticado.

**Query Parameters:**
- `type` (string, opcional) - Filtrar por tipo: `monetary` ou `material`
- `skip` (int, default: 0)
- `take` (int, default: 20, máx: 100)

**Response (200 OK):**
Similar ao GET `/donations`

---

## GET `/donations/me/received` 🏢

Lista doações recebidas pela ONG autenticada.

**Query Parameters:**
- `type` (string, opcional) - `monetary` ou `material`
- `skip` (int, default: 0)
- `take` (int, default: 20, máx: 100)

**Response (200 OK):**
Similar ao GET `/donations`

---

## GET `/donations/:id` 🔒

Obtém detalhes de uma doação específica.

**Response (200 OK):**
```json
{
  "id": 1,
  "donationType": "monetary",
  "donationStatus": "pending",
  "monetaryAmount": 150.50,
  "monetaryCurrency": "BRL",
  "materialDescription": null,
  "materialQuantity": null,
  "proofOfPaymentUrl": "/uploads/payment-proofs/proof-12345.jpg",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "verifiedAt": null,
  "ong": { ... },
  "donor": { ... }
}
```

---

## PATCH `/donations/:id` 🔒

Atualiza uma doação.

**Permissões:**
- **Doador**: Pode atualizar descrição/quantidade de materiais pendentes, cancelar
- **ONG**: Pode marcar como COMPLETED ou CANCELED
- Doações monetárias: Apenas podem ser canceladas ou aceitas

**Request Body:**
```json
{
  "donationStatus": "completed",
  "materialDescription": "Alimentos atualizados",
  "materialQuantity": 15
}
```

**Response (200 OK):**
Retorna doação atualizada

**Validações:**
- Doações COMPLETED/CANCELED não podem ser alteradas
- Cada role tem permissões específicas

---

## PATCH `/donations/:id/accept` 🏢

Aceita uma doação (marca como COMPLETED).

**Response (200 OK):**
Retorna doação com status atualizado

---

## PATCH `/donations/:id/reject` 🏢

Rejeita uma doação (marca como CANCELED).

**Response (200 OK):**
Retorna doação com status atualizado

---

## DELETE `/donations/:id` 👤

Cancela uma doação (apenas doadores).

**Response (204 No Content)**

---

# 🏷️ CATEGORIAS

## POST `/categories` 👑

Cria uma nova categoria.

**Request Body:**
```json
{
  "name": "Educação"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "name": "Educação",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Erros Possíveis:**
- `409 Conflict` - Categoria com este nome já existe

---

## GET `/categories` 🔓

Lista todas as categorias (paginado, alfabético).

**Query Parameters:**
- `skip` (int, default: 0)
- `take` (int, default: 10, máx: 100)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Assistência Social",
      "createdAt": "2024-01-01T08:00:00Z",
      "updatedAt": "2024-01-01T08:00:00Z"
    },
    {
      "id": 2,
      "name": "Cultura e Arte",
      "createdAt": "2024-01-01T08:00:00Z",
      "updatedAt": "2024-01-01T08:00:00Z"
    }
  ],
  "pagination": {
    "skip": 0,
    "take": 10,
    "total": 12,
    "pages": 2
  }
}
```

---

## GET `/categories/:id` 🔓

Obtém uma categoria específica.

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Educação",
  "createdAt": "2024-01-01T08:00:00Z",
  "updatedAt": "2024-01-01T08:00:00Z"
}
```

---

## PATCH `/categories/:id` 👑

Atualiza uma categoria.

**Request Body:**
```json
{
  "name": "Educação e Capacitação"
}
```

**Response (200 OK):**
Categoria atualizada

---

## DELETE `/categories/:id` 👑

Deleta uma categoria.

**Response (204 No Content)**

---

# ⭐ AVALIAÇÕES

## POST `/ongs/:ongId/ratings` 👤

Cria ou atualiza a avaliação de uma ONG (apenas doadores).

**Pré-requisito:** Doador deve ter doado para a ONG

**Request Body:**
```json
{
  "score": 5,
  "comment": "Excelente transparência e impacto"
}
```

**Response (201 Created / 200 Updated):**
```json
{
  "id": 1,
  "score": 5,
  "comment": "Excelente transparência e impacto",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "ongId": 2,
  "donorId": 1
}
```

**Validações:**
- Score entre 1 e 5
- Doador deve ter realizado doação para a ONG

**Erros Possíveis:**
- `403 Forbidden` - Doador nunca doou para esta ONG
- `404 Not Found` - ONG não encontrada

---

## GET `/ongs/:ongId/ratings` 🔓

Lista todas as avaliações de uma ONG.

**Query Parameters:**
- `skip` (int, default: 0)
- `take` (int, default: 20, máx: 100)

**Response (200 OK):**
```json
[
  {
    "score": 5,
    "comment": "Excelente organização",
    "createdAt": "2024-01-15T10:30:00Z",
    "donor": {
      "user": {
        "name": "João Silva"
      }
    }
  }
]
```

---

# 📍 ENDEREÇOS

## POST `/addresses` 🔒

Cria um novo endereço. Geocodifica automaticamente se não houver coordenadas.

**Request Body:**
```json
{
  "street": "Rua das Flores",
  "number": "123",
  "complement": "Apartamento 42",
  "neighborhood": "Centro",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01234-567",
  "country": "Brasil",
  "latitude": -23.5505,
  "longitude": -46.6333
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "street": "Rua das Flores",
  "number": "123",
  "complement": "Apartamento 42",
  "neighborhood": "Centro",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01234-567",
  "country": "Brasil",
  "latitude": -23.5505,
  "longitude": -46.6333,
  "donorId": 1,
  "ongId": null,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

## GET `/addresses` 🔐

Lista todos os endereços.

**Response (200 OK):**
Array de endereços

---

## GET `/addresses/:id` 🔐

Obtém um endereço específico.

**Response (200 OK):**
Detalhes do endereço

---

## PATCH `/addresses/:id` 🔒

Atualiza um endereço e regeocodifica se necessário.

**Request Body:**
```json
{
  "city": "Rio de Janeiro"
}
```

**Response (200 OK):**
Endereço atualizado

---

## DELETE `/addresses/:id` 🔒

Deleta um endereço.

**Response (204 No Content)**

---

## POST `/addresses/geocode` 🔐

Geocodifica um endereço (retorna apenas coordenadas).

**Request Body:**
```json
{
  "street": "Rua das Flores",
  "number": "123",
  "neighborhood": "Centro",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01234-567"
}
```

**Response (200 OK):**
```json
{
  "latitude": -23.5505,
  "longitude": -46.6333
}
```

---

# 🏦 CONTAS BANCÁRIAS

## POST `/ongs/bank-account/me` 🏢

Cria ou atualiza a conta bancária da ONG autenticada.

**Request Body:**
```json
{
  "bankName": "Banco do Brasil",
  "agencyNumber": "1234-5",
  "accountNumber": "12345-6",
  "accountType": "Corrente",
  "pixKey": "contato@ongesperanca.com.br"
}
```

**Response (201 Created / 200 Updated):**
```json
{
  "id": 1,
  "bankName": "Banco do Brasil",
  "agencyNumber": "1234-5",
  "accountNumber": "12345-6",
  "accountType": "Corrente",
  "pixKey": "contato@ongesperanca.com.br",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "ongProfileId": 1
}
```

---

## GET `/ongs/bank-account/me` 🏢

Lista todas as contas bancárias da ONG autenticada.

**Response (200 OK):**
Array de contas bancárias

---

## GET `/ongs/bank-account/:ongId` 🔓

Retorna dados seguros da(s) conta(s) bancária(s) de uma ONG (sem dados sensíveis).

**Response (200 OK):**
```json
[
  {
    "bankName": "Banco do Brasil",
    "agencyNumber": "1234-5",
    "accountNumber": "12345-6",
    "accountType": "Corrente",
    "pixKey": "contato@ongesperanca.com.br"
  }
]
```

---

## PATCH `/ongs/bank-account/me` 🏢

Atualiza a conta bancária da ONG autenticada.

**Request Body:**
```json
{
  "pixKey": "novo.pix@ongesperanca.com.br"
}
```

**Response (200 OK):**
Conta bancária atualizada

---

## DELETE `/ongs/bank-account/me` 🏢

Remove a conta bancária da ONG autenticada.

**Response (204 No Content)**

---

# 🎁 WISHLIST

## POST `/ongs/:ongId/wishlist-items` 🏢

Cria um item na lista de desejos da ONG.

**Request Body:**
```json
{
  "description": "Notebooks para aula de informática",
  "quantity": 10
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "ongId": 2,
  "description": "Notebooks para aula de informática",
  "quantity": 10,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Nota:** O `ongId` na URL é ignorado na criação; usa-se o ID do usuário autenticado

---

## GET `/ongs/:ongId/wishlist-items` 🔓

Lista todos os itens da wishlist de uma ONG.

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "ongId": 2,
    "description": "Notebooks para aula de informática",
    "quantity": 10,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

---

## GET `/ongs/:ongId/wishlist-items/:id` 🔓

Obtém um item específico da wishlist.

**Response (200 OK):**
Item detalhado

---

## PATCH `/ongs/:ongId/wishlist-items/:id` 🏢

Atualiza um item da wishlist.

**Request Body:**
```json
{
  "description": "Notebooks (i7 ou superior)",
  "quantity": 15
}
```

**Response (200 OK):**
Item atualizado

**Validação:**
- Apenas a ONG proprietária pode atualizar

---

## DELETE `/ongs/:ongId/wishlist-items/:id` 🏢

Remove um item da wishlist.

**Response (204 No Content)**

---

# 📚 CATÁLOGO

## GET `/catalog` 🔒

Busca ONGs verificadas organizadas em seções com ranking inteligente.

**Query Parameters:**
- `categoryIds` (string, opcional) - IDs separados por vírgula: `1,2,3`
- `searchTerm` (string, opcional) - Termo de busca
- `limit` (int, optional, default: 10) - Quantidade por seção
- `offset` (int, optional, default: 0) - Paginação offset-based

**Response sem searchTerm (200 OK):**
```json
[
  {
    "title": "Melhor Avaliadas",
    "type": "topRated",
    "items": [
      {
        "id": 2,
        "name": "ONG Esperança",
        "avatarUrl": "/uploads/profiles/ong-esperanca.jpg",
        "bannerUrl": "/uploads/profiles/ong-esperanca-banner.jpg",
        "categories": [
          {
            "id": 1,
            "name": "Educação"
          }
        ],
        "createdAt": "2024-01-10T14:00:00Z",
        "averageRating": 4.8,
        "numberOfRatings": 50
      }
    ]
  },
  {
    "title": "Mais Recentes",
    "type": "newest",
    "items": [...]
  },
  {
    "title": "Próximas a Você",
    "type": "nearby",
    "items": [...]
  }
]
```

**Response com searchTerm (200 OK):**
```json
{
  "title": "Resultados para \"educação\"",
  "type": "search",
  "items": [...]
}
```

**Seções Retornadas (sem busca):**
1. **Melhor Avaliadas** - Ordenadas por average rating descendente
2. **Mais Recentes** - Ordenadas por data descendente
3. **Próximas a Você** - Dentro de 10km da localização do usuário
4. **Mais Antigas** - Ordenadas por data ascendente
5. **Mais Doações Recebidas** - Por quantidade de doações
6. **Menos Doações Recebidas** - Por quantidade de doações (ascendente)

**Ranking Inteligente:**
- Quando `categoryIds` é fornecido, ONGs com mais correspondências aparecem primeiro
- Campo `matchCount` mostra quantas categorias correspondem

---

# 👑 ADMINISTRAÇÃO

## POST `/admins` 👑

Cria um novo administrador.

**Request Body:**
```json
{
  "name": "Novo Admin",
  "email": "admin@doecerto.com",
  "password": "senha123"
}
```

**Response (201 Created):**
```json
{
  "userId": 3,
  "user": {
    "id": 3,
    "name": "Novo Admin",
    "email": "admin@doecerto.com"
  }
}
```

---

## DELETE `/admins/:adminId` 👑

Deleta um administrador.

**Response (204 No Content)**

---

## GET `/admins/me` 👑

Obtém dados do admin autenticado.

**Response (200 OK):**
Dados do admin

---

## GET `/admins/me/stats` 👑

Obtém estatísticas do admin autenticado.

**Response (200 OK):**
```json
{
  "adminId": 3,
  "adminName": "Novo Admin",
  "totalVerifications": 25,
  "approved": 20,
  "rejected": 5
}
```

---

## GET `/admins/:adminId` 👑

Obtém dados de um admin específico.

**Response (200 OK):**
Dados do admin

---

## GET `/admins/:adminId/stats` 👑

Obtém estatísticas de um admin específico.

**Response (200 OK):**
Similar ao GET `/admins/me/stats`

---

## GET `/admins/ongs/status/pending` 👑

Lista ONGs pendentes de verificação.

**Response (200 OK):**
```json
[
  {
    "userId": 5,
    "cnpj": "11.222.333/0001-44",
    "verificationStatus": "pending",
    "verifiedAt": null,
    "rejectionReason": null,
    "contactNumber": "(11) 98765-4321",
    "name": "ONG Nova",
    "email": "contato@ongnova.com",
    "verifiedBy": null
  }
]
```

---

## GET `/admins/ongs/status/verified` 👑

Lista ONGs verificadas/aprovadas.

**Response (200 OK):**
Similar ao anterior, com dados de `verifiedBy`

---

## GET `/admins/ongs/status/rejected` 👑

Lista ONGs rejeitadas.

**Response (200 OK):**
Similar, com `rejectionReason` preenchido

---

## PATCH `/admins/ongs/:ongId/verification/approve` 👑

Aprova uma ONG (marca como `verified`).

**Response (200 OK):**
ONG atualizada com status `verified`

---

## PATCH `/admins/ongs/:ongId/verification/reject` 👑

Rejeita uma ONG (marca como `rejected`).

**Request Body:**
```json
{
  "reason": "Documentação incompleta"
}
```

**Response (200 OK):**
ONG atualizada com status `rejected` e `rejectionReason`

---

## GET `/admins/metrics` 👑

Obtém métricas gerais do dashboard.

**Response (200 OK):**
```json
{
  "topOngsByDonationCount": [
    {
      "id": 2,
      "name": "ONG Esperança",
      "email": "contato@ongesperanca.com",
      "value": 150,
      "category": "Educação"
    }
  ],
  "topDonorsByFrequency": [
    {
      "id": 1,
      "name": "João Silva",
      "email": "joao@example.com",
      "value": 45
    }
  ],
  "topPositiveRatings": [...],
  "topNegativeRatings": [...],
  "categoriesStats": [
    {
      "name": "Educação",
      "count": 35,
      "percentage": 30
    }
  ],
  "generalStats": {
    "totalOngs": 120,
    "totalDonors": 5000
  }
}
```

---

# Códigos de Status HTTP

## 2xx - Sucesso

| Código | Significado |
|--------|-----------|
| **200** | OK - Requisição bem-sucedida |
| **201** | Created - Recurso criado com sucesso |
| **204** | No Content - Operação bem-sucedida sem retorno |

## 4xx - Erro do Cliente

| Código | Significado | Causas Comuns |
|--------|-----------|--------------|
| **400** | Bad Request | Dados inválidos, validação falhou, ONG não verificada |
| **401** | Unauthorized | JWT inválido ou expirado, credenciais incorretas |
| **403** | Forbidden | Permissão insuficiente, tentativa de acessar recurso de outro usuário |
| **404** | Not Found | Recurso não encontrado |
| **409** | Conflict | Email/CPF/CNPJ duplicado, categoria já existe |

## 5xx - Erro do Servidor

| Código | Significado |
|--------|-----------|
| **500** | Internal Server Error - Erro não tratado no servidor |

---

# Exemplos de Requisições

## 1. Registro e Login

### Registrar como Doador
```bash
curl -X POST http://localhost:3001/auth/register/donor \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "senha123",
    "cpf": "123.456.789-00"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "senha123"
  }' \
  -c cookies.txt
```

---

## 2. Criar e Gerenciar Doações

### Criar Doação Monetária
```bash
curl -X POST http://localhost:3001/donations \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "ongId": 2,
    "donationType": "monetary",
    "monetaryAmount": 150.50,
    "monetaryCurrency": "BRL"
  }'
```

### Criar Doação Material
```bash
curl -X POST http://localhost:3001/donations \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "ongId": 2,
    "donationType": "material",
    "materialDescription": "Alimentos não-perecíveis",
    "materialQuantity": 10
  }'
```

### Com Comprovante de Pagamento
```bash
curl -X POST http://localhost:3001/donations \
  -F "proofFile=@comprovante.jpg" \
  -F 'createDonationDto={
    "ongId": 2,
    "donationType": "monetary",
    "monetaryAmount": 100.00,
    "monetaryCurrency": "BRL"
  };type=application/json' \
  -b cookies.txt
```

### Listar Minhas Doações Enviadas
```bash
curl -X GET "http://localhost:3001/donations/me/sent?skip=0&take=20" \
  -b cookies.txt
```

### Aceitar Doação (ONG)
```bash
curl -X PATCH http://localhost:3001/donations/1/accept \
  -b cookies.txt
```

---

## 3. Perfis e Informações

### Atualizar Perfil do Doador
```bash
curl -X POST http://localhost:3001/donors/me/profile \
  -F "file=@avatar.jpg" \
  -F 'updateDonorProfileDto={
    "bio": "Apaixonado por causas sociais",
    "contactNumber": "(11) 9 9999-8888"
  };type=application/json' \
  -b cookies.txt
```

### Atualizar Perfil da ONG
```bash
curl -X POST http://localhost:3001/ongs/me/profile \
  -F "avatar=@avatar.jpg" \
  -F "banner=@banner.jpg" \
  -F 'updateOngProfileDto={
    "bio": "ONG dedicada à educação",
    "contactNumber": "(11) 98765-4321",
    "categoryIds": [1, 2],
    "bankAccount": {
      "bankName": "Banco do Brasil",
      "agencyNumber": "1234-5",
      "accountNumber": "12345-6",
      "accountType": "Corrente",
      "pixKey": "contato@ong.com.br"
    }
  };type=application/json' \
  -b cookies.txt
```

### Ver Perfil Público de ONG
```bash
curl -X GET http://localhost:3001/ongs/2/profile
```

---

## 4. Wishlist e Categorias

### Adicionar Item à Wishlist
```bash
curl -X POST http://localhost:3001/ongs/2/wishlist-items \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "description": "Notebooks para aula de informática",
    "quantity": 10
  }'
```

### Ver Wishlist de ONG
```bash
curl -X GET http://localhost:3001/ongs/2/wishlist-items
```

### Listar Categorias
```bash
curl -X GET "http://localhost:3001/categories?skip=0&take=10"
```

---

## 5. Avaliações

### Avaliar ONG
```bash
curl -X POST http://localhost:3001/ongs/2/ratings \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "score": 5,
    "comment": "Excelente transparência"
  }'
```

### Ver Avaliações de ONG
```bash
curl -X GET "http://localhost:3001/ongs/2/ratings?skip=0&take=10"
```

---

## 6. Endereços

### Criar Endereço
```bash
curl -X POST http://localhost:3001/addresses \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "street": "Rua das Flores",
    "number": "123",
    "neighborhood": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234-567"
  }'
```

### Geocodificar Endereço
```bash
curl -X POST http://localhost:3001/addresses/geocode \
  -H "Content-Type: application/json" \
  -d '{
    "street": "Rua das Flores",
    "number": "123",
    "neighborhood": "Centro",
    "city": "São Paulo",
    "state": "SP"
  }'
```

---

## 7. Catálogo

### Listar Catálogo Completo
```bash
curl -X GET http://localhost:3001/catalog \
  -b cookies.txt
```

### Filtrar por Categorias
```bash
curl -X GET "http://localhost:3001/catalog?categoryIds=1,2,3" \
  -b cookies.txt
```

### Buscar no Catálogo
```bash
curl -X GET "http://localhost:3001/catalog?searchTerm=educacao" \
  -b cookies.txt
```

---

## 8. ONGs Próximas

### Listar ONGs Próximas (10km)
```bash
curl -X GET http://localhost:3001/ongs/nearby \
  -b cookies.txt
```

---

## 9. Administração

### Listar ONGs Pendentes
```bash
curl -X GET http://localhost:3001/admins/ongs/status/pending \
  -b cookies.txt
```

### Aprovar ONG
```bash
curl -X PATCH http://localhost:3001/admins/ongs/2/verification/approve \
  -b cookies.txt
```

### Rejeitar ONG
```bash
curl -X PATCH http://localhost:3001/admins/ongs/2/verification/reject \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"reason": "Documentação incompleta"}'
```

### Ver Métricas
```bash
curl -X GET http://localhost:3001/admins/metrics \
  -b cookies.txt
```

---

## 10. Contas Bancárias

### Criar/Atualizar Conta Bancária
```bash
curl -X POST http://localhost:3001/ongs/bank-account/me \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "bankName": "Banco do Brasil",
    "agencyNumber": "1234-5",
    "accountNumber": "12345-6",
    "accountType": "Corrente",
    "pixKey": "contato@ong.com.br"
  }'
```

### Ver Dados Bancários Públicos
```bash
curl -X GET http://localhost:3001/ongs/bank-account/2
```

---

# Notas Importantes

## Autenticação com JWT

O token JWT é armazenado automaticamente em cookie `access_token` após login/registro. Para requisições subsequentes, o token é enviado automaticamente.

Você pode também enviar manualmente via header:
```bash
curl -X GET http://localhost:3001/users/me \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

## Upload de Arquivos

Para requisições com upload, use `multipart/form-data`:
- Avatar/Banner: JPG, PNG, WebP (máx 5-10MB)
- Comprovante Pagamento: JPG, PNG, PDF (máx 5MB)
- Imagens são processadas automaticamente (redimensionadas, comprimidas)

## Paginação

Todos os endpoints de listagem suportam:
- `skip`: Registros a pular (padrão: 0)
- `take`: Quantidade a retornar (padrão: 20, máx: 100)

## Taxa de Limite

- Sem rate limiting implementado atualmente
- Recomendado para produção: 100 requisições por minuto por IP

## Erros

Todos os erros retornam JSON:
```json
{
  "statusCode": 400,
  "message": "Descrição do erro"
}
```

---

**Última atualização**: 13 de fevereiro de 2026  
**Versão**: 1.2.0  
**Mantém compatibilidade com versões anteriores**: Sim ✅
