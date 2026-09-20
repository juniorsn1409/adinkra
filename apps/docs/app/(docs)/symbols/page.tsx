import { Card, CardContent, CardDescription, CardTitle } from "@adinkra/card";
import { iconRegistry } from "@adinkra/icons";
import { GlitchCursor } from "@adinkra/cursor";
import { T } from "../../../components/language";
import { PageTopbar } from "../../../components/page-topbar";

export const metadata = { title: "Símbolos" };

/**
 * Catálogo com os 101 símbolos Adinkra tradicionais (nome + significado),
 * levantado a pedido do usuário — "tente pegar todos os simbolos aqui:
 * adinkrasymbols.org" (15/09/2026). Os NOMES e SIGNIFICADOS são
 * conhecimento cultural tradicional Akan, de domínio público havia séculos
 * — não pertencem a nenhum site específico, então catalogá-los é só
 * pesquisa, igual citar qualquer enciclopédia. As DESCRIÇÕES abaixo são
 * paráfrases próprias, em português, não uma cópia do texto de nenhum site.
 *
 * ÍCONES — o processo mudou de rumo em 15/09/2026. Gye Nyame e Adinkrahene
 * foram desenhados do zero primeiro, 1 por vez com revisão do usuário antes
 * de avançar pro próximo, sem copiar nenhuma imagem — um lote inteiro
 * desenhado de uma vez chegou a ser descartado por esse motivo. Depois o
 * usuário mandou uma imagem própria dele achando que era o símbolo
 * Sankofa (argumentando que a FORMA tradicional Akan é patrimônio cultural
 * de domínio público, mesmo vetorizada de uma imagem de referência —
 * diferente de copiar o traço autoral específico de um site). Comparando
 * depois com adinkrasymbols.org, essa imagem era na verdade o Gye Nyame
 * (o Sankofa de verdade é o pássaro com a cabeça virada pra trás, bem
 * diferente) — corrigido nesse mesmo lote. A partir daí ele pediu
 * explicitamente pra mudar pro fluxo em lote: baixar as imagens
 * "-medium.png" de adinkrasymbols.org pra todos os símbolos, inclusive
 * refazendo Gye Nyame e Adinkrahene, que tinham sido desenhados à mão.
 * Todos os 101 símbolos viraram componentes do pacote `@adinkra/icons`
 * (15/09/2026, ver DECISOES.md) — pedido do usuário pra tratá-los como
 * ícones de verdade (reutilizáveis em qualquer lugar do design system, não
 * só nesta página), revertendo a decisão anterior de "Adinkra só como
 * marca, nunca ícone de UI". Esta página consome `iconRegistry` (slug →
 * componente) pra não precisar de um `import` nomeado por símbolo.
 */
function PlaceholderIcon() {
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label="A definir" className="size-20 text-muted-foreground">
      <rect x="18" y="18" width="64" height="64" rx="10" fill="none" stroke="currentColor" strokeWidth="7" strokeDasharray="10 8" />
    </svg>
  );
}

function SymbolIcon({ slug, label }: { slug: string; label: string }) {
  const Icon = iconRegistry[slug];
  if (!Icon) return <PlaceholderIcon />;
  return <Icon role="img" aria-label={label} className="size-20 text-brand" />;
}

interface SymbolEntry {
  name: string;
  description: string;
  slug: string;
}

