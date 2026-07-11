import { db } from './firebase-config.js';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const psicologoLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
if (!psicologoLogado) window.location.href = '../index.html';

let todosPacientes = [];
let pacienteAtual = null; 

const gerarCodigoNumerico = () => Math.floor(100000 + Math.random() * 900000).toString();

import('./protocolos.js').then(module => { if (module.initProtocolos) module.initProtocolos(); });

function calcularIdade(dataNasc) {
    if (!dataNasc) return '--';
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) { idade--; }
    return idade;
}

function imprimirConteudo(htmlContent) {
    const janela = window.open('', '', 'width=900,height=650');
    janela.document.write(`<html><head><title>Impressão</title><style>body{font-family:Arial;padding:20px;}@media print{body{-webkit-print-color-adjust:exact;}}</style></head><body>${htmlContent}<script>window.onload=()=>{setTimeout(()=>{window.print();window.close();},500);};</script></body></html>`);
    janela.document.close();
}

function injetarModais() {
    if (!document.getElementById('modalSistemaCustomizado')) {
        document.body.insertAdjacentHTML('beforeend', `<div id="modalSistemaCustomizado" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.8); backdrop-filter:blur(4px); justify-content:center; align-items:center; z-index:9999;"><div style="background:white; padding:30px; border-radius:12px; width:90%; max-width:450px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);"><div style="display:flex; justify-content:space-between; margin-bottom:20px; border-bottom:1px solid #e2e8f0; padding-bottom:15px;"><h3 id="modalCustomTitulo" style="color:#1e293b; font-size:18px; margin:0;">Ação</h3><button onclick="window.fecharModalCustom()" style="background:none;border:none;cursor:pointer;font-size:22px;color:#94a3b8;font-weight:bold;line-height:1;">✖</button></div><div id="modalCustomBody" style="color:#334155; font-size:15px; line-height:1.6;"></div></div></div>`);
    }
}

document.addEventListener('DOMContentLoaded', () => { 
    if (psicologoLogado.isento) {
        const abaMenuBtn = document.querySelector('.menu-btn[data-target="tab-assinatura"]');
        if(abaMenuBtn) abaMenuBtn.style.display = 'none';
    }

    injetarModais(); 
    carregarPacientes(); 
    carregarMinhaAssinatura(); 
    carregarMeuPerfil(); // NOVO: CARREGA DADOS DO PERFIL
});

window.abrirModalCustom = (t, h) => { document.getElementById('modalCustomTitulo').innerText = t; document.getElementById('modalCustomBody').innerHTML = h; document.getElementById('modalSistemaCustomizado').style.display = 'flex'; };
window.fecharModalCustom = () => { document.getElementById('modalSistemaCustomizado').style.display = 'none'; };

let graficoInstancia = null;

function renderizarAgendaHoje() {
    const dataObj = new Date(); 
    dataObj.setMinutes(dataObj.getMinutes() - dataObj.getTimezoneOffset());
    const hoje = dataObj.toISOString().split('T')[0];
    
    const container = document.getElementById('lista-agenda-hoje');
    if(!container) return; container.innerHTML = '';
    let temSessao = false;
    
    todosPacientes.forEach(pac => {
        (pac.sessoes_previstas || []).forEach(s => {
            if(s.data === hoje && s.status_sessao !== 'Cancelada') {
                temSessao = true;
                container.innerHTML += `<div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #e2e8f0; background:#f8fafc; border-radius:8px; margin-bottom:8px;"><div><strong style="color:#0f172a; display:block;">${pac.nome}</strong><span style="color:#64748b; font-size:12px;">⏰ ${s.horario} | ${s.frequencia || 'Avulsa'}</span></div><button style="padding:8px 12px; font-size:12px; background:#6366f1; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:600;" onclick="window.open('https://meet.google.com/new', '_blank')">Gerar Meet</button></div>`;
            }
        });
    });
    if(!temSessao) container.innerHTML = '<p style="color:#64748b; padding:10px;">Nenhuma sessão agendada para hoje.</p>';
}

function renderizarGrafico() {
    const canvas = document.getElementById('chartFinanceiro');
    if(!canvas || typeof Chart === 'undefined') return;
    let pago = 0, pendente = 0;
    todosPacientes.forEach(pac => { (pac.sessoes_previstas || []).forEach(s => { if(s.status_sessao === 'Realizada') { if(s.status_pagamento === 'Pago') pago += s.valor; else pendente += s.valor; }}); });
    if(graficoInstancia) graficoInstancia.destroy();
    graficoInstancia = new Chart(canvas.getContext('2d'), { type: 'doughnut', data: { labels: ['Recebido', 'Pendente'], datasets: [{ data: [pago, pendente], backgroundColor: ['#10b981', '#ef4444'] }] }, options: { responsive: true, maintainAspectRatio: false } });
}

function renderizarAniversariantes() {
    const container = document.getElementById('lista-aniversariantes');
    if (!container) return;
    container.innerHTML = '';
    const hoje = new Date();
    const anoAtual = hoje.getFullYear(); const mesAtual = hoje.getMonth() + 1; const diaAtual = hoje.getDate();
    let temAniversariante = false;

    todosPacientes.forEach(pac => {
        if (pac.nascimento && pac.status !== "Alta" && pac.status !== "Inativo") {
            const [ano, mes, dia] = pac.nascimento.split('-');
            if (parseInt(mes) === mesAtual) {
                temAniversariante = true;
                const ehHoje = parseInt(dia) === diaAtual;
                const idadeQueVaiFazer = anoAtual - parseInt(ano);
                
                // NOVO DESIGN DO ANIVERSÁRIO INSPIRADO NA IMAGEM
                const badge = ehHoje ? `<span style="background: linear-gradient(135deg, #f43f5e, #e11d48); color:white; font-size:11px; font-weight:800; padding:4px 10px; border-radius:20px; box-shadow: 0 2px 4px rgba(225,29,72,0.3); text-transform:uppercase; letter-spacing:0.5px;">É HOJE! 🎈</span>` : '';
                
                container.innerHTML += `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 15px; background:#fff; border:1px solid #fbcfe8; border-radius:10px; margin-bottom:10px; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div style="background:#fdf2f8; color:#be123c; width:38px; height:38px; border-radius:10px; display:flex; justify-content:center; align-items:center; font-weight:bold; font-size:15px; border: 1px solid #fce7f3;">
                                ${dia}
                            </div>
                            <div>
                                <strong style="color:#1e293b; display:block; font-size:14px;">${pac.nome}</strong>
                                <span style="color:#64748b; font-size:13px;">Faz ${idadeQueVaiFazer} anos</span>
                            </div>
                        </div>
                        ${badge}
                    </div>
                `;
            }
        }
    });
    if (!temAniversariante) { container.innerHTML = '<p style="color:#94a3b8; font-size:13px; padding:10px;">Nenhum aniversariante neste mês.</p>'; }
}

