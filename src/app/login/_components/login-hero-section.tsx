import Image from "next/image";
import { ShieldCheck } from "lucide-react";

export function LoginHeroSection() {
  return (
    <section className="relative hidden min-h-[560px] overflow-hidden border-r bg-foreground px-10 py-10 text-background lg:flex lg:flex-col lg:justify-between">
      <Image
        src="/ufpel-bg.jpg"
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 520px, 0px"
        className="scale-110 object-cover opacity-55 blur-sm"
      />
      <div className="absolute inset-0 bg-foreground/75" />

      <div className="relative space-y-5">
        <h1 className="max-w-sm text-4xl font-semibold leading-tight">
          Plataforma acadêmica para simulação de avaliações ENADE.
        </h1>
      </div>

      <div className="relative space-y-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-background/10 ring-1 ring-background/20">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <p className="max-w-sm text-sm leading-6 text-background/75">
          As credenciais desta plataforma são independentes dos demais sistemas
          da faculdade. Somente usuários que receberam convite por email podem
          acessar.
        </p>
      </div>
    </section>
  );
}
