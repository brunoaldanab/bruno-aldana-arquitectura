# -*- coding: utf-8 -*-
"""
El plan del cuarto de Bruno y de la casa de ejemplo.

Es la prueba que de verdad cubre el botón: todo lo que se puede equivocar está
resuelto acá y se compara contra los archivos que escribió el motor de la app.
"""
import unittest

import contexto

from barelevamiento import plan as planificador
from barelevamiento import unidades
from barelevamiento.lectura import leer_archivo

PIE = unidades.CM_POR_PIE


def plan_de(nombre):
    return planificador.armar(leer_archivo(contexto.ruta(nombre)))


class CuartoDeBruno(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.plan = plan_de(contexto.CUARTO)

    def _uno(self, clase):
        ordenes = self.plan.por_clase(clase)
        self.assertEqual(len(ordenes), 1, u"esperaba una sola orden de %s" % clase.__name__)
        return ordenes[0]

    def test_las_etapas_salen_en_orden(self):
        etapas = [o.etapa for o in self.plan.ordenes]
        self.assertEqual(etapas, sorted(etapas, key=planificador.ETAPAS.index))

    def test_el_nivel_arranca_en_la_cota_del_relevamiento(self):
        nivel = self._uno(planificador.OrdenNivel)
        self.assertEqual(nivel.nombre, u"Planta baja")
        self.assertAlmostEqual(nivel.elevacion, 0.0)

    def test_un_solo_tipo_de_muro_para_los_cuatro_muros(self):
        tipo = self._uno(planificador.OrdenTipoMuro)
        self.assertEqual(tipo.nombre, u"BA Muro 15")
        self.assertAlmostEqual(tipo.espesor, 15 / PIE)

    def test_los_cuatro_muros_con_su_largo_y_su_altura(self):
        muros = self.plan.por_clase(planificador.OrdenMuro)
        self.assertEqual(len(muros), 4)
        for m in muros:
            self.assertEqual(m.tipo, u"BA Muro 15")
            self.assertAlmostEqual(m.altura, 263 / PIE)

    def test_el_muro_de_arriba_va_de_esquina_a_esquina_con_la_y_dada_vuelta(self):
        m1 = [m for m in self.plan.por_clase(planificador.OrdenMuro) if m.id == u"m1"][0]
        self.assertAlmostEqual(m1.inicio[0], -7.5 / PIE)
        self.assertAlmostEqual(m1.inicio[1], 7.5 / PIE)
        self.assertAlmostEqual(m1.fin[0], 412.5 / PIE)
        self.assertAlmostEqual(m1.fin[1], 7.5 / PIE)

    def test_la_puerta_entra_por_el_centro_que_calculo_el_motor(self):
        puerta = [a for a in self.plan.por_clase(planificador.OrdenAbertura) if a.codigo == u"P1"][0]
        self.assertAlmostEqual(puerta.punto[0], 70 / PIE)
        self.assertAlmostEqual(puerta.punto[1], 7.5 / PIE)
        self.assertEqual(puerta.tipo, u"BA 80 x 210")
        self.assertAlmostEqual(puerta.antepecho, 0.0)

    def test_la_puerta_apunta_hacia_donde_abre(self):
        # Abre hacia la cara derecha del muro de arriba, que es la de adentro
        # del cuarto: en Revit, hacia la y negativa.
        puerta = [a for a in self.plan.por_clase(planificador.OrdenAbertura) if a.codigo == u"P1"][0]
        self.assertAlmostEqual(puerta.normal[0], 0.0)
        self.assertAlmostEqual(puerta.normal[1], -1.0)

    def test_una_ventana_sin_apertura_cargada_mira_hacia_la_cara_que_se_midio(self):
        ventana = [a for a in self.plan.por_clase(planificador.OrdenAbertura) if a.codigo == u"V1"][0]
        centro = (202.5 / PIE, -228 / PIE)
        hacia_el_centro = (centro[0] - ventana.punto[0], centro[1] - ventana.punto[1])
        escalar = ventana.normal[0] * hacia_el_centro[0] + ventana.normal[1] * hacia_el_centro[1]
        self.assertGreater(escalar, 0, u"la ventana se midió desde adentro y tiene que mirar para adentro")

    def test_la_bisagra_del_arranque_deja_la_mano_como_viene(self):
        puerta = [a for a in self.plan.por_clase(planificador.OrdenAbertura) if a.codigo == u"P1"][0]
        self.assertFalse(puerta.invertir_mano)

    def test_la_ventana_lleva_su_antepecho(self):
        ventana = [a for a in self.plan.por_clase(planificador.OrdenAbertura) if a.codigo == u"V1"][0]
        self.assertAlmostEqual(ventana.antepecho, 100 / PIE)
        self.assertAlmostEqual(ventana.alto, 110 / PIE)
        self.assertEqual(ventana.categoria, u"ventana")

    def test_cada_medida_distinta_crea_un_tipo_y_no_mas(self):
        nombres = [t.nombre for t in self.plan.por_clase(planificador.OrdenTipoAbertura)]
        self.assertEqual(sorted(nombres), [u"BA 150 x 110", u"BA 80 x 210"])

    def test_la_columna_gira_al_reves_que_en_la_pantalla(self):
        columna = self._uno(planificador.OrdenColumna)
        self.assertEqual(columna.tipo, u"BA Columna 30 x 30")
        self.assertAlmostEqual(columna.rotacion, 0.0)
        self.assertAlmostEqual(columna.punto[1], -430 / PIE)

    def test_el_ambiente_va_con_su_punto_interior(self):
        ambiente = self._uno(planificador.OrdenAmbiente)
        self.assertEqual(ambiente.nombre, u"Cuarto")
        self.assertAlmostEqual(ambiente.superficie_m2, 18.468)
        self.assertAlmostEqual(ambiente.punto[0], 202.5 / PIE)
        self.assertAlmostEqual(ambiente.punto[1], -228 / PIE)

    def test_el_piso_usa_el_contorno_interior_de_cara_a_cara(self):
        piso = self._uno(planificador.OrdenPiso)
        self.assertEqual(len(piso.contorno), 4)
        self.assertAlmostEqual(piso.desnivel, 0.0)
        xs = [p[0] for p in piso.contorno]
        ys = [p[1] for p in piso.contorno]
        self.assertAlmostEqual(max(xs) - min(xs), 405 / PIE)
        self.assertAlmostEqual(max(ys) - min(ys), 456 / PIE)

    def test_la_bandeja_se_crea_despues_de_su_zona_madre(self):
        techos = self.plan.por_clase(planificador.OrdenTecho)
        self.assertEqual(len(techos), 2)
        self.assertIsNone(techos[0].padre_id)
        self.assertEqual(techos[1].padre_id, techos[0].id)
        self.assertAlmostEqual(techos[0].altura, 240 / PIE)
        self.assertAlmostEqual(techos[1].altura, 220 / PIE)

    def test_la_moldura_recorre_las_cuatro_caras_a_la_altura_del_cielo(self):
        moldura = self._uno(planificador.OrdenMoldura)
        self.assertEqual(len(moldura.segmentos), 4)
        self.assertAlmostEqual(moldura.altura, 240 / PIE)
        # El recorrido cierra: cada segmento arranca donde terminó el anterior.
        for i, (desde, hasta) in enumerate(moldura.segmentos):
            siguiente = moldura.segmentos[(i + 1) % 4][0]
            self.assertAlmostEqual(hasta[0], siguiente[0], places=6)
            self.assertAlmostEqual(hasta[1], siguiente[1], places=6)

    def test_los_cinco_puntos_electricos_miran_hacia_adentro(self):
        puntos = self.plan.por_clase(planificador.OrdenElectrico)
        self.assertEqual(len(puntos), 5)
        centro = (202.5 / PIE, -228 / PIE)
        for p in puntos:
            hacia_el_centro = (centro[0] - p.punto[0], centro[1] - p.punto[1])
            escalar = p.normal[0] * hacia_el_centro[0] + p.normal[1] * hacia_el_centro[1]
            self.assertGreater(escalar, 0, u"%s mira para afuera del cuarto" % p.codigo)

    def test_cada_punto_lleva_la_altura_de_la_norma(self):
        por_codigo = dict((p.codigo, p) for p in self.plan.por_clase(planificador.OrdenElectrico))
        self.assertAlmostEqual(por_codigo[u"L1"].altura, 125 / PIE)
        self.assertEqual(por_codigo[u"L1"].familia, u"interruptor")
        self.assertAlmostEqual(por_codigo[u"T1"].altura, 30 / PIE)
        self.assertEqual(por_codigo[u"D1"].categoria, u"dispositivos-de-comunicacion")

    def test_no_quedan_ordenes_de_vano_en_un_cuarto_sin_vanos(self):
        self.assertEqual(self.plan.por_clase(planificador.OrdenVano), [])


class CasaDeEjemplo(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.plan = plan_de(contexto.CASA)

    def test_los_dos_espesores_dan_dos_tipos_de_muro(self):
        nombres = sorted(t.nombre for t in self.plan.por_clase(planificador.OrdenTipoMuro))
        self.assertEqual(nombres, [u"BA Muro 10", u"BA Muro 15"])

    def test_los_diez_muros_con_el_tipo_que_les_toca(self):
        muros = dict((m.id, m) for m in self.plan.por_clase(planificador.OrdenMuro))
        self.assertEqual(len(muros), 10)
        self.assertEqual(muros[u"m1"].tipo, u"BA Muro 15")
        self.assertEqual(muros[u"m8"].tipo, u"BA Muro 10")

    def test_los_tres_ambientes_con_su_piso(self):
        nombres = sorted(a.nombre for a in self.plan.por_clase(planificador.OrdenAmbiente))
        self.assertEqual(nombres, [u"Baño", u"Dormitorio", u"Pasillo"])
        self.assertEqual(len(self.plan.por_clase(planificador.OrdenPiso)), 3)

    def test_el_vano_va_por_su_etapa_y_no_necesita_tipo(self):
        vanos = self.plan.por_clase(planificador.OrdenVano)
        self.assertEqual(len(vanos), 1)
        self.assertEqual(vanos[0].etapa, u"vanos")
        self.assertAlmostEqual(vanos[0].ancho, 100 / PIE)
        self.assertFalse(hasattr(vanos[0], u"tipo"))

    def test_la_puerta_con_bisagra_al_final_se_espeja(self):
        puertas = [a for a in self.plan.por_clase(planificador.OrdenAbertura) if a.codigo == u"P1"]
        self.assertTrue(puertas[0].invertir_mano)

    def test_la_viga_va_de_punta_a_punta_con_su_peralte(self):
        viga = self.plan.por_clase(planificador.OrdenViga)[0]
        self.assertAlmostEqual(viga.peralte, 30 / PIE)
        self.assertAlmostEqual(viga.inicio[1], -255 / PIE)
        self.assertAlmostEqual(viga.fin[0], 305 / PIE)

    def test_la_moldura_no_aparece_si_no_se_dibujo(self):
        self.assertEqual(self.plan.por_clase(planificador.OrdenMoldura), [])


class CuartoSinMedir(unittest.TestCase):
    def test_el_plan_se_arma_igual_y_arrastra_los_pendientes(self):
        plan = plan_de(contexto.SIN_MEDIR)
        self.assertEqual(len(plan.por_clase(planificador.OrdenMuro)), 4)
        pendientes = [c for c in plan.controles if c[u"tipo"] == u"pendiente"]
        self.assertTrue(pendientes, u"un relevamiento a ojo tiene que traer medidas pendientes")


if __name__ == u"__main__":
    unittest.main()