window.executarAnaliseIA = () => {
    const div = document.getElementById('resultado-ia'); if(!div) return;
    div.innerHTML = "<p style='color:#64748b;'>Analisando prontuários...</p>";
    setTimeout(() => { div.innerHTML = `<div style="border-left:4px solid #8b5cf6; padding:15px; background:#f5f3ff; border-radius:0 8px 8px 0; font-size:14px; color:#4c1d95; line-height:1.5;"><strong>Análise Finalizada:</strong> Consistência positiva nos inventários. Sugerimos focar na manutenção da rotina de sono do paciente primário.</div>`; }, 1500);
};

// ==========================================
// CADASTRO E FILTROS DE PACIENTES
// ==========================================
document.getElementById('btnMostrarFormNovo').addEventListener('click', () => document.getElementById('containerFormPaciente').style.display = 'block');
document.getElementById('btnFecharForm').addEventListener('click', () => document.getElementById('containerFormPaciente').style.display = 'none');

document.getElementById('formNovoPaciente').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pacData = {
        nome: document.getElementById('pac_nome').value,
        responsavel: document.getElementById('pac_responsavel').value,
        cpf: document.getElementById('pac_cpf').value,
        nascimento: document.getElementById('pac_nascimento').value,
        telefone: document.getElementById('pac_telefone').value,
        emergencia: document.getElementById('pac_emergencia').value,
        endereco: document.getElementById('pac_endereco').value,
        plano: document.getElementById('pac_plano').value,
        valor: parseFloat(document.getElementById('pac_valor').value),
        status: document.getElementById('pac_status').value,
        foto: "",
        prontuario_id: gerarCodigoNumerico(),
        financeiro_id: gerarCodigoNumerico(),
        psicologo_id: psicologoLogado.id,
        data_cadastro: new Date().toISOString(),
        sessoes_previstas: [],
        anamnese: null
    };
    
    try {
        await addDoc(collection(db, "pacientes"), pacData);
        document.getElementById('msg-paciente').innerText = "Paciente cadastrado com sucesso.";
        document.getElementById('msg-paciente').style.display = 'block';
        document.getElementById('formNovoPaciente').reset();
        setTimeout(() => { document.getElementById('msg-paciente').style.display = 'none'; document.getElementById('containerFormPaciente').style.display = 'none'; }, 2000);
        carregarPacientes(); 
    } catch (error) { window.abrirModalCustom("Erro", "<p>Falha ao cadastrar paciente.</p>"); }
});

async function carregarPacientes() {
    try {
        const q = query(collection(db, "pacientes"), where("psicologo_id", "==", psicologoLogado.id));
        const snap = await getDocs(q);
        todosPacientes = [];
        snap.forEach((doc) => todosPacientes.push({ id: doc.id, ...doc.data() }));
        
        // ORDENAÇÃO ALFABÉTICA GARANTIDA
        todosPacientes.sort((a, b) => a.nome.localeCompare(b.nome));
        
        // APLICA O FILTRO (QUE AGORA É "ATIVO" POR PADRÃO)
        aplicarFiltros(); 
        
        renderizarAgendaHoje(); 
        renderizarGrafico(); 
        renderizarAniversariantes();
    } catch (error) { console.error(error); }
}

function renderizarCards(pacientes) {
    const listaContainer = document.getElementById('lista-pacientes'); listaContainer.innerHTML = '';
    if (pacientes.length === 0) { listaContainer.innerHTML = '<p>Nenhum paciente encontrado.</p>'; return; }
    pacientes.forEach((pac) => {
        let iniciais = pac.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        let avatarHTML = pac.foto ? `<img src="${pac.foto}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">` : `<div class="avatar-letra">${iniciais}</div>`;
        let statusEmoji = pac.status === "Ativo" ? "🟢" : (pac.status === "Espera" ? "🟡" : (pac.status === "Inativo" ? "⚪" : "🔵"));
        let statusTexto = pac.status === "Ativo" ? "Ativo" : (pac.status === "Espera" ? "Em Espera" : (pac.status === "Inativo" ? "Inativo" : "Alta"));
        const card = document.createElement('div'); card.className = 'card-paciente';
        card.innerHTML = `<div class="card-paciente-topo"><div style="width:45px; height:45px;">${avatarHTML}</div><span class="badge-status" style="background:#f8fafc; border:1px solid #e2e8f0; color:#334155; font-size:12px; padding:4px 8px; border-radius:4px;">${statusEmoji} ${statusTexto}</span></div><h4>${pac.nome}</h4><p>📞 Tel: ${pac.telefone}</p>`;
        card.addEventListener('click', () => abrirPerfilPaciente(pac));
        listaContainer.appendChild(card);
    });
}

document.getElementById('buscaPaciente').addEventListener('input', aplicarFiltros);
document.getElementById('filtroStatus').addEventListener('change', aplicarFiltros);
function aplicarFiltros() {
    const textoBusca = document.getElementById('buscaPaciente').value.toLowerCase(), statusFiltro = document.getElementById('filtroStatus').value;
    renderizarCards(todosPacientes.filter(pac => pac.nome.toLowerCase().includes(textoBusca) && (statusFiltro === "Todos" || pac.status === statusFiltro)));
}

// ==========================================
// ABA MEU PERFIL (MÁSCARAS E FUNÇÕES)
// ==========================================
// Máscara Universal para CPF / CNPJ
document.getElementById('prof_documento').addEventListener('input', function(e) {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length <= 11) { // CPF
        v = v.replace(/(\d{3})(\d)/, '$1.$2'); v = v.replace(/(\d{3})(\d)/, '$1.$2'); v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else { // CNPJ
        v = v.replace(/^(\d{2})(\d)/, '$1.$2'); v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3'); v = v.replace(/\.(\d{3})(\d)/, '.$1/$2'); v = v.replace(/(\d{4})(\d)/, '$1-$2');
    }
    e.target.value = v.substring(0, 18);
});

