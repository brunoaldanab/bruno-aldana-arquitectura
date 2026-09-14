# -*- coding: utf-8 -*-
"""
Deja a mano la librería del botón y los archivos de ejemplo.

Las pruebas corren con el Python de la computadora, sin Revit: por eso solo se
importa `lib/barelevamiento`, que no conoce la API. Los archivos de
`fixtures/` los escribe `generar.mts` con el motor de verdad de la app.
"""
import io
import json
import os
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
LIB = os.path.join(os.path.dirname(AQUI), u"BA.extension", u"lib")
FIXTURES = os.path.join(AQUI, u"fixtures")

if LIB not in sys.path:
    sys.path.insert(0, LIB)


def ruta(nombre):
    return os.path.join(FIXTURES, nombre)


def texto(nombre):
    with io.open(ruta(nombre), u"r", encoding=u"utf-8") as f:
        return f.read()


def datos(nombre):
    return json.loads(texto(nombre))


CUARTO = u"cuarto-de-bruno.json"
CASA = u"casa-de-ejemplo.json"
SIN_MEDIR = u"cuarto-sin-medir.json"
