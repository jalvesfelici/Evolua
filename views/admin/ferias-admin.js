const sidebar = document.querySelector('.sidebar');
const toggleButton = document.querySelector('.sidebar-toggle');
const logoutButton = document.querySelector('.logout-button');
const storageKey = 'evolua-sidebar-collapsed';
const requestsTable = document.getElementById('requestsTable');
const statusFilter = document.getElementById('statusFilter');
const decisionModal = document.getElementById('decisionModal');
const decisionTitle = document.getElementById('decisionTitle');
const decisionDescription = document.getElementById('decisionDescription');
const decisionNote = document.getElementById('decisionNote');
const confirmDecision = document.getElementById('confirmDecision');
let selectedRequestId = null;
let selectedDecision = null;

const currentAdmin = JSON.parse(localStorage.getItem('usuario_logado') || 'null');
if (!currentAdmin || !['admin_principal', 'admin_setor'].includes(currentAdmin.perfil)) {
    window.location.href = '/login/';
}

function updateSidebar(isCollapsed) {
    sidebar.classList.toggle('sidebar-collapsed', isCollapsed);
    toggleButton.setAttribute('aria-expanded', String(!isCollapsed));
    toggleButton.setAttribute('aria-label', isCollapsed ? 'Expandir menu' : 'Recolher menu');
}

if (sidebar && toggleButton) {
    updateSidebar(localStorage.getItem(storageKey) === 'true');
    toggleButton.addEventListener('click', () => {
        const isCollapsed = !sidebar.classList.contains('sidebar-collapsed');
        updateSidebar(isCollapsed);
        localStorage.setItem(storageKey, String(isCollapsed));
    });
}

function getAuthHeaders(includeJson = false) {
    const headers = { Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` };
    if (includeJson) headers['Content-Type'] = 'application/json';
    return headers;
}

async function getRequests() {
    const response = await fetch('/api/ferias', { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Não foi possível consultar as férias.');
    return response.json();
}

function statusClass(status) {
    if (status === 'Pendente') return 'warning';
    if (status === 'Aprovada') return 'success';
    return 'rejected';
}

function updateSummary(requests) {
    const pending = requests.filter((request) => request.statusLabel === 'Pendente');
    const approved = requests.filter((request) => request.statusLabel === 'Aprovada');
    const rejected = requests.filter((request) => request.statusLabel === 'Recusada');
    document.getElementById('pendingCount').textContent = pending.length;
    document.getElementById('approvedCount').textContent = approved.length;
    document.getElementById('approvedDays').textContent = approved.reduce((total, request) => total + Number(request.quantidade || 0), 0);
    document.getElementById('rejectedCount').textContent = rejected.length;
}

async function renderRequests() {
    let requests;
    try {
        requests = await getRequests();
    } catch (error) {
        requestsTable.innerHTML = `<tr><td colspan="7" class="empty-state">${error.message}</td></tr>`;
        return;
    }
    updateSummary(requests);
    const selectedStatus = statusFilter.value;
    const visibleRequests = selectedStatus === 'todos'
        ? requests
        : requests.filter((request) => request.statusLabel === selectedStatus);

    if (!visibleRequests.length) {
        requestsTable.innerHTML = '<tr><td colspan="7" class="empty-state">Nenhuma solicitação encontrada.</td></tr>';
        return;
    }

    requestsTable.innerHTML = visibleRequests.map((request) => {
        const actions = request.statusLabel === 'Pendente'
            ? `<div class="action-group"><button class="action-button approve" type="button" data-action="Aprovada" data-id="${request.id}">Aprovar</button><button class="action-button reject" type="button" data-action="Recusada" data-id="${request.id}">Recusar</button></div>`
            : '<span class="muted-text">Decidida</span>';
        return `<tr>
            <td>${request.colaborador || 'Colaborador'}</td>
            <td>${request.periodo}</td>
            <td>${request.tipo === 'periodo' ? 'Período' : 'Dias fixos'}</td>
            <td>${request.quantidade}</td>
            <td>${request.dataSolicitacao}</td>
            <td><span class="status-pill ${statusClass(request.statusLabel)}">${request.statusLabel}</span></td>
            <td>${actions}</td>
        </tr>`;
    }).join('');
}

async function openDecision(id, decision) {
    const request = (await getRequests()).find((item) => String(item.id) === String(id));
    if (!request) return;
    selectedRequestId = id;
    selectedDecision = decision;
    decisionTitle.textContent = decision === 'Aprovada' ? 'Aprovar solicitação?' : 'Recusar solicitação?';
    decisionDescription.textContent = `${request.periodo} - ${request.quantidade} dia(s). A decisão será comunicada ao colaborador.`;
    decisionNote.value = '';
    decisionModal.classList.add('open');
    decisionModal.setAttribute('aria-hidden', 'false');
    confirmDecision.classList.toggle('danger-button', decision === 'Recusada');
}

function closeDecision() {
    decisionModal.classList.remove('open');
    decisionModal.setAttribute('aria-hidden', 'true');
    selectedRequestId = null;
    selectedDecision = null;
}

requestsTable.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (button) openDecision(button.dataset.id, button.dataset.action);
});
statusFilter.addEventListener('change', renderRequests);
document.getElementById('closeDecision').addEventListener('click', closeDecision);
document.getElementById('cancelDecision').addEventListener('click', closeDecision);
decisionModal.addEventListener('click', (event) => {
    if (event.target === decisionModal) closeDecision();
});
confirmDecision.addEventListener('click', async () => {
    const response = await fetch(`/api/ferias/${selectedRequestId}/decisao`, {
        method: 'PATCH',
        headers: getAuthHeaders(true),
        body: JSON.stringify({ status: selectedDecision, observacaoAdmin: decisionNote.value.trim() })
    });
    if (!response.ok) {
        alert('Não foi possível registrar a decisão.');
        return;
    }
    closeDecision();
    renderRequests();
});

if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        if (!window.confirm('Deseja sair da área administrativa?')) return;
        localStorage.removeItem('access_token');
        localStorage.removeItem('usuario_logado');
        window.location.href = '/login/';
    });
}

renderRequests();
