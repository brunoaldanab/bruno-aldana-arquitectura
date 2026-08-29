"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { getSteps, type StepId } from "@/lib/entrevista/steps";
import type { EntrevistaState } from "@/lib/entrevista/types";
import type { GaleriaData } from "@/lib/entrevista/galeria";
import { saveEntrevista } from "./actions";
import { ProgresoCapitulos } from "@/components/entrevista/ProgresoCapitulos";
import { NavegadorPasos } from "@/components/entrevista/NavegadorPasos";
import { SALIDA, proyectar } from "@/lib/movimiento";
import { EscenaCinematica } from "@/components/EscenaCinematica";
import { escenaDePaso } from "@/lib/images";

import { TipoProyectoStep } from "./steps/TipoProyectoStep";
import { DatosGeneralesStep } from "./steps/DatosGeneralesStep";
import { SeleccionAmbientesStep } from "./steps/SeleccionAmbientesStep";
import { OficinaStep } from "./steps/OficinaStep";
import { RolesStep } from "./steps/RolesStep";
import { MobiliarioExistenteStep } from "./steps/MobiliarioExistenteStep";
import { PresupuestoStep } from "./steps/PresupuestoStep";
import { PlazosStep } from "./steps/PlazosStep";
import { CierreStep } from "./steps/CierreStep";
import { ResumenStep } from "./steps/ResumenStep";
import { EstiloStep } from "./steps/EstiloStep";
import { MobiliarioGaleriaStep } from "./steps/MobiliarioGaleriaStep";
import { DueloStep } from "./steps/DueloStep";
import { PaletaStep } from "./steps/PaletaStep";
import { MaterialesStep } from "./steps/MaterialesStep";
import { DetalleAmbientesStep } from "./steps/DetalleAmbientesStep";

/** Pasos que se muestran a pantalla ancha porque su contenido es visual. */
const PASOS_VISUALES = new Set<StepId>([
  "estilo",
  "mobiliario-galeria",
  "duelo",
  "paleta",
  "materiales",
]);

type StepComponentProps = {
  state: EntrevistaState;
  setState: React.Dispatch<React.SetStateAction<EntrevistaState>>;
  galeria: GaleriaData;
  setGaleria: React.Dispatch<React.SetStateAction<GaleriaData>>;
  onAdvance?: () => void;
};

const STEP_COMPONENTS: Record<StepId, React.ComponentType<StepComponentProps>> = {
  "tipo-proyecto": TipoProyectoStep,
  "datos-generales": DatosGeneralesStep,
  ambientes: SeleccionAmbientesStep,
  oficina: OficinaStep,
  roles: RolesStep,
  estilo: EstiloStep,
  duelo: DueloStep,
  "mobiliario-galeria": MobiliarioGaleriaStep,
  paleta: PaletaStep,
  materiales: MaterialesStep,
  "detalle-ambientes": DetalleAmbientesStep,
  "mobiliario-existente": MobiliarioExistenteStep,
  presupuesto: PresupuestoStep,
  plazos: PlazosStep,
  cierre: CierreStep,
  resumen: ResumenStep,
};

type SaveStatus = "idle" | "saving" | "saved";


