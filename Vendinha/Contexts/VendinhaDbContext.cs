using Microsoft.EntityFrameworkCore;
using Vendinha.Models;

namespace Vendinha.Contexts
{
    public class VendinhaDbContext : DbContext
    {
        // A API injeta as opções (connection string) por aqui
        public VendinhaDbContext(DbContextOptions<VendinhaDbContext> options) : base(options)
        {
        }

        public DbSet<Cliente> Clientes => Set<Cliente>();
        public DbSet<Divida> Dividas => Set<Divida>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // ---- mapeamento de Cliente (nomes iguais aos do database/schema.sql) ----
            var cliente = modelBuilder.Entity<Cliente>();
            cliente.ToTable("clientes");
            cliente.HasKey(c => c.Id);
            cliente.Property(c => c.Id).HasColumnName("id");
            cliente.Property(c => c.Nome).HasColumnName("nome").HasMaxLength(150).IsRequired();
            cliente.Property(c => c.Cpf).HasColumnName("cpf").HasMaxLength(11).IsRequired();
            cliente.Property(c => c.DataNascimento).HasColumnName("datanascimento");
            cliente.Property(c => c.Email).HasColumnName("email").HasMaxLength(200);
            cliente.HasIndex(c => c.Cpf).IsUnique(); // não pode haver CPF duplicado

            // Calculadas na classe, não existem como coluna
            cliente.Ignore(c => c.Idade);
            cliente.Ignore(c => c.TotalDividas);

            // ---- mapeamento de Divida ----
            var divida = modelBuilder.Entity<Divida>();
            divida.ToTable("dividas");
            divida.HasKey(d => d.Id);
            divida.Property(d => d.Id).HasColumnName("id");
            divida.Property(d => d.ClienteId).HasColumnName("clienteid");
            divida.Property(d => d.Valor).HasColumnName("valor").HasPrecision(18, 2);
            divida.Property(d => d.Paga).HasColumnName("paga");
            divida.Property(d => d.DataCriacao).HasColumnName("datacriacao");
            divida.Property(d => d.DataPagamento).HasColumnName("datapagamento");

            // 1 cliente tem N dívidas; apagar o cliente apaga as dívidas dele
            cliente.HasMany(c => c.Dividas)
                .WithOne(d => d.Cliente)
                .HasForeignKey(d => d.ClienteId)
                .OnDelete(DeleteBehavior.Cascade);

            base.OnModelCreating(modelBuilder);
        }
    }
}
