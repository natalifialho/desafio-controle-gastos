import { useState, useEffect } from 'react';
import './App.tsx';

interface Pessoa {
  id: string;
  nome: string;
  idade: number;
}

interface ResumoPessoa {
  nome: string;
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
}

interface RelatorioGeral {
  detalhesPorPessoa: ResumoPessoa[];
  totalGeralReceitas: number;
  totalGeralDespesas: number;
  saldoLiquidoGeral: number;
}

export default function App() {
  // AJUSTE A PORTA AQUI SE O SEU BACKEND ESTIVER EM OUTRA PORTA (Ex: 5123, 5243)
  const API_URL = 'http://localhost:5000/api';

  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [relatorio, setRelatorio] = useState<RelatorioGeral | null>(null);

  const [nome, setNome] = useState('');
  const [idade, setIdade] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState('despesa');
  const [pessoaId, setPessoaId] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = () => {
    // Busca as pessoas e normaliza maiúsculas/minúsculas vindas do C#
    fetch(`${API_URL}/pessoas`)
      .then(res => {
        if (!res.ok) throw new Error("Erro na resposta do servidor");
        return res.json();
      })
      .then(dados => {
        // Garante que o React leia 'id', 'nome' e 'idade' independente do formato do C#
        const dadosNormalizados = dados.map((p: any) => ({
          id: p.id ?? p.Id ?? p.ID,
          nome: p.nome ?? p.Nome ?? '',
          idade: p.idade ?? p.Idade ?? 0
        }));
        setPessoas(dadosNormalizados);
      })
      .catch(err => {
        console.error("Erro ao buscar pessoas:", err);
      });

    // Busca o relatório geral e normaliza também os totais
    fetch(`${API_URL}/totais`)
      .then(res => res.ok ? res.json() : null)
      .then(dados => {
        if (!dados) return;
        const relatorioNormalizado: RelatorioGeral = {
          detalhesPorPessoa: (dados.detalhesPorPessoa ?? dados.DetalhesPorPessoa ?? []).map((d: any) => ({
            nome: d.nome ?? d.Nome ?? '',
            totalReceitas: d.totalReceitas ?? d.TotalReceitas ?? 0,
            totalDespesas: d.totalDespesas ?? d.TotalDespesas ?? 0,
            saldo: d.saldo ?? d.Saldo ?? 0
          })),
          totalGeralReceitas: dados.totalGeralReceitas ?? dados.TotalGeralReceitas ?? 0,
          totalGeralDespesas: dados.totalGeralDespesas ?? dados.TotalGeralDespesas ?? 0,
          saldoLiquidoGeral: dados.saldoLiquidoGeral ?? dados.SaldoLiquidoGeral ?? 0
        };
        setRelatorio(relatorioNormalizado);
      })
      .catch(err => console.error("Erro ao buscar totais:", err));
  };

  const cadastrarPessoa = (e: any) => {
    e.preventDefault();
    if (!nome || !idade) return alert("Preencha todos os campos.");

    fetch(`${API_URL}/pessoas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, idade: Number(idade) })
    })
    .then(res => {
      if (res.ok) {
        setNome('');
        setIdade('');
        carregarDados();
      } else {
        alert("O servidor backend recusou o cadastro da pessoa.");
      }
    })
    .catch(err => {
      console.error(err);
      alert("Não foi possível conectar ao Backend. Verifique se ele está rodando com 'dotnet run'!");
    });
  };

  const cadastrarTransacao = (e: any) => {
    e.preventDefault();
    if (!descricao || !valor || !pessoaId) return alert("Preencha todos os campos.");

    fetch(`${API_URL}/transacoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        descricao,
        valor: Number(valor),
        tipo,
        pessoaId
      })
    })
    .then(async res => {
      if (!res.ok) {
        const erro = await res.text();
        alert(erro); 
      } else {
        setDescricao('');
        setValor('');
        setPessoaId('');
        carregarDados();
      }
    })
    .catch(err => {
      console.error(err);
      alert("Não foi possível salvar a transação. O Backend está online?");
    });
  };

  const deletarPessoa = (id: string) => {
    if (window.confirm("Deseja mesmo excluir esta pessoa?")) {
      fetch(`${API_URL}/pessoas/${id}`, { method: 'DELETE' })
        .then(() => carregarDados())
        .catch(err => console.error(err));
    }
  };

  return (
    <div className="container">
      <h1>Controle Financeiro Familiar</h1>
      <hr />

      <div className="grid">
        <div className="card">
          <h2>Cadastrar Pessoa</h2>
          <form onSubmit={cadastrarPessoa}>
            <div className="form-group">
              <label>Nome:</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Idade:</label>
              <input type="number" value={idade} onChange={e => setIdade(e.target.value)} />
            </div>
            <button type="submit">Salvar Pessoa</button>
          </form>
        </div>

        <div className="card">
          <h2>Cadastrar Transação</h2>
          <form onSubmit={cadastrarTransacao}>
            <div className="form-group">
              <label>Descrição:</label>
              <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Valor (R$):</label>
              <input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Tipo:</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)}>
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
              </select>
            </div>
            <div className="form-group">
              <label>Quem gastou:</label>
              <select value={pessoaId} onChange={e => setPessoaId(e.target.value)}>
                <option value="">Selecione...</option>
                {pessoas.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
            <button type="submit">Adicionar Transação</button>
          </form>
        </div>
      </div>

      <div className="card">
        <h2>Pessoas Cadastradas</h2>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Idade</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {pessoas.map(p => (
              <tr key={p.id}>
                <td>{p.nome}</td>
                <td>{p.idade} anos</td>
                <td>
                  <button onClick={() => deletarPessoa(p.id)} className="btn-danger">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {relatorio && relatorio.detalhesPorPessoa && relatorio.detalhesPorPessoa.length > 0 && (
        <div className="card">
          <h2>Relatório Geral</h2>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Receitas</th>
                <th>Despesas</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {relatorio.detalhesPorPessoa.map((det, idx) => (
                <tr key={idx}>
                  <td>{det.nome}</td>
                  <td>R$ {det.totalReceitas.toFixed(2)}</td>
                  <td>R$ {det.totalDespesas.toFixed(2)}</td>
                  <td>R$ {det.saldo.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}