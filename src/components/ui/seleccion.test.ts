import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { anilloSeleccion } from "./seleccion";

const SRC = fileURLToPath(new URL("../../", import.meta.url));

function archivosTsx(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) {
      return nombre === "generated" ? [] : archivosTsx(ruta);
    }
    return ruta.endsWith(".tsx") ? [ruta] : [];
  });
}

/**
 * El fondo de la aplicación es grafito y las tarjetas son `neutral-900`. Pintar
 * el anillo de "esto está elegido" con un color de esa misma familia lo vuelve
 * invisible: al hacer clic la tarjeta parece apagarse en vez de encenderse.
 * Pasó de verdad al cambiar la app al lenguaje de la marca, y dejó los pasos de
 * paleta y materiales aparentemente rotos. Esta prueba impide que vuelva.
 */
describe("anillo de selección", () => {
  const oscuros = ["neutral-800", "neutral-900", "neutral-950"];

  it("no se pinta con ningún color de la familia del fondo", () => {
    const culpables: string[] = [];
    for (const ruta of archivosTsx(SRC)) {
      const contenido = readFileSync(ruta, "utf8");
      for (const linea of contenido.split("\n")) {
        // Un anillo grueso (2px o más) es siempre un indicador de estado, nunca
        // un borde de reposo: si es oscuro, no se ve.
        const anillos = linea.match(/shadow-\[0_0_0_[2-9]px_var\(--color-([a-z]+-\d+)\)\]/g) ?? [];
        for (const anillo of anillos) {
          if (oscuros.some((o) => anillo.includes(o))) {
            culpables.push(`${ruta.replace(SRC, "")}: ${anillo}`);
          }
        }
      }
    }
    expect(culpables).toEqual([]);
  });

  it("marca la diferencia entre elegido y no elegido", () => {
    expect(anilloSeleccion(true)).not.toEqual(anilloSeleccion(false));
    expect(anilloSeleccion(true)).toContain("neutral-100");
  });
});
