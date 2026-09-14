# -*- coding: utf-8 -*-
"""Las unidades y las coordenadas: si esto está bien, todo lo demás cae en su lugar."""
import unittest

import contexto  # noqa: F401  (deja la librería en el path)

from barelevamiento import unidades


class Conversiones(unittest.TestCase):
    def test_un_pie_son_30_coma_48_centimetros(self):
        self.assertAlmostEqual(unidades.pies(30.48), 1.0)
        self.assertAlmostEqual(unidades.centimetros(1.0), 30.48)

    def test_la_y_de_la_pantalla_se_da_vuelta(self):
        self.assertEqual(unidades.punto({u"x": 0, u"y": 30.48}), (0.0, -1.0))

    def test_el_vector_se_transforma_igual_que_el_punto_pero_sin_escalar(self):
        self.assertEqual(unidades.vector({u"x": 1, u"y": 1}), (1.0, -1.0))

    def test_el_contorno_conserva_el_orden(self):
        puntos = [{u"x": 0, u"y": 0}, {u"x": 30.48, u"y": 0}]
        self.assertEqual(unidades.contorno(puntos), [(0.0, 0.0), (1.0, 0.0)])


class Orientacion(unittest.TestCase):
    """La regla de una sola línea: la cara derecha es la que Revit usa sola."""

    def test_la_normal_por_defecto_es_la_direccion_girada_un_cuarto_de_vuelta(self):
        self.assertEqual(unidades.normal_por_defecto((1.0, 0.0)), (0.0, -1.0))
        self.assertEqual(unidades.normal_por_defecto((0.0, 1.0)), (1.0, 0.0))

    def test_la_cara_derecha_coincide_con_la_normal_por_defecto(self):
        u = unidades.unitario((0.0, 0.0), (1.0, 0.0))
        self.assertEqual(unidades.normal_cara(u, u"derecha"), unidades.normal_por_defecto(u))

    def test_la_cara_izquierda_es_la_contraria(self):
        u = (1.0, 0.0)
        izquierda = unidades.normal_cara(u, u"izquierda")
        derecha = unidades.normal_cara(u, u"derecha")
        self.assertEqual(izquierda, (-derecha[0], -derecha[1]))

    def test_un_muro_de_largo_cero_no_revienta(self):
        self.assertEqual(unidades.unitario((1.0, 1.0), (1.0, 1.0)), (0.0, 0.0))


class NombresDeTipo(unittest.TestCase):
    def test_el_muro_lleva_su_espesor_en_centimetros(self):
        self.assertEqual(unidades.nombre_tipo_muro(15), u"BA Muro 15")

    def test_la_abertura_lleva_ancho_por_alto(self):
        self.assertEqual(unidades.nombre_tipo_abertura(80, 210), u"BA 80 x 210")

    def test_la_columna_lleva_ancho_por_profundidad(self):
        self.assertEqual(unidades.nombre_tipo_columna(30, 30), u"BA Columna 30 x 30")

    def test_los_decimales_solo_aparecen_cuando_hacen_falta(self):
        self.assertEqual(unidades.nombre_tipo_muro(15.0), u"BA Muro 15")
        self.assertEqual(unidades.nombre_tipo_muro(12.5), u"BA Muro 12.5")


if __name__ == u"__main__":
    unittest.main()
