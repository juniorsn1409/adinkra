"use client";

import * as React from "react";
import { Link } from "@adinkra/link";
import { Switch } from "@adinkra/switch";
import { T } from "./language";

// Precisa de estado (o switch da caixa alta) — por isso vive num componente
// à parte, não direto no MDX (que não tem hooks).
export function LinkDemo() {
  const [uppercase, setUppercase] = React.useState(true);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-wrap items-center justify-center gap-6">
        <Link href="#" uppercase={uppercase}>
          Sponsor
        </Link>
        <Link href="#" uppercase={uppercase}>
          <T k="demo.link.advertise" />
        </Link>
        <Link href="#" uppercase={uppercase}>
          <T k="demo.link.seeAll" />
        </Link>
      </div>
      <div className="flex items-center gap-2.5">
        <Switch id="link-uppercase" checked={uppercase} onCheckedChange={setUppercase} />
        <label htmlFor="link-uppercase" className="font-display text-sm text-heading">
          <T k="demo.link.uppercase" />
        </label>
      </div>
    </div>
  );
}