async function carregarMeuPerfil() {
    try {
        const docSnap = await getDoc(doc(db, "usuarios", psicologoLogado.id));
        if (docSnap.exists()) {
            const dados = docSnap.data();
            document.getElementById('prof_nome').value = dados.nome || '';
            document.getElementById('prof_profissao').value = dados.profissao || 'Psicólogo';
            document.getElementById('prof_crp').value = dados.crp || '';
            document.getElementById('prof_cbo').value = dados.cbo || '';
            document.getElementById('prof_documento').value = dados.documento || '';
            document.getElementById('prof_email').value = dados.email || '';
            
            if (dados.foto_perfil) {
                document.getElementById('meu_perfil_foto_img').src = dados.foto_perfil;
                document.getElementById('meu_perfil_foto_img').style.display = 'block';
                document.getElementById('meu_perfil_iniciais').style.display = 'none';
            } else {
                document.getElementById('meu_perfil_iniciais').innerText = (dados.nome || 'P').substring(0,2).toUpperCase();
            }
        }
    } catch(e) { console.error("Erro perfil", e); }
}

document.getElementById('formMeuPerfil').addEventListener('submit', async (e) => {
    e.preventDefault();
    const novosDados = {
        nome: document.getElementById('prof_nome').value,
        profissao: document.getElementById('prof_profissao').value,
        crp: document.getElementById('prof_crp').value,
        cbo: document.getElementById('prof_cbo').value,
        documento: document.getElementById('prof_documento').value
    };
    
    try {
        await updateDoc(doc(db, "usuarios", psicologoLogado.id), novosDados);
        psicologoLogado.nome = novosDados.nome;
        psicologoLogado.crp = novosDados.crp;
        localStorage.setItem('usuarioLogado', JSON.stringify(psicologoLogado));
        
        const elNomeSidebar = document.getElementById('nomeProfissional');
        if(elNomeSidebar) elNomeSidebar.innerText = novosDados.nome;
        
        window.abrirModalCustom("Sucesso", "<p>Seu perfil foi atualizado com sucesso!</p>");
    } catch(err) { console.error(err); window.abrirModalCustom("Erro", "<p>Falha ao salvar o perfil.</p>"); }
});

document.getElementById('btnAlterarMinhaFoto').addEventListener('click', () => document.getElementById('inputMinhaFoto').click());
document.getElementById('inputMinhaFoto').addEventListener('change', (e) => {
    const arq = e.target.files[0]; if (!arq) return; const reader = new FileReader(); reader.readAsDataURL(arq);
    reader.onload = (ev) => { 
        const img = new Image(); img.src = ev.target.result; 
        img.onload = async () => { 
            const canvas = document.createElement('canvas'); canvas.width = 300; canvas.height = 300; 
            canvas.getContext('2d').drawImage(img, 0, 0, 300, 300); 
            const f = canvas.toDataURL('image/jpeg', 0.8); 
            document.getElementById('meu_perfil_foto_img').src = f; 
            document.getElementById('meu_perfil_foto_img').style.display = 'block'; 
            document.getElementById('meu_perfil_iniciais').style.display = 'none'; 
            try { await updateDoc(doc(db, "usuarios", psicologoLogado.id), { foto_perfil: f }); window.abrirModalCustom("Sucesso", "<p>Sua foto de perfil foi atualizada!</p>"); } catch(err){} 
        } 
    };
});

// ==========================================
// ASSINATURA E ISENÇÃO
// ==========================================
async function carregarMinhaAssinatura() {
    const container = document.getElementById('info-minha-assinatura'); 
    try {
        const docSnap = await getDoc(doc(db, "usuarios", psicologoLogado.id));
        if (docSnap.exists()) {
            const dadosPsi = docSnap.data();
            
            psicologoLogado.crp = dadosPsi.crp || "";
            psicologoLogado.nome = dadosPsi.nome || psicologoLogado.nome;
            psicologoLogado.isento = dadosPsi.isento_mensalidade || false;
            localStorage.setItem('usuarioLogado', JSON.stringify(psicologoLogado));

            if (dadosPsi.isento_mensalidade) { 
                const abaMenuBtn = document.querySelector('.menu-btn[data-target="tab-assinatura"]');
                if(abaMenuBtn) abaMenuBtn.style.display = 'none';
                return; 
            }
            
            if (!container) return;
            const faturas = dadosPsi.faturas_sistema || [];
            if (faturas.length === 0) { container.innerHTML = `<p style="color:#64748b;">Nenhuma fatura registrada.</p>`; return; }
            let htmlFaturas = '<div style="display:flex; flex-direction:column; gap:10px;">';
            faturas.slice().reverse().forEach(f => {
                const isPendente = f.status === 'Pendente';
                htmlFaturas += `<div style="display:flex; justify-content:space-between; align-items:center; padding:15px; border:1px solid #e2e8f0; border-radius:8px; background:#fff;"><div><strong style="color:#1e293b; font-size:15px;">Fatura: ${f.mes_referencia}</strong><br><span style="color:#64748b; font-size:13px;">Valor: R$ ${parseFloat(f.valor).toFixed(2)}</span></div><div style="text-align:right;">${isPendente ? `<button onclick="window.abrirPagamentoPix('${parseFloat(f.valor).toFixed(2)}', '${f.mes_referencia}')" style="background:#0ea5e9; color:#fff; padding:6px 12px; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size:13px;">Pagar via PIX</button>` : `<span style="display:inline-block; padding:4px 10px; border-radius:20px; background:#10b98120; color:#10b981; font-weight:bold; font-size:12px;">Pago</span>`}</div></div>`;
            });
            htmlFaturas += '</div>'; container.innerHTML = htmlFaturas;
        }
    } catch (err) { console.error(err); }
}

