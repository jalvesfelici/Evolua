const modal = document.getElementById('modalSolicitacao');
const abrirModalBtn = document.getElementById('abrirModal');
const btnNovaSolicitacao = document.getElementById('btnNovaSolicitacao');
const fecharModalBtn = document.getElementById('fecharModal');
const cancelarModalBtn = document.getElementById('cancelarModal');
const formSolicitacao = document.getElementById('formSolicitacao');
const tipoButtons = document.querySelectorAll('.toggle-option');
const campoQuantidade = document.getElementById('campoQuantidade');
const dataInicio = document.getElementById('dataInicio');
const dataFim = document.getElementById('dataFim');
const quantidadeDias = document.getElementById('quantidadeDias');
const tabelaSolicitacoes = document.getElementById('tabelaSolicitacoes');
const modalTitulo = document.getElementById('modalTitulo');

let tipoSelecionado = 'periodo';
let solicitacaoEditandoId = null;

const solicitacoes = [
    {
        id: 1,
        tipo: 'periodo',
        periodo: '12/08/2026 - 25/08/2026',
        inicio: '2026-08-12',
        fim: '2026-08-25',
        quantidade: 14,
        statusLabel: 'Pendente',
        dataSolicitacao: '01/08/2026'
    },
    {
        id: 2,
        tipo: 'periodo',
        periodo: '05/09/2026 - 10/09/2026',
        inicio: '2026-09-05',
        fim: '2026-09-10',
        quantidade: 6,
        statusLabel: 'Em revisão',
        dataSolicitacao: '18/07/2026'
    }
];

function abrirModal() {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
}

function fecharModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    formSolicitacao.reset();
    tipoSelecionado = 'periodo';
    solicitacaoEditandoId = null;
    modalTitulo.textContent = 'Solicitar férias';
    atualizarTipoSolicitacao();
}

function atualizarTipoSolicitacao() {
    tipoButtons.forEach((button) => {
        const isActive = button.dataset.type === tipoSelecionado;
        button.classList.toggle('active', isActive);
    });

    const isPeriodo = tipoSelecionado === 'periodo';
    dataInicio.disabled = false;
    dataFim.disabled = false;
    quantidadeDias.disabled = isPeriodo;
    campoQuantidade.style.opacity = isPeriodo ? '0.55' : '1';
    campoQuantidade.style.pointerEvents = isPeriodo ? 'none' : 'auto';
}

function calcularDiasEntreDatas(inicio, fim) {
    const dataInicial = new Date(inicio);
    const dataFinal = new Date(fim);
    const diferenca = dataFinal - dataInicial;
    return Math.round(diferenca / 86400000) + 1;
}

