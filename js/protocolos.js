import { db } from './firebase-config.js';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const psicologoLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

let evolucaoChartInstancia = null;

// Conecta os scripts separados
import './protocolo_abc.js';
import './protocolo_snap.js';

export function initProtocolos() {
    const navMenu = document.querySelector('.sidebar-menu');
    const mainArea = document.querySelector('.content-area');
    
    if (!navMenu || !mainArea) return;

    const btnProtocolo = document.createElement('button');
    btnProtocolo.className = 'menu-btn';
    btnProtocolo.setAttribute('data-target', 'tab-protocolos');
    btnProtocolo.innerText = 'Protocolos';
    navMenu.appendChild(btnProtocolo);

    const sectionProtocolos = document.createElement('section');
    sectionProtocolos.id = 'tab-protocolos';
    sectionProtocolos.className = 'tab-content';
    mainArea.appendChild(sectionProtocolos);

    btnProtocolo.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-menu .menu-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.content-area .tab-content').forEach(sec => sec.classList.remove('active'));
        btnProtocolo.classList.add('active');
        sectionProtocolos.classList.add('active');
        carregarAbaProtocolos();
    });

    document.querySelectorAll('.sidebar-menu .menu-btn:not([data-target="tab-protocolos"])').forEach(btn => {
        btn.addEventListener('click', () => { sectionProtocolos.classList.remove('active'); btnProtocolo.classList.remove('active'); });
    });
}

async function carregarAbaProtocolos() {
    const tab = document.getElementById('tab-protocolos');
    tab.innerHTML = `
        <div class="header-acoes" style="margin-bottom: 25px;">
            <div>
                <h1>Protocolos de Avaliação</h1>
                <p>Selecione um paciente para ver o histórico e aplicar instrumentos.</p>
            </div>
        </div>
        
        <div class="card-painel" style="margin-bottom: 20px;">
            <label style="font-weight:bold; color:#1e293b; display:block; margin-bottom:10px;">1. Selecione o Paciente:</label>
            <select id="select_paciente_protocolo" class="select-estilizado" style="width:100%; max-width:400px; padding:10px;" onchange="window.carregarEvolucaoPaciente(this.value)">
                <option value="">Carregando pacientes...</option>
            </select>
        </div>

        <div id="area-evolucao-protocolos" style="display:none; background:#fff; padding:20px; border-radius:8px; border:1px solid #e2e8f0; margin-bottom: 20px;">
            <h3 style="color:#1e293b; margin-bottom:15px; font-size:16px;">Evolução Histórica</h3>
            <div style="width: 100%; max-height: 250px;">
                <canvas id="chartEvolucaoProtocolos"></canvas>
            </div>
        </div>
        
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:20px;">
            <div style="background:#fff; padding:20px; border-radius:8px; border:1px solid #e2e8f0;">
                <h3 style="color:#1e293b; margin-bottom:8px;">ABC-ICA (BR)</h3>
                <p style="color:#64748b; font-size:13px; margin-bottom:20px;">Rastreio de Comportamentos Autísticos.</p>
                <button onclick="window.iniciarABC()" style="width:100%; padding:10px; background:#0f172a; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">Aplicar Teste</button>
            </div>

            <div style="background:#fff; padding:20px; border-radius:8px; border:1px solid #e2e8f0;">
                <h3 style="color:#1e293b; margin-bottom:8px;">SNAP-IV</h3>
                <p style="color:#64748b; font-size:13px; margin-bottom:20px;">Rastreamento de TDAH e TOD (26 itens).</p>
                <button onclick="window.iniciarSNAP()" style="width:100%; padding:10px; background:#4f46e5; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">Aplicar Teste</button>
            </div>
        </div>

        <div id="area-aplicacao-protocolo" style="margin-top:30px; display:none; background:#fff; padding:30px; border-radius:8px; border:1px solid #cbd5e1;"></div>
        <div id="area-resultado-grafico" style="margin-top:30px; display:none;"></div>
    `;

    try {
        const q = query(collection(db, "pacientes"), where("psicologo_id", "==", psicologoLogado.id));
        const snap = await getDocs(q);
        const select = document.getElementById('select_paciente_protocolo');
        select.innerHTML = '<option value="">-- Escolha um paciente --</option>';
        snap.forEach(doc => { select.innerHTML += `<option value="${doc.id}">${doc.data().nome}</option>`; });
    } catch (err) { console.error(err); }
}

