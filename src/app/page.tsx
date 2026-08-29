"use client";

import { motion, useReducedMotion } from "motion/react";
import { logout } from "@/app/login/actions";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/Button";
import { FondoCinematico } from "@/components/FondoCinematico";
import { fondos } from "@/lib/images";
import { SALIDA } from "@/lib/movimiento";

/**
 * La portada del sistema.
 *
 * Es la única pantalla que se ve una vez por sesión y no cien veces al día, así
 * que acá sí corresponde gastar el presupuesto de animación: la firma y el
 * título entran escalonados sobre el render. El escalón es de 70 ms —lo
 * suficiente para que se lea como una secuencia y no como un rebote colectivo.
 *
 * La firma es el vector con el texto en curvas, no el nombre tipeado: el manual
 * pide que la firma no se re-tipee nunca.
 */
const contenedor = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};

const subir = {
  hidden: { opacity: 0, transform: "translateY(14px)" },
  show: {
    opacity: 1,
    transform: "translateY(0px)",
    transition: { duration: 0.5, ease: SALIDA },
  },
};

const subirQuieto = {
  hidden: { opacity: 0, transform: "translateY(0px)" },
  show: { opacity: 1, transform: "translateY(0px)", transition: { duration: 0.3 } },
};

export default function Home() {
  const reduceMotion = useReducedMotion();
  const entrada = reduceMotion ? subirQuieto : subir;

  return (
    <>
      <AppHeader />
      <FondoCinematico
        src={fondos.home.src}
        brillo={fondos.home.brillo}
        className="flex flex-1 flex-col"
        velo="bg-gradient-to-t from-neutral-950/95 via-neutral-950/60 to-neutral-950/30"
      >
        <main className="flex h-full flex-col items-center justify-center px-4 py-24 text-center">
          <motion.div
            variants={contenedor}
            initial="hidden"
            animate="show"
            className="relative flex flex-col items-center gap-10"
          >
            <motion.div variants={entrada}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/firma-vertical-blanco.svg"
                alt="Bruno Aldana · Arquitectura"
                width={240}
                height={130}
                className="h-auto w-[220px] sm:w-[260px]"
              />
            </motion.div>

            <motion.p variants={entrada} className="rotulo text-neutral-400">
              Entrevista · Cotización · Propuesta
            </motion.p>

            <motion.div variants={entrada} className="flex items-center gap-3">
              <Button href="/contactos">Ver contactos</Button>
              <form action={logout}>
                {/* Sobre la foto oscura el gris del botón fantasma no se lee: el
                    color va forzado porque su clase base pierde por orden de CSS. */}
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="!text-neutral-300 hover:!text-neutral-100 hover:bg-white/10"
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