window.abrirPagamentoPix = (valor, mes) => {
    const chavePix = "51986875187"; 
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(chavePix)}`;
    window.abrirModalCustom(`Pagamento PIX - ${mes}`, `<div style="text-align:center; padding-top:10px;"><p style="color:#475569; font-size:14px; margin-bottom:15px;">Escaneie o QR Code no seu banco para pagar a fatura de <strong>R$ ${valor}</strong>.</p><img src="${qrCodeUrl}" alt="QR Code PIX" style="border-radius:8px; border:1px solid #e2e8f0; padding:10px; margin-bottom:20px;"><div style="text-align:left;"><label style="font-size:12px; font-weight:bold; color:#64748b;">Chave PIX (Celular):</label><div style="display:flex; gap:5px; margin-top:5px;"><input type="text" id="pixCopiaCola" value="${chavePix}" style="flex:1; padding:10px; border-radius:6px; border:1px solid #ccc; font-size:14px; font-weight:bold; text-align:center;" readonly><button onclick="document.getElementById('pixCopiaCola').select(); document.execCommand('copy'); alert('Chave copiada!');" style="background:#334155; color:white; border:none; padding:10px 15px; border-radius:6px; cursor:pointer; font-weight:bold;">Copiar</button></div></div><p style="font-size:12px; color:#94a3b8; margin-top:20px;">O sistema aprovará a baixa automaticamente em até 10 minutos.</p></div>`);
};

// ==========================================
// PERFIL DO PACIENTE 
// ==========================================
function abrirPerfilPaciente(paciente) {
    pacienteAtual = paciente; 
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById('tab-perfil-paciente').classList.add('active');

    document.getElementById('perfil_nome').innerHTML = `${paciente.nome}`;
    document.getElementById('perfil_idade').innerText = calcularIdade(paciente.nascimento);
    document.getElementById('perfil_contato').innerText = `📞 ${paciente.telefone} | R$ ${paciente.valor ? paciente.valor.toFixed(2) : "0.00"}/sessão`;
    document.getElementById('perfil_plano').innerText = paciente.plano || "Não definido";
    document.getElementById('perfil_id_registro').innerText = paciente.prontuario_id || "Não possui";
    document.getElementById('perfil_id_finan').innerText = paciente.financeiro_id || "Não possui";
    document.getElementById('selectEditarStatus').value = paciente.status || "Ativo";

    if (paciente.foto) { document.getElementById('perfil_foto_img').src = paciente.foto; document.getElementById('perfil_foto_img').style.display = 'block'; document.getElementById('perfil_iniciais').style.display = 'none'; } 
    else { document.getElementById('perfil_foto_img').style.display = 'none'; document.getElementById('perfil_iniciais').innerText = paciente.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(); document.getElementById('perfil_iniciais').style.display = 'block'; }

    document.getElementById('edit_nome_comp').value = paciente.nome || '';
    document.getElementById('edit_resp_comp').value = paciente.responsavel || '';
    document.getElementById('edit_cpf_comp').value = paciente.cpf || '';
    document.getElementById('edit_nasc_comp').value = paciente.nascimento || '';
    document.getElementById('edit_tel_comp').value = paciente.telefone || '';
    document.getElementById('edit_emerg_comp').value = paciente.emergencia || '';
    document.getElementById('edit_end_comp').value = paciente.endereco || '';
    document.getElementById('edit_plano_comp').value = paciente.plano || 'Psicoterapia Individual';
    document.getElementById('edit_valor_comp').value = paciente.valor || 0;

    document.getElementById('agenda_valor').value = paciente.valor ? paciente.valor.toFixed(2) : "0.00";
    if (document.getElementById('formAnamnese')) {
        if (paciente.anamnese) { 
            document.getElementById('anam_queixa').value = paciente.anamnese.queixa || ""; document.getElementById('anam_historico').value = paciente.anamnese.historico || ""; document.getElementById('anam_observacao').value = paciente.anamnese.observacao || ""; document.getElementById('anam_hipotese').value = paciente.anamnese.hipotese || ""; 
            if(document.getElementById('registro_anamnese')) document.getElementById('registro_anamnese').innerHTML = `Salvo em: <strong>${new Date(paciente.anamnese.ultima_atualizacao).toLocaleString('pt-BR')}</strong>`; 
        } else { 
            document.getElementById('formAnamnese').reset(); 
            if(document.getElementById('registro_anamnese')) document.getElementById('registro_anamnese').innerHTML = "Sem registro prévio"; 
        }
    }
    
    document.querySelector('.sub-btn[data-sub="perfil"]').click();
    renderizarSessoesPrevistas(paciente.sessoes_previstas || []); 
    renderizarFinanceiro(paciente.sessoes_previstas || []); 
    renderizarEvolucoes(paciente.evolucoes || []);
}

document.getElementById('formEditarPerfilCompleto').addEventListener('submit', async (e) => {
    e.preventDefault();
    if(!pacienteAtual) return;
    const novosDados = { 
        nome: document.getElementById('edit_nome_comp').value, 
        responsavel: document.getElementById('edit_resp_comp').value,
        cpf: document.getElementById('edit_cpf_comp').value, 
        nascimento: document.getElementById('edit_nasc_comp').value, 
        telefone: document.getElementById('edit_tel_comp').value, 
        emergencia: document.getElementById('edit_emerg_comp').value, 
        endereco: document.getElementById('edit_end_comp').value, 
        plano: document.getElementById('edit_plano_comp').value, 
        valor: parseFloat(document.getElementById('edit_valor_comp').value)
    };
    try { 
        await updateDoc(doc(db, "pacientes", pacienteAtual.id), novosDados); 
        pacienteAtual = { ...pacienteAtual, ...novosDados }; 
        abrirPerfilPaciente(pacienteAtual); 
        carregarPacientes(); 
        window.abrirModalCustom("Sucesso", "<p>Dados cadastrais atualizados!</p>");
    } catch(err) { console.error(err); alert("Erro ao salvar."); }
});

document.getElementById('btnExcluirPaciente').addEventListener('click', async () => {
    window.confirmarExclusao = async () => { window.fecharModalCustom(); try { await deleteDoc(doc(db, "pacientes", pacienteAtual.id)); document.getElementById('btnVoltarPacientes').click(); carregarPacientes(); } catch(err) { console.error(err); } };
    window.abrirModalCustom("Excluir Paciente", `<p>Apagar DEFINITIVAMENTE o prontuário de ${pacienteAtual.nome}?</p><div style="display:flex; gap:10px; margin-top:20px;"><button onclick="window.fecharModalCustom()" style="flex:1; padding:10px; border-radius:6px; border:1px solid #cbd5e1; background:#fff; cursor:pointer;">Cancelar</button><button onclick="window.confirmarExclusao()" style="flex:1; padding:10px; border-radius:6px; border:none; background:#b91c1c; color:#fff; font-weight:bold; cursor:pointer;">Excluir</button></div>`);
});

document.getElementById('selectEditarStatus').addEventListener('change', async (e) => { try { await updateDoc(doc(db, "pacientes", pacienteAtual.id), { status: e.target.value }); carregarPacientes(); } catch(err) { console.error(err); } });

if (document.getElementById('formAnamnese')) {
    document.getElementById('formAnamnese').addEventListener('submit', async (e) => {
        e.preventDefault(); if (!pacienteAtual) return;
        const agoraIso = new Date().toISOString();
        const anamneseData = { queixa: document.getElementById('anam_queixa').value, historico: document.getElementById('anam_historico').value, observacao: document.getElementById('anam_observacao').value, hipotese: document.getElementById('anam_hipotese').value, ultima_atualizacao: agoraIso };
        try { await updateDoc(doc(db, "pacientes", pacienteAtual.id), { anamnese: anamneseData }); pacienteAtual.anamnese = anamneseData; if(document.getElementById('registro_anamnese')) document.getElementById('registro_anamnese').innerHTML = `Salvo em: <strong>${new Date(agoraIso).toLocaleString('pt-BR')}</strong>`; window.abrirModalCustom("Sucesso", "<p>Anamnese salva.</p>"); } catch (error) { window.abrirModalCustom("Erro", "<p>Erro ao salvar.</p>"); }
    });
}

document.getElementById('formAgendaSimples').addEventListener('submit', async (e) => {
    e.preventDefault();
    const dataInicial = document.getElementById('agenda_data').value, horario = document.getElementById('agenda_hora').value, valor = parseFloat(document.getElementById('agenda_valor').value), frequencia = document.getElementById('agenda_frequencia').value;
    let sessoes = pacienteAtual.sessoes_previstas || [];
    let sessoesParaAdicionar = [];

    if (frequencia === 'Avulsa') { sessoesParaAdicionar.push(dataInicial); } 
    else if (frequencia === 'Semanal') { for(let i=0; i<4; i++) { let d = new Date(dataInicial + "T00:00:00"); d.setDate(d.getDate() + (i * 7)); sessoesParaAdicionar.push(d.toISOString().split('T')[0]); } } 
    else if (frequencia === 'Quinzenal') { for(let i=0; i<2; i++) { let d = new Date(dataInicial + "T00:00:00"); d.setDate(d.getDate() + (i * 14)); sessoesParaAdicionar.push(d.toISOString().split('T')[0]); } } 
    else if (frequencia === 'Mensal') { for(let i=0; i<6; i++) { let d = new Date(dataInicial + "T00:00:00"); d.setMonth(d.getMonth() + i); sessoesParaAdicionar.push(d.toISOString().split('T')[0]); } }

    sessoesParaAdicionar.forEach(dataSessao => { sessoes.push({ data: dataSessao, horario: horario, valor: valor, frequencia: frequencia, status_sessao: "Agendada", status_pagamento: "Pendente" }); });
    sessoes.sort((a, b) => new Date(a.data) - new Date(b.data));

    try {
        await updateDoc(doc(db, "pacientes", pacienteAtual.id), { sessoes_previstas: sessoes }); pacienteAtual.sessoes_previstas = sessoes; 
        document.getElementById('formAgendaSimples').reset(); document.getElementById('agenda_valor').value = pacienteAtual.valor ? pacienteAtual.valor.toFixed(2) : "0.00"; document.getElementById('agenda_frequencia').value = "Avulsa";
        renderizarSessoesPrevistas(sessoes); renderizarFinanceiro(sessoes); renderizarGrafico(); 
    } catch(err) { console.error(err); }
});

function renderizarSessoesPrevistas(sessoes) {
    const div = document.getElementById('lista_sessoes_geradas'); div.innerHTML = ''; 
    if(!sessoes || sessoes.length === 0) { div.innerHTML = "<p style='color:#64748b;'>Nenhuma sessão agendada.</p>"; return; }
    const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    sessoes.forEach((s, index) => {
        const [ano, mes, dia] = s.data.split('-'); const nomeMes = mesesNomes[parseInt(mes) - 1];
        const card = document.createElement('div'); card.className = `sessao-card ${(s.status_sessao === 'Falta' || s.status_sessao === 'Cancelada') ? 'status-inativo' : ''}`;
        card.innerHTML = `<div class="sessao-data"><span class="dia">${dia}</span><span class="mes">${nomeMes}</span></div><div class="sessao-detalhes"><strong>${s.horario}</strong><span>R$ ${s.valor.toFixed(2)} <small style="background:#e2e8f0; padding:2px 6px; border-radius:4px; margin-left:5px; font-size:10px;">${s.frequencia || 'Avulsa'}</small></span></div><div class="sessao-acoes" style="display:flex; align-items:center; gap:5px;"><select class="select-status-sessao" data-index="${index}" style="font-weight:600;"><option value="Agendada" ${s.status_sessao === 'Agendada' ? 'selected' : ''}>⏳ Agendada</option><option value="Realizada" ${s.status_sessao === 'Realizada' ? 'selected' : ''}>✅ Realizada</option><option value="Falta" ${s.status_sessao === 'Falta' ? 'selected' : ''}>❌ Falta</option><option value="Cancelada" ${s.status_sessao === 'Cancelada' ? 'selected' : ''}>🚫 Cancelada</option></select><button class="btn-desconto" data-index="${index}" style="font-size:12px; background:#475569; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Editar</button><button class="btn-excluir-sessao" data-index="${index}" style="font-size:12px; background:#f43f5e; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Excluir</button></div>`;
        div.appendChild(card);
    });
}

