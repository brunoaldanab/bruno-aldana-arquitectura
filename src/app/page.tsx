"use client";

import { motion } from "motion/react";
import { logout } from "@/app/login/actions";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/Button";
import { FondoCinematico } from "@/components/FondoCinematico";
import { fondos } from "@/lib/images";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] as const } },
};

export default function Home() {
  return (
    <>
      <AppHeader />
      <FondoCinematico
        src={fondos.home.src}
        brillo={fondos.home.brillo}
        className="flex flex-1 flex-col"
        velo="bg-gradient-to-t from-neutral-950/95 via-neutral-950/55 to-neutral-950/25"
      >
        <main className="flex h-full flex-col items-center justify-center px-4 py-24 text-center">
        <motion.div variants={container} initial="hidden" animate="show" className="relative flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-4">
            <motion.span variants={rise} className="text-xs font-medium tracking-[0.2em] text-neutral-300 uppercase">
              Estudio de arquitectura
            </motion.span>
            <motion.h1 variants={rise} className="font-display text-5xl font-light tracking-tight text-white sm:text-7xl">
              Bruno Aldana
            </motion.h1>
            <motion.p variants={rise} className="text-sm text-neutral-300">
              Sesión iniciada.
            </motion.p>
          </div>
          <motion.div variants={rise} className="flex items-center gap-3">
            <Button href="/contactos">Ver contactos</Button>
            <form action={logout}>
              {/* Sobre la foto oscura el gris del botón fantasma no se lee: el
                  color va forzado porque su clase base pierde por orden de CSS. */}
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="!text-neutral-200 hover:!text-white hover:bg-white/10"
              >
                Cerrar sesión
              </Button>
            </form>
          </motion.div>
        </motion.div>
        </main>
      </FondoCinematico>
    </>
  );
}
