# Adinkra: decisões de design

Registro das decisões do design system **Adinkra**: o que foi decidido, por quê e o que ficou para trás.
Referência visual: [style tile publicado](https://claude.ai/artifact/WJL4HAheiYdgmn4sJjFYjw).

Última atualização: 17/09/2026.

---

## 1. Marca

- **Nome:** Adinkra.
- **Identidade própria:** branco gesso e ardósia na base, céu nas ações, coral na marca.
- **Direção visual: neobrutalismo** (15/09/2026) — borda grossa visível, sombra dura (sem desfoque), estado "pressionado" tátil em todo componente interativo, cantos arredondados (não retos), blocos de cor chapada para categorizar. Ver seção 4 para a mecânica completa e referências.
- A estética do Wes Anderson (*O Esquema Fenício*) foi o ponto de partida e **ficou para trás** — não é mais justificativa de decisão.
- Elementos visuais herdados que **continuam**: capa com moldura dupla; cartelas de seção centralizadas com traço coral acima do título; Jost em caixa alta, espaçamento largo, nos títulos de seção.

## 2. Stack e distribuição

| Item | Decisão |
|---|---|
| Framework | Next.js + TypeScript, deploy na Vercel |
| Estilo | Tailwind CSS v4 + tokens em CSS variables |
| Componentes | shadcn/ui com base **Base UI** (não Radix) |
| Variantes | CVA (class-variance-authority) + `tailwind-merge` + `clsx` |
| Ícones de interface | Lucide (padrão do shadcn) |
| Gerenciador de pacotes | **Bun** (workspaces nativo, v1.3.3) |
| Orquestração do monorepo | Turborepo (Turbo 2.10.13, sobre Bun workspaces) |
| Build de cada pacote | **tsup** (esbuild) — ESM + CJS + `.d.ts`, preserva o banner `"use client"` |
| Versionamento | **Changesets** — cada pacote isolado com versão/changelog próprios |
| Documentação | Site próprio em Next.js + MDX (`apps/docs`), não Storybook |
| Distribuição | Pacotes npm privados, **totalmente isolados por componente** (seção 3) |

- Componentes interativos do Base UI levam `"use client"` no topo do arquivo do componente.
- **Pendente:** criar a organização `adinkra` no npm (ou GitHub Packages) — escopo e nomes principais ainda livres no registro.

### Bun: perguntas respondidas

- **Dá para usar Bun no lugar do pnpm?** Sim — workspaces nativos, e o Turborepo já lê `packageManager` no `package.json` raiz.
- **Quem usa npm consegue instalar a biblioteca?** Sim, sem restrição — Bun é só ferramenta de dev; o que chega ao registro é um pacote comum (`package.json` + `dist/`).
- **Por que tsup e não o bundler do Bun?** `bun build` ainda não resolve bem `.d.ts` + ESM/CJS simultâneos + preservar `"use client"` (exigido pelo RSC). tsup/esbuild já faz isso de forma estável, é o que o shadcn/ui usa.

## 3. Arquitetura do monorepo

Pacotes **totalmente isolados**: cada componente é dono do próprio `package.json`, versão e changelog — não existe `@adinkra/ui` guarda-chuva. Quem só precisa do Button instala só `@adinkra/button`.

```
adinkra/
├── apps/
│   └── docs/                      ← site de documentação (Next.js)
│       ├── app/
│       │   ├── layout.tsx         ← casca: sidebar + área de conteúdo
│       │   ├── page.tsx           ← home
│       │   └── components/[slug]/page.tsx  ← 1 rota por componente
│       ├── content/components/*.mdx
│       └── config/nav.ts          ← árvore da sidebar, escrita à mão
├── packages/
│   ├── core/                      ← @adinkra/core: cn(), tipos compartilhados
│   ├── tokens/                    ← @adinkra/tokens: CSS variables (seção 4)
│   └── <componente>/              ← 1 pasta e 1 pacote por componente
├── turbo.json
└── package.json                   ← workspaces do Bun + packageManager: "bun@1.3.3"
```

- **`@adinkra/core`** existe para não duplicar `cn()` (`clsx`+`tailwind-merge`) e tipos comuns — mesmo padrão que o Radix usa internamente com `@radix-ui/react-primitive`.
- **`@adinkra/tokens`** publica só o CSS das variáveis (claro/escuro); componentes não a importam em runtime, só leem `var(--token)`.
- Cada pacote declara `react`/`react-dom`/Base UI como **peerDependencies**, não dependência direta.
- **Custo aceito:** manutenção multiplicada (changelog/versão por pacote) — o Changesets é o que torna isso administrável.

### Armadilhas de `"use client"` (aprendidas montando o build, 14–15/09/2026)

1. **`"use client"` no topo de um arquivo vira TODO export do módulo em referência de cliente — inclusive funções não-componente.** Quebrou chamar `buttonVariants()` de um Server Component quando o arquivo tinha a diretiva sem precisar. **Regra:** só marcar `"use client"` quem usa hook de estado/efeito de verdade (`useId()` é seguro em Server Components).
2. **Um objeto exportado por um módulo `"use client"` contendo vários componentes como propriedades chega VAZIO do lado do servidor** (`{...mdxComponents}` virava `{}`). **Regra:** todo componente compartilhado com Server Component é export nomeado individual, nunca propriedade de objeto.
3. **`package.json` aponta `exports` pro `src/*.ts`** (workspace consome a fonte direto) — então `"use client"` precisa estar no arquivo-fonte, não só no `banner` do `tsup.config.ts` (que só afeta o `dist/` publicado). Quebrou `@adinkra/sidebar` com `createContext is not a function`.
4. **(CSS) seletores de tema `:root[data-theme="dark"]` só casam no `<html>`.** Um preview que põe `data-theme` numa `<div>` aninhada nunca ativa o override. Fix: `[data-theme="dark"]`/`[data-theme="light"]` sem `:root`, valores completos em cada bloco (variável local sempre vence a herdada). `@media prefers-color-scheme` continua preso a `:root` — decisão de página inteira. Mesma armadilha reapareceu na variante "portal" (Base UI `Portal` escapa pro `<body>`, fora de qualquer `data-theme` de ancestral) — corrigida achando o container em runtime via `.closest("[data-theme]")`.
5. Ao importar uma CONSTANTE (não componente) de um módulo `"use client"` em código server-safe, isolar num arquivo à parte sem diretiva — evita repetir a armadilha 2 com algo ainda não confirmado se afeta valores simples também.

Também: `next-mdx-remote`'s `compileMDX` precisa de `options.blockJS: false` (conteúdo é nosso, não remoto). E: uma chamada de função solta numa expressão JS do MDX (`{fn()}`) não resolve via `components` do `compileMDX` — só tags JSX resolvem assim; quebra o build (SSG) com `ReferenceError`.

### Site de documentação (`apps/docs`)

- **MDX**, não React puro nem Storybook — cada página mistura prosa com componentes ao vivo (`<Preview>`, `<StatesGrid>`, `<PropsTable>`), mesmo padrão do site do Base UI.
- **Conteúdo separado do pacote:** `.mdx` vive em `apps/docs/content/`, não em `packages/<componente>/`.
- **Sidebar por config explícita** (`apps/docs/config/nav.ts`), não varredura de pastas.
- **Anatomia de cada página de componente**, sempre na mesma ordem: 1) cabeçalho (nome, descrição, selo de status) 2) preview ao vivo com toggle dia/noite 3) como usar 4) estados (padrão/hover/foco/desativado/erro) 5) variantes 6) props (tabela gerada do tipo TS — pendente automatizar, ver "Faltam") 7) acessibilidade 8) tokens usados.

## 4. Cores e a direção neobrutalista