document.getElementById('lista_sessoes_geradas').addEventListener('change', async (e) => {
    if(e.target.classList.contains('select-status-sessao')) {
        const index = e.target.getAttribute('data-index'); pacienteAtual.sessoes_previstas[index].status_sessao = e.target.value;
        try { await updateDoc(doc(db, "pacientes", pacienteAtual.id), { sessoes_previstas: pacienteAtual.sessoes_previstas }); renderizarSessoesPrevistas(pacienteAtual.sessoes_previstas); renderizarFinanceiro(pacienteAtual.sessoes_previstas); renderizarGrafico(); } catch(err) {}
    }
});

document.getElementById('lista_sessoes_geradas').addEventListener('click', async (e) => {
    if(e.target.classList.contains('btn-desconto')) {
        const index = e.target.getAttribute('data-index'); const valorAtual = pacienteAtual.sessoes_previstas[index].valor.toFixed(2);
        window.executarEdicaoValor = async () => {
            const novoValor = document.getElementById('dinamico_novo_valor').value; window.fecharModalCustom();
            if(novoValor !== null && !isNaN(novoValor) && novoValor.trim() !== '') {
                pacienteAtual.sessoes_previstas[index].valor = parseFloat(novoValor);
                try { await updateDoc(doc(db, "pacientes", pacienteAtual.id), { sessoes_previstas: pacienteAtual.sessoes_previstas }); renderizarSessoesPrevistas(pacienteAtual.sessoes_previstas); renderizarFinanceiro(pacienteAtual.sessoes_previstas); renderizarGrafico(); } catch(err) {}
            }
        };
        window.abrirModalCustom("Editar Valor da Sessão", `<input type="number" id="dinamico_novo_valor" step="0.01" value="${valorAtual}" style="width:100%; padding:12px; border-radius:8px; border:1px solid #cbd5e1; margin-bottom:15px;"><button onclick="window.executarEdicaoValor()" style="width:100%; padding:12px; background:#0ea5e9; color:#fff; border:none; border-radius:8px; font-weight:bold;">Salvar</button>`);
    }
    if(e.target.classList.contains('btn-excluir-sessao')) {
        const index = e.target.getAttribute('data-index');
        window.confirmarExclusaoSessao = async () => {
            window.fecharModalCustom(); pacienteAtual.sessoes_previstas.splice(index, 1);
            try { await updateDoc(doc(db, "pacientes", pacienteAtual.id), { sessoes_previstas: pacienteAtual.sessoes_previstas }); renderizarSessoesPrevistas(pacienteAtual.sessoes_previstas); renderizarFinanceiro(pacienteAtual.sessoes_previstas); renderizarGrafico(); } catch(err) {}
        };
        window.abrirModalCustom("Excluir Atendimento", `<p>Deseja remover este agendamento?</p><div style="display:flex; gap:10px; margin-top:20px;"><button onclick="window.fecharModalCustom()" style="flex:1; padding:10px; border-radius:6px; border:1px solid #cbd5e1; background:#fff;">Cancelar</button><button onclick="window.confirmarExclusaoSessao()" style="flex:1; padding:10px; border-radius:6px; border:none; background:#e11d48; color:#fff; font-weight:bold;">Excluir</button></div>`);
    }
});

