using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Vendinha.Validations;

namespace Vendinha.Models
{
    public class Cliente
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "O nome completo é obrigatório.")]
        [StringLength(150, MinimumLength = 3,
            ErrorMessage = "O nome deve ter entre 3 e 150 caracteres.")]
        public string Nome { get; set; }

        [Required(ErrorMessage = "O CPF é obrigatório.")]
        [Cpf]
        public string Cpf { get; set; }

        // A obrigatoriedade e a data futura são checadas no ClienteService,
        // porque [Required] não funciona em tipos de valor (DateOnly nunca é nulo).
        public DateOnly DataNascimento { get; set; }

        [EmailAddress(ErrorMessage = "O e-mail informado é inválido.")]
        [StringLength(200, ErrorMessage = "O e-mail deve ter no máximo 200 caracteres.")]
        public string Email { get; set; }

        // [JsonIgnore] evita o JSON entrar em loop (Cliente -> Dividas -> Cliente...)
        [JsonIgnore]
        public List<Divida> Dividas { get; set; } = new();

        // ---- Propriedades calculadas: só get, não vão para o banco, mas saem no JSON ----

        /// <summary>Idade calculada a partir da data de nascimento.</summary>
        public int Idade
        {
            get
            {
                var hoje = DateOnly.FromDateTime(DateTime.Today);
                var idade = hoje.Year - DataNascimento.Year;
                // ainda não fez aniversário este ano
                if (DataNascimento > hoje.AddYears(-idade))
                {
                    idade--;
                }
                return idade;
            }
        }

        /// <summary>Soma das dívidas em aberto (não pagas). É o quanto o cliente deve.</summary>
        public decimal TotalDividas => Dividas.Where(d => !d.Paga).Sum(d => d.Valor);
    }
}
