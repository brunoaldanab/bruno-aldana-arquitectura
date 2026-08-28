import type { TipoProyecto } from "./types";

export type StepId =
  | "tipo-proyecto"
  | "datos-generales"
  | "ambientes"
  | "oficina"
  | "roles"
  | "estilo"
  | "duelo"
  | "mobiliario-galeria"
  | "paleta"
  | "materiales"
  | "detalle-ambientes"
  | "mobiliario-existente"
  | "presupuesto"
  | "plazos"
  | "cierre"
  | "resumen";

export interface StepDef {
  id: StepId;
  label: string;
}

/**
 * Misma lógica de ramificación que getSteps() en Entrevista_Diseno_Interiores_v2_5.html:
 * qué pasos aparecen depende de tipoProyecto ('oficina' / 'ambiente-unico' / vivienda por defecto).
 */
export function getSteps(tipoProyecto: TipoProyecto): StepDef[] {
  const steps: StepDef[] = [
    { id: "tipo-proyecto", label: "Tipo de proyecto" },
    { id: "datos-generales", label: "Datos generales" },
  ];

  if (tipoProyecto === "oficina") {
    steps.push({ id: "ambientes", label: "Espacios" });
    steps.push({ id: "oficina", label: "La oficina" });
  } else if (tipoProyecto === "ambiente-unico") {
    steps.push({ id: "ambientes", label: "El ambiente" });
  } else {
    steps.push({ id: "ambientes", label: "Ambientes" });
  }

  if (tipoProyecto === "oficina") {
    steps.push({ id: "roles", label: "Roles y flujo" });
  }

  steps.push({ id: "estilo", label: "Estilo" });
  steps.push({ id: "duelo", label: "Ranking & Duelo" });
  steps.push({ id: "mobiliario-galeria", label: "Tipo de mobiliario" });
  steps.push({ id: "paleta", label: "Paleta de color" });
  steps.push({ id: "materiales", label: "Materiales" });
  steps.push({
    id: "detalle-ambientes",
    label: tipoProyecto === "ambiente-unico" ? "Detalle del ambiente" : "Detalle x ambiente",
  });
  steps.push({ id: "mobiliario-existente", label: "Mobiliario" });
  steps.push({ id: "presupuesto", label: "Presupuesto" });
  steps.push({ id: "plazos", label: "Plazos" });
  steps.push({ id: "cierre", label: "Cierre" });
  steps.push({ id: "resumen", label: "Resumen" });

  return steps;
}