if (document.getElementById('formEvolucao')) {
    document.getElementById('formEvolucao').addEventListener('submit', async (e) => {
        e.preventDefault(); if (!pacienteAtual) return;
        const novaEvolucao = { id: gerarCodigoNumerico(), data: document.getElementById('evo_data').value, hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), evolucao: document.getElementById('evo_texto').value, plano: document.getElementById('evo_plano').value, data_registro: new Date().toISOString() };
        let listaEvolucoes = pacienteAtual.evolucoes || []; listaEvolucoes.push(novaEvolucao); listaEvolucoes.sort((a, b) => new Date(b.data) - new Date(a.data));
        try { await updateDoc(doc(db, "pacientes", pacienteAtual.id), { evolucoes: listaEvolucoes }); pacienteAtual.evolucoes = listaEvolucoes; document.getElementById('formEvolucao').reset(); renderizarEvolucoes(listaEvolucoes); window.abrirModalCustom("Sucesso", "<p>Sessão registrada.</p>"); } catch (error) {}
    });
}

function renderizarEvolucoes(evolucoes) {
    const container = document.getElementById('lista_evolucoes'); if (!container) return; container.innerHTML = '';
    const subEvolucao = document.getElementById('sub-evolucao');
    if(subEvolucao && subEvolucao.querySelector('h3') && !document.getElementById('btnImprimirParecer')) { 
        let headerEvo = subEvolucao.querySelector('h3');
        headerEvo.style.display = 'flex'; headerEvo.style.justifyContent = 'space-between'; headerEvo.style.alignItems = 'center';
        headerEvo.innerHTML = `Evolução Clínica <button id="btnImprimirParecer" style="padding:8px 16px; font-size:13px; background:#8b5cf6; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">Gerar Parecer</button>`; 
    }
    if (!evolucoes || evolucoes.length === 0) { container.innerHTML = '<p style="color:#94a3b8; font-size:14px;">Nenhuma evolução registrada.</p>'; return; }
    evolucoes.forEach(evo => {
        const cardEvo = document.createElement('div'); cardEvo.style.cssText = "background:#fff; border:1px solid #cbd5e1; border-radius:8px; padding:15px; margin-bottom:10px;";
        cardEvo.innerHTML = `<div style="display:flex; justify-content:space-between; border-bottom:1px solid #f1f5f9; padding-bottom:10px; margin-bottom:10px;"><strong>Data: ${evo.data.split('-').reverse().join('/')}</strong><span style="font-size:12px; color:#64748b;">Hora: ${evo.hora}</span></div><div><span style="font-size:12px; font-weight:bold; color:#475569;">Evolução</span><p style="font-size:14px; margin-top:4px;">${evo.evolucao}</p></div><div style="margin-top:10px;"><span style="font-size:12px; font-weight:bold; color:#059669;">Plano</span><p style="font-size:14px; margin-top:4px;">${evo.plano || 'Sem plano'}</p></div>`; container.appendChild(cardEvo);
    });
}

