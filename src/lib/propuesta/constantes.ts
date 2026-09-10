/**
 * Los números del negocio, en un solo lugar.
 *
 * La fuente de verdad es `BA_ARQUITECTURA/CLAUDE.md`, sección "Condiciones de la
 * propuesta comercial". Si un número cambia allá, se cambia acá y en ningún otro
 * archivo: no debe haber un 60 ni un 1000 sueltos dentro de un componente.
 */

/** Tarifa del diseño, en bolivianos por metro cuadrado. */
export const TARIFA_M2 = 60;

/*
 * Hasta el 31/08/2026 hubo un piso de 1.000 Bs por ambiente, pensado para que un
 * baño de 4 m² no se cobrara como si diera menos trabajo que una sala. Bruno lo
 * sacó: la tarifa es 60 Bs/m² y nada más. El motivo fue que el piso hacía que la
 * calculadora de la landing y la propuesta de la aplicación dieran números
 * distintos para el mismo proyecto —4.200 contra 5.880 Bs en un departamento de
 * 70 m²—, y un precio publicado que después sube es lo contrario de lo que la
 * página busca. Si alguna vez vuelve, tiene que volver en los dos lados a la vez.
 */

/** Ritmo de entrega: un día hábil cada tantos metros cuadrados. */
export const M2_POR_DIA_HABIL = 10;

/** Piso del plazo: ningún proyecto se entrega en menos que esto. */
export const DIAS_HABILES_MINIMO = 5;

/**
 * Días corridos que vale la propuesta. Es corto a propósito: cada vencimiento
 * es una excusa legítima para volver a escribirle al cliente.
 */
export const VALIDEZ_DIAS = 10;

/** Anticipo para arrancar. El 70 % restante se cobra a la entrega. */
export const PORCENTAJE_ANTICIPO = 0.3;

/** Honorarios de dirección y supervisión sobre las partidas supervisadas. */
export const PORCENTAJE_SUPERVISION = 0.1;
