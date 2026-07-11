import { db } from './firebase-config.js';
import { doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const perguntasSNAP = [
    { id: 1, dom: "Desatenção", texto: "Não consegue prestar muita atenção a detalhes ou comete erros por descuido" },
    { id: 2, dom: "Desatenção", texto: "Tem dificuldade de manter a atenção em tarefas ou atividades de lazer" },
    { id: 3, dom: "Desatenção", texto: "Parece não estar ouvindo quando se fala diretamente com ele(a)" },
    { id: 4, dom: "Desatenção", texto: "Não segue instruções até o fim e não termina tarefas" },
    { id: 5, dom: "Desatenção", texto: "Tem dificuldade para organizar tarefas e atividades" },
    { id: 6, dom: "Desatenção", texto: "Evita, não gosta ou reluta em envolver-se em tarefas que exijam esforço mental" },
    { id: 7, dom: "Desatenção", texto: "Perde coisas necessárias para tarefas ou atividades" },
    { id: 8, dom: "Desatenção", texto: "Distrai-se facilmente com estímulos externos" },
    { id: 9, dom: "Desatenção", texto: "É esquecido(a) em atividades do dia-a-dia" },
    { id: 10, dom: "Hiperatividade", texto: "Mexe com as mãos ou os pés ou se contorce na cadeira" },
    { id: 11, dom: "Hiperatividade", texto: "Sai do lugar na sala de aula ou em outras situações" },
    { id: 12, dom: "Hiperatividade", texto: "Correm ou sobem nas coisas em situações inapropriadas" },
    { id: 13, dom: "Hiperatividade", texto: "Tem dificuldade em brincar ou envolver-se em atividades de lazer de forma calma" },
    { id: 14, dom: "Hiperatividade", texto: "Não para ou frequentemente está a 'mil por hora'" },
    { id: 15, dom: "Hiperatividade", texto: "Fala em excesso" },
    { id: 16, dom: "Hiperatividade", texto: "Responde precipitadamente antes da pergunta ser terminada" },
    { id: 17, dom: "Hiperatividade", texto: "Tem dificuldade de esperar a sua vez" },
    { id: 18, dom: "Hiperatividade", texto: "Interrompe ou se intromete nas conversas/jogos dos outros" },
    { id: 19, dom: "Oposição", texto: "Descontrola-se facilmente" },
    { id: 20, dom: "Oposição", texto: "Discute com adultos" },
    { id: 21, dom: "Oposição", texto: "Desafia ativamente ou recusa-se a atender a pedidos de adultos" },
    { id: 22, dom: "Oposição", texto: "Faz coisas deliberadamente para aborrecer os outros" },
    { id: 23, dom: "Oposição", texto: "Culpa os outros por seus próprios erros" },
    { id: 24, dom: "Oposição", texto: "É suscetível ou facilmente aborrecido pelos outros" },
    { id: 25, dom: "Oposição", texto: "É raivoso(a) e ressentido(a)" },
    { id: 26, dom: "Oposição", texto: "É rancoroso(a) ou vingativo(a)" }
];

window.iniciarSNAP = () => {
    const pacienteId = document.getElementById('select_paciente_protocolo').value;
    if (!pacienteId) { alert("Selecione um paciente!"); return; }

    const area = document.getElementById('area-aplicacao-protocolo');
    area.style.display = 'block';
    
    let htmlForm = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:2px solid #e2e8f0; padding-bottom:10px;">
            <h2 style="color:#0f172a; margin:0;">SNAP-IV (TDAH e TOD)</h2>
            <button onclick="document.getElementById('area-aplicacao-protocolo').style.display='none'" style="background:none; border:none; color:#ef4444; font-weight:bold; cursor:pointer;">✖ Fechar</button>
        </div>
        <p style="color:#64748b; font-size:14px; margin-bottom:20px;">Escala: <strong>0 = Nem um pouco | 1 = Só um pouco | 2 = Bastante | 3 = Demais</strong>.</p>
        <form id="form_snap">
            <div style="max-height:450px; overflow-y:auto; padding-right:10px; margin-bottom:20px;">
    `;

    perguntasSNAP.forEach((p, index) => {
        htmlForm += `
            <div style="background:${index % 2 === 0 ? '#f8fafc' : '#ffffff'}; padding:15px; border:1px solid #e2e8f0; margin-bottom:8px; border-radius:6px;">
                <p style="margin: 0 0 10px 0; color: #1e293b; font-weight: 500; font-size: 14px;">${p.id}. ${p.texto} <span style="color:#94a3b8; font-size:11px; font-weight:bold;">(${p.dom})</span></p>
                <div style="display: flex; gap: 15px;">
                    <label style="font-size:13px; font-weight:bold;"><input type="radio" name="s_${p.id}" value="0" required> 0</label>
                    <label style="font-size:13px; font-weight:bold;"><input type="radio" name="s_${p.id}" value="1"> 1</label>
                    <label style="font-size:13px; font-weight:bold;"><input type="radio" name="s_${p.id}" value="2"> 2</label>
                    <label style="font-size:13px; font-weight:bold; color:#10b981;"><input type="radio" name="s_${p.id}" value="3"> 3</label>
                </div>
            </div>
        `;
    });

    htmlForm += `
            </div>
            <div style="text-align: right;">
                <button type="submit" style="background:#4f46e5; color:#fff; border:none; padding:12px 24px; border-radius:8px; font-weight:bold; font-size:14px; cursor:pointer;">Processar e Salvar</button>
            </div>
        </form>
    `;
    area.innerHTML = htmlForm;

    document.getElementById('form_snap').addEventListener('submit', async (e) => {
        e.preventDefault();
        let escores = { "Desatenção": 0, "Hiperatividade": 0, "Oposição": 0 };
        let somaTotal = 0;

        perguntasSNAP.forEach(p => {
            const val = parseInt(document.querySelector(`input[name="s_${p.id}"]:checked`).value);
            somaTotal += val; escores[p.dom] += val;
        });

        try {
            const pRef = doc(db, "pacientes", pacienteId);
            const pacData = (await getDoc(pRef)).data();
            let protSalvos = pacData.protocolos_aplicados || [];
            protSalvos.push({ data_aplicacao: new Date().toISOString(), tipo_teste: "SNAP-IV", score_total: somaTotal, detalhes_dominio: escores });
            await updateDoc(pRef, { protocolos_aplicados: protSalvos });
            
            // Atualiza o histórico
            window.carregarEvolucaoPaciente(pacienteId);

            const textoRisco = somaTotal > 0 ? '<span style="color:#b91c1c;">Sintomas Registrados</span>' : '<span style="color:#10b981;">Nenhum Sintoma</span>';
            const tabelaHtml = `
                <table style="width:100%; border-collapse:collapse; margin-top:30px; font-size:14px;">
                    <tr style="border-bottom:2px solid #e2e8f0; text-align:left;"><th style="padding:10px;">DOMÍNIO</th><th style="padding:10px;">SCORE</th></tr>
                    <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px;">Desatenção (Máx 27)</td><td style="padding:10px;">${escores["Desatenção"]}</td></tr>
                    <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px;">Hiperatividade (Máx 27)</td><td style="padding:10px;">${escores["Hiperatividade"]}</td></tr>
                    <tr><td style="padding:10px;">Oposição/Desafio (Máx 24)</td><td style="padding:10px;">${escores["Oposição"]}</td></tr>
                </table>
            `;
            window.renderizarGraficoRadarGlobal(['Desatenção', 'Hiperatividade', 'Oposição/Desafio'], [escores["Desatenção"], escores["Hiperatividade"], escores["Oposição"]], 27, somaTotal, textoRisco, tabelaHtml);
        } catch (error) { console.error(error); alert("Erro ao salvar no banco."); }
    });
};