document.addEventListener('click', async (e) => {
    if (e.target && e.target.id === 'btnImprimirParecer') {
        if (!pacienteAtual || !pacienteAtual.evolucoes || pacienteAtual.evolucoes.length === 0) { window.abrirModalCustom("Aviso", "<p>Sem histórico para parecer.</p>"); return; }
        
        window.abrirModalCustom("Gerando Parecer", "<p>Consolidando histórico e confirmando registro profissional...</p>");
        
        try {
            const psiSnap = await getDoc(doc(db, "usuarios", psicologoLogado.id));
            const crpAtualizado = psiSnap.exists() ? psiSnap.data().crp : null;
            const crpExibicao = crpAtualizado ? `CRP: ${crpAtualizado}` : "CRP: Não Cadastrado";

            setTimeout(() => {
                const evosOrdenadas = [...pacienteAtual.evolucoes].sort((a, b) => new Date(a.data) - new Date(b.data)); const dataInicio = evosOrdenadas[0].data.split('-').reverse().join('/'); const dataFim = evosOrdenadas[evosOrdenadas.length - 1].data.split('-').reverse().join('/');
                const textoResumoIA = `O paciente realizou um total de ${evosOrdenadas.length} sessões de acompanhamento psicológico no período compreendido entre ${dataInicio} e ${dataFim}. O processo terapêutico focou nas demandas apresentadas, englobando as observações contínuas e as intervenções propostas pelo plano clínico.`;
                
                const conteudoPDF = `<div style="font-family:Arial; line-height:1.6; padding:20px;"><h1 style="text-align:center; font-size:22px; border-bottom:2px solid #000; padding-bottom:20px;">Parecer Psicológico Evolutivo</h1><div style="margin-bottom:30px;"><p><strong>Paciente:</strong> ${pacienteAtual.nome}</p><p><strong>Profissional:</strong> ${psicologoLogado.nome} | ${crpExibicao}</p><p><strong>Período:</strong> ${dataInicio} a ${dataFim}</p></div><h3 style="border-bottom:1px solid #ccc; padding-bottom:10px;">Síntese do Processo</h3><div style="text-align:justify; margin-bottom:40px;">${textoResumoIA}</div><div style="text-align:center; margin-top:80px;"><p>_____________________________________</p><p style="font-weight:bold;">${psicologoLogado.nome}</p><p>Emitido em: ${new Date().toLocaleDateString('pt-BR')}</p></div></div>`;
                window.fecharModalCustom(); imprimirConteudo(conteudoPDF); 
            }, 1500);
        } catch (err) { console.error(err); window.fecharModalCustom(); }
    }
});

function renderizarFinanceiro(sessoes) {
    const div = document.getElementById('lista_financeiro_sessoes'); div.innerHTML = '';
    let totalPendente = 0, totalPago = 0;
    if (!sessoes || sessoes.length === 0) { div.innerHTML = '<p style="color:#64748b;">Nenhum histórico financeiro.</p>'; document.getElementById('finan_total_pendente').innerText = 'R$ 0,00'; document.getElementById('finan_total_pago').innerText = 'R$ 0,00'; } 
    else {
        [...sessoes].reverse().forEach((s) => {
            const item = document.createElement('div'); item.className = 'finan-item'; const dataBR = s.data.split('-').reverse().join('/');
            if (s.status_sessao === 'Agendada') { item.style.opacity = '0.6'; item.innerHTML = `<div><strong style="color:#64748b;">Sessão: ${dataBR} (Futuro)</strong></div><div><span style="color:#64748b;">R$ ${s.valor.toFixed(2)}</span></div>`; } 
            else if (s.status_sessao === 'Cancelada' || s.status_sessao === 'Falta') { item.style.background = '#f8fafc'; item.innerHTML = `<div><strong style="color:#64748b; text-decoration:line-through;">Sessão: ${dataBR} (${s.status_sessao})</strong></div><div><span style="color:#cbd5e1; text-decoration:line-through;">R$ ${s.valor.toFixed(2)}</span></div>`; } 
            else if (s.status_sessao === 'Realizada') {
                if (s.status_pagamento === 'Pago') { totalPago += s.valor; item.innerHTML = `<div><strong style="color:#1e293b;">Sessão: ${dataBR}</strong></div><div><span class="badge-pago">Pago</span></div>`; } 
                else { totalPendente += s.valor; item.innerHTML = `<div><strong style="color:#b91c1c;">Sessão: ${dataBR} (Débito)</strong></div><div><button class="btn-pagar" data-index="${sessoes.indexOf(s)}">Registrar Pagamento</button></div>`; }
            }
            div.appendChild(item);
        });
        document.getElementById('finan_total_pendente').innerText = `R$ ${totalPendente.toFixed(2)}`; document.getElementById('finan_total_pago').innerText = `R$ ${totalPago.toFixed(2)}`;
    }
    
    div.innerHTML += `<div style="margin-top:30px; text-align:center; border-top:1px solid #e2e8f0; padding-top:20px;"><button onclick="window.zerarFinanceiro()" style="background:transparent; color:#e11d48; border:1px solid #e11d48; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:13px; transition: 0.2s;">Zerar Histórico Financeiro e Agenda</button><p style="font-size:11px; color:#94a3b8; margin-top:8px;">Isso removerá todas as sessões e pagamentos da agenda deste paciente.</p></div>`;
}

window.zerarFinanceiro = async () => {
    window.confirmarZerar = async () => {
        window.fecharModalCustom();
        try { await updateDoc(doc(db, "pacientes", pacienteAtual.id), { sessoes_previstas: [] }); pacienteAtual.sessoes_previstas = []; renderizarSessoesPrevistas([]); renderizarFinanceiro([]); renderizarGrafico(); window.abrirModalCustom("Sucesso", "<p>Histórico financeiro e agenda foram reiniciados.</p>"); } catch(err) { console.error(err); }
    };
    window.abrirModalCustom("⚠️ Atenção: Zerar Histórico", `<div style="text-align:center;"><p style="color:#475569; font-size:15px; margin-bottom:15px;">Tem certeza que deseja apagar <strong>permanentemente</strong> todas as sessões agendadas, pendentes e pagas deste paciente?</p><div style="display:flex; gap:10px;"><button onclick="window.fecharModalCustom()" style="flex:1; padding:12px; border-radius:8px; border:1px solid #cbd5e1; background:#f8fafc; color:#475569; font-weight:bold; cursor:pointer;">Cancelar</button><button onclick="window.confirmarZerar()" style="flex:1; padding:12px; border-radius:8px; border:none; background:#e11d48; color:#fff; font-weight:bold; cursor:pointer;">Sim, Zerar Tudo</button></div></div>`);
};

