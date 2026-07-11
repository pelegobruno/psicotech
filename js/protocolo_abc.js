import { db } from './firebase-config.js';
import { doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const perguntasICA = [
    { id: 1, dom: "ES", texto: "Gira em torno de si por longo período de tempo" },
    { id: 2, dom: "ES", texto: "Aprende uma tarefa, mas esquece rapidamente" },
    { id: 3, dom: "ES", texto: "Pobre uso de discriminação visual" },
    { id: 4, dom: "ES", texto: "Cobre os ouvidos para sons de rotina" },
    { id: 5, dom: "ES", texto: "Olha fixamente para o nada ou para o vazio" },
    { id: 6, dom: "ES", texto: "Reação incomum a texturas e toques" },
    { id: 7, dom: "ES", texto: "Fica fascinado com o movimento de certos objetos" },
    { id: 8, dom: "ES", texto: "Cheira ou lambe objetos não alimentares" },
    { id: 9, dom: "ES", texto: "Apresenta alta tolerância à dor" },
    { id: 10, dom: "RE", texto: "É raro atender a estímulo não verbal social" },
    { id: 11, dom: "RE", texto: "Ausência de resposta para solicitações verbais" },
    { id: 12, dom: "RE", texto: "Ausência do sorriso social" },
    { id: 13, dom: "RE", texto: "Parece não escutar" },
    { id: 14, dom: "RE", texto: "Falta de contato visual adequado" },
    { id: 15, dom: "RE", texto: "Isola-se ativamente" },
    { id: 16, dom: "RE", texto: "Não participa de jogos em grupo" },
    { id: 17, dom: "RE", texto: "Rejeita carinho ou colo" },
    { id: 18, dom: "RE", texto: "Tem explosões de choro sem motivo" },
    { id: 19, dom: "RE", texto: "Age como se os outros fossem objetos" },
    { id: 20, dom: "RE", texto: "Não demonstra simpatia/empatia" },
    { id: 21, dom: "RE", texto: "Sorri ou ri de forma inadequada" },
    { id: 22, dom: "CO", texto: "Uso inapropriado de brinquedos" },
    { id: 23, dom: "CO", texto: "Insiste em manter certos objetos sempre consigo" },
    { id: 24, dom: "CO", texto: "Balança-se por longos períodos" },
    { id: 25, dom: "CO", texto: "Caminha na ponta dos pés" },
    { id: 26, dom: "CO", texto: "Flapping (agitar as mãos rapidamente)" },
    { id: 27, dom: "CO", texto: "Auto-agressão" },
    { id: 28, dom: "CO", texto: "Resiste a mudanças de rotina intensamente" },
    { id: 29, dom: "CO", texto: "Alinha objetos em filas precisas" },
    { id: 30, dom: "CO", texto: "Movimentos corporais rígidos" },
    { id: 31, dom: "CO", texto: "Exibe apegos incomuns a objetos" },
    { id: 32, dom: "CO", texto: "Fascinação por luzes e reflexos" },
    { id: 33, dom: "CO", texto: "Pula constantemente de forma desregulada" },
    { id: 34, dom: "LG", texto: "Uso inadequado de pronomes" },
    { id: 35, dom: "LG", texto: "Fala monótona e sem ritmo" },
    { id: 36, dom: "LG", texto: "Ecolalia" },
    { id: 37, dom: "LG", texto: "Atraso acentuado na linguagem expressiva" },
    { id: 38, dom: "LG", texto: "Não aponta para mostrar objetos de interesse" },
    { id: 39, dom: "LG", texto: "Dificuldade de seguir instruções simples" },
    { id: 40, dom: "LG", texto: "Produz jargões sem sentido" },
    { id: 41, dom: "LG", texto: "Responde a uma pergunta repetindo-a" },
    { id: 42, dom: "LG", texto: "Dificuldade em manter um diálogo de troca" },
    { id: 43, dom: "LG", texto: "Grita quando não sabe expressar uma frustração" },
    { id: 44, dom: "LG", texto: "Perda abrupta de palavras já adquiridas" },
    { id: 45, dom: "LG", texto: "Não entende comandos gestuais" },
    { id: 46, dom: "LG", texto: "Fica obcecado por certos sons de fala" },
    { id: 47, dom: "PS", texto: "Dificuldade na alimentação (seletividade)" },
    { id: 48, dom: "PS", texto: "Não demonstra medo diante de perigos reais" },
    { id: 49, dom: "PS", texto: "Atraso no desfralde ou uso do banheiro" },
    { id: 50, dom: "PS", texto: "Não possui habilidades básicas de vestir-se" },
    { id: 51, dom: "PS", texto: "Não consegue esperar sua vez" },
    { id: 52, dom: "PS", texto: "Birras severas e difíceis de conter" },
    { id: 53, dom: "PS", texto: "Não consegue imitar atividades simples dos pais" },
    { id: 54, dom: "PS", texto: "Brincadeira de faz-de-conta pobre ou inexistente" },
    { id: 55, dom: "PS", texto: "Dificuldade em lavar as mãos sozinho" },
    { id: 56, dom: "PS", texto: "Demonstra medo extremo de coisas inofensivas" },
    { id: 57, dom: "PS", texto: "Comportamento muito passivo ou dependente" }
];

window.iniciarABC = () => {
    const pacienteId = document.getElementById('select_paciente_protocolo').value;
    if (!pacienteId) { alert("Selecione um paciente!"); return; }

    const area = document.getElementById('area-aplicacao-protocolo');
    area.style.display = 'block';
    
    let htmlForm = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:2px solid #e2e8f0; padding-bottom:10px;">
            <h2 style="color:#0f172a; margin:0;">Inventário ABC-ICA (BR)</h2>
            <button onclick="document.getElementById('area-aplicacao-protocolo').style.display='none'" style="background:none; border:none; color:#ef4444; font-weight:bold; cursor:pointer;">✖ Fechar</button>
        </div>
        <p style="color:#64748b; font-size:14px; margin-bottom:20px;">Escala: <strong>0 = Nunca | 1 = Raramente | 2 = Às vezes | 3 = Frequentemente | 4 = Sempre</strong>.</p>
        <form id="form_abc_ica">
            <div style="max-height:450px; overflow-y:auto; padding-right:10px; margin-bottom:20px;">
    `;

    perguntasICA.forEach((p, index) => {
        htmlForm += `
            <div style="background:${index % 2 === 0 ? '#f8fafc' : '#ffffff'}; padding:15px; border:1px solid #e2e8f0; margin-bottom:8px; border-radius:6px;">
                <p style="margin: 0 0 10px 0; color: #1e293b; font-weight: 500; font-size: 14px;">${p.id}. ${p.texto} <span style="color:#94a3b8; font-size:11px; font-weight:bold;">(${p.dom})</span></p>
                <div style="display: flex; gap: 15px;">
                    <label style="font-size:13px; font-weight:bold;"><input type="radio" name="q_${p.id}" value="0" required> 0</label>
                    <label style="font-size:13px; font-weight:bold;"><input type="radio" name="q_${p.id}" value="1"> 1</label>
                    <label style="font-size:13px; font-weight:bold;"><input type="radio" name="q_${p.id}" value="2"> 2</label>
                    <label style="font-size:13px; font-weight:bold;"><input type="radio" name="q_${p.id}" value="3"> 3</label>
                    <label style="font-size:13px; font-weight:bold; color:#10b981;"><input type="radio" name="q_${p.id}" value="4"> 4</label>
                </div>
            </div>
        `;
    });

    htmlForm += `
            </div>
            <div style="text-align: right;">
                <button type="submit" style="background:#0f172a; color:#fff; border:none; padding:12px 24px; border-radius:8px; font-weight:bold; font-size:14px; cursor:pointer;">Processar e Salvar</button>
            </div>
        </form>
    `;
    area.innerHTML = htmlForm;

    document.getElementById('form_abc_ica').addEventListener('submit', async (e) => {
        e.preventDefault();
        let escores = { ES: 0, RE: 0, CO: 0, LG: 0, PS: 0 };
        let somaTotal = 0;

        perguntasICA.forEach(p => {
            const val = parseInt(document.querySelector(`input[name="q_${p.id}"]:checked`).value);
            somaTotal += val; escores[p.dom] += val;
        });

        try {
            const pRef = doc(db, "pacientes", pacienteId);
            const pacData = (await getDoc(pRef)).data();
            let protSalvos = pacData.protocolos_aplicados || [];
            protSalvos.push({ data_aplicacao: new Date().toISOString(), tipo_teste: "ABC-ICA", score_total: somaTotal, detalhes_dominio: escores });
            await updateDoc(pRef, { protocolos_aplicados: protSalvos });
            
            // Atualiza o histórico
            window.carregarEvolucaoPaciente(pacienteId);

            const textoRisco = somaTotal >= 49 ? '<span style="color:#b91c1c;">Alta probabilidade (Requer investigação)</span>' : '<span style="color:#10b981;">Baixa probabilidade</span>';
            const tabelaHtml = `
                <table style="width:100%; border-collapse:collapse; margin-top:30px; font-size:14px;">
                    <tr style="border-bottom:2px solid #e2e8f0; text-align:left;"><th style="padding:10px;">DOMÍNIO</th><th style="padding:10px;">SCORE</th></tr>
                    <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px;">Sensorial (ES)</td><td style="padding:10px;">${escores.ES}</td></tr>
                    <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px;">Relacionamento (RE)</td><td style="padding:10px;">${escores.RE}</td></tr>
                    <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px;">Corpo/Objetos (CO)</td><td style="padding:10px;">${escores.CO}</td></tr>
                    <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px;">Linguagem (LG)</td><td style="padding:10px;">${escores.LG}</td></tr>
                    <tr><td style="padding:10px;">Pessoal/Social (PS)</td><td style="padding:10px;">${escores.PS}</td></tr>
                </table>
            `;
            window.renderizarGraficoRadarGlobal(['Sensorial', 'Relacionamento', 'Corpo/Obj', 'Linguagem', 'Pessoal/Social'], [escores.ES, escores.RE, escores.CO, escores.LG, escores.PS], 50, somaTotal, textoRisco, tabelaHtml);
        } catch (error) { console.error(error); alert("Erro ao salvar no banco."); }
    });
};