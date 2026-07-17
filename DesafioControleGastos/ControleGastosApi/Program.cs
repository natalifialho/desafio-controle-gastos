var builder = WebApplication.CreateBuilder(args);

// 1. ADICIONE ESSA LINHA PARA CONFIGURAR O CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.WithOrigins("http://localhost:5000") // Porta padrão do seu Vite/React
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();

var app = builder.Build();

// 2. ADICIONE ESSA LINHA LOGO ANTES DE app.MapControllers()
app.UseCors("AllowReact");

app.UseAuthorization();
app.MapControllers();

app.Run();