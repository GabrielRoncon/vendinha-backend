using Microsoft.EntityFrameworkCore;
using Vendinha.Contexts;
using Vendinha.Services;

var builder = WebApplication.CreateBuilder(args);

// Controllers + documentação OpenAPI
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Liberar o front-end (React/Vite) a chamar esta API
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:4173",
                "http://127.0.0.1:4173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Banco: a connection string vem do appsettings.json (chave "Postgres")
var connstring = builder.Configuration.GetConnectionString("Postgres");
builder.Services.AddDbContext<VendinhaDbContext>(o => o.UseNpgsql(connstring));

// Injeção de dependência: um serviço novo por requisição (Scoped)
builder.Services.AddScoped<ClienteService>();
builder.Services.AddScoped<DividaService>();

var app = builder.Build();

// Pipeline HTTP
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi(); // JSON da documentação em /openapi/v1.json
}

app.UseCors("Frontend");
app.MapControllers();

app.Run();