Referências (15/09/2026): [neobrutalism.dev](https://www.neobrutalism.dev/docs) (mesma base técnica do Adinkra), [Neobrutalism in Web Design, NN/g](https://www.nngroup.com/articles/neobrutalism/), e três referências visuais do usuário no Pinterest.

**As fontes escritas e as referências visuais puxam para lados diferentes — decisão foi conciliar, não escolher uma só:**
- `neobrutalism.dev`/NN/g descrevem o neobrutalismo "clássico": borda preta grossa, sombra dura sem desfoque, cantos quase retos, cores primárias cruas.
- As três imagens do usuário são mais suaves: cantos bem arredondados, paleta pastel, blocos de cor chapada, bastante espaço em branco.
- **Ficou:** a mecânica estrutural (borda visível, sombra dura, estado "pressionado" tátil, sem gradiente/textura) — mas com cantos arredondados e a paleta que o Adinkra já tinha, em vez de preto puro e neon.
- A NN/g avisa que, sem cuidado, neobrutalismo pode sobrecarregar e prejudicar acessibilidade — recomenda 2–3 cores fortes, contraste garantido, hierarquia clara, feedback óbvio de hover/clique. As regras abaixo seguem isso à risca.

### Paleta (9 cores)

| Cor | Hex | Papel |
|---|---|---|
| Branco gesso | `#FBFBF9` | Fundo |
| Ardósia | `#4E5166` | Texto corrido |
| Ardósia escura | `#1B1D26` | Títulos, texto sobre o céu, **tinta da borda/sombra neobrutalista** |
| Céu | `#5299D3` | **Primária**: ações |
| Névoa azul | `#C9DDF0` | Secundária |
| Marinho | `#1E3550` | Etiquetas e foco do teclado |
| Coral | `#CB5A2A` | **Marca**: logo, símbolos, blocos de destaque |
| Mostarda | `#E8A93A` | Só categorizar cartões/etiquetas — nunca botão de ação |
| Tomate | `#C8322A` | Erro e ações destrutivas |

Proporção: **60%** branco gesso · **30%** ardósia/marinho/névoa · **10%** céu/coral/mostarda/tomate.

### Tokens semânticos

Componentes usam sempre tokens, nunca hex direto.

| Token | Dia | Noite | Contraste (dia) |
|---|---|---|---|
| `--background` | `#FBFBF9` | `#1B1D26` | — |
| `--surface` | `#F2F2EF` | `#242733` | — |
| `--card` | `#FFFFFF` | `#20222C` | — |
| `--foreground` | `#4E5166` | `#F0EFF3` | 7.5 (AAA) |
| `--heading` | `#1B1D26` | `#FFFFFF` | 16.2 |
| `--muted-foreground` | `#65687A` | `#A6A9B8` | 5.3 |
| `--border` | `#808393` | `#75788B` | 3.6 |
| `--hairline` | `#E1E2E4` | `#30333F` | só decorativo |
| `--brand` | `#CB5A2A` | `#E0784A` | gráfico |
| `--primary` | `#5299D3` | `#5299D3` | — |
| `--primary-foreground` | `#1B1D26` | `#1B1D26` | 5.5 |
| `--primary-hover` | `#6AA9DC` | `#6AA9DC` | 6.7 |
| `--link` | `#2B6395` | `#7DB3E3` | 6.1 |
| `--secondary` | `#C9DDF0` | `#2C3A52` | — |
| `--secondary-foreground` | `#1E3550` | `#F0EFF3` | 9.0 |
| `--accent` | `#1E3550` | `#C9DDF0` | — |
| `--accent-foreground` | `#FFFFFF` | `#1B1D26` | 12.5 |
| `--destructive` | `#C8322A` | `#EE6B5A` | 5.1 |
| `--destructive-foreground` | `#FFFFFF` | `#1B1D26` | 5.3 |
| `--ring` | `#1E3550` | `#F0EFF3` | 12.1 |

Bloco de destaque, iguais nos dois temas: `--feature: #CB5A2A`, `--feature-foreground: #FFFFFF`, `--chip-bg: #FFFFFF`, `--chip-foreground: #1B1D26`.

Tokens de etiqueta (categorizar cartões), fixos nos dois temas:

| Token | Hex | Texto | Contraste |
|---|---|---|---|
| `--tag-coral` | `#B54D22` | `--tag-coral-foreground: #FFFFFF` | 5.2 |
| `--tag-sky` | `#5299D3` | `--tag-sky-foreground: #1B1D26` | 5.5 |
| `--tag-mustard` | `#E8A93A` | `--tag-mustard-foreground: #1B1D26` | 8.1 |
| `--tag-navy` (16/09) | hex fixo do `--accent` claro nos dois temas | `--tag-navy-foreground` | precisava de uma 4ª cor de série categórica que não invertesse por tema como `--accent` inverte |

`--tag-coral` **não** é o mesmo hex que `--brand` — nem texto branco nem escuro passam AA em texto pequeno sobre o coral de marca; `--tag-coral` é mais escuro, garantido >4.5:1.

### Direção neobrutalista: borda, sombra e cantos

| Token | Valor | Uso |
|---|---|---|
| `--ink` | = `--heading` | Cor única de borda/sombra em qualquer tema |
| `--border-width` | `3px` | Toda superfície interativa (menos `ghost`) |
| `--shadow-brutal` | `4px 4px 0 0 var(--ink)` | Sombra dura, deslocada, sem desfoque |
| `--radius-control` | `4px` (reduzido de 8px→6px→4px em duas rodadas de "mais quadrado", 15/09) | Botão, input, badge, etiqueta |
| `--radius-card` | `6px` (reduzido de 16px→10px→6px, mesmas rodadas) | Cartão, painel, bloco de destaque |

**Três estados de interação, sempre os três:**
1. **Padrão:** borda `--border-width` em `--ink`, sombra `--shadow-brutal`.
2. **Hover:** sobe (`translate(-2px,-2px)`), sombra cresce pra `6px 6px 0 0`.
3. **Pressionado (`:active`):** desce a distância da sombra (`translate(4px,4px)`), sombra some — a marca registrada do neobrutalismo.

Todas as transições respeitam `prefers-reduced-motion`. **Exceção de propósito:** a variante `ghost` fica sem borda/sombra — válvula de escape pra ação terciária.

### Regras de uso da cor

1. Todo texto passa no WCAG 2.2 AA (contrastes calculados, não estimados).
2. Céu com texto escuro, nunca branco (branco reprova a 3.1:1).
3. Coral só com texto grande (branco a 4.2:1, só vale ≥24px).
4. Ardósia `#4E5166` nunca sobre o céu (2.5:1).
5. Coral, tomate e céu nunca ficam um sobre o outro (luminosidades próximas, vibram).
6. Um só botão em céu por tela — secundária é névoa azul, resto usa contorno/ghost.
7. Tomate só pra erro/destrutivo, nunca sozinho — sempre com ícone+borda+texto explicando.
8. Mostarda nunca em botão de ação (15/09) — só categorizar.
9. Toda superfície interativa leva borda+sombra+os três estados (15/09), exceto `ghost` — tudo-ou-nada.

## 5. Tipografia

**Fraunces saiu** (15/09) — serifa editorial destoava do tom cru do neobrutalismo. Entrou **Inter** no corpo de texto. Jost (títulos) e IBM Plex Mono (dados) continuam.

| Papel | Fonte | Uso |
|---|---|---|
| Display e interface | **Jost** 400–600 | Títulos de seção em caixa alta, botões, rótulos |
| Corpo de texto | **Inter** 400–600 | Texto corrido, títulos de página, legendas |
| Dados e código | **IBM Plex Mono** 400–500 | Hex, tokens, especificações |
| Wordmark | **Adinkra Alphabet** 400 | Só a palavra "Adinkra" na sidebar e na home |

Carregar com `next/font` para evitar deslocamento de layout (pendente — ver "Faltam").

**Adinkra Alphabet** (16/09, github.com/adinkraalphabet/font, Charles Korankye, MIT): fonte de EXIBIÇÃO que mapeia letra latina pra símbolo Adinkra — usada só no wordmark (sidebar + home), não em texto corrido nem em nenhum outro lugar. `.ttf` auto-hospedado em `apps/docs/public/fonts/` (não CDN de terceiro) + LICENSE copiado junto. Arquitetura em duas camadas como as outras fontes: `@adinkra/tokens` só nomeia (`--font-adinkra`), `apps/docs/app/globals.css` declara o `@font-face` com `font-display: swap` + fallback pro Jost. `uppercase` removido dos dois wordmarks na troca — o mapeamento letra→símbolo dessa fonte não é documentado publicamente, arriscava cair fora do que ela mapeia.

| Nível | Tamanho |
|---|---|
| display | 56px |
| h1 | 36px |
| h2 | 28px |
| h3 | 22px |
| body | 17px, altura de linha 1.6, até 65 caracteres por linha |
| small | 14px |
| caption | 12px |

## 6. Símbolos Adinkra

- Símbolos Adinkra (povos Akan, Gana) entram como **linguagem da marca**: logo, estampas tom sobre tom, ilustração de conteúdo, divisores.
- **Nunca como ícone de interface** — esses ficam com o Lucide (ou SVG inline no traço do sistema).
- Significado vai no texto alternativo do SVG, para leitores de tela. Evitar Gye Nyame e outros símbolos religiosos como enfeite.
- Significado cultural das cores **não** é critério de decisão da paleta.
- Catálogo completo dos 101 símbolos pesquisado (nomes/significados Akan, texto próprio, sem copiar de site específico — imagens nunca consultadas/copiadas, copyright do adinkrasymbols.org respeitado). 8 têm ícone de verdade desenhado do zero (`viewBox` 100×100, `strokeWidth` 7): Adinkrahene, Gye Nyame, Sankofa, Dwennimmen, Nkyinkyim, Nyansapo, Akoma, Nkonsonkonson. Os outros 93 usam `PlaceholderIcon` (contorno tracejado) até serem desenhados — item 5 do roteiro (seção "Faltam").

| Símbolo | Significado | Uso |
|---|---|---|
| Adinkrahene | Grandeza, carisma, liderança | Logo e emblema |
| Akoma | Amor, paciência, fidelidade | Ilustração de conteúdo |
| Osram ne Nsoromma | Amor, fidelidade, harmonia | Ilustração do tema noturno |
| Nkyinkyim | Iniciativa, dinamismo | Divisores de seção |

## 7. Decisões de interface

No formato do Tom Greever: fizemos isto, porque aquilo, o que ajuda este objetivo.

| # | Decisão | Por quê | Objetivo |
|---|---|---|---|
| 1 | O logo leva sempre ao início | Convenção já aprendida | Ninguém fica preso sem saída |
| 2 | A navegação mostra onde você está | Traço coral na seção atual + trilha | Quem chega pelo Google entende em segundos |
| 3 | A busca é uma caixa com botão escrito "Buscar" | Nada de lupa/símbolo escondido | Quem prefere buscar, acha a busca |
| 4 | Um só botão em céu por tela | Céu reservado à ação principal | O olho acha o próximo passo sem pensar |
| 5 | Links sempre sublinhados | Cor sozinha não basta (~1 em 12 homens é daltônico) | O clicável parece clicável |
| 6 | O erro aparece junto ao campo e diz como resolver | "E-mail inválido" culpa; "falta o final, como ana@x.com" resolve | Não gastar a boa vontade de quem usa |
| 7 | Tomate só para erro, nunca sozinho | Vermelho em tudo deixa de chamar atenção | Problemas notados na primeira olhada |
| 8 | Adinkra decora, mas não comanda | Símbolos têm significado, não viram "fechar" | Identidade forte sem atrapalhar o uso |
| S1 | Componentes usam tokens, nunca hex | Trocar paleta vira mudar um arquivo só | Outros projetos ajustam o tema sem reescrever nada |
| S2 | Todo texto passa no AA, medido | Contraste calculado par a par | Funciona pra quem enxerga pouco, no sol, no celular velho |

Todo componente precisa mostrar os estados **padrão, hover, foco visível, desativado e erro**.

## 8. Hipóteses a validar

Pelo Lean UX, cada aposta tem um jeito de ser provada errada.

| # | Acreditamos que | Saberemos que é verdade quando | Status |
|---|---|---|---|
| H1 · Adoção | Pacotes isolados por componente permitem instalar só o necessário e montar a 1ª página no mesmo dia | Próximo projeto publica a 1ª página em <1 dia, sem CSS próprio | A validar |
| H2 · Usabilidade | Estampa/símbolos Adinkra dão identidade sem atrapalhar quem só quer ler e assinar | 3 de 3 pessoas acham conteúdo e assinam a newsletter sem hesitar, teste de 15min | A validar |
| H3 · Marca | Branco gesso/ardósia, coral só nos destaques, transmitem "elegante, culto, com memória" | Num teste de 5s, maioria descreve a página com essas palavras, sem sugestão | A validar — reteste recomendado depois do neobrutalismo (tom mais cru de propósito) |

Ritmo de teste: **três pessoas por mês** (Krug). Cada componente novo nasce com uma hipótese.

## 9. O que ficou para trás e por quê

| Descartado | Motivo |
|---|---|
| Nome "AdinkraUI" | Voltou a ser só **Adinkra** |
| Radix como base do shadcn | Preferência pelo Base UI |
| Monorepo só interno | Componentes serão usados em outros repositórios → pacote npm |
| Pacote único `@adinkra/ui` | Trocado por pacotes **totalmente separados** por componente |
| pnpm | Trocado por **Bun** (workspaces nativos); Turborepo continua orquestrando |
| Storybook | Site de documentação próprio em Next.js + MDX |
| Paleta "Esquema Terracota" | Muitas cores disputando atenção, conjunto turvo |
| Referência ao Wes Anderson / *O Esquema Fenício* | Identidade própria |
| Leite `#F0ECE4` como fundo | Branco gesso, mais elegante |
| Gelo, mostarda, cinza-verde e sépia (paleta antiga) | Removidos para enxugar |
| Preto esverdeado `#1E2622` como texto | Ardósia `#4E5166` |
| Coral como primária | Céu virou primária, coral virou cor da marca |
| Vinho `#9B2226` no lugar do tomate | Mantido o tomate, compensado com ícone/borda/texto nos erros |
| Significado cultural das cores como critério | Não usado |
| Fraunces (serifa editorial) | Trocada por Inter (15/09) |
| Raio único de `3px` | Dois níveis, `--radius-control`/`--radius-card` (seção 4) |
| Componentes preenchidos sem borda própria | Neobrutalismo pede borda+sombra+pressionado em toda superfície (exceto `ghost`) |
| Neobrutalismo "clássico" cru | Adaptado: mecânica mantida, cantos arredondados, paleta própria |
| Cor verde/vermelho por sinal em valores numéricos (`--positive`) | Testada no `@adinkra/data-table` (16/09) e revertida a pedido — token removido do sistema |

## 10. Referências

- Steve Krug, *Don't Make Me Think, Revisited*: usabilidade, convenções, clicáveis óbvios, teste com poucas pessoas.
- Tom Greever, *Articulating Design Decisions*: como justificar decisões para stakeholders.
- Jeff Gothelf e Josh Seiden, *Lean UX*: hipóteses, resultados antes de entregas, experimentos.
- Sara Caldas, *Paleta perfeita para designers gráficos e ilustradores*: consultada só pela descrição, conteúdo não acessível.
- Brad Frost, [*Atomic Design*](https://atomicdesign.bradfrost.com/table-of-contents/): metodologia de hierarquia de UI (átomos/moléculas/organismos) para bibliotecas de padrões consistentes.
- Andrew Couldwell, [*Laying the Foundations*](https://pt.scribd.com/document/745205002/laying-the-foundations-smaller-compressed): processo honesto e direto de criar/documentar/manter design systems, sem embelezar as dificuldades.
- Yesenia Perez-Cruz, *Expressive Design Systems*: como manter harmonia entre produtos sem sufocar experimentação/marca — conteúdo não acessível, citado só pela descrição.
- DesignBetter.co, *Design Systems Handbook*: boas práticas de planejar/desenhar/construir/implementar um design system — conteúdo não acessível, citado só pela descrição.
- Donella H. Meadows, *Thinking in Systems: A Primer*: pensamento sistêmico aplicado a problemas de qualquer escala — conteúdo não acessível, citado só pela descrição.
- [neobrutalism.dev](https://www.neobrutalism.dev/docs): biblioteca de componentes neobrutalista sobre Base UI + Tailwind — mesma base técnica do Adinkra, referência de mecânica.
- [Neobrutalism in Web Design, Nielsen Norman Group](https://www.nngroup.com/articles/neobrutalism/): riscos de acessibilidade/sobrecarga visual — as regras da seção 4 seguem as recomendações desse artigo.
- WCAG 2.2, nível AA.

## 11. Estado atual e próximos passos

**Neobrutalismo (seções 4 e 5) implementado** (15/09) em `@adinkra/tokens` e em todos os pacotes de componente — build/typecheck/SSG confirmados, style tile republicado. `bun install && bun run build && bun run typecheck` passam 100% (verificado de novo em 17/09: 20 pacotes + docs, full turbo cache).

### Pacotes de componente (ordem de criação)

- **`@adinkra/core`**, **`@adinkra/tokens`**, **`@adinkra/button`**, **`@adinkra/input`**, **`@adinkra/badge`**, **`@adinkra/skeleton`** — base do sistema. Nenhum é `"use client"` (sem hook de estado/efeito).
- **`@adinkra/card`** (15/09, escolhido entre Card/Switch/Select/Alert/Tabs por ser o mais fundamental): `Card`/`CardHeader`/`CardTitle`/`CardDescription`/`CardAction`/`CardContent`/`CardFooter`, composição shadcn/[neobrutalism.dev](https://www.neobrutalism.dev/docs/card). Borda+sombra sempre; prop `interactive` liga os três estados do Button + `tabIndex=0` (cartões-link). Sem hooks.
- **`@adinkra/table`** (15/09, ref. [table](https://www.neobrutalism.dev/docs/table)): composição shadcn completa. Container (não `<table>`) leva borda+sombra+raio. Linhas alternadas via CSS puro (`[tbody_&]:even:bg-surface`, sem índice em JS). `columnLines` (prop, ligada por padrão): borda vertical entre colunas — grossa/`--ink` (mesma espessura do resto da estrutura, por escolha explícita sobre `--hairline`). Sem hooks.
- **`@adinkra/toggle`** (15/09, ref. [toggle](https://www.neobrutalism.dev/docs/toggle)): `<button aria-pressed>` de dois estados que persiste (não ação disparada) — reaproveita o gesto hover/pressionado do Button, mas o "afundado" (borda de tinta, `--secondary`, sem sombra) persiste com `data-state=on`. `variant` default (sem borda até hover) / outline (borda+sombra desde o início). Controlado/não-controlado, `"use client"` (1º desde o Sidebar).
- **`@adinkra/switch`** (15/09, ref. [switch](https://www.neobrutalism.dev/docs/switch)): `<button role="switch" aria-checked>` de verdade (WAI-ARIA APG, não checkbox disfarçado). Trilha sempre borda+sombra, só troca de cor (`--card`/`--primary`); polegar desliza via `translate-x` na escala do Tailwind. `"use client"`.
- **`@adinkra/breadcrumb`** (15/09, ref. [breadcrumb](https://www.neobrutalism.dev/docs/breadcrumb)): composição shadcn completa, puro JSX sem hooks. Separador/elipse em SVG inline (viewBox 16×16, strokeWidth 1.3–1.4, mesmo traço do resto do sistema — nenhuma lib de ícone nova). `aria-current="page"` na página atual, `aria-hidden` nos decorativos.
- **`@adinkra/pagination`** (15/09, ref. [pagination](https://www.neobrutalism.dev/docs/pagination)): só peças estilizadas, quem usa decide `href`/`onClick`. `isActive` reaproveita o "afundado" do Toggle (borda+`--secondary`+sombra, sem hover-convite). Ícones em SVG inline. Sem hooks.
- **`@adinkra/theme-toggle` apagado por completo** (15/09, pedido explícito, escopo confirmado como "o pacote inteiro"): `ThemeToggle`/`ThemeScript`/`useTheme` saíram, junto com `suppressHydrationWarning`/`<ThemeScript>` de `layout.tsx` e o botão da home. Grupo "Sistema" e a rota `/components/theme-toggle` saíram de `nav.ts`. **O que NÃO saiu:** os tokens `[data-theme="dark"]` — o toggle sol/lua de cada `<Preview>` é independente (nunca importou o pacote) e depende desses tokens pra comparar dia/noite. Site ficou sem troca de tema site-wide (sempre claro, sem persistência); cada preview continua comparando dia/noite.
- **`@adinkra/sidebar`** — navegação colapsável (ref. [shadcn](https://ui.shadcn.com/docs/components/base/sidebar)/[neobrutalism.dev](https://www.neobrutalism.dev/docs/sidebar), reconstruída sobre os tokens próprios, sem dependência de nenhum dos dois). `SidebarProvider`/`Sidebar`/`SidebarHeader`/`SidebarContent`/`SidebarFooter`/`SidebarGroup`/`SidebarMenu`/`SidebarMenuButton`/`SidebarMenuBadge`/`SidebarMenuAction`/`SidebarRail`/`SidebarTrigger` + `useSidebar`/`useIsMobile`. Modo "icon", atalho Cmd/Ctrl+B, estado em cookie (lido no cliente — SSG preservada, ver abaixo). Completo (15/09): gaveta mobile (abaixo de 768px, estado `openMobile` separado de `open`, fecha por backdrop/Esc/trigger), `SidebarMenuBadge`/`SidebarMenuAction` (`showOnHover`), `SidebarRail`. Submenu recolhível (`SidebarMenuCollapsible`/`SidebarMenuCollapsibleTrigger`/`SidebarMenuSub*`) via `<details>/<summary>` nativo — teclado e estado de leitor de tela de graça, sem lib de accordion (limitação conhecida: com a sidebar recolhida a ícones, submenu abre mas não vira flutuante). Terceiro modo `collapsible="offcanvas"` (recolhe a largura zero, sem faixa de ícones) — usado pelo `AppSidebar` real do site (sem ícone por item, então `"icon"` não serve) junto com `SidebarRail` de verdade. `SidebarGroup` ganhou divisória entre grupos via CSS puro (`:not(:first-child)`).
- **`@adinkra/date-picker`** (15/09, ref. [date-picker](https://www.neobrutalism.dev/docs/date-picker), 2ª dependência de UI externa depois do navigation-menu): `DatePicker`+`Calendar`/`CalendarDayButton`+`Popover`/`PopoverTrigger`/`PopoverContent`, sobre `@base-ui-components/react` (posicionamento flutuante/portal) + `react-day-picker` (motor de grade/teclado) — grandes demais pra reconstruir. Cores adaptadas aos tokens: dia selecionado/trigger "ligado" usam `--secondary` (regra 6, céu fica só pra ação principal), dia de hoje leva destaque de contraste calculado (`bg-accent text-accent-foreground` — testado com `text-accent` sozinho primeiro, contraste insuficiente contra `--foreground` dos outros dias). `"use client"`.
- **`@adinkra/data-table`** (15/09, pedido a partir de print de planilha do Notion): tabela editável estilo Notion, controlada (`rows`/`onRowsChange`). V1 com escopo fechado antes de construir: 4 tipos de coluna (text, select single/multi via `@adinkra/badge`, number/moeda, date), editar célula + adicionar/remover linha — sem editor de coluna/ordenação/filtro. `"use client"`. Ver evolução detalhada abaixo.
- **`@adinkra/navigation-menu`** (15/09, 1ª dependência de UI externa): menu com dropdowns flutuantes sobre `@base-ui-components/react` (motor de posicionamento grande demais pra reconstruir, diferente do Sidebar). Cores adaptadas: hover `bg-card`, aberto/ativo `--secondary` (regra 6), sem borda/sombra no trigger (ghost), só o painel flutuante leva borda+raio+sombra.
- **`@adinkra/icons`** (15/09, reverte a decisão "Adinkra só marca, nunca ícone de UI"): um componente React por símbolo (101, PascalCase+"Icon"), mais `iconRegistry` (slug→componente) e `iconPaths` (dados crus, pra quem monta muitos ícones de uma vez sem duplicar `<path>`, como o `SymbolField` da home). Sem `"use client"` (só `<svg>`).
- **`@adinkra/progress`** (16/09) — `SegmentedBar`: quebra de um total em partes categóricas (não barra "0–100%" clássica). Ver evolução detalhada abaixo.
- **`@adinkra/charts`** (16/09) — Recharts por baixo (motor grande demais pra reconstruir), tema Adinkra por cima. Ver evolução detalhada abaixo.
- **`@adinkra/cursor`** (17/09) — `BigCircleCursor`/`MotionBlurCursor`. Ver evolução detalhada abaixo.

### `apps/docs`: dogfooding e ajustes do site em si

- `PropsTable` passou a usar o `@adinkra/table` de verdade (15/09) — toda tabela de props do site ganhou zebra automática.
- Paginação anterior/próximo no rodapé de cada página de componente (`getAdjacentNavItems`, dogfooding do `@adinkra/pagination`); barra de topo com `Toggle` (recolher sidebar) + `Breadcrumb` (dogfooding dos dois); `<Preview>` trocou o botão sol/lua próprio por `Toggle` outline.
- `SidebarUsageExamples`/`SidebarShowcase` (mocks com dados fabricados, não a navegação real) ligados à página `/components/sidebar` — inclusive o preview "hero" do topo, que usava o `AppSidebar` de verdade encolhido e virou mock por pedido do usuário.
- **Sidebar real do site**: espaçamento entre itens (`SidebarMenu gap-*`) passou por 4 ajustes na mesma sessão (2px→6px→10px→8px final, pedidos sucessivos); raio já coberto pela redução de `--radius-control`/`--radius-card` (seção 4). `AppSidebar` passou a usar `SidebarMenuCollapsible` de verdade por categoria (Primitivos/Navegação/Formulário), depois consolidado numa `SidebarGroup` única "Componentes" com as categorias aninhadas dentro, sem linha divisória entre elas. Comparado contra uma referência visual do shadcn (Acme Inc/Playground/Projects): trigger do submenu ganhou estado "aberto" preenchido (`bg-secondary`, vocabulário de "ligado"), seta mais visível, cabeçalho ganhou visual de seletor (par de chevrons) — ícone por item **não** adotado (decisão mantida). Linha vertical do submenu removida e depois recolocada (comparação com print). Grupo sem rótulo "Getting started"/"Introduction" adicionado antes de "Componentes", com `DocsShell` extraído pra não duplicar `SidebarProvider` nas rotas novas. Linha entre `SidebarGroup`s virou grossa (`--border-width`/`--ink`) e de ponta a ponta (`-mx-3 px-3` cancelando o padding do pai). Sidebar sem ícone por item (decisão mantida, `lucide-react` removido do site) — `AppSidebar` usa `collapsible="none"` até a introdução do modo `offcanvas` (ver acima).
- **Novo `SidebarGroup` "Recursos"** com ícone por item (regra "sem ícone" vale só pra lista de Componentes, não pro sistema/pacote inteiro) — item "Símbolos" leva a `/symbols`, catálogo dos 101 símbolos com cards (ícone grande centralizado + nome + descrição, `sm:grid-cols-2 lg:grid-cols-4`), 8 com ícone de verdade e 93 com `PlaceholderIcon` (ver seção 6).
- Padrão de tema é **sempre claro** (15/09, revertendo o que existia): `@adinkra/tokens` não segue `prefers-color-scheme`. Todas as rotas de componente continuam SSG — estado do sidebar é lido em `useEffect` no cliente, não `cookies()` do servidor (custaria a geração estática).
- Sidebar e Skeleton revisados contra o [sidebar](https://www.neobrutalism.dev/docs/sidebar)/[skeleton](https://www.neobrutalism.dev/docs/skeleton) do neobrutalism.dev: item ativo leva `outline` (não `border`) de tinta; Skeleton ganhou borda.
- `@adinkra/sidebar` ganhou página de docs própria com o `AppSidebar` real como preview (não recriação — ganhou prop `className` pra encolher).

### `@adinkra/date-picker`: variantes e correções (16/09)

- **Três variantes novas**, mesma composição Popover+Calendar: `label` prop no `DatePicker` base (par rótulo+campo); `DateRangePicker` (`mode="range"`, dois meses lado a lado, não fecha sozinho); `DateTimePicker` (Calendar + seletor de hora, não fecha ao escolher o dia).
- **`TimePicker` construído** (substitui o `<input type="time">` nativo do `DateTimePicker`, decisão consciente do usuário revertendo a escolha original de usar o nativo): duas colunas roláveis (Hora/Minuto), `role="listbox"/"option"`, `scrollIntoView({block:"center"})` no valor atual ao abrir. Layout do `DateTimePicker` mudou de empilhado pra lado a lado (Calendar | TimePicker); armadilha: esticar a coluna pra igualar a altura do Calendar via flex puro não funciona sem altura explícita em algum ancestral (Popup do Popover cresce pro conteúdo) — resolvido com altura fixa via prop `columnClassName`, não stretch dinâmico.
- **Bugs corrigidos**: dark mode não chegava no painel flutuante (armadilha 4, variante portal — Base UI `Portal` escapa pro `<body>`); trigger do `DateRangePicker` quebrava layout com datas longas (`w-72`→`w-auto min-w-72`+`whitespace-nowrap`+`truncate`, replicado no `DatePicker`/`DateTimePicker`); hover invisível nos dias do calendário (mesma cor `bg-surface` no popover e no botão ghost — trocado pra `hover:bg-card`); `shadow-brutal` do popover lida como "uma linha estranha" por quem via o componente pela 1ª vez — sombra removida de todo `PopoverContent` (afeta também o `SelectCell`/`DateCell` do data-table, que usa o mesmo Popover).
- **Calendar**: locale `ptBR` (nomes de mês/dia capitalizados via `formatCaption`/`formatWeekdayName` customizados); `showOutsideDays` default `false`; espaçamento de 5px entre dias; borda em todo dia (não só hoje); dia de hoje distinto por cor primeiro (`text-accent`, depois `bg-accent text-accent-foreground` por contraste insuficiente contra os outros números) — mais clarinho que o selecionado (`bg-accent/15`, decisão final, hoje discreto e selecionado forte, ordem no `cn()` garante que selecionado vence se coincidirem). `DateRangePicker`: intervalo contínuo visualmente (bordas do meio do range removidas via `connectsLeft`/`connectsRight`, pseudo-elemento preenchendo o gap de 5px entre dias adjacentes, caso de 1 dia só tratado à parte). Formatos de data unificados via `formatLongDate`/`formatTime12h` compartilhados (`format.ts`) em vez de `Intl.DateTimeFormat` duplicado por arquivo. Linha divisória entre os dois meses do Range Picker, responsiva (horizontal empilhado/vertical lado a lado) — bug de seletor corrigido duas vezes até mirar especificamente em `.rdp-month` (não em posição genérica de filho, que também pegava o `<nav>` das setas).

### `@adinkra/data-table`: evolução (16/09)

- **Célula de data**: era `<input type="date">` nativo → virou o `DatePicker` completo → reescrita final pra texto puro + `Popover`/`Calendar` genéricos (mesmo padrão do `SelectCell`: `isEditing`/`onRequestEdit`/`onClose` controlado pela tabela).
- **Dropdown de select**: era `absolute` cru dentro do `<td>` (bug real — distorcia layout, célula/linha cresciam pra caber o conteúdo) → reescrito com `Popover` (Base UI, sai via portal) — bounding box da tabela confirmado idêntico com Playwright antes/depois de abrir.
- **Exclusão de linha**: botão passou a sempre visível (não só hover) → trocou de `Toggle` pra `<button>` comum (Toggle não fazia sentido — nunca mostrava o estado "ligado") → removida da UI por completo → voltou só na barra de edição em massa. Ícone final `TrashIcon` desenhado localmente (era `NyansapoIcon`, placeholder explícito desde o início).
- **Linhas verticais entre colunas**: `columnLines` (default true, mesmo padrão do `@adinkra/table`) — espessura final: cabeçalho com borda cheia (`--border-width`/`--ink`), corpo com `--hairline`; borda do container/header removida, borda das linhas mantida. Bug corrigido: conflito de especificidade CSS (duas regras concorrentes pro mesmo `border-right`) fazia a última coluna manter borda indevida — fix com seletor único `:not(:first-child):not(:last-child)`.
- **Colunas redimensionáveis**: `table-fixed`+`<colgroup>`; `columnWidths` só guarda o que foi arrastado manualmente (colunas intocadas dividem o espaço livre sozinhas, scroll só aparece quando a soma realmente estoura); `ColumnResizeHandle` usa `setPointerCapture` no próprio elemento (sem listener de `window`); mínimo 72px.
- **Coluna do checkbox**: sem borda própria, fundo transparente (cabeçalho e corpo), alinhada à direita; checkbox (linha e "selecionar todas") só visível no hover/foco/quando marcado. Bug corrigido: duas camadas de `bg-secondary/10` empilhadas (linha inteira + fundo próprio da célula) deixavam essa coluna com hover mais escuro — fix removendo o fundo próprio no hover.
- **Gutter da linha** (ref. print do Notion): "+" (insere linha depois) + alça de arrastar (reordenar via drag-and-drop NATIVO do HTML — aqui só importa onde soltou, diferente do `setPointerCapture` usado na barra flutuante) + checkbox, nessa ordem.
- **Barra de edição em massa** (aparece com seleção ativa): um botão por coluna (popover aplica em todas as linhas selecionadas de uma vez) + lixeira. Virou flutuante e arrastável (`position:fixed`, alça com `setPointerCapture`); cor final `bg-surface`/`border-ink`/`shadow-brutal` (era `bg-heading`/`text-background` copiando o Notion, trocada pro "cartão único" padrão do sistema).
- **Cor por sinal do número** (`--positive`/`--positive-foreground`, único verde já testado no sistema): implementada e depois **revertida por completo** a pedido do usuário — token removido do `@adinkra/tokens`, `NumberCell` voltou a `text-foreground` neutro sempre. Registrado em "O que ficou para trás" (seção 9) como decisão a não repetir sem pedido explícito.
- Outras correções: setas do `<input type="number">` escondidas via CSS (`appearance:textfield`+`-webkit-*-spin-button:appearance-none`); hover de linha `hover:bg-secondary/10` (tentativa anterior com `bg-card` era quase imperceptível, `--background`/`--card` têm claridade parecida no tema claro); placeholder "—" de campo vazio trocado por célula genuinamente vazia (`null`, exceto número que sempre mostra um valor).

### `@adinkra/progress` (`SegmentedBar`): evolução (16/09)

Antes de escrever qualquer linha, carregada a skill `dataviz` (cor vem por último no método dela). Passou por muitas iterações na mesma sessão até bater com um mockup de referência (Playwright/`getComputedStyle` no DOM renderizado, não só no olho) — estado final:
- **Cor**: paleta final são as 3 (depois 4, com `--tag-navy` novo) cores de etiqueta do próprio sistema — não a fórmula OKLCH copiada da referência nem a paleta categórica de 8 cores da skill `dataviz` (testadas antes, nessa ordem).
- **Mecânica de tamanho**: `flex: 0 0 ${tamanho_visual}%` fixo (não `flex-grow`) — a soma dos tamanhos visuais é normalizada pra reservar um piso visual mínimo (`minVisibleShare`, % da barra) a TODOS os segmentos primeiro, repartindo o resto proporcionalmente, garantindo que a soma sempre feche em 100% sem nenhum segmento sumir (bug corrigido: com "estourar e cortar" via `overflow-hidden`, um segmento perto de 100% podia zerar visualmente o outro).
- **Piso do arrasto** (`minSegmentShare`, fração do total, hoje 5%) é conceito separado do **piso visual** (`minVisibleShare`) — um segmento pode existir com valor bem pequeno mas nunca renderiza menor que o piso visual.
- **Rótulo**: recalculado a cada render via `formatLabel(value)` (não string estática congelada — bug corrigido depois de implementar arrastar) — sempre aparece, mesmo em valores baixos; `truncate` como rede de segurança se não couber, nunca `overflow-hidden` cortando letra (proibido pela skill).
- **Puxador de arraste**: `position:absolute` centrado na fronteira (não um divisor ocupando espaço de flex, versão inicial). Bug corrigido duas vezes até bater com a posição real: precisa de `flexBasis:0` nos segmentos (senão a largura considera o conteúdo/texto do rótulo antes de distribuir por `flex-grow`) e o cálculo do puxador precisa usar a soma acumulada dos tamanhos VISUAIS (já com piso aplicado), não a participação bruta.
- Espaçador de 2px entre segmentos (cor `--surface`) em vez de borda — regra da skill: borda separando marcas soma tinta que não é dado. Cor de texto por segmento calculada por luminância relativa (WCAG), não uma cor padrão pra todos.
- `light-dark()` CSS nativo pra cor (não token novo nem JS lendo DOM) — `tokens.css` já declara `color-scheme` no `:root`/`[data-theme]`.

### `@adinkra/charts`: evolução (16/09)

- **Base**: `ChartContainer` injeta `config` como CSS vars `--color-<chave>` num `<style>` escopado (`ChartStyle`); série sem `color`/`theme` explícito cicla a mesma paleta categórica de 4 cores do `@adinkra/progress` (`--tag-coral`/`--tag-sky`/`--tag-mustard`/`--tag-navy`) — reuso deliberado, não paleta nova por componente. `ChartTooltipContent` é o "cartão único" padrão (borda+raio+sombra).
- **Bug real por trás de séries "pretas"**, corrigido na raiz: `ChartStyle` só declarava a var CSS pras chaves do `config` com `color`/`theme` EXPLÍCITO — mas `<Bar>`/`<Radar>`/`<Line>`/`<Area>` sempre referenciam `var(--color-chave)` sem fallback; uma série sem cor explícita (o caso comum, quase todo exemplo do próprio `charts.mdx`) ficava com a variável indefinida, e o valor inicial de SVG quando `var()` não resolve é PRETO. Fix: `ChartStyle` agora itera TODAS as chaves do `config`, com a mesma fórmula de fallback que `getSeriesColor()` já usava só em Pie/Tooltip/Legend.
- **12 tipos de gráfico** (ampliado num pedido só, lista explícita do usuário; inspiração citada neobrutalism.dev/charts e boldkit.dev/charts, mas os dois são SPAs sem conteúdo estático fetchável — implementação seguiu a convenção já estabelecida no próprio pacote, não clone pixel-a-pixel): bar simples, empilhado+legenda, negativo (cor por sinal — `--destructive`, `<ReferenceLine y={0}>`), donut com texto central (`<Label content={fn}>`, `innerRadius`/`outerRadius` em % não px — bug corrigido, valor absoluto cortava o anel em containers baixos, `ChartContainer` ganhou `aspect-square`), pizza com rótulo customizado, radar preenchido, sparkline de linha/área (gradiente com `id` via `useId()` — evita colisão de `url(#id)` global do SVG entre duas instâncias na mesma página), tendência de alta/baixa (cor fixa `--primary`/`--destructive`, **não verde** — decisão explícita, mesmo raciocínio da reversão no data-table), linha com ponto final destacado, treemap (espaçamento simulado por inset nos retângulos, já que Treemap não é flex/grid), sankey (ligação herda a cor de onde SAI, não neutra — precisou de componente `SankeyLink` próprio pra redesenhar a curva de Bézier e injetar a cor calculada via `colorByNodeName`, já que o Recharts só expõe o NÓ resolvido, não o índice original, depois de resolver `source`/`target`).
- **Revisão de cor em todo o pacote**: `--ink` (quase preto, tinta padrão de toda borda/sombra) removido de toda MARCA DE DADO (contorno de bloco do Treemap, contorno de nó do Sankey, linha de base do gráfico negativo) — regra da skill `dataviz`, "borda separando marcas soma tinta que não é dado". Trocado por `--border` (cinza neutro) onde ainda fazia sentido ter uma linha de apoio.

### `@adinkra/cursor` (21º pacote, 17/09)

`BigCircleCursor` (círculo que cresce no hover, encolhe no clique, `backdrop-filter: invert()+grayscale()`) e `MotionBlurCursor` (círculo que borra na direção do movimento). Tradução de dois snippets de referência (vanilla JS) pra React, não cópia literal:
- `clientX`/`clientY` (não `pageX`/`pageY`) — os elementos são `position:fixed` (relativos à viewport), a referência original compensava scroll manualmente, o que ficaria errado aqui.
- Sem `document.querySelector` — tudo via `useRef`, atualizado direto no `pointermove` (mesmo raciocínio de performance do `SymbolField`).
- `cursor:none` via `<style>` injetado + classe no `<html>` (não `el.style.cursor` elemento por elemento) — cobre conteúdo dinâmico adicionado depois do mount.
- `pointerdown`/`pointerup` (não `click`+`setTimeout` fixo) — acompanha a duração real do clique/toque.
- Não ativa em toque (`pointer:coarse`) nem com `prefers-reduced-motion` — os dois casos renderizam `null`, cursor nativo continua.
- `data-cursor-hover` (atributo de dado) pra marcar elemento extra como "isto também cresce o cursor" — não checagem de substring de classe.
- `useCursorActive` (hook compartilhado): mesma checagem (montado + ponteiro fino + sem reduced-motion) fatorada entre os dois cursores.
- `id` do `<filter>` do Motion Blur via `React.useId()` — evita colisão se dois cursores desse tipo coexistirem.
- **`MotionBlurCursor` reescrito**: de `<circle fill>` com `filter="url(#blur)"` pra `<div>` com `backdrop-filter: url(#filtro-svg)` (amostra o que está ATRÁS, não o conteúdo próprio) — filtro encadeia `feColorMatrix` (inverte) → `feColorMatrix saturate=0` (dessatura) → `feGaussianBlur`. `color-interpolation-filters="sRGB"` obrigatório (padrão do SVG é `linearRGB`, dá cor visualmente errada comparado a `invert()`/`grayscale()` CSS).
  - **Bug real, corrigido no mesmo dia (17/09, sessão seguinte)**: usuário reportou "o Motion Blur não tá funcionando" — o círculo aparecia PRETO SÓLIDO em vez de invertido/borrado (confirmado com screenshot via Playwright). Causa: `backdrop-filter: url(#filtro-svg)` (referência a `<filter>` de SVG por `url()`) é instável nessa propriedade especificamente — bug conhecido do Firefox (elemento não renderiza) e comportamento errático no Chromium (a amostra do fundo falha antes de entrar no filtro, e inverter/dessaturar uma amostra preta continua preto). Só FUNÇÕES CSS puras (`invert()`, `grayscale()`, `blur()`) são confiáveis em `backdrop-filter` — `filter: url(#id)` (a propriedade `filter` normal, não `backdrop-filter`) sim suporta referência a SVG de forma confiável, é o caso de uso original do recurso. **Fix**: dividir em duas propriedades no mesmo elemento — `backdropFilter: "invert(0.97) grayscale(1)"` (funções CSS puras, mesma dupla do `BigCircleCursor`) + `filter: url(#id)` (só o `feGaussianBlur` direcional agora, sem os dois `feColorMatrix` — a inversão/dessaturação saiu do SVG). `filter` age sobre o resultado já invertido/dessaturado que o `backdrop-filter` produziu, borrando esse resultado em vez do fundo cru. Mesmo fix replicado na demo contida (`cursor-demo.tsx`).
- **Feature `data-cursor-color` (cor por elemento) implementada e depois removida por completo** (mesmo dia, três tentativas — fundo sólido opaco → `mix-blend-mode:color` → `color-mix()` translúcido — nenhuma satisfez o resultado esperado pelo usuário; pedido final foi tirar a feature inteira). Junto, os dois cursores perderam também o fallback sólido de `--ink`/`--background` pra navegadores sem `backdrop-filter` — hoje não têm NENHUM caminho de preenchimento de cor, só o filtro.
- Demo de cada cursor na página de docs é uma versão à parte, contida (`position:absolute` relativo à caixa da demo, não `document` inteiro) — o componente real sequestraria o cursor do site inteiro se usado direto numa página de catálogo.
- **Aplicado na home** (17/09): `<BigCircleCursor size={250} />` em `app/page.tsx` (não no `layout.tsx` raiz — só a home, cleanup automático ao trocar de rota). Dois botões novos "Getting Started"/"Introduction" (`variant="outline"`, `primary` continua reservado só pra CTA principal). `SymbolField` (fundo de símbolos da home) perdeu o hover de área — virou puramente decorativo, sem `"use client"`/hooks (efeito colateral bem-vindo). Uma linha diagonal a 45° cruzando o `SymbolField` foi adicionada e removida no mesmo dia (pedido revertido).
- **`SymbolField` reagindo de novo ao `BigCircleCursor` (17/09, sessão seguinte)**: pedido do usuário — "os simbolos [...] mudando de cor pra terracota ao big circle passar por eles". `SymbolField` voltou a ser `"use client"`: calcula os ladrilhos dentro do raio do cursor via grade regular (linha/coluna a partir de `getBoundingClientRect()` do container ÷ 64px, não `getBoundingClientRect()` por ladrilho) e troca só `style.color` desses via `ref` num array indexado — sem `useState`/loop nos 800 ladrilhos, mesmo raciocínio de performance do resto do pacote. Nova prop `cursorSize` (default 250) precisa casar com o `size` do `BigCircleCursor` montado do lado — os dois em `app/page.tsx` levam `250` agora, hardcoded nos dois lugares (não uma prop compartilhada). `useCursorActive` foi exportado de `@adinkra/cursor` (antes só interno) pra `SymbolField` poder gatear o efeito — sem o cursor customizado ativo (touch, `prefers-reduced-motion`), a área não reage a um círculo que não existe.
- **Pacote reformulado: de 2 pra 6 variantes de cursor (17/09, sessão seguinte)**: pedido do usuário, referenciando o [Curzr](https://github.com/fuzionix/curzr) de fuzionix (CodePen bloqueado por Cloudflare; código-fonte puxado de um gist com o HTML/JS/SCSS completos, `gist.githubusercontent.com` não tem o mesmo bloqueio). Adicionados `ArrowPointerCursor`, `RingDotCursor`, `CircleAndDotCursor`, `GlitchCursor` — tradução das classes JS da referência pras convenções já estabelecidas no pacote, não cópia literal:
  - **`clientX`/`clientY` direto**, sem o ajuste manual de `getBoundingClientRect()` da referência (só necessário lá porque os elementos originais eram `position: absolute` relativos ao `body`; aqui são `position: fixed`, relativos à viewport).
  - **Clique por duração real** (`pointerdown`/`pointerup`) em vez do `setTimeout(35ms)` fixo da referência — mesmo raciocínio já usado no `BigCircleCursor`.
  - **Cores via token do sistema, não hex fixo**: `ArrowPointerCursor` usa `var(--ink)`/`var(--background)` (se adapta ao tema sozinho, diferente da referência com cores estáticas que nunca invertiam no escuro); `RingDotCursor` troca o amarelo `#edf370` por `var(--primary)`; `GlitchCursor` troca o ciano/magenta `#00feff`/`#ff4f71` por `var(--primary)`/`var(--brand)` (as duas cores "vivas" que o sistema já tem — como é sombra decorativa, não texto, a regra de contraste AA que restringe `--brand` a texto ≥24px não se aplica).
  - **`CURSOR_HOVER_SELECTOR` fatorado** (`hover-selector.ts`) — antes só existia dentro do `BigCircleCursor`, duplicaria em mais 3 arquivos; agora um só export compartilhado.
  - **Descoberta reaproveitada do bug do Motion Blur**: `GlitchCursor` também precisa de um blur/preenchimento reativo ao fundo — usa `CSS.supports("backdrop-filter", "invert(1)")` com fallback sólido em `var(--ink)` (mesmo padrão defensivo que `BigCircleCursor`/`MotionBlurCursor` abriram mão depois da saga do `data-cursor-color`, mas aqui volta a fazer sentido — componente diferente, sem essa decisão anterior).
  - `ArrowPointerCursor`/`CircleAndDotCursor` usam o mesmo truque de ângulo por quadrante com acumulador (`angleDisplace`) da referência — evita o salto visual de 359°→0° que `Math.atan2` direto numa `rotate()` CSS daria.
  - `cursor.mdx` ganhou uma seção por variante (Preview/uso/Props), crédito à referência original, e a seção "Tokens usados" foi expandida por variante. `cursor-demo.tsx` ganhou 4 demos contidas (mesma ressalva de sempre: real é `document`+`fixed`, demo é local ao container). Build/typecheck limpos, sanity check via Playwright sem erro de console nas 6 seções.
- **`.claude/` criado, `DECISOES.md` movido pra lá** (17/09, pedido do usuário) — antes na raiz do projeto. README e este memory atualizados com o novo caminho.
- **Dois bugs de demo corrigidos (17/09, sessões seguintes, reportados pelo usuário testando manualmente)**:
  - **`Circle & Dot` só aparecia depois de passar por cima de algo**: `CircleAndDotCursorDemo` só setava `border` numa MUDANÇA de estado de hover (`hovering !== hoveringRef.current`) — como o valor inicial já é `false`, o primeiro movimento (tipicamente fora do botão) não muda nada, então a borda nunca era setada até o mouse realmente passar por cima do botão pela primeira vez. O componente real do pacote já tinha a borda inicial certa (`applyBorder(false)` antes de registrar os listeners); só a demo ficou sem o equivalente. Fix: `border: "1.25px solid var(--ink)"` direto no `style` estático do JSX da demo.
  - **`Motion Blur` mostrava o cursor nativo no hover do botão**: única das 6 demos com `<button>` que não tinha as classes `[&_a]:cursor-none [&_button]:cursor-none` no container — o `style={{cursor:"none"}}` do container não é herdado pelo `<button>` (que tem `cursor:pointer` próprio, não herdado do pai). As outras 5 demos já tinham essas classes.
- **Prop de cor customizável em 4 dos 6 cursores** (17/09, pedido do usuário — "quero ter a possibilidade de mudar a cor dos cursor"): escopo perguntado e confirmado — só os 4 que já usam cor sólida via token (`ArrowPointerCursor`, `RingDotCursor`, `CircleAndDotCursor`, `GlitchCursor`); `BigCircleCursor`/`MotionBlurCursor` ficaram de fora de propósito, mesma razão já documentada acima (`data-cursor-color` tentado e revertido por completo nesses dois). Cada um ganhou prop(s) com default = o token que já usava, nada muda visualmente sem customizar:
  - `ArrowPointerCursor.color` (default `var(--ink)`, contorno) — o miolo continua sempre `var(--background)` fixo (garante o recorte de duas cores mesmo com `color` custom).
  - `RingDotCursor.color` (default `var(--primary)`, traço externo/halo) — o traço interno/pontinho continua sempre `var(--ink)` fixo.
  - `CircleAndDotCursor.color` (default `var(--ink)`) — componente monocromático, cor única trocada por completo.
  - `GlitchCursor.colorA`/`colorB` (default `var(--primary)`/`var(--brand)`) — duas props, não uma: a separação cromática precisa de duas cores por natureza do efeito; `colorA` também vira o fallback sólido sem `backdrop-filter`.
  - Decisão de design: expor só UMA cor customizável por componente de tom único (o "acento"), mantendo `var(--ink)` sempre fixo como estrutural — evita rediscutir contraste/legibilidade por instância, `--ink` continua sendo o token universal de "sempre legível" do sistema.
  - `cursor.mdx` ganhou seção "Cor customizável" (com exemplo de código) antes de "Tokens usados", que também foi reescrita por variante pra citar prop + default em vez de token fixo.
- **`BigCircleCursor` ganha `backdropFilter={false}` (17/09, pedido do usuário — "no big circle quero ter a opção de desligar o backdrop-filter")**: nova prop boolean (default `true`) — desligada, troca `backdrop-filter: invert()+grayscale()` por preenchimento sólido via nova prop `color` (default `var(--ink)`, ignorada no padrão). **Não é o fallback automático por `CSS.supports` que o pacote já teve e abandonou** (saga do `data-cursor-color`, ver acima) — aqui é um MODO explícito escolhido por quem consome o componente, não uma detecção de suporte do navegador, então não reabre aquela decisão (o pacote continua sem fallback automático nenhum). `MotionBlurCursor` não ganhou a mesma prop: o efeito dele PRECISA do `backdrop-filter` pra amostrar o fundo antes de borrar — sem ele não sobra nada pra borrar, então "desligar" não é uma opção coerente pra esse componente (diferente do Big Circle, que só usa o filtro pra tingir, tem alternativa sólida óbvia). `cursor.mdx` atualizado (props table, exemplo de uso, seções "Cor customizável"/"Tokens usados").
  - **`dotColor` separado de `color` (mesmo dia, sessão seguinte, pedido do usuário — "tem controlar o backdrop-filter pra ser transparente")**: primeira aplicação na home (`backdropFilter={false}`, sem `color` custom) não era o resultado esperado — pedido seguinte esclareceu que a intenção era um círculo TRANSPARENTE (invisível), não um preenchimento sólido em `var(--ink)`. Como `color` controlava círculo E pontinho juntos, `color="transparent"` sozinho apagaria os dois — mas o pedido era só o pontinho continuar visível. Fix: `dotColor` prop nova, default `= color` (destructuring com default referenciando outro parâmetro já desestruturado, válido em JS/TS).
    - **Bug real na primeira tentativa, corrigido no mesmo dia (usuário reportou "não to vendo o ponto que deveria ter")**: por causa do default `dotColor = color`, `dotColor` HERDA o valor de `color` (não o `var(--ink)` interno do componente) — como a home passava `color="transparent"` explícito, `dotColor` também virava `"transparent"` por padrão, apagando o pontinho junto. Fix: passar `dotColor="var(--ink)"` explícito na home. `<BigCircleCursor size={250} backdropFilter={false} color="transparent" dotColor="var(--ink)" />` — essa é a versão final, círculo grande invisível, só o pontinho aparece. O exemplo do `cursor.mdx` já tinha `dotColor` explícito desde o início, só a home ficou sem por um instante.
- **Botões "Getting Started"/"Introduction" trocados de `outline` pra `secondary` (17/09, sessão seguinte, pedido do usuário — "por que os buttons [...] estão com o background vazado, é pra ser uma cor solida")**: não era bug de CSS — `outline` é `bg-transparent` DE PROPÓSITO desde que os dois botões foram criados (deixa ver o que está atrás, aqui a grade de símbolos da home), documentado em `packages/button/src/button.tsx:39`. Usuário não esperava esse comportamento pros dois botões novos. Perguntado qual cor sólida preferia (secondary/mesmo terracota do CTA/branco gesso) — escolheu `secondary` (`bg-secondary`, névoa azul, sólido mas discreto, não compete com o CTA principal terracota — mesmo raciocínio já documentado de "um só destaque por tela").
- **Home simplificada: título maior, um só botão "Get Started" (17/09, sessão seguinte, pedido do usuário — "titulo grander com a descricao abaixo, e um boton abaixo com getStarted")**: perguntado se os outros dois (Getting Started/Introduction) somem — confirmado que sim. `h1` "Adinkra" (`font-adinkra`) foi de `text-4xl sm:text-5xl` pra `text-5xl sm:text-6xl md:text-7xl`. Os 3 botões anteriores (Ver os componentes/Getting Started/Introduction) saíram por completo — sobrou 1 `Link` só, texto "Get Started", `href="/getting-started"`, estilo igual ao CTA principal anterior (`variant="primary"` + `bg-feature`/`text-feature-foreground`, mesmo raciocínio de sempre: `--brand` puro não passa AA como fundo de botão, `--feature` é o par pronto pra isso).

### Faltam

1. Criar a organização `adinkra` no npm ou GitHub Packages, publicar v0.1.0 de cada pacote.
2. Tabs, Alert e Select — fora da sidebar por decisão (só entram componentes que já existem de verdade); o mecanismo de status `"planejado"` continua no código, é só reintroduzir um item em `nav.ts`.
3. ~~Gaveta mobile (Sheet) e rail arrastável no `@adinkra/sidebar`~~ — feito 15/09.
4. Gerar a tabela de Props de verdade a partir do tipo TypeScript (`react-docgen-typescript`) — hoje é escrita à mão em cada `.mdx`.
5. ~~Redesenhar os SVGs dos símbolos Adinkra~~ — feito 15/09 (vetorizados a partir de adinkrasymbols.org, viraram `@adinkra/icons`); 93 dos 101 ainda usam `PlaceholderIcon`.
6. Rodar o primeiro teste de usabilidade com três pessoas (H2) — H3 (seção 8) merece reteste depois do neobrutalismo, já que mede "elegante, culto, com memória" e a nova direção é mais crua de propósito.
7. Considerar `next/font` no lugar do `<link>` do Google Fonts em `apps/docs/app/layout.tsx`, para self-hosting sem flash de fonte.
