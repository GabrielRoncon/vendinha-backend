using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using Vendinha.Contexts;
using Vendinha.Models;
using Vendinha.Validations;

namespace Vendinha.Services
{
    public class ClienteService
    {
        public const int TamanhoPagina = 10;

        private readonly VendinhaDbContext context;

        public ClienteService(VendinhaDbContext context)
        {
            this.context = context;
        }

        /// <summary>
        /// Lista clientes: filtro por nome (texto contido), ordenados de quem mais deve
        /// para quem menos deve, de 10 em 10.
        /// </summary>
        public Pagina<Cliente> Listar(string pesquisa, int page = 1)
        {
            if (page < 1)
            {
                page = 1;
            }

            // Include traz as dívidas junto, para calcular TotalDividas de cada cliente
            IQueryable<Cliente> query = context.Clientes.Include(c => c.Dividas);

            if (!string.IsNullOrWhiteSpace(pesquisa))
            {
                var termo = pesquisa.Trim().ToLower();
                query = query.Where(c => c.Nome.ToLower().Contains(termo));
            }

            var totalItens = query.Count();

            var itens = query
                // quem mais deve primeiro (soma das dívidas em aberto, calculada no banco)
                .OrderByDescending(c => c.Dividas.Where(d => !d.Paga).Sum(d => d.Valor))
                .ThenBy(c => c.Nome) // desempate: ordem alfabética
                .ThenBy(c => c.Id)   // desempate final: paginação estável
                .Skip((page - 1) * TamanhoPagina)
                .Take(TamanhoPagina)
                .ToList();

            return new Pagina<Cliente>
            {
                Itens = itens,
                PaginaAtual = page,
                TamanhoPagina = TamanhoPagina,
                TotalItens = totalItens,
                TotalPaginas = (int)Math.Ceiling(totalItens / (double)TamanhoPagina)
            };
        }

        /// <summary>Busca um cliente (com as dívidas) ou null se não existir.</summary>
        public Cliente Obter(int id)
        {
            return context.Clientes
                .Include(c => c.Dividas)
                .FirstOrDefault(c => c.Id == id);
        }

        public bool Criar(Cliente cliente, out List<ValidationResult> erros)
        {
            if (!Validar(cliente, 0, out erros))
            {
                return false;
            }

            cliente.Id = 0; // quem define o id é o banco
            cliente.Dividas = new List<Divida>();

            context.Clientes.Add(cliente);
            context.SaveChanges();
            return true;
        }

        /// <summary>Atualiza os dados de um cliente que já existe (recebido do Obter).</summary>
        public bool Atualizar(Cliente existente, Cliente dados, out List<ValidationResult> erros)
        {
            if (!Validar(dados, existente.Id, out erros))
            {
                return false;
            }

            existente.Nome = dados.Nome;
            existente.Cpf = dados.Cpf;
            existente.DataNascimento = dados.DataNascimento;
            existente.Email = dados.Email;

            context.SaveChanges();
            return true;
        }

        /// <summary>Exclui o cliente (e, em cascata, as dívidas dele). False se não existir.</summary>
        public bool Excluir(int id)
        {
            var cliente = context.Clientes.FirstOrDefault(c => c.Id == id);
            if (cliente == null)
            {
                return false;
            }

            context.Clientes.Remove(cliente);
            context.SaveChanges();
            return true;
        }

        /// <summary>
        /// Normaliza os campos e aplica todas as validações.
        /// idIgnorar: id do próprio cliente na atualização, para o CPF dele não contar como duplicado.
        /// </summary>
        private bool Validar(Cliente cliente, int idIgnorar, out List<ValidationResult> erros)
        {
            // 1) Normalização
            cliente.Nome = cliente.Nome?.Trim();
            cliente.Cpf = CpfValidador.EhValido(cliente.Cpf)
                ? CpfValidador.Normalizar(cliente.Cpf) // grava só os dígitos
                : cliente.Cpf?.Trim();                 // inválido: mantém para o [Cpf] reclamar
            cliente.Email = string.IsNullOrWhiteSpace(cliente.Email)
                ? null                                  // e-mail é opcional
                : cliente.Email.Trim().ToLower();

            // 2) Regras declaradas nos atributos do modelo ([Required], [Cpf], [EmailAddress]...)
            erros = new List<ValidationResult>();
            var valido = Validator.TryValidateObject(
                cliente, new ValidationContext(cliente), erros, true);

            // 3) Data de nascimento
            var hoje = DateOnly.FromDateTime(DateTime.Today);
            if (cliente.DataNascimento == default)
            {
                erros.Add(new ValidationResult("A data de nascimento é obrigatória.",
                    new[] { nameof(Cliente.DataNascimento) }));
                valido = false;
            }
            else if (cliente.DataNascimento > hoje)
            {
                erros.Add(new ValidationResult("A data de nascimento não pode ser no futuro.",
                    new[] { nameof(Cliente.DataNascimento) }));
                valido = false;
            }

            // 4) Regra de negócio: CPF único
            if (!string.IsNullOrEmpty(cliente.Cpf) &&
                context.Clientes.Any(c => c.Cpf == cliente.Cpf && c.Id != idIgnorar))
            {
                erros.Add(new ValidationResult("Já existe um cliente cadastrado com este CPF.",
                    new[] { nameof(Cliente.Cpf) }));
                valido = false;
            }

            return valido;
        }
    }
}
