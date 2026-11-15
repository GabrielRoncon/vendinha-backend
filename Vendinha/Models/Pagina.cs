namespace Vendinha.Models
{
    /// <summary>
    /// Resultado paginado. Genérico (T) para servir a qualquer listagem.
    /// </summary>
    public class Pagina<T>
    {
        public List<T> Itens { get; set; } = new();
        public int PaginaAtual { get; set; }
        public int TamanhoPagina { get; set; }
        public int TotalItens { get; set; }
        public int TotalPaginas { get; set; }
    }
}
