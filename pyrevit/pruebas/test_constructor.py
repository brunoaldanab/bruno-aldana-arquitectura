# -*- coding: utf-8 -*-
"""
El constructor recorrido entero contra un Revit de mentira.

No prueba que Revit se comporte como se espera —eso solo se sabe abriendo el
modelo—, pero sí que el botón no se caiga en el primer renglón: que las once
etapas se recorran, que cada elemento pida lo que tiene que pedir y que un
proyecto al que le faltan familias no tumbe el resto.
"""
import unittest

import contexto
import dobles

dobles.instalar()

from barelevamiento import informe as informes  # noqa: E402
from barelevamiento import plan as planificador  # noqa: E402
from barelevamiento.lectura import leer_archivo  # noqa: E402
from barevit.constructor import Constructor  # noqa: E402


def construir(nombre, con_familias=True, sin_volteo=()):
    doc = dobles.documento(con_familias, sin_volteo)
    plan = planificador.armar(leer_archivo(contexto.ruta(nombre)))
    resultado = informes.Resultado()
    Constructor(doc, plan, resultado).construir()
    return plan, resultado, dobles.REGISTRO


class CuartoDeBruno(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.plan, cls.resultado, cls.registro = construir(contexto.CUARTO)

    def test_no_falla_ni_un_elemento(self):
        self.assertEqual(self.resultado.fallidos, [], u"%s" % (self.resultado.fallidos,))

    def test_crea_los_cuatro_muros(self):
        self.assertEqual(self.resultado.cuenta(u"OrdenMuro"), 4)
        self.assertEqual(self.registro.cuantos(u"muro"), 4)

    def test_crea_las_dos_aberturas_el_ambiente_el_piso_y_los_dos_techos(self):
        self.assertEqual(self.resultado.cuenta(u"OrdenAbertura"), 2)
        self.assertEqual(self.resultado.cuenta(u"OrdenAmbiente"), 1)
        self.assertEqual(self.resultado.cuenta(u"OrdenPiso"), 1)
        self.assertEqual(self.resultado.cuenta(u"OrdenTecho"), 2)

    def test_crea_los_cinco_puntos_electricos(self):
        self.assertEqual(self.resultado.cuenta(u"OrdenElectrico"), 5)

    def test_la_moldura_deja_cuatro_lineas_de_modelo(self):
        self.assertEqual(self.registro.cuantos(u"linea de modelo"), 4)

    def test_avisa_que_la_moldura_es_una_linea_y_no_un_solido(self):
        self.assertTrue(any(u"líneas de modelo" in a for a in self.resultado.avisos))

    def test_el_tipo_de_muro_de_quince_ya_estaba_y_no_se_duplica(self):
        self.assertEqual(self.registro.cuantos(u"duplicado"), 3, u"solo las dos aberturas y la columna")

    def test_cada_etapa_abre_y_cierra_su_transaccion_adentro_de_un_grupo(self):
        movimientos = self.registro.transacciones
        self.assertEqual(movimientos[0], (u"abre", u"Traer relevamiento"))
        self.assertEqual(movimientos[-1], (u"junta", u"Traer relevamiento"))
        self.assertNotIn(u"deshace", [m for m, _ in movimientos])
        abiertas = len([1 for m, _ in movimientos if m == u"abre"])
        cerradas = len([1 for m, _ in movimientos if m == u"cierra"])
        self.assertEqual(abiertas - 1, cerradas, u"cada etapa cierra la suya")

    def test_el_codigo_del_relevamiento_queda_escrito_en_el_elemento(self):
        comentarios = [v for n, v in self.registro.parametros if n == u"comentario"]
        self.assertIn(u"P1", comentarios)
        self.assertIn(u"T1", comentarios)

    def test_la_ventana_entra_con_su_antepecho(self):
        antepechos = [v for n, v in self.registro.parametros if n == u"antepecho"]
        self.assertIn(100 / 30.48, antepechos)

    def test_todo_termina_mirando_hacia_donde_dice_el_relevamiento(self):
        """La prueba de la orientación: se mide, no se adivina.

        Cada elemento nace mirando hacia `+X` en el Revit de mentira. El
        constructor tiene que voltear los que quedaron al revés y dejar quietos
        los que ya estaban bien, así que al final ninguno puede quedar mirando
        en contra de su normal.
        """
        normales = dict(
            (o.codigo, o.normal)
            for o in self.plan.ordenes
            if getattr(o, u"normal", None) and type(o).__name__ in (u"OrdenAbertura", u"OrdenElectrico")
        )
        self.assertEqual(len(normales), 7, u"dos aberturas y cinco puntos")
        revisados = 0
        for instancia in self.registro.instancias:
            codigo = instancia.get_Parameter(u"BuiltInParameter.ALL_MODEL_INSTANCE_COMMENTS")
            normal = normales.get(codigo.AsString() if codigo else None)
            if not normal:
                continue
            mira = instancia.FacingOrientation
            self.assertGreaterEqual(mira.X * normal[0] + mira.Y * normal[1], 0, u"quedó mirando al revés")
            revisados += 1
        self.assertEqual(revisados, 7)

    def test_solo_se_voltea_lo_que_estaba_al_reves(self):
        volteos = len([v for v in self.registro.volteos if v[1] == u"cara"])
        al_reves = len(
            [
                o
                for o in self.plan.ordenes
                if getattr(o, u"normal", None) and o.normal[0] < 0 and type(o).__name__ in (u"OrdenAbertura", u"OrdenElectrico")
            ]
        )
        self.assertEqual(volteos, al_reves)


class CasaDeEjemplo(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.plan, cls.resultado, cls.registro = construir(contexto.CASA)

    def test_no_falla_ni_un_elemento(self):
        self.assertEqual(self.resultado.fallidos, [], u"%s" % (self.resultado.fallidos,))

    def test_los_dos_espesores_crean_un_tipo_nuevo_de_diez(self):
        duplicados = [d for q, d in self.registro.creados if q == u"duplicado"]
        self.assertIn(u"BA Muro 10", duplicados)

    def test_el_vano_se_abre_en_el_muro(self):
        self.assertEqual(self.registro.cuantos(u"vano"), 1)

    def test_la_puerta_con_bisagra_al_final_se_espeja(self):
        self.assertIn((u"instancia", u"mano"), self.registro.volteos)

    def test_los_tres_ambientes_con_su_piso(self):
        self.assertEqual(self.resultado.cuenta(u"OrdenAmbiente"), 3)
        self.assertEqual(self.resultado.cuenta(u"OrdenPiso"), 3)

    def test_la_viga_entra_apoyada_en_la_altura_del_nivel(self):
        self.assertEqual(self.resultado.cuenta(u"OrdenViga"), 1)


class ComoLaPlantillaDeGigi(unittest.TestCase):
    """Las familias eléctricas que no se dejan voltear y entran sueltas.

    Es el caso real de la plantilla de Bruno, medido en Revit el 14/09/2026:
    `CanFlipFacing` en falso y sin muro anfitrión. Darlas vuelta no hace nada,
    así que la única forma de dejarlas mirando bien es girarlas.
    """

    @classmethod
    def setUpClass(cls):
        cls.plan, cls.resultado, cls.registro = construir(
            contexto.CUARTO,
            sin_volteo=(u"dispositivos-electricos", u"dispositivos-de-iluminacion", u"dispositivos-de-comunicacion"),
        )

    def test_los_cinco_puntos_entran_igual(self):
        self.assertEqual(self.resultado.cuenta(u"OrdenElectrico"), 5)

    def test_se_los_gira_porque_voltearlos_no_hace_nada(self):
        self.assertTrue(self.registro.rotaciones, u"tendría que haber girado los que quedaron torcidos")

    def test_todos_terminan_mirando_hacia_su_normal(self):
        normales = dict(
            (o.codigo, o.normal)
            for o in self.plan.ordenes
            if type(o).__name__ == u"OrdenElectrico"
        )
        revisados = 0
        for instancia in self.registro.instancias:
            codigo = instancia.get_Parameter(u"BuiltInParameter.ALL_MODEL_INSTANCE_COMMENTS")
            normal = normales.get(codigo.AsString() if codigo else None)
            if not normal:
                continue
            mira = instancia.FacingOrientation
            self.assertAlmostEqual(mira.X * normal[0] + mira.Y * normal[1], 1.0, places=6)
            revisados += 1
        self.assertEqual(revisados, 5)

    def test_avisa_que_quedaron_sueltos(self):
        self.assertTrue(any(u"sueltos" in a for a in self.resultado.avisos))


class UnProyectoPelado(unittest.TestCase):
    """Sin familias cargadas: lo que se puede crear se crea igual, y se avisa el resto."""

    @classmethod
    def setUpClass(cls):
        cls.plan, cls.resultado, cls.registro = construir(contexto.CUARTO, con_familias=False)

    def test_los_muros_entran_lo_mismo(self):
        self.assertEqual(self.resultado.cuenta(u"OrdenMuro"), 4)

    def test_las_aberturas_fallan_una_por_una_con_el_motivo_escrito(self):
        motivos = [m for clase, _, m in self.resultado.fallidos if clase == u"OrdenAbertura"]
        self.assertEqual(len(motivos), 2)
        self.assertIn(u"familia", motivos[0])

    def test_el_ambiente_y_el_piso_entran_igual(self):
        self.assertEqual(self.resultado.cuenta(u"OrdenAmbiente"), 1)
        self.assertEqual(self.resultado.cuenta(u"OrdenPiso"), 1)

    def test_el_informe_los_lista_para_que_bruno_sepa_que_le_falta(self):
        texto = informes.texto(self.plan, self.resultado)
        self.assertIn(u"## Lo que no se pudo crear", texto)
        self.assertIn(u"abertura P1", texto)


if __name__ == u"__main__":
    unittest.main()
