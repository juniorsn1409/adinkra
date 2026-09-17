// Cobre botão/link/campo/rótulo por padrão — quem quiser o mesmo efeito de
// hover num elemento fora dessa lista marca com `data-cursor-hover`, sem
// precisar editar nenhum cursor do pacote (mesmo espírito do `data-slot`
// usado nos outros pacotes: contrato explícito, não adivinhação por nome
// de classe/`localName`). Compartilhado entre todo cursor que reage a
// hover, pra não repetir a mesma string em cada arquivo.
export const CURSOR_HOVER_SELECTOR = "button, a, input, select, textarea, label, [role='button'], [data-cursor-hover]";
