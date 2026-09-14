# -*- coding: utf-8 -*-
"""
El catálogo eléctrico del botón tiene que decir lo mismo que el de la app.

`plan.py` repite la tabla de tipos de `src/lib/plano/electricos.ts` porque son
dos lenguajes distintos. Esta prueba compara las dos: si mañana se agrega un
tipo de enchufe en la app y nadie lo agrega acá, la prueba lo canta en vez de
que el punto entre a Revit con la familia equivocada.
"""
import io
import os
import re
import unittest

import contexto

from barelevamiento import plan as planificador

ELECTRICOS_TS = os.path.join(
    os.path.dirname(os.path.dirname(contexto.AQUI)), u"src", u"lib", u"plano", u"electricos.ts"
)

LINEA = re.compile(r'\{\s*clave:\s*"([a-z\-]+)",\s*familia:\s*"([a-z]+)"')


def catalogo_de_la_app():
    with io.open(ELECTRICOS_TS, u"r", encoding=u"utf-8") as f:
        return dict(LINEA.findall(f.read()))


class Catalogo(unittest.TestCase):
    def setUp(self):
        self.app = catalogo_de_la_app()

    def test_la_app_tiene_los_veintidos_tipos_que_pidio_bruno(self):
        self.assertEqual(len(self.app), 22)

    def test_cada_tipo_de_la_app_esta_en_el_boton_con_la_misma_familia(self):
        self.assertEqual(self.app, dict(planificador.FAMILIA_DE_PUNTO))

    def test_cada_familia_tiene_su_categoria_de_revit(self):
        for familia in set(self.app.values()):
            self.assertIn(familia, planificador.CATEGORIA_ELECTRICA)


if __name__ == u"__main__":
    unittest.main()
