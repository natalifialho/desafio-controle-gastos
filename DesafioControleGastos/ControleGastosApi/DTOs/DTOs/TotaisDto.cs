using System.Collections.Generic;

namespace ControleGastosApi.DTOs
{
    public class ResumoPessoaDto
    {
        public string Nome { get; set; } = string.Empty;
        public decimal TotalReceitas { get; set; }
        public decimal TotalDespesas { get; set; }
        public decimal Saldo { get; set; }
    }

    public class RelatorioGeralDto
    {
        public List<ResumoPessoaDto> DetalhesPorPessoa { get; set; } = new List<ResumoPessoaDto>();
        public decimal TotalGeralReceitas { get; set; }
        public decimal TotalGeralDespesas { get; set; }
        public decimal SaldoLiquidoGeral { get; set; }
    }
}