# -*- coding: utf-8 -*-
"""El texto que ve Bruno al terminar: lo creado, lo que falló y lo que quedó a ojo."""
import unittest

import contexto

from barelevamiento import informe
from barelevamiento import plan as planificador
from barelevamiento.lectura import leer_archivo


def plan_de(nombre):
    return planificador.armar(leer_archivo(contexto.ruta(nombre)))


class InformeDelCuarto(unittest.TestCase):
    def setUp(self):
        self.plan = plan_de(contexto.CUARTO)
        self.resultado = informe.Resultado()

    def test_encabeza_con_el_proyecto_y_la_fecha_como_la_escribe_bruno(self):
        texto = informe.texto(self.plan, self.resultado)
        self.assertIn(u"# Cuarto de Bruno", texto)
        self.assertIn(u"14/09/2026", texto)

    def test_cuenta_lo_creado_en_singular_y_en_plural(self):
        self.resultado.creado(u"OrdenMuro", u"m1")
        self.resultado.creado(u"OrdenMuro", u"m2")
        self.resultado.creado(u"OrdenAmbiente", u"Cuarto")
        texto = informe.texto(self.plan, self.resultado)
        self.assertIn(u"- 2 muros", texto)
        self.assertIn(u"- 1 ambiente", texto)

    def test_lo_que_no_se_pudo_crear_va_con_su_motivo(self):
        self.resultado.fallo(u"OrdenAbertura", u"P1", u"No hay ninguna familia de puertas cargada")
        texto = informe.texto(self.plan, self.resultado)
        self.assertIn(u"## Lo que no se pudo crear", texto)
        self.assertIn(u"abertura P1", texto)
        self.assertIn(u"No hay ninguna familia de puertas cargada", texto)

    def test_un_motivo_de_varios_renglones_se_aplasta_a_uno(self):
        self.resultado.fallo(u"OrdenMuro", u"m1", u"Revit dijo:\n  algo\n  largo")
        self.assertIn(u"Revit dijo: algo largo", informe.texto(self.plan, self.resultado))

    def test_sin_nada_creado_lo_dice(self):
        self.assertIn(u"No se creó ningún elemento", informe.texto(self.plan, self.resultado))

    def test_las_medidas_a_ojo_se_listan_para_que_bruno_las_vaya_a_medir(self):
        texto = informe.texto(plan_de(contexto.SIN_MEDIR), self.resultado)
        self.assertIn(u"## Medidas que quedaron a ojo", texto)
        self.assertIn(u"entraron a Revit con el valor dibujado", texto)

    def test_un_cuarto_medido_no_muestra_la_lista_de_pendientes_del_ambiente(self):
        # El cuarto está medido; lo único pendiente son los puntos eléctricos.
        texto = informe.texto(self.plan, self.resultado)
        pendientes = [c for c in self.plan.controles if c[u"tipo"] == u"pendiente"]
        self.assertEqual(u"## Medidas que quedaron a ojo (%s)" % len(pendientes) in texto, bool(pendientes))


class ListasLargas(unittest.TestCase):
    def test_pasadas_las_cuarenta_pendientes_se_corta_y_avisa_cuantas_faltan(self):
        plan = plan_de(contexto.CUARTO)
        plan.controles = [
            {u"tipo": u"pendiente", u"codigo": u"pendiente", u"mensaje": u"medida %s" % i} for i in range(45)
        ]
        texto = informe.texto(plan, informe.Resultado())
        self.assertIn(u"- medida 39", texto)
        self.assertNotIn(u"- medida 40", texto)
        self.assertIn(u"...y 5 más.", texto)

    def test_los_errores_del_relevamiento_van_arriba_de_los_pendientes(self):
        plan = plan_de(contexto.CUARTO)
        plan.controles = [
            {u"tipo": u"pendiente", u"codigo": u"p", u"mensaje": u"falta medir"},
            {u"tipo": u"error", u"codigo": u"e", u"mensaje": u"el ambiente no cierra"},
        ]
        texto = informe.texto(plan, informe.Resultado())
        self.assertLess(texto.index(u"## Problemas del relevamiento"), texto.index(u"## Medidas que quedaron a ojo"))


if __name__ == u"__main__":
    unittest.main()