window.carregarEvolucaoPaciente = async (pacienteId) => {
    const areaEvolucao = document.getElementById('area-evolucao-protocolos');
    if (!pacienteId) { areaEvolucao.style.display = 'none'; return; }

    try {
        const pacSnap = await getDoc(doc(db, "pacientes", pacienteId));
        if (pacSnap.exists()) {
            const pacData = pacSnap.data();
            const protocolos = pacData.protocolos_aplicados || [];

            if (protocolos.length === 0) { areaEvolucao.style.display = 'none'; return; }

            areaEvolucao.style.display = 'block';

            protocolos.sort((a, b) => new Date(a.data_aplicacao) - new Date(b.data_aplicacao));
            
            const labels = protocolos.map(p => {
                const data = new Date(p.data_aplicacao);
                return `${data.getDate()}/${data.getMonth()+1}/${data.getFullYear()} (${p.tipo_teste})`;
            });
            const scores = protocolos.map(p => p.score_total);

            const ctx = document.getElementById('chartEvolucaoProtocolos').getContext('2d');
            if(evolucaoChartInstancia) evolucaoChartInstancia.destroy();

            evolucaoChartInstancia = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Evolução Global dos Testes',
                        data: scores,
                        borderColor: '#0f172a',
                        backgroundColor: 'rgba(15, 23, 42, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3,
                        pointBackgroundColor: '#3b82f6',
                        pointRadius: 5
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    } catch (error) { console.error("Erro puxar evolução:", error); }
};

let radarChartInstancia = null;

window.renderizarGraficoRadarGlobal = (labels, dados, maxScale, somaTotal, textoRisco, tabelaHtml) => {
    const area = document.getElementById('area-resultado-grafico');
    area.style.display = 'block';

    area.innerHTML = `
        <div style="border:1px solid #cbd5e1; border-radius:8px; padding:20px; background:#fff;">
            <h3 style="text-align:center; color:#1e293b; text-transform:uppercase; margin-bottom:20px; font-size:18px;">PERFIL COMPORTAMENTAL (RADAR)</h3>
            <div style="display:flex; justify-content:space-between; align-items:center; border:2px solid #1e293b; padding:15px; border-radius:6px; margin-bottom:30px;">
                <span style="font-size:16px; font-weight:bold; color:#1e293b;">Score Total: ${somaTotal}</span>
                <span style="font-size:14px; text-transform:uppercase; border: 1px solid #000; padding: 4px 10px;">${textoRisco}</span>
            </div>
            <div style="width: 100%; max-width: 500px; margin: 0 auto;">
                <canvas id="chartProtocoloRadarGlobal"></canvas>
            </div>
            ${tabelaHtml}
        </div>
    `;

    const ctx = document.getElementById('chartProtocoloRadarGlobal').getContext('2d');
    if(radarChartInstancia) radarChartInstancia.destroy();

    radarChartInstancia = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Intensidade por Domínio',
                data: dados,
                backgroundColor: 'rgba(99, 102, 241, 0.4)', 
                borderColor: '#4f46e5', 
                pointBackgroundColor: '#4f46e5',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            scales: { r: { angleLines: { color: 'rgba(0, 0, 0, 0.1)' }, suggestedMin: 0, suggestedMax: maxScale } },
            plugins: { legend: { display: false } }
        }
    });
    area.scrollIntoView({ behavior: 'smooth' });
};