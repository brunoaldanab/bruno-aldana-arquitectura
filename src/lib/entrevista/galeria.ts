export type GaleriaTipo = "ESTILO" | "MOBILIARIO";

export interface GaleriaFotoDTO {
  id: string;
  cardKey: string;
  dataUrl: string;
  orden: number;
}

export interface GaleriaCardCustomDTO {
  id: string;
  key: string;
  titulo: string;
  mood: string;
  descripcion: string;
  facts: { k: string; v: string }[];
}

export interface PaletaOficinaFotoDTO {
  id: string;
  comboKey: string;
  dataUrl: string;
  orden: number;
}

export interface PaletaOficinaCustomDTO {
  id: string;
  key: string;
  nombre: string;
  colores: { n: string; h: string }[];
  uso: string;
}

export interface GaleriaData {
  estiloFotos: GaleriaFotoDTO[];
  estiloCustom: GaleriaCardCustomDTO[];
  mobiliarioFotos: GaleriaFotoDTO[];
  mobiliarioCustom: GaleriaCardCustomDTO[];
  paletaOficinaFotos: PaletaOficinaFotoDTO[];
  paletaOficinaCustom: PaletaOficinaCustomDTO[];
}
