using System;

namespace ControleGastosApi.Models
{
    public class Transacao
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Descricao { get; set; } = string.Empty;
        public decimal Valor { get; set; }
        public string Tipo { get; set; } = string.Empty; // "receita" ou "despesa"
        public string PessoaId { get; set; } = string.Empty; // Vincula a transação à pessoa
    }
}