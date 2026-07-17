using System;

namespace ControleGastosApi.Models
{
    public class Pessoa
    {
        // Geramos um ID único automaticamente ao criar o objeto
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Nome { get; set; } = string.Empty;
        public int Idade { get; set; }
    }
}