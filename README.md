admin123




new hope 123456




# 🧠 PsiTech - Sistema de Gestão para Psicólogos Clínicos

O **PsiTech** é uma plataforma SaaS (Software as a Service) desenvolvida para facilitar e modernizar o dia a dia de psicólogos clínicos. O sistema oferece uma gestão completa de pacientes, prontuários, agendamentos, controles financeiros e evolução clínica, tudo com foco em segurança (LGPD) e usabilidade.

## 🚀 Funcionalidades Principais

### 👩‍⚕️ Painel do Psicólogo
* **Dashboard Inteligente:** Visão geral financeira (gráficos interativos), agenda do dia e alertas de aniversariantes do mês.
* **Gestão de Pacientes:** Cadastro completo com informações pessoais, contatos de emergência e responsáveis (para menores).
* **Prontuário Eletrônico:**
  * Registro de Anamnese inicial e Hipóteses Terapêuticas.
  * Evolução Clínica contínua da terapia.
  * Geração automática de **Parecer Psicológico Evolutivo** em PDF, utilizando consolidação de histórico.
* **Módulo Financeiro:** Controle de sessões pagas e pendentes, geração de recibos profissionais em PDF e controle de valores por paciente.
* **Agenda:** Agendamento de sessões avulsas, semanais, quinzenais ou mensais.

### 💼 Painel Administrativo (Gestor ADM)
* **Gestão de Assinaturas:** Controle de todos os profissionais cadastrados na plataforma.
* **Sistema de Trial Automatizado:** Concessão de 30 dias de teste grátis, com cálculo reverso e bloqueio automático de acesso ao expirar.
* **Controle Financeiro ADM:** Geração manual de faturas mensais, controle de recebimentos e métricas gerais (KPIs).
* **Isenção de Mensalidade:** Opção de conceder contas premium/isentas para usuários específicos.

## 🛠️ Tecnologias Utilizadas

O projeto foi construído utilizando tecnologias modernas voltadas para aplicações web rápidas e sem necessidade de infraestrutura complexa de backend:

* **Frontend:** HTML5, CSS3, JavaScript (ES6 Modules)
* **Backend as a Service (BaaS):** [Firebase](https://firebase.google.com/) (Google)
  * **Firebase Authentication:** Gestão de login, segurança de rotas e recuperação de senhas seguras por e-mail.
  * **Cloud Firestore:** Banco de dados NoSQL em tempo real para armazenamento de usuários, prontuários e faturas.
* **Bibliotecas Extras:** 
  * [Chart.js](https://www.chartjs.org/) (Para gráficos financeiros no dashboard)

## 📁 Estrutura do Projeto

```text
/
├── index.html                 # Tela de Login Principal
├── views/
│   ├── cadastro.html          # Tela de criação de conta (Trial 30 dias)
│   ├── psicologo.html         # Painel principal do profissional
│   └── admin.html             # Painel de gestão da plataforma
├── css/
│   └── style.css              # Arquivo de estilos globais
└── js/
    ├── firebase-config.js     # Chaves de conexão com o Google Firebase
    ├── auth.js                # Lógica de Login, bloqueios e recuperação de senha
    ├── cadastro.js            # Lógica de registro de novos profissionais
    ├── pacientes.js           # Motor principal do CRUD de pacientes e prontuários
    ├── admin.js               # Motor do painel administrativo e controle de trial
    ├── painel.js              # Lógicas de interface (Sidebar, abas, modais)
    └── protocolos.js          # Gestão de inventários e testes psicológicos