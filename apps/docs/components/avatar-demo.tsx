"use client";

import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@adinkra/avatar";

// Imagem embutida (SVG em data URI) pra o exemplo "com foto" funcionar sem
// depender de rede nem de arquivo em /public.
const PHOTO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><rect width='96' height='96' fill='#60C0F0'/><circle cx='48' cy='38' r='16' fill='#1E3550'/><path d='M16 96c2-22 16-32 32-32s30 10 32 32z' fill='#1E3550'/></svg>`,
  );

export function AvatarDemo() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar size="sm">
          <AvatarImage src={PHOTO} alt="Ana Souza" />
          <AvatarFallback>AS</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage src={PHOTO} alt="Ana Souza" />
          <AvatarFallback>AS</AvatarFallback>
        </Avatar>
        <Avatar size="lg">
          <AvatarImage src={PHOTO} alt="Ana Souza" />
          <AvatarFallback>AS</AvatarFallback>
        </Avatar>
        {/* Endereço que não existe: cai nas iniciais. */}
        <Avatar>
          <AvatarImage src="/nao-existe.png" alt="Bruno Lima" />
          <AvatarFallback>BL</AvatarFallback>
        </Avatar>
      </div>
      <AvatarGroup role="group" aria-label="Quem está editando: Ana, Bruno, Carla e mais 2 pessoas">
        <Avatar>
          <AvatarImage src={PHOTO} alt="" />
          <AvatarFallback>AS</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>BL</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>CM</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>+2</AvatarFallback>
        </Avatar>
      </AvatarGroup>
    </div>
  );
}
