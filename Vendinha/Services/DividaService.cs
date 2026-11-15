using System.ComponentModel.DataAnnotations;
using Vendinha.Contexts;
using Vendinha.Models;

namespace Vendinha.Services
{
    public class DividaService
    {
        private readonly VendinhaDbContext context;

        public DividaService(VendinhaDbContext context)
        {
            this.context = context;
        }

        public bool ClienteExiste(int clienteId)
        {
            return context.Clientes.Any(c => c.Id == clienteId);
        }

        /// <summary>Dívidas de um cliente, da mais recente para a mais antiga.</summary>
        public List<Divida> Listar(int clienteId)
        {
            return context.Dividas
                .Where(d => d.ClienteId == clienteId)
                .OrderByDescending(d => d.DataCriacao)
                .ToList();
        }

        /// <summary>Busca uma dívida DAQUELE cliente ou null.</summary>
        public Divida Obter(int clienteId, int dividaId)
        {
            return context.Dividas
                .FirstOrDefault(d => d.Id == dividaId && d.ClienteId == clienteId);
        }

        public bool Criar(int clienteId, Divida divida, out List<ValidationResult> erros)
        {
            // O cliente não escolhe estes campos: o sistema define
            divida.Id = 0;
            divida.ClienteId = clienteId;
            divida.Cliente = null;
            divida.Paga = false;
            divida.DataCriacao = DateTime.UtcNow;
            divida.DataPagamento = null;
            divida.Valor = Math.Round(divida.Valor, 2);

            erros = new List<ValidationResult>();
            var valida = Validator.TryValidateObject(
                divida, new ValidationContext(divida), erros, true);

            // Regra de negócio: um cliente só pode ter uma dívida em aberto
            var temEmAberto = context.Dividas.Any(d => d.ClienteId == clienteId && !d.Paga);
            if (temEmAberto)
            {
                erros.Add(new ValidationResult(
                    "O cliente já possui uma dívida em aberto. Quite-a antes de cadastrar outra.",
                    new[] { nameof(Divida.ClienteId) }));
                valida = false;
            }

            if (!valida)
            {
                return false;
            }

            context.Dividas.Add(divida);
            context.SaveChanges();
            return true;
        }

        /// <summary>Marca a dívida como paga e registra a data do pagamento.</summary>
        public bool Pagar(Divida divida, out List<ValidationResult> erros)
        {
            erros = new List<ValidationResult>();

            if (divida.Paga)
            {
                erros.Add(new ValidationResult("Esta dívida já está paga.",
                    new[] { nameof(Divida.Paga) }));
                return false;
            }

            divida.Paga = true;
            divida.DataPagamento = DateTime.UtcNow;
            context.SaveChanges();
            return true;
        }
    }
}
