# Adinkra

Design system para sites Next.js na Vercel. Cada componente é um pacote npm isolado
(`@adinkra/button`, `@adinkra/input`...) — instale só o que for usar.

Todas as decisões (paleta, tipografia, arquitetura, o que ficou para trás e por quê)
estão registradas em **[`.claude/DECISOES.md`](./.claude/DECISOES.md)**. Leia esse arquivo antes de
mudar qualquer coisa aqui — ele é a fonte de verdade do projeto.

## Estrutura

```
apps/
  docs/            site de documentação (Next.js + MDX), 1 rota por componente
packages/
  core/            @adinkra/core — cn() e utilitários compartilhados
  tokens/          @adinkra/tokens — CSS variables (cor, tipografia, raio)
  icons/           @adinkra/icons — 101 símbolos Adinkra como componentes de ícone
  badge/           breadcrumb/       button/          card/            charts/
  cursor/          data-table/       date-picker/     input/           navigation-menu/
  pagination/      progress/         sidebar/         skeleton/        switch/
  table/           toggle/
```

Lista completa de pacotes e o histórico de cada decisão ficam em [`.claude/DECISOES.md`](./.claude/DECISOES.md) — a lista acima é só a forma do monorepo, não um inventário que se mantém sincronizado sozinho.

## Como rodar

```bash
bun install
bun run dev      # sobe apps/docs em modo dev
bun run build    # builda todos os pacotes + o site de docs
bun run typecheck
```

## Como publicar um componente

```bash
bun run changeset          # descreve o que mudou e em qual pacote
bun run version-packages   # aplica os bumps de versão e atualiza changelogs
bun run build
cd packages/<componente> && bun publish
```
