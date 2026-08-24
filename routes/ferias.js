const express = require('express');
const supabase = require('../config/supabase');
const supabaseAdmin = require('../config/supabaseAdmin');

const router = express.Router();

function getBearerToken(req) {
    const authorization = req.headers.authorization || '';
    const [type, token] = authorization.split(' ');
    return type?.toLowerCase() === 'bearer' ? token : null;
}

async function getLoggedUser(req) {
    const token = getBearerToken(req);
    if (!token) return { error: 'Token de autenticação não informado.', status: 401 };

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) return { error: 'Sessão inválida ou expirada.', status: 401 };

    const { data: profile, error: profileError } = await supabaseAdmin
        .from('usuario')
        .select('id, nome, setor, perfil, ativo')
        .eq('id', authData.user.id)
        .single();

    if (profileError || !profile || profile.ativo === false) {
        return { error: 'Perfil de usuário não encontrado ou inativo.', status: 403 };
    }

    return { ...profile, token };
}

function sendAuthError(res, loggedUser) {
    if (loggedUser.error) {
        res.status(loggedUser.status).json({ erro: loggedUser.error });
        return true;
    }
    return false;
}

function formatRequest(request) {
    return {
        id: request.id,
        colaborador: request.usuario?.nome || 'Colaborador',
        colaboradorId: request.colaborador_id,
        setor: request.usuario?.setor || null,
        tipo: request.tipo,
        inicio: request.data_inicio,
        fim: request.data_fim,
        periodo: request.tipo === 'periodo'
            ? `${request.data_inicio} - ${request.data_fim}`
            : `Solicitação de ${request.quantidade_dias} dias`,
        quantidade: request.quantidade_dias,
        observacoes: request.observacoes,
        observacoesAdmin: request.observacao_admin,
        statusLabel: request.status,
        dataSolicitacao: request.created_at
    };
}

router.get('/', async (req, res) => {
    const loggedUser = await getLoggedUser(req);
    if (sendAuthError(res, loggedUser)) return;

    let query = supabaseAdmin
        .from('solicitacoes_ferias')
        .select('*, usuario:colaborador_id(nome, setor)')
        .order('created_at', { ascending: false });

    if (loggedUser.perfil === 'colaborador') {
        query = query.eq('colaborador_id', loggedUser.id);
    } else if (loggedUser.perfil === 'admin_setor') {
        const { data: sectorUsers, error: sectorError } = await supabaseAdmin
            .from('usuario').select('id').eq('setor', loggedUser.setor);
        if (sectorError) return res.status(500).json({ erro: 'Não foi possível consultar o setor.' });
        query = query.in('colaborador_id', (sectorUsers || []).map((user) => user.id));
    } else if (loggedUser.perfil !== 'admin_principal') {
        return res.status(403).json({ erro: 'Você não tem permissão para consultar férias.' });
    }

    const { data, error } = await query;
    if (error) {
        console.error('Erro ao listar férias:', error);
        return res.status(500).json({ erro: 'Não foi possível consultar as solicitações de férias.' });
    }
    return res.json((data || []).map(formatRequest));
});

router.post('/', async (req, res) => {
    const loggedUser = await getLoggedUser(req);
    if (sendAuthError(res, loggedUser)) return;
    if (loggedUser.perfil !== 'colaborador') return res.status(403).json({ erro: 'Somente colaboradores podem solicitar férias.' });

    const { tipo, dataInicio, dataFim, quantidadeDias, observacoes } = req.body;
    const quantidade = Number(quantidadeDias);
    if (!['periodo', 'fixos'].includes(tipo) || !Number.isInteger(quantidade) || quantidade < 1 || quantidade > 30) {
        return res.status(400).json({ erro: 'Informe um tipo e uma quantidade de dias válida.' });
    }
    if (tipo === 'periodo' && (!dataInicio || !dataFim || dataFim < dataInicio)) {
        return res.status(400).json({ erro: 'Informe um período de férias válido.' });
    }

    const { data, error } = await supabaseAdmin.from('solicitacoes_ferias').insert({
        colaborador_id: loggedUser.id,
        tipo,
        data_inicio: tipo === 'periodo' ? dataInicio : null,
        data_fim: tipo === 'periodo' ? dataFim : null,
        quantidade_dias: quantidade,
        observacoes: observacoes || null
    }).select('*, usuario:colaborador_id(nome, setor)').single();

    if (error) {
        console.error('Erro ao criar férias:', error);
        return res.status(500).json({ erro: 'Não foi possível registrar a solicitação.' });
    }
    return res.status(201).json(formatRequest(data));
});

router.patch('/:id/decisao', async (req, res) => {
    const loggedUser = await getLoggedUser(req);
    if (sendAuthError(res, loggedUser)) return;
    if (!['admin_principal', 'admin_setor'].includes(loggedUser.perfil)) return res.status(403).json({ erro: 'Você não tem permissão para decidir sobre férias.' });

    const { status, observacaoAdmin } = req.body;
    if (!['Aprovada', 'Recusada'].includes(status)) return res.status(400).json({ erro: 'Decisão inválida.' });

    const { data: request, error: requestError } = await supabaseAdmin
        .from('solicitacoes_ferias').select('id, colaborador_id').eq('id', req.params.id).single();
    if (requestError || !request) return res.status(404).json({ erro: 'Solicitação não encontrada.' });

    if (loggedUser.perfil === 'admin_setor') {
        const { data: user } = await supabaseAdmin.from('usuario').select('setor').eq('id', request.colaborador_id).single();
        if (!user || user.setor !== loggedUser.setor) return res.status(403).json({ erro: 'Solicitação fora do seu setor.' });
    }

    const { data, error } = await supabaseAdmin.from('solicitacoes_ferias').update({
        status,
        observacao_admin: observacaoAdmin || null,
        decidido_por: loggedUser.id,
        decidido_em: new Date().toISOString()
    }).eq('id', req.params.id).select('*, usuario:colaborador_id(nome, setor)').single();

    if (error) {
        console.error('Erro ao decidir férias:', error);
        return res.status(500).json({ erro: 'Não foi possível registrar a decisão.' });
    }
    return res.json(formatRequest(data));
});

router.delete('/:id', async (req, res) => {
    const loggedUser = await getLoggedUser(req);
    if (sendAuthError(res, loggedUser)) return;

    const { data, error } = await supabaseAdmin
        .from('solicitacoes_ferias')
        .delete()
        .eq('id', req.params.id)
        .eq('colaborador_id', loggedUser.id)
        .eq('status', 'Pendente')
        .select('id');

    if (error) return res.status(500).json({ erro: 'Não foi possível excluir a solicitação.' });
    if (!data?.length) return res.status(404).json({ erro: 'Solicitação não encontrada ou já analisada.' });
    return res.status(204).send();
});

module.exports = router;
