namespace Vendinha.Validations
{
    /// <summary>
    /// Regras de CPF: normalização (só dígitos) e cálculo dos dois dígitos verificadores.
    /// </summary>
    public static class CpfValidador
    {
        /// <summary>Remove tudo que não for dígito: "123.456.789-09" vira "12345678909".</summary>
        public static string Normalizar(string cpf)
        {
            if (cpf == null)
            {
                return string.Empty;
            }
            return new string(cpf.Where(char.IsDigit).ToArray());
        }

        public static bool EhValido(string cpf)
        {
            var digitos = Normalizar(cpf);

            // CPF tem exatamente 11 dígitos
            if (digitos.Length != 11)
            {
                return false;
            }

            // 111.111.111-11, 000.000.000-00 etc. passam na conta, mas são inválidos
            if (digitos.Distinct().Count() == 1)
            {
                return false;
            }

            var numeros = digitos.Select(c => c - '0').ToArray();

            // O 10º dígito usa os 9 primeiros; o 11º usa os 10 primeiros
            return numeros[9] == CalcularDigito(numeros, 9)
                && numeros[10] == CalcularDigito(numeros, 10);
        }

        private static int CalcularDigito(int[] numeros, int quantidade)
        {
            var soma = 0;
            // pesos: para 9 números, de 10 até 2; para 10 números, de 11 até 2
            for (var i = 0; i < quantidade; i++)
            {
                soma += numeros[i] * (quantidade + 1 - i);
            }

            var resto = soma % 11;
            return resto < 2 ? 0 : 11 - resto;
        }
    }
}