export function EntrevistaWizard({
  entrevistaId,
  contactoId,
  contactoNombre,
  initialData,
  initialGaleria,
}: {
  entrevistaId: string;
  contactoId: string;
  contactoNombre: string;
  initialData: EntrevistaState;
  initialGaleria: GaleriaData;
}) {
  const [state, setState] = useState<EntrevistaState>(initialData);
  const [galeria, setGaleria] = useState<GaleriaData>(initialGaleria);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [navegadorAbierto, setNavegadorAbierto] = useState(false);
  const [, startTransition] = useTransition();
  const reduceMotion = useReducedMotion();

  const isFirstRender = useRef(true);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const steps = getSteps(state.proyecto.tipoProyecto);
  const cantidadPasos = steps.length;

  // Si cambia el tipo de proyecto y quedan menos pasos, no hace falta corregir
  // el estado desde un efecto: `safeCurrent` ya recorta el índice al renderizar
  // y `goTo` lo recorta al navegar.

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSaveStatus("saving");
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      startTransition(() => {
        saveEntrevista(entrevistaId, state).then(() => setSaveStatus("saved"));
      });
    }, 1200);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const safeCurrent = Math.min(current, steps.length - 1);
  const step = steps[safeCurrent];
  // Los pasos donde el material visual es el contenido — fotos, paletas,
  // materiales — necesitan todo el ancho: ahí la imagen es la pregunta, no un
  // adorno al lado del formulario.
  const esPasoVisual = PASOS_VISUALES.has(step.id);
  // La foto de la franja sigue de qué se está hablando: el paso actual, y dentro
  // del paso la variante que corresponde al tipo de proyecto (una oficina no se
  // ilustra con el living de un departamento).
  const escena = escenaDePaso(step.id, state.proyecto.tipoProyecto);
  const StepComponent = STEP_COMPONENTS[step.id];
  const isFirstStep = safeCurrent === 0;
  const isLastStep = safeCurrent === steps.length - 1;
  const nextDisabled = step.id === "tipo-proyecto" && !state.proyecto.tipoProyecto;
  // En los pasos visuales el contenido ya usa el arrastre horizontal (el visor
  // de fotos), así que ahí el gesto de cambiar de paso cedería el paso: dos
  // reconocedores peleando por el mismo eje se sienten rotos.
  const puedeArrastrar = !reduceMotion && !esPasoVisual;

  // ⌘K abre el salto rápido; las flechas recorren pasos salvo que se esté
  // escribiendo. Ninguna de las dos lleva animación extra: son acciones de
  // teclado y se usan muchas veces.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      const escribiendo =
        t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setNavegadorAbierto((v) => !v);
        return;
      }
      if (escribiendo || navegadorAbierto) return;
      if (e.key === "ArrowRight") setCurrent((c) => Math.min(c + 1, cantidadPasos - 1));
      if (e.key === "ArrowLeft") setCurrent((c) => Math.max(c - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navegadorAbierto, cantidadPasos]);

  function goTo(index: number) {
    const clamped = Math.max(0, Math.min(index, steps.length - 1));
    setDirection(clamped >= safeCurrent ? 1 : -1);
    setCurrent(clamped);
  }

  const offset = reduceMotion ? 0 : 22;

  return (
    <>
      <NavegadorPasos
        abierto={navegadorAbierto}
        steps={steps}
        actual={safeCurrent}
        onIr={goTo}
        onCerrar={() => setNavegadorAbierto(false)}
      />

      <div className="relative min-h-screen pb-28">
        <EscenaCinematica
          className="h-[38vh] min-h-[240px] w-full"
          sizes="100vw"
          src={escena.foto.src}
          brillo={escena.foto.brillo}
          claveEscena={`${step.id}-${state.proyecto.tipoProyecto}`}
          kicker={escena.kicker}
          titulo={step.label}
          barra={
            <>
              <Link
                href={`/contactos/${contactoId}`}
                className="text-sm text-neutral-300 transition-colors duration-150 hover:text-white"
              >
                ← {contactoNombre}
              </Link>
              <span className="font-mono text-[11px] text-neutral-300">
                {saveStatus === "saving" ? "Guardando…" : saveStatus === "saved" ? "Guardado ✓" : ""}
              </span>
            </>
          }
        />

        {/* El progreso vive en un ancho constante: es una pista de arrastre y no
            puede cambiar de tamaño debajo del dedo al saltar a un paso ancho. */}
        <div className="mx-auto max-w-3xl px-4 pt-4">
          <ProgresoCapitulos steps={steps} actual={safeCurrent} onIr={goTo} />
        </div>

        <div
          // El ancho cambia de golpe: animar `max-width` recalcula el layout en
          // cada cuadro, y el cambio queda tapado igual por la animación de
          // entrada del propio paso, que ya está corriendo encima.
          className={`mx-auto px-4 ${esPasoVisual ? "max-w-6xl" : "max-w-3xl"}`}
        >

          {/* El paso ya no vive dentro de una tarjeta: es la pantalla.
              El arrastre horizontal cambia de paso, con resistencia en los
              extremos y decisión por velocidad, no por distancia. */}
          {/* El paso entra y sale solo con desplazamiento y opacidad.
              Antes también animaba un desenfoque. Se sacó por la regla de
              movimiento del manual —solo `opacity` y `transform`— y porque acá
              costaba caro de verdad: el desenfoque obliga al navegador a
              repintar el elemento más grande de la pantalla en cada cuadro, y
              este paso puede tener una grilla de fotos adentro. El
              desplazamiento y la opacidad, en cambio, los resuelve la placa de
              video sin repintar nada. */}
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={step.id}
              custom={direction}
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, transform: `translateX(${direction * offset}px)` }
              }
              animate={{ opacity: 1, transform: "translateX(0px)" }}
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, transform: `translateX(${direction * -offset}px)` }
              }
              transition={{ duration: 0.24, ease: SALIDA }}
              drag={puedeArrastrar ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.16}
              dragDirectionLock
              onDragEnd={(_, info) => {
                // Se proyecta adónde iba el gesto: un envión corto alcanza.
                const destino = info.offset.x + proyectar(info.velocity.x) * 0.08;
                if (destino < -90 && !isLastStep && !nextDisabled) goTo(safeCurrent + 1);
                else if (destino > 90 && !isFirstStep) goTo(safeCurrent - 1);
              }}
              className={puedeArrastrar ? "cursor-grab active:cursor-grabbing" : ""}
            >
              <div className="py-6">
                <StepComponent
                  state={state}
                  setState={setState}
                  galeria={galeria}
                  setGaleria={setGaleria}
                  onAdvance={() => goTo(safeCurrent + 1)}
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Chrome flotante: material translúcido con el contenido pasando por
            debajo, en vez de una franja opaca que se come una tira de pantalla. */}
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-5">
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/10 bg-neutral-900/80 p-1.5 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.65)] backdrop-blur-2xl backdrop-saturate-150">
            <button
              type="button"
              onClick={() => goTo(safeCurrent - 1)}
              disabled={isFirstStep}
              aria-label="Paso anterior"
              className="boton-chrome flex h-11 w-11 items-center justify-center rounded-full text-neutral-200 disabled:opacity-30"
            >
              ←
            </button>

            <button
              type="button"
              onClick={() => setNavegadorAbierto(true)}
              className="boton-chrome flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-neutral-100"
            >
              <span className="max-w-[9rem] truncate">{step.label}</span>
              <kbd className="hidden rounded border border-neutral-100/12 px-1.5 py-0.5 font-mono text-[10px] text-neutral-500 sm:block">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => goTo(safeCurrent + 1)}
              disabled={isLastStep || nextDisabled}
              aria-label="Paso siguiente"
              className="boton-chrome flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-neutral-950 disabled:opacity-30"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
