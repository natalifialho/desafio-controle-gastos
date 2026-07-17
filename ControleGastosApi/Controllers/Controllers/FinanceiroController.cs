using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ControleGastosApi.Data;
using ControleGastosApi.Models;
using ControleGastosApi.DTOs;

namespace ControleGastosApi.Controllers
{
    [ApiController]
    [Route("api")]
    public class FinanceiroController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FinanceiroController(AppDbContext context)
        {
            _context = context;
        }

        // --- MÉTODOS DE PESSOAS ---

        [HttpPost("pessoas")]
        public async Task<IActionResult> CriarPessoa([FromBody] Pessoa pessoa)
        {
            if (string.IsNullOrWhiteSpace(pessoa.Nome) || pessoa.Idade <= 0)
                return BadRequest("Nome ou idade inválidos.");

            _context.Pessoas.Add(pessoa);
            await _context.SaveChangesAsync();
            return Ok(pessoa);
        }

        [HttpGet("pessoas")]
        public async Task<IActionResult> ListarPessoas()
        {
            var pessoas = await _context.Pessoas.ToListAsync();
            return Ok(pessoas);
        }

        [HttpDelete("pessoas/{id}")]
        public async Task<IActionResult> DeletarPessoa(string id)
        {
            var pessoa = await _context.Pessoas.FindAsync(id);
            if (pessoa == null) return NotFound("Pessoa não encontrada.");

            // Regra: Ao deletar uma pessoa, apaga todas as transações dela
            var transacoes = _context.Transacoes.Where(t => t.PessoaId == id);
            _context.Transacoes.RemoveRange(transacoes);

            _context.Pessoas.Remove(pessoa);
            await _context.SaveChangesAsync();

            return Ok();
        }

        // --- MÉTODOS DE TRANSAÇÕES ---

        [HttpPost("transacoes")]
        public async Task<IActionResult> CriarTransacao([FromBody] Transacao transacao)
        {
            var pessoa = await _context.Pessoas.FindAsync(transacao.PessoaId);
            if (pessoa == null) return BadRequest("Pessoa associada não existe.");

            // Regra: Menores de 18 anos só podem registrar despesa
            if (pessoa.Idade < 18 && transacao.Tipo.ToLower() == "receita")
            {
                return BadRequest("Atenção: Menores de 18 anos só podem registrar Despesas.");
            }

            _context.Transacoes.Add(transacao);
            await _context.SaveChangesAsync();
            return Ok(transacao);
        }

        [HttpGet("transacoes")]
        public async Task<IActionResult> ListarTransacoes()
        {
            return Ok(await _context.Transacoes.ToListAsync());
        }

        // --- CONSULTA DE TOTAIS CONSOLIDADO ---

        [HttpGet("totais")]
        public async Task<IActionResult> ObterTotais()
        {
            var pessoas = await _context.Pessoas.ToListAsync();
            var transacoes = await _context.Transacoes.ToListAsync();

            var relatorio = new RelatorioGeralDto();

            foreach (var p in pessoas)
            {
                var transacoesDaPessoa = transacoes.Where(t => t.PessoaId == p.Id).ToList();
                var receitas = transacoesDaPessoa.Where(t => t.Tipo.ToLower() == "receita").Sum(t => t.Valor);
                var despesas = transacoesDaPessoa.Where(t => t.Tipo.ToLower() == "despesa").Sum(t => t.Valor);

                relatorio.DetalhesPorPessoa.Add(new ResumoPessoaDto
                {
                    Nome = p.Nome,
                    TotalReceitas = receitas,
                    TotalDespesas = despesas,
                    Saldo = receitas - despesas
                });
            }

            relatorio.TotalGeralReceitas = relatorio.DetalhesPorPessoa.Sum(d => d.TotalReceitas);
            relatorio.TotalGeralDespesas = relatorio.DetalhesPorPessoa.Sum(d => d.TotalDespesas);
            relatorio.SaldoLiquidoGeral = relatorio.TotalGeralReceitas - relatorio.TotalGeralDespesas;

            return Ok(relatorio);
        }
    }
}