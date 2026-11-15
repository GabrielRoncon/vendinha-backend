using System.ComponentModel.DataAnnotations;

namespace Vendinha.Validations
{
    /// <summary>
    /// Atributo de validação próprio, usado como [Cpf] nas propriedades.
    /// Funciona junto com [Required], [StringLength] etc. (DataAnnotations).
    /// </summary>
    public class CpfAttribute : ValidationAttribute
    {
        public CpfAttribute() : base("O CPF informado é inválido.")
        {
        }

        public override bool IsValid(object value)
        {
            // Campo vazio não é responsabilidade deste atributo: quem cuida é o [Required]
            if (value is not string cpf || string.IsNullOrWhiteSpace(cpf))
            {
                return true;
            }

            return CpfValidador.EhValido(cpf);
        }
    }
}