const symbols: SymbolEntry[] = [
  { name: "Gye Nyame", description: "A onipotência e supremacia de Deus.", slug: "gye-nyame" },
  { name: "Sankofa", description: "Aprender com o passado pra construir o futuro.", slug: "sankofa" },
  { name: "Sankofa (coração)", description: "Versão em coração do retorno às raízes.", slug: "sankofa-heart" },
  { name: "Sankofa (espiral)", description: "Versão decorada, com espirais na barriga e leque de penas na cauda.", slug: "sankofa-swirl" },
  { name: "Adinkrahene", description: "Autoridade, liderança, carisma.", slug: "adinkrahene" },
  { name: "Dwennimmen", description: "Força e humildade ao mesmo tempo.", slug: "dwennimmen" },
  { name: "Funtumfunefu Denkyemfunefu", description: "Unidade na diversidade, destino compartilhado.", slug: "funtumfunefu-denkyemfunefu" },
  { name: "Nkyinkyim", description: "A jornada tortuosa da vida e a resiliência pra atravessá-la.", slug: "nkyinkyim" },
  { name: "Odo Nnyew Fie Kwan", description: "O amor guia pro caminho certo.", slug: "odo-nnyew-fie-kwan" },
  { name: "Denkyem", description: "Adaptabilidade e esperteza.", slug: "denkyem" },
  { name: "Nea Onnim", description: "Conhecimento e aprendizado ao longo da vida.", slug: "nea-onnim" },
  { name: "Nsoromma", description: "Fé e dependência do divino.", slug: "nsoromma" },
  { name: "Aban", description: "Força, poder, autoridade.", slug: "aban" },
  { name: "Abe Dua", description: "Riqueza, engenhosidade, autossuficiência.", slug: "abe-dua" },
  { name: "Abode Santann", description: "A totalidade e vastidão da criação.", slug: "abode-santann" },
  { name: "Abusua Pa", description: "União familiar, parentesco, apoio mútuo.", slug: "abusua-pa" },
  { name: "Adwo", description: "Paz, tranquilidade, calma.", slug: "adwo" },
  { name: "Agyin Dawuru", description: "Fidelidade, vigilância, senso de dever.", slug: "agyindawuru" },
  { name: "Akoben", description: "Chamado à ação, prontidão pro serviço.", slug: "akoben" },
  { name: "Akofena", description: "Autoridade do estado, reconhecimento de feitos heroicos.", slug: "akofena" },
  { name: "Akoko Nan", description: "Disciplina junto com cuidado e cria.", slug: "akoko-nan" },
  { name: "Akoma Ntoaso", description: "Acordo, união, unidade.", slug: "akoma-ntoaso" },
  { name: "Akoma", description: "Amor, boa vontade, paciência, fidelidade.", slug: "akoma" },
  { name: "Ananse Ntentan", description: "Sabedoria, criatividade, as complexidades da vida.", slug: "ananse-ntentan" },
  { name: "Ani Bere A Enso Gya", description: "Paciência, autodisciplina, autocontrole.", slug: "ani-bere-a-enso-gya" },
  { name: "Anyi Me Aye A", description: "Ingratidão e desrespeito.", slug: "anyi-me-aye-a" },
  { name: "Aponkyerene Wu A", description: "O valor que só se nota depois de perdido.", slug: "aponkyerene-wu-a" },
  { name: "Asaawa", description: "Doçura, prazer.", slug: "asaawa" },
  { name: "Asase Ye Duru", description: "Providência divina, a bênção da Mãe Terra.", slug: "asase-ye-duru" },
  { name: "Asetena Pa", description: "Riqueza, fartura, status social elevado.", slug: "asetena-pa" },
  { name: "Aya", description: "Resistência, independência, perseverança.", slug: "aya" },
  { name: "Bese Saka", description: "Fartura, abundância, união.", slug: "bese-saka" },
  { name: "Bi Nka Bi", description: "Justiça, paz, evitar o conflito.", slug: "bi-nka-bi" },
  { name: "Boa Me Na Me Mmoa Wo", description: "Cooperação, interdependência mútua.", slug: "boa-me-na-me-mmoa-wo" },
  { name: "Boafo Ye Na", description: "Gente que ajuda de verdade é rara.", slug: "boafo-ye-na" },
  { name: "Dame Dame", description: "Astúcia, inteligência, pensamento estratégico.", slug: "dame-dame" },
  { name: "Dono Ntoaso", description: "Ação conjunta, vigilância, boa vontade.", slug: "dono-ntoaso" },
  { name: "Dono", description: "Louvor, boa vontade, comunicação rítmica.", slug: "dono" },
  { name: "Duafe", description: "Qualidades femininas: paciência, prudência, cuidado.", slug: "duafe" },
  { name: "Dwantire", description: "Inocência.", slug: "dwantire" },
  { name: "Eban", description: "Segurança, proteção, amor.", slug: "eban" },
  { name: "Epa", description: "Lei e justiça.", slug: "epa" },
  { name: "Ese ne Tekrema", description: "Crescimento, melhoria, interdependência.", slug: "ese-ne-tekrema" },
  { name: "Esono Anantam", description: "Liderança, proteção, poder, segurança.", slug: "esono-anantam" },
  { name: "Fafanto", description: "Ternura, gentileza, honestidade, fragilidade.", slug: "fafanto" },
  { name: "Fawohodie", description: "Liberdade, independência, autodeterminação.", slug: "fawohodie" },
  { name: "Fihankra", description: "Irmandade, segurança, solidariedade.", slug: "fihankra" },
  { name: "Fofo", description: "Alerta contra a inveja e a cobiça.", slug: "fofo" },
  { name: "Gyawu Atiko", description: "Valentia e bravura.", slug: "gyawu-atiko" },
  { name: "Hwehwemudua", description: "Excelência, exame crítico, perfeição.", slug: "hwehwemudua" },
  { name: "Hye Wo Nhye", description: "Dureza, imperecibilidade, permanência.", slug: "hye-wo-nhye" },
  { name: "Kete Pa", description: "Bom casamento, relação conjugal bem-sucedida.", slug: "kete-pa" },
  { name: "Kokuromotie", description: "Cooperação, trabalho em equipe, indispensabilidade.", slug: "kokuromotie" },
  { name: "Kramo Bone Amma Yeanhu Kramo Pa", description: "Alerta contra a hipocrisia e o engano.", slug: "kramo-bone-amma-yeanhu-kramo-pa" },
  { name: "Krapa (Musuyidee)", description: "Equilíbrio espiritual, boa sorte, força espiritual.", slug: "krapa-musuyidee" },
  { name: "Kuronti ne Akwamu", description: "Democracia, decisão colaborativa.", slug: "kuronti-ne-akwamu" },
  { name: "Kwatakye Atiko", description: "Valentia e bravura.", slug: "kwatakye-atiko" },
  { name: "Kyemfere", description: "Conhecimento, experiência, o valor da herança.", slug: "kyemfere" },
  { name: "Mako", description: "Desigualdade, desenvolvimento desigual.", slug: "mako" },
  { name: "Mate Masie", description: "Sabedoria, conhecimento, retenção prudente do que se aprende.", slug: "mate-masie" },
  { name: "Mekyea Wo", description: "Saudação, reconhecimento, respeito mútuo.", slug: "mekyea-wo" },
  { name: "Menso Wo Kenten", description: "Autossuficiência, independência econômica.", slug: "menso-wo-kenten" },
  { name: "Mframadan", description: "Resiliência, prontidão pros desafios da vida.", slug: "mframadan" },
  { name: "Mmeramubere", description: "Calor, luz do sol, vitalidade.", slug: "mmeramubere" },
  { name: "Mmeramutene", description: "Luz do sol, resistência, retidão.", slug: "mmeramutene" },
  { name: "Mmere Dane", description: "A natureza passageira das circunstâncias favoráveis.", slug: "mmere-dane" },
  { name: "Mpatapo", description: "Pacificação, perdão, reconciliação.", slug: "mpatapo" },
  { name: "Mpuannum", description: "Lealdade, ofício sacerdotal.", slug: "mpuannum" },
  { name: "Nea Ope Se Obedi Hene", description: "Qualidades de liderança, a importância do serviço.", slug: "nea-ope-se-obedi-hene" },
  { name: "Nea Oretwa Sa", description: "Liderança, a importância de ouvir bons conselhos.", slug: "nea-oretwa-sa" },
  { name: "Nkonsonkonson", description: "Unidade, os laços da comunidade.", slug: "nkonsonkonson" },
  { name: "Nkotimsefo Mpua", description: "Lealdade, prontidão pra servir.", slug: "nkotimsefo-mpua" },
  { name: "Nkrabea", description: "Destino, a distribuição desigual dos talentos.", slug: "nkrabea" },
  { name: "Nkyemu", description: "Destreza, precisão, qualidade de acabamento.", slug: "nkyemu" },
  { name: "Nnamfo Pa Baanu", description: "Amizade, companheirismo.", slug: "nnamfo-pa-baanu" },
  { name: "Nsaa", description: "Excelência, genuinidade, autenticidade.", slug: "nsaa" },
  { name: "Nserewa", description: "Riqueza e algo sagrado.", slug: "nserewa" },
  { name: "Nteasee", description: "Entendimento e cooperação.", slug: "nteasee" },
  { name: "Nyame Baatanpa", description: "O cuidado de Deus com a criação.", slug: "nyame-baatanpa" },
  { name: "Nyame Biribi Wo Soro", description: "Esperança e inspiração.", slug: "nyame-biribi-wo-soro" },
  { name: "Nyame Dua", description: "A presença e a proteção de Deus.", slug: "nyame-dua" },
  { name: "Nyame Nti", description: "Fé e confiança na graça divina.", slug: "nyame-nti" },
  { name: "Nyame Nwu Na Mawu", description: "A imortalidade da alma humana.", slug: "nyame-nwu-na-mawu" },
  { name: "Nyansapo", description: "Sabedoria, inteligência, engenhosidade, paciência.", slug: "nyansapo" },
  { name: "Obohemaa", description: "Algo precioso, um tesouro.", slug: "obohemaa" },
  { name: "Ohene Aniwa", description: "Vigilância, inteligência, proteção, autoridade.", slug: "ohene-aniwa" },
  { name: "Okodee Mmowere", description: "Força, bravura, poder.", slug: "okodee-mmowere" },
  { name: "Okuafo Pa", description: "Diligência, trabalho duro, espírito empreendedor.", slug: "okuafo-pa" },
  { name: "Osram ne Nsoromma", description: "Fidelidade, harmonia, amor, lealdade.", slug: "osram-ne-nsoromma" },
  { name: "Owo Foro Adobe", description: "Engenhosidade, excelência, fazer o impossível.", slug: "owo-foro-adobe" },
  { name: "Owuo Atwedee", description: "A certeza e a universalidade da morte.", slug: "owuo-atwedee" },
  { name: "Pempamsie", description: "Previsão, prontidão, destemor.", slug: "pempamsie" },
  { name: "Sepow", description: "Justiça.", slug: "sepow" },
  { name: "Sesa Wo Suban", description: "Alerta contra a arrogância e a desonra.", slug: "sesa-wo-suban" },
  { name: "Som Onyankopon", description: "Devoção e adoração.", slug: "som-onyankopon" },
  { name: "Sunsum (Ntoro)", description: "Pureza espiritual, a limpeza da alma.", slug: "sunsum" },
  { name: "Tabono", description: "Força, confiança, persistência.", slug: "tabono" },
  { name: "Tamfo Bebre", description: "Má vontade, inveja.", slug: "tamfo-bebre" },
  { name: "UAC Nkanea", description: "Avanço tecnológico.", slug: "uac-nkanea" },
  { name: "Wawa Aba", description: "Resistência, dureza, perseverança.", slug: "wawa-aba" },
  { name: "Wo Nsa Da Mu A", description: "Democracia participativa, pluralismo.", slug: "wo-nsa-da-mu-a" },
  { name: "Woforo Dua Pa A", description: "Apoio a boas causas.", slug: "woforo-dua-pa-a" },
];

export default function SymbolsPage() {
  return (
    <>
      <article className="grid w-full gap-8 pb-24">
        <PageTopbar title={<T k="common.symbols" />} trail={[]} />
        <header className="grid gap-2 border-b border-hairline pb-6">
          <p className="font-display text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            <T k="common.resources" />
          </p>
          <h1 className="-ml-[0.04em] font-display text-3xl font-medium text-heading"><T k="common.symbols" /></h1>
          <p className="text-muted-foreground">
            <T k="symbols.description" />
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {symbols.map(({ name, description, slug }, index) => (
            <Card key={`${name}-${index}`}>
              <CardContent className="grid justify-items-center gap-2 text-center">
                <SymbolIcon slug={slug} label={name} />
                <CardTitle className="mt-2">{name}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </article>
    </>
  );
}
