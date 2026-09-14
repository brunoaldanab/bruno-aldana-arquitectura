# -*- coding: utf-8 -*-
"""La puerta de entrada: un archivo que pasa por acá ya no rompe más adelante."""
import json
import unittest

import contexto

from barelevamiento.lectura import ErrorDeArchivo, leer_archivo, leer_texto


def _sin(nombre, cambio):
    datos = contexto.datos(nombre)
    cambio(datos)
    return json.dumps(datos)


class ArchivosQueSeRechazan(unittest.TestCase):
    def _motivo(self, texto):
        try:
            leer_texto(texto)
        except ErrorDeArchivo as e:
            return u"%s" % e
        self.fail(u"tendría que haber sido rechazado")

    def test_un_texto_que_no_es_json(self):
        self.assertIn(u"no es un JSON", self._motivo(u"esto no es json"))

    def test_un_json_que_no_es_un_relevamiento(self):
        self.assertIn(u"no es un relevamiento", self._motivo(u'{"hola": 1}'))

    def test_el_formato_anterior_avisa_que_hay_que_exportar_de_nuevo(self):
        motivo = self._motivo(_sin(contexto.CUARTO, lambda d: d.update(version=1)))
        self.assertIn(u"versión 1", motivo)
        self.assertIn(u"exportarlo de nuevo", motivo)

    def test_sin_la_geometria_calculada_no_se_puede_construir(self):
        motivo = self._motivo(_sin(contexto.CUARTO, lambda d: d.pop(u"calculado")))
        self.assertIn(u"geometría calculada", motivo)

    def test_una_abertura_sin_muro_se_nombra_por_su_codigo(self):
        def romper(d):
            d[u"niveles"][0][u"aberturas"][0][u"muroId"] = u"m99"

        self.assertIn(u"P1", self._motivo(_sin(contexto.CUARTO, romper)))

    def test_un_muro_que_apunta_a_una_esquina_que_no_existe(self):
        def romper(d):
            d[u"niveles"][0][u"muros"][0][u"desde"] = u"n99"

        self.assertIn(u"esquina que no existe", self._motivo(_sin(contexto.CUARTO, romper)))

    def test_en_medidas_que_no_son_centimetros(self):
        self.assertIn(u"centímetros", self._motivo(_sin(contexto.CUARTO, lambda d: d.update(unidades=u"m"))))


class ArchivoBueno(unittest.TestCase):
    def setUp(self):
        self.lectura = leer_archivo(contexto.ruta(contexto.CUARTO))

    def test_trae_el_proyecto_y_la_fecha(self):
        self.assertEqual(self.lectura.nombre, u"Cuarto de Bruno")
        self.assertEqual(self.lectura.fecha, u"2026-09-14")

    def test_un_nivel_con_sus_cuatro_muros(self):
        nivel = self.lectura.niveles[0]
        self.assertEqual(len(nivel.muros), 4)
        self.assertEqual(nivel.altura_general, 263)

    def test_cada_muro_tiene_su_geometria_resuelta(self):
        nivel = self.lectura.niveles[0]
        for m in nivel.muros:
            self.assertIn(m[u"id"], nivel.geometria_muro)

    def test_la_altura_de_un_muro_sin_medir_es_la_general_del_nivel(self):
        nivel = self.lectura.niveles[0]
        self.assertEqual(nivel.altura_de_muro(nivel.muros[0]), 263)

    def test_las_esquinas_de_cada_cara_estan_en_el_archivo(self):
        nivel = self.lectura.niveles[0]
        cara = nivel.cara(u"m1", u"derecha")
        self.assertEqual(cara[u"desde"], {u"x": 0, u"y": 0})
        self.assertEqual(cara[u"hasta"], {u"x": 405, u"y": 0})


if __name__ == u"__main__":
    unittest.main()
