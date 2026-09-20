/**
 * Textos da interface do site em português (idioma padrão). É a fonte das
 * chaves: `en.ts` é tipado com `Record<MessageKey, string>`, então esquecer
 * uma tradução (ou sobrar uma chave) quebra o typecheck.
 *
 * Trechos entre crases viram <code> ao renderizar (ver `T` em
 * components/language.tsx).
 */
export const pt = {
  // Comuns
  "common.home": "Início",
  "common.components": "Componentes",
  "common.resources": "Recursos",
  "common.introduction": "Introdução",
  "common.symbols": "Símbolos",
  "common.gettingStarted": "Getting started",
  "common.browseComponents": "Ver os componentes",
  "common.comingSoon": "Em breve",
  "common.packagePerComponent": "Um pacote por componente",

  // Barra do topo, tema e idioma
  "topbar.collapseMenu": "Recolher menu",
  "topbar.expandMenu": "Expandir menu",
  "nav.menu": "Menu",
  "nav.mainLabel": "Navegação principal",
  "theme.toLight": "Mudar para o tema claro",
  "theme.toDark": "Mudar para o tema escuro",
  "language.label": "Idioma",
  "language.pt": "Português",
  "language.en": "English",

  // Grupos da sidebar
  "sidebar.group.primitives": "Primitivos",
  "sidebar.group.navigation": "Navegação",
  "sidebar.group.form": "Formulário",
  "sidebar.group.feedback": "Feedback",
  "sidebar.group.layers": "Camadas",
  "sidebar.group.content": "Conteúdo",
  "sidebar.group.system": "Sistema",

  // Home
  "home.description":
    "Componentes React isolados por pacote (instale só o que for usar) com tokens de cor e tipografia prontos para o Tailwind v4.",
  "home.about":
    "Inspirado nos símbolos Adinkra do povo Akan, o sistema combina bordas de tinta, sombras duras e uma paleta quente em componentes acessíveis, com tema claro e escuro.",
  "home.highlightSymbols": "101 símbolos",

  // Introdução
  "introduction.tagline":
    "Um design system em React e Tailwind v4, feito de pacotes independentes: você instala só o que vai usar.",
  "introduction.intro":
    "O Adinkra reúne componentes de interface (botões, tabelas, gráficos, navegação, seletores de data) e os tokens que dão a eles uma identidade comum. Cada peça funciona sozinha, mas todas falam a mesma língua visual.",
  "introduction.principles": "Princípios",
  "introduction.principle.package.text":
    "Cada componente tem o próprio package.json, versão e changelog. Não existe um pacote guarda-chuva @adinkra/ui: quem só precisa do Button instala só @adinkra/button.",
  "introduction.principle.tokens.title": "Tokens em vez de valores soltos",
  "introduction.principle.tokens.text":
    "Cores, tipografia, raios, borda e sombra vêm de variáveis CSS em @adinkra/tokens, registradas como tema do Tailwind v4. Trocar um token muda o sistema inteiro.",
  "introduction.principle.style.title": "Neobrutalismo suavizado",
  "introduction.principle.style.text":
    "Borda de tinta, sombra dura e três estados táteis (padrão, hover e pressionado) em toda superfície interativa. Os cantos são arredondados, não os retos do brutalismo clássico.",
  "introduction.principle.theme.title": "Claro por padrão, escuro por escolha",
  "introduction.principle.theme.text":
    'O tema de dia é sempre o ponto de partida, mesmo com o sistema operacional no escuro. O tema de noite entra só com data-theme="dark", em qualquer elemento, não apenas no <html>.',
  "introduction.principle.symbols.title": "Símbolos Adinkra",
  "introduction.principle.symbols.text":
    "O pacote de ícones reúne 101 símbolos Adinkra do povo Akan, prontos para usar como componentes React.",
  "introduction.start": "Por onde começar",
  "introduction.startText":
    "O guia de instalação leva poucos minutos: tokens, CSS e o primeiro componente. Depois é só explorar a lista de componentes, cada um com exemplos, variantes e props documentadas.",

  // Getting started
  "gettingStarted.title": "Instalação",
  "gettingStarted.tagline":
    "Em quatro passos você tem o primeiro componente na tela. Cada pacote é isolado, então instale só o que for usar.",
  "gettingStarted.before": "Antes de começar",
  "gettingStarted.beforeText":
    "Os componentes pedem React 19 e Tailwind v4 no projeto. Os comandos abaixo usam o bun, mas qualquer gerenciador de pacotes serve.",
  "gettingStarted.step1": "1. Instale os tokens",
  "gettingStarted.step1Text":
    "`@adinkra/tokens` traz as variáveis CSS e o tema do Tailwind v4, nos modos dia e noite. Quase todo pacote depende dele, junto com `@adinkra/core`.",
  "gettingStarted.step2": "2. Importe os tokens no CSS",
  "gettingStarted.step2Text":
    "No CSS global, importe o Tailwind e depois os tokens. O Tailwind v4 não varre `node_modules` sozinho, então aponte também onde estão as classes dos componentes com `@source` (o caminho é relativo ao arquivo CSS).",
  "gettingStarted.step3": "3. Instale um componente",
  "gettingStarted.step3Text": "Por exemplo, o Button:",
  "gettingStarted.step4": "4. Use",
  "gettingStarted.step4Text": "Importe o componente e use como qualquer outro do React:",
  "gettingStarted.dark": "Tema escuro",
  "gettingStarted.darkText":
    'O tema claro é o padrão, mesmo com o sistema operacional no escuro. Para o escuro, coloque `data-theme="dark"` no elemento que quiser, do `<html>` até uma caixa isolada.',

  // Páginas de componente
  "docs.component": "Componente",
  "docs.prop": "Prop",
  "docs.type": "Tipo",
  "docs.default": "Padrão",
  "docs.description": "Descrição",
  "docs.previewToDark": "Mostrar esta caixa no escuro",
  "docs.previewToLight": "Mostrar esta caixa no claro",

  // Símbolos
  "symbols.description":
    "Catálogo dos 101 símbolos Adinkra tradicionais: nome, significado e o traço de cada um, vetorizado a partir das formas tradicionais (potrace, revisão em lote de 15/09/2026).",
  // Demos: Link
  "demo.link.advertise": "Anuncie aqui",
  "demo.link.seeAll": "Ver todos →",
  "demo.link.uppercase": "Caixa alta",

  // Demos: ArcLogo
  "demo.arc.text": "Texto da arco",
  "demo.arc.below": "Em baixo do arco",
  "demo.arc.year": "Texto no final do arco",
  "demo.arc.size": "Tamanho (px)",
  "demo.arc.radius": "Raio da curva (px)",
  "demo.arc.tail": "Trecho reto (× raio do sol)",
  "demo.arc.sunY": "Posição do sol (0–1)",
  "demo.arc.icon": "Ícone (slug)",
  "demo.arc.rayDistance": "Distância dos raios (×)",
  "demo.arc.autoRadius": "Raio automático",
  "demo.arc.filled": "Ícone preenchido",
  "demo.arc.showRays": "Mostrar raios",
  "demo.arc.replay": "Reiniciar animação ↺",

  // Demos: Cursor
  "demo.cursor.hoverHere": "Passe o mouse aqui",
  "demo.cursor.outside": "e aqui, fora do botão",
  "demo.cursor.moveFast": "Mova rápido por aqui",
  "demo.cursor.alsoHere": "e por aqui também",
  "demo.cursor.arrow": "A seta gira pra acompanhar a direção do movimento",
  "demo.cursor.chromatic": "separação cromática",

  // Demos: Sidebar
  "demo.sidebar.product": "Produto",
  "demo.sidebar.panel": "Painel",
  "demo.sidebar.team": "Equipe",
  "demo.sidebar.members": "Membros",
  "demo.sidebar.permissions": "Permissões",
  "demo.sidebar.overview": "Visão geral",
  "demo.sidebar.reports": "Relatórios",
  "demo.sidebar.settings": "Configurações",
  "demo.sidebar.pageContent": "Conteúdo da página",
  "demo.sidebar.freeFooter": "rodapé livre",
  "demo.sidebar.notifications": "Notificações",
  "demo.sidebar.projects": "Projetos",
  "demo.sidebar.moreOptions": "Mais opções",
  "demo.sidebar.hoverSecond": "Passe o mouse no 2º item",
  "demo.sidebar.basicTitle": "Básico",
  "demo.sidebar.basicDesc": "Grupo com rótulo, item ativo, rodapé livre.",
  "demo.sidebar.submenuTitle": "Submenu recolhível",
  "demo.sidebar.submenuDesc": "<details>/<summary> nativo, sem useState.",
  "demo.sidebar.badgeTitle": "Badge e ação de item",
  "demo.sidebar.badgeDesc": "SidebarMenuBadge fixo; SidebarMenuAction só no hover (showOnHover).",
  "demo.sidebar.modesTitle": "Modos de recolhimento",
  "demo.sidebar.modesDesc":
    "icon (faixa de ícones) · offcanvas (largura zero + rail) · none (sempre expandido). Clique no botão do cabeçalho ou na faixa da borda.",
  "demo.sidebar.mobile": "Mobile",
  "demo.sidebar.mobileText":
    "Sem demo estática aqui: o comportamento depende da largura real da janela (`useIsMobile`, abaixo de 768px), não de um contêiner pequeno. Qualquer `<Sidebar/>` vira gaveta automaticamente nesse caso; veja a seção \"Mobile\" em `content/components/sidebar.mdx`.",

  // Demos: Data Table
  "demo.table.description": "Descrição",
  "demo.table.type": "Tipo",
  "demo.table.income": "Entrada",
  "demo.table.expense": "Saída",
  "demo.table.amount": "Valor",
  "demo.table.date": "Data",
  "demo.table.tags": "Tags",
  "demo.table.tagSalary": "salário",
  "demo.table.tagFood": "comida",
  "demo.table.tagBill": "fatura",
  "demo.table.tagHousing": "habitação",
  "demo.table.row1": "pagamento de salário",
  "demo.table.row2": "pix (queijo da maria)",
  "demo.table.row3": "fatura do cartão",
  "demo.table.row4": "despesas com casa (pizza da itália)",

  // Demos: Segmented Bar
  "demo.bar.fixed": "Custos fixos",
  "demo.bar.freedom": "Liberdade financeira",
  "demo.bar.comfort": "Conforto",
  "demo.bar.goals": "Metas",
  "demo.bar.pleasures": "Prazeres",

  // Demos: Date Picker
  "demo.date.eventDate": "Data do evento",
  "demo.date.period": "Período",
  "demo.date.scheduleFor": "Agendar para",

  // Exemplos: textos passados aos componentes nas páginas de documentação
  "sample.previousPage": "Página anterior",
  "sample.previous": "Anterior",
  "sample.nextPage": "Próxima página",
  "sample.next": "Próxima",
  "sample.theEndOfTheEmail": "Falta o final do e-mail, como ana@estudio.com.br",
  "sample.weSendOneIssueA": "Enviamos uma edição por mês.",
  "sample.anaStudio": "ana@estudio",
  "sample.email": "E-mail",
  "sample.name": "Nome",
  "sample.chooseAFruitToContinue": "Escolha uma fruta para continuar.",
  "sample.chooseAnOption": "Escolha uma opção",
  "sample.food": "Alimento",
  "sample.vegetables": "Legumes",
  "sample.carrot": "Cenoura",
  "sample.fruits": "Frutas",
  "sample.fruit": "Fruta",
  "sample.apple": "Maçã",
  "sample.grape": "Uva",
  "sample.published": "Publicado",
  "sample.reviewed": "Revisado",
  "sample.draft": "Rascunho",
  "sample.new": "Novo",
  "sample.saveDraft": "Salvar rascunho",
  "sample.preview": "Visualizar",
  "sample.publish": "Publicar",
  "sample.cancel": "Cancelar",
  "sample.delete": "Excluir",
  "sample.subscribe": "Assinar",
  "sample.save": "Salvar",
  "sample.sankofaGoBackAndFetch": "Sankofa: voltar para buscar o que ficou para trás.",
  "sample.automaticReviewBeforeItGoes": "Revisão automática antes de ir ao ar.",
  "sample.hoverClick": "Passe o mouse / clique",
  "sample.publishEssay": "Publicar ensaio",
  "sample.notClickable": "Não clicável",
  "sample.getTheNewsletter": "Receber a newsletter",
  "sample.airplaneMode": "Modo avião",
  "sample.underline": "Sublinhado",
  "sample.notify": "Notificar",
  "sample.bold": "Negrito",
  "sample.italic": "Itálico",
  "sample.b": "N",
  "sample.u": "S",
  "sample.components": "Componentes",
  "sample.home": "Início",
  "sample.essaysPublishedInTheLast": "Ensaios publicados nas últimas duas semanas.",
  "sample.isolatedPackageArchitecture": "Arquitetura de pacotes isolados",
  "sample.sankofaAndSystemsDesign": "Sankofa e o design de sistemas",
  "sample.whyRoundedCorners": "Por que cantos arredondados",
  "sample.defaultTableBackground": "Fundo padrão da tabela",
  "sample.notesOnThePalette": "Notas sobre a paleta",
  "sample.totalReaders": "Total de leitores",
  "sample.aSlightlyDullerTone": "Um tom mais fosco",
  "sample.category": "Categoria",
  "sample.readers": "Leitores",
  "sample.title": "Título",
  "sample.essay": "Ensaio",
  "sample.1284": "1.284",
  "sample.2829": "2.829",
  "sample.note": "Nota",
  "sample.text": "—",
  "sample.financialFreedom": "Liberdade financeira",
  "sample.fixedCosts": "Custos fixos",
  "sample.fixedIncome": "Renda fixa",
  "sample.comfort": "Conforto",
  "sample.pleasures": "Prazeres",
  "sample.treasury": "Tesouro",
  "sample.goals": "Metas",
  "sample.stocks": "Ações",
  "sample.reits": "Fiis",
  "sample.alternatingRowsWithNoExternal": "Linhas alternadas, sem depender de CSS externo.",
  "sample.primarySecondaryOrDestructiveAction": "Ação principal, secundária ou destrutiva.",
  "sample.surfaceWithBorderRadiusAnd": "Superfície com borda, raio e sombra.",
  "sample.installationAndFirstSteps": "Instalação e primeiros passos.",
  "sample.collapsibleSideNavigation": "Navegação lateral colapsável.",
  "sample.the101AdinkraSymbols": "Os 101 símbolos Adinkra.",
  "sample.resources": "Recursos",
  "sample.symbols": "Símbolos",
  "sample.score": "Pontuação",
  "sample.signUp": "Cadastro",
  "sample.dropOff": "Abandono",
  "sample.support": "Suporte",
  "sample.visits": "Visitas",
  "sample.code": "Código",
  "sample.tests": "Testes",
  "sample.others": "Outros",
  "sample.purchase": "Compra",
  "sample.balance": "Saldo",
  "sample.feb": "Fev",
  "sample.apr": "Abr",
  "sample.may": "Mai",
  "sample.notifications": "Notificações",
  "sample.moreOptions": "Mais opções",
  "sample.projects": "Projetos",
} as const;

export type MessageKey = keyof typeof pt;