function formatarData(data) {
    const date = new Date(data);
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

function getStatusClass(statusLabel) {
    if (statusLabel === 'Pendente') return 'warning';
    if (statusLabel === 'Em revisão') return 'info';
    return 'success';
}

function renderizarSolicitacoes() {
    tabelaSolicitacoes.innerHTML = '';

    solicitacoes.forEach((solicitacao) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${solicitacao.periodo}</td>
            <td>${solicitacao.tipo === 'periodo' ? 'Período' : 'Dias fixos'}</td>
            <td>${solicitacao.quantidade}</td>
            <td><span class="status-pill ${getStatusClass(solicitacao.statusLabel)}">${solicitacao.statusLabel}</span></td>
            <td>${solicitacao.dataSolicitacao}</td>
            <td>
                <div class="table-actions">
                    <button type="button" class="link-btn edit-btn" data-action="editar" data-id="${solicitacao.id}">Editar</button>
                    <button type="button" class="link-btn delete-btn" data-action="excluir" data-id="${solicitacao.id}">Excluir</button>
                </div>
            </td>
        `;
        tabelaSolicitacoes.appendChild(row);
    });
}

function preencherFormularioComSolicitacao(solicitacao) {
    tipoSelecionado = solicitacao.tipo;
    modalTitulo.textContent = 'Editar solicitação';

    if (solicitacao.tipo === 'periodo') {
        dataInicio.value = solicitacao.inicio;
        dataFim.value = solicitacao.fim;
        quantidadeDias.value = '';
    } else {
        dataInicio.value = '';
        dataFim.value = '';
        quantidadeDias.value = solicitacao.quantidade;
    }

    atualizarTipoSolicitacao();
}

function abrirModalEdicao(id) {
    const solicitacao = solicitacoes.find((item) => item.id === id);
    if (!solicitacao) return;

    solicitacaoEditandoId = id;
    preencherFormularioComSolicitacao(solicitacao);
    abrirModal();
}

function criarSolicitacaoDoFormulario() {
    if (tipoSelecionado === 'periodo') {
        if (!dataInicio.value || !dataFim.value) {
            alert('Informe a data de início e a data de término.');
            return null;
        }

        if (new Date(dataFim.value) < new Date(dataInicio.value)) {
            alert('A data de término não pode ser anterior à data de início.');
            return null;
        }

        const totalDias = calcularDiasEntreDatas(dataInicio.value, dataFim.value);
        return {
            tipo: 'periodo',
            periodo: `${formatarData(dataInicio.value)} - ${formatarData(dataFim.value)}`,
            inicio: dataInicio.value,
            fim: dataFim.value,
            quantidade: totalDias,
            statusLabel: 'Pendente',
            dataSolicitacao: formatarData(new Date())
        };
    }

    if (!quantidadeDias.value || Number(quantidadeDias.value) <= 0) {
        alert('Informe a quantidade de dias válidos.');
        return null;
    }

    return {
        tipo: 'fixos',
        periodo: `Solicitação de ${quantidadeDias.value} dias`,
        inicio: '',
        fim: '',
        quantidade: Number(quantidadeDias.value),
        statusLabel: 'Pendente',
        dataSolicitacao: formatarData(new Date())
    };
}

abrirModalBtn.addEventListener('click', () => {
    solicitacaoEditandoId = null;
    modalTitulo.textContent = 'Solicitar férias';
    abrirModal();
});
btnNovaSolicitacao.addEventListener('click', () => {
    solicitacaoEditandoId = null;
    modalTitulo.textContent = 'Solicitar férias';
    abrirModal();
});
fecharModalBtn.addEventListener('click', fecharModal);
cancelarModalBtn.addEventListener('click', fecharModal);

modal.addEventListener('click', (event) => {
    if (event.target === modal) {
        fecharModal();
    }
});

tipoButtons.forEach((button) => {
    button.addEventListener('click', () => {
        tipoSelecionado = button.dataset.type;
        atualizarTipoSolicitacao();
    });
});

tabelaSolicitacoes.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const id = Number(button.dataset.id);

    if (button.dataset.action === 'editar') {
        abrirModalEdicao(id);
        return;
    }

    if (button.dataset.action === 'excluir') {
        const indice = solicitacoes.findIndex((item) => item.id === id);
        if (indice !== -1) {
            solicitacoes.splice(indice, 1);
            renderizarSolicitacoes();
        }
    }
});

formSolicitacao.addEventListener('submit', (event) => {
    event.preventDefault();

    const novaSolicitacao = criarSolicitacaoDoFormulario();
    if (!novaSolicitacao) return;

    if (solicitacaoEditandoId !== null) {
        const indice = solicitacoes.findIndex((item) => item.id === solicitacaoEditandoId);
        if (indice !== -1) {
            solicitacoes[indice] = {
                ...solicitacoes[indice],
                ...novaSolicitacao,
                id: solicitacaoEditandoId
            };
        }
    } else {
        solicitacoes.unshift({
            id: Date.now(),
            ...novaSolicitacao
        });
    }

    renderizarSolicitacoes();
    fecharModal();
});

renderizarSolicitacoes();
atualizarTipoSolicitacao();
