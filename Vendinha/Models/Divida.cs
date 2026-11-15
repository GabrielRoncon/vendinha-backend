using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Vendinha.Models
{
    public class Divida
    {
        public int Id { get; set; }

        public int ClienteId { get; set; }

        [Range(0.01, 1000000000.0, ErrorMessage = "O valor da dívida deve ser maior que zero.")]
        public decimal Valor { get; set; }

        /// <summary>Situação: true = paga, false = em aberto.</summary>
        public bool Paga { get; set; }

        public DateTime DataCriacao { get; set; }

        /// <summary>Só é preenchida quando a dívida é paga.</summary>
        public DateTime? DataPagamento { get; set; }

        [JsonIgnore]
        public Cliente Cliente { get; set; }
    }
}