document.getElementById('lista_financeiro_sessoes').addEventListener('click', async (e) => {
    if (e.target.classList.contains('btn-pagar')) {
        const index = e.target.getAttribute('data-index');
        window.executarPagamento = async () => { const metodo = document.getElementById('dinamico_pagamento_metodo').value; window.fecharModalCustom(); pacienteAtual.sessoes_previstas[index].status_pagamento = "Pago"; pacienteAtual.sessoes_previstas[index].metodo_pagamento = metodo; try { await updateDoc(doc(db, "pacientes", pacienteAtual.id), { sessoes_previstas: pacienteAtual.sessoes_previstas }); renderizarSessoesPrevistas(pacienteAtual.sessoes_previstas); renderizarFinanceiro(pacienteAtual.sessoes_previstas); renderizarGrafico(); } catch(err) {} };
        window.abrirModalCustom("Registrar Pagamento", `<select id="dinamico_pagamento_metodo" style="width:100%; padding:12px; border-radius:8px; border:1px solid #cbd5e1; margin-bottom:15px;"><option value="Pix">Pix</option><option value="Dinheiro">Dinheiro</option><option value="Cartão">Cartão</option></select><button onclick="window.executarPagamento()" style="width:100%; padding:12px; background:#0ea5e9; color:#fff; border:none; border-radius:8px; font-weight:bold;">Confirmar</button>`);
    }
});

document.getElementById('btnImprimirRecibo').addEventListener('click', () => {
    const dataObj = new Date(); dataObj.setMinutes(dataObj.getMinutes() - dataObj.getTimezoneOffset());
    const hojeIso = dataObj.toISOString().split('T')[0]; const inicioDoMes = hojeIso.substring(0, 8) + '01';
    
    window.executarImpressao = async () => {
        const dI = document.getElementById('dinamico_data_ini').value, dF = document.getElementById('dinamico_data_fim').value; window.fecharModalCustom();
        let sP = pacienteAtual.sessoes_previstas.filter(s => s.status_pagamento === 'Pago' && s.data >= dI && s.data <= dF).sort((a, b) => new Date(a.data) - new Date(b.data));
        if (sP.length === 0) { window.abrirModalCustom("Aviso", "<p>Nenhuma sessão paga no período.</p>"); return; }
        
        try {
            const psiSnap = await getDoc(doc(db, "usuarios", psicologoLogado.id));
            const crpAtualizado = psiSnap.exists() ? psiSnap.data().crp : null;
            const documentoOpcional = psiSnap.exists() && psiSnap.data().documento ? `<p style="margin: 5px 0;"><strong>CPF/CNPJ:</strong> ${psiSnap.data().documento}</p>` : '';
            const crpExibicao = crpAtualizado ? `Registro: ${crpAtualizado}` : "Registro: Não Cadastrado";

            const conteudoPDF = `
                <div class="recibo-container" style="font-family: Arial, sans-serif;">
                    <div class="recibo-header" style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px;">
                        <h1 class="recibo-titulo" style="font-size: 22px; text-transform: uppercase;">Recibo de Prestação de Serviços</h1>
                        <p style="margin: 5px 0;"><strong>Profissional:</strong> ${psicologoLogado.nome} | ${crpExibicao}</p>
                        ${documentoOpcional}
                        <p style="margin: 5px 0;"><strong>Paciente:</strong> ${pacienteAtual.nome} | <strong>CPF:</strong> ${pacienteAtual.cpf || 'Não informado'}</p>
                    </div>
                    <table class="recibo-tabela" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                        <thead>
                            <tr><th style="text-align: left; padding: 10px; border-bottom: 1px solid #ccc;">Data</th><th style="text-align: left; padding: 10px; border-bottom: 1px solid #ccc;">Serviço</th><th style="text-align: left; padding: 10px; border-bottom: 1px solid #ccc;">Valor</th></tr>
                        </thead>
                        <tbody>
                            ${sP.map(s => `<tr><td style="padding: 10px; border-bottom: 1px solid #eee;">${s.data.split('-').reverse().join('/')}</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${pacienteAtual.plano || 'Sessão de Psicoterapia'}</td><td style="padding: 10px; border-bottom: 1px solid #eee;">R$ ${s.valor.toFixed(2)}</td></tr>`).join('')}
                        </tbody>
                    </table>
                    <div style="margin-top: 30px; text-align: right; padding-top: 15px; border-top: 2px solid #ccc;">
                        <p style="font-size: 18px; color: #000;"><strong>Total do Período: R$ ${sP.reduce((a, s) => a + s.valor, 0).toFixed(2)}</strong></p>
                    </div>
                    <div style="margin-top: 80px; text-align: center;">
                        <p>____________________________________________________</p>
                        <p style="margin-top: 5px; font-weight: bold; color: #000;">${psicologoLogado.nome}</p>
                        <p style="margin-top: 2px; color: #000;">${crpExibicao}</p>
                    </div>
                </div>
            `;
            imprimirConteudo(conteudoPDF); 
        } catch (err) { console.error(err); }
    };
    window.abrirModalCustom("Imprimir Recibo", `<input type="date" id="dinamico_data_ini" value="${inicioDoMes}" style="width:100%; padding:10px; margin-bottom:10px;"><input type="date" id="dinamico_data_fim" value="${hojeIso}" style="width:100%; padding:10px; margin-bottom:15px;"><button onclick="window.executarImpressao()" style="width:100%; padding:12px; background:#059669; color:#fff; font-weight:bold; border-radius:8px; border:none;">Gerar Recibo</button>`);
});

document.getElementById('btnAlterarFoto').addEventListener('click', () => document.getElementById('inputFotoPaciente').click());
document.getElementById('inputFotoPaciente').addEventListener('change', (e) => {
    const arq = e.target.files[0]; if (!arq) return; const reader = new FileReader(); reader.readAsDataURL(arq);
    reader.onload = (ev) => { const img = new Image(); img.src = ev.target.result; img.onload = async () => { const canvas = document.createElement('canvas'); canvas.width = 300; canvas.height = 300; canvas.getContext('2d').drawImage(img, 0, 0, 300, 300); const f = canvas.toDataURL('image/jpeg', 0.7); document.getElementById('perfil_foto_img').src = f; document.getElementById('perfil_foto_img').style.display = 'block'; document.getElementById('perfil_iniciais').style.display = 'none'; try { await updateDoc(doc(db, "pacientes", pacienteAtual.id), { foto: f }); carregarPacientes(); } catch(err){} } };
});

document.querySelectorAll('.sub-btn').forEach(btn => { btn.addEventListener('click', () => { document.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active')); document.querySelectorAll('.sub-content').forEach(c => c.classList.remove('active')); btn.classList.add('active'); document.getElementById('sub-' + btn.getAttribute('data-sub')).classList.add('active'); }); });
document.getElementById('btnVoltarPacientes').addEventListener('click', () => { document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active')); document.getElementById('tab-pacientes').classList.add('active'); });