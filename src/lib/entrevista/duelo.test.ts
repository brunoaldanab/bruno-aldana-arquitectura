import { describe, expect, it } from "vitest";
import { campeonGuardado, fotoPortada } from "./duelo";
import { createInitialEntrevistaState } from "./types";
import type { GaleriaData } from "./galeria";

const galeriaVacia: GaleriaData = {
  estiloFotos: [],
  estiloCustom: [],
  mobiliarioFotos: [],
  mobiliarioCustom: [],
  paletaOficinaFotos: [],
  paletaOficinaCustom: [],
};

const galeria: GaleriaData = {
  ...galeriaVacia,
  estiloFotos: [
    { id: "f1", cardKey: "industrial", dataUrl: "data:image/jpeg;base64,AAA", orden: 0 },
    { id: "f2", cardKey: "industrial", dataUrl: "data:image/jpeg;base64,BBB", orden: 1 },
    { id: "f3", cardKey: "nordico", dataUrl: "data:image/jpeg;base64,CCC", orden: 0 },
  ],
};

const resultado = {
  fotoId: "f2",
  styleKey: "industrial",
  styleName: "Industrial suave",
  rating: 9,
  reaction: "super",
  decididoEn: "2026-08-28T12:00:00.000Z",
};

describe("campeonGuardado", () => {
  it("reconstruye la foto ganadora desde la biblioteca", () => {
    expect(campeonGuardado(resultado, galeria.estiloFotos)).toEqual({
      fotoId: "f2",
      dataUrl: "data:image/jpeg;base64,BBB",
      styleName: "Industrial suave",
      rating: 9,
    });
  });

  it("devuelve null si no hay resultado guardado", () => {
    expect(campeonGuardado(undefined, galeria.estiloFotos)).toBeNull();
  });

  it("devuelve null si la foto fue borrada de la biblioteca", () => {
    expect(campeonGuardado(resultado, [])).toBeNull();
  });
});

describe("fotoPortada", () => {
  it("usa el campeón del duelo cuando existe", () => {
    const state = { ...createInitialEntrevistaState(), duelo: resultado };
    expect(fotoPortada(state, galeria)?.fotoId).toBe("f2");
  });

  it("cae en la foto mejor calificada cuando no hubo duelo", () => {
    const state = createInitialEntrevistaState();
    state.estiloDetalle = {
      industrial: {
        notas: "",
        reacciones: {
          f1: { reaction: "like", rating: 7, comment: "" },
          f2: { reaction: "super", rating: 10, comment: "" },
        },
      },
      nordico: {
        notas: "",
        reacciones: { f3: { reaction: "like", rating: 8, comment: "" } },
      },
    };
    expect(fotoPortada(state, galeria)?.fotoId).toBe("f2");
  });

  it("ignora las fotos que el cliente descartó", () => {
    const state = createInitialEntrevistaState();
    state.estiloDetalle = {
      industrial: {
        notas: "",
        reacciones: { f1: { reaction: "no", rating: 10, comment: "" } },
      },
      nordico: {
        notas: "",
        reacciones: { f3: { reaction: "like", rating: 6, comment: "" } },
      },
    };
    expect(fotoPortada(state, galeria)?.fotoId).toBe("f3");
  });

  it("devuelve null si no hay ninguna foto valorada", () => {
    expect(fotoPortada(createInitialEntrevistaState(), galeria)).toBeNull();
  });
});
