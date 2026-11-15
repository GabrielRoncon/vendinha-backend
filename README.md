# Vendinha — API de controle de dívidas

API em **.NET (C#)** para uma vendinha controlar as contas penduradas ("fiado") dos clientes:
cadastro de clientes (CRUD) e gerenciamento das dívidas de cada um.

## Tecnologias

- C# / .NET 10 (ASP.NET Core Web API)
- Entity Framework Core + PostgreSQL (Npgsql)
- Validação com DataAnnotations (inclui um atributo próprio `[Cpf]`)
- Interface web em React + Vite (fetch API, CSS Modules), para usar a API sem precisar de ferramentas externas

## Estrutura do projeto

```
Vendinha.slnx
├── Vendinha/              # Domínio: regras e acesso a dados
│   ├── Models/            # Cliente, Divida, Pagina<T>
│   ├── Contexts/          # VendinhaDbContext (mapeamento EF Core)
│   ├── Services/          # ClienteService, DividaService (regras de negócio)
│   └── Validations/       # CpfValidador e atributo [Cpf]
├── Vendinha.Api/          # Camada HTTP
│   ├── Controllers/       # ClienteController, DividaController
│   ├── Program.cs         # Configuração, injeção de dependência, pipeline
│   └── Vendinha.Api.http  # Exemplos de requisições
├── Vendinha.Web/          # Interface (React + Vite)
│   └── src/
│       ├── api.js         # Chamadas à API (fetch)
│       ├── utils.js       # Formatação (CPF, moeda, datas)
│       ├── App.jsx        # Tela principal: tabela de clientes, busca e paginação
│       └── components/    # Modais: cliente, dívidas, exclusão
└── database/
    └── schema.sql         # Script de criação do banco (PostgreSQL)
```

## Como executar

### Pré-requisitos

- [.NET SDK 10](https://dotnet.microsoft.com/download) (para usar .NET 8, veja a observação no final)
- PostgreSQL em execução

### Passo a passo

1. Crie o banco e as tabelas:

   ```bash
   psql -U postgres -c "CREATE DATABASE vendinha;"
   psql -U postgres -d vendinha -f database/schema.sql
   ```

2. Ajuste a connection string em `Vendinha.Api/appsettings.json` (usuário, senha e host do seu PostgreSQL):

   ```json
   "ConnectionStrings": {
     "Postgres": "Host=localhost;Port=5432;Database=vendinha;Username=postgres;Password=postgres"
   }
   ```

3. Execute a API:

   ```bash
   dotnet run --project Vendinha.Api
   ```

   A API sobe em `http://localhost:5059`. O arquivo `Vendinha.Api/Vendinha.Api.http` tem exemplos
   prontos de todas as requisições (Visual Studio / VS Code com REST Client).

4. Execute a interface web (em outro terminal, com a API rodando). Requer [Node.js](https://nodejs.org) 20+:

   ```bash
   cd Vendinha.Web
   npm install
   npm run dev
   ```

   Abra `http://localhost:5173`. Para apontar para outro endereço de API, defina `VITE_API_URL`
   (padrão: `http://localhost:5059/api`).

### O que a interface faz

- Lista os clientes (10 por página), do que mais deve para o que menos deve, com busca por nome.
- Cadastra, edita e exclui clientes (modais), mostrando as mensagens de validação da API.
- Abre as dívidas de cada cliente para cadastrar uma nova e marcar como paga.

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/cliente?pesquisa=&page=1` | Lista clientes (10 por página, busca por nome, do que mais deve para o que menos deve) |
| GET | `/api/cliente/{id}` | Busca um cliente |
| POST | `/api/cliente` | Cadastra cliente |
| PUT | `/api/cliente/{id}` | Atualiza cliente |
| DELETE | `/api/cliente/{id}` | Exclui cliente (e as dívidas dele) |
| GET | `/api/cliente/{id}/divida` | Lista as dívidas do cliente |
| POST | `/api/cliente/{id}/divida` | Cadastra dívida para o cliente |
| PUT | `/api/cliente/{id}/divida/{dividaId}/pagamento` | Marca a dívida como paga |

### Exemplo: cadastrar cliente

```json
POST /api/cliente
{
  "nome": "Maria da Silva",
  "cpf": "529.982.247-25",
  "dataNascimento": "1990-05-20",
  "email": "maria@email.com"
}
```

Resposta (`201 Created`):

```json
{
  "id": 1,
  "nome": "Maria da Silva",
  "cpf": "52998224725",
  "dataNascimento": "1990-05-20",
  "email": "maria@email.com",
  "idade": 36,
  "totalDividas": 0
}
```

### Exemplo: listagem

```json
{
  "itens": [ { "id": 1, "nome": "Maria da Silva", "idade": 36, "totalDividas": 25.50, "...": "..." } ],
  "paginaAtual": 1,
  "tamanhoPagina": 10,
  "totalItens": 1,
  "totalPaginas": 1
}
```

## Regras de negócio

- **Campos obrigatórios do cliente:** nome completo, CPF e data de nascimento.
- **CPF válido:** os dígitos verificadores são conferidos. Aceita com ou sem pontuação e é gravado só com dígitos.
- **CPF único:** não pode haver dois clientes com o mesmo CPF.
- **E-mail:** opcional; se informado, precisa ser válido.
- **Idade:** calculada a partir da data de nascimento (não é armazenada).
- **Dívidas:** possuem valor, situação (paga ou não), data de criação e data de pagamento.
- **Uma dívida em aberto por cliente:** só é possível cadastrar outra depois de pagar a atual.
- **Total de dívidas:** na listagem, é a soma das dívidas em aberto de cada cliente, e a ordenação é por esse valor (maior primeiro).

## Respostas de erro

| Status | Quando |
|--------|--------|
| `400 Bad Request` | Corpo da requisição ausente ou malformado |
| `404 Not Found` | Cliente ou dívida inexistente |
| `422 Unprocessable Entity` | Falha de validação ou de regra de negócio |

Os erros `422` retornam uma lista com o campo e a mensagem:

```json
[
  { "memberNames": ["Cpf"], "errorMessage": "O CPF informado é inválido." }
]
```

## Observação sobre a versão do .NET

O projeto usa `net10.0`. Para usar o .NET 8, altere `<TargetFramework>` para `net8.0` nos dois `.csproj`
e ajuste os pacotes `Microsoft.EntityFrameworkCore`, `Npgsql.EntityFrameworkCore.PostgreSQL`
e `Microsoft.AspNetCore.OpenApi` para a versão `8.0.x`.
