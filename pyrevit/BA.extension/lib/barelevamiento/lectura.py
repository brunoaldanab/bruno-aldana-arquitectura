# -*- coding: utf-8 -*-
"""
Leer el archivo del teléfono y decir en castellano qué le falta.

Todo lo que el botón da por sentado más adelante se comprueba acá: el formato,
la versión, las unidades y que las referencias entre elementos existan. Un
archivo que pasa por esta puerta ya no rompe al plan ni al constructor, así que
`plan.py` no vuelve a preguntar si algo está o no está.
"""
import io
import json

FORMATO = u"ba-relevamiento"
VERSION = 2


class ErrorDeArchivo(Exception):
    """Un archivo que no se puede usar. El mensaje va tal cual a la pantalla."""


class Lectura(object):
    """El relevamiento ya validado, con los índices que necesita el plan."""

    def __init__(self, datos):
        self.datos = datos
        self.proyecto = datos[u"proyecto"]
        self.niveles = [NivelLeido(n, _calculado_de(datos, n[u"id"])) for n in datos[u"niveles"]]

    @property
    def nombre(self):
        return self.proyecto.get(u"nombre") or u"Relevamiento"

    @property
    def fecha(self):
        return self.proyecto.get(u"fechaRelevamiento") or u""

    @property
    def controles(self):
        """Las cotas sin medir y los ambientes que no cierran, de todos los niveles."""
        return [c for n in self.niveles for c in n.controles]


class NivelLeido(object):
    def __init__(self, nivel, calculado):
        self.datos = nivel
        self.id = nivel[u"id"]
        self.nombre = nivel[u"nombre"]
        self.cota_piso = nivel[u"cotaPiso"]
        self.altura_general = nivel[u"alturaGeneral"][u"valor"]
        self.nodos = {n[u"id"]: n for n in nivel[u"nodos"]}
        self.muros = nivel[u"muros"]
        self.aberturas = nivel[u"aberturas"]
        self.columnas = nivel[u"columnas"]
        self.electricos = nivel.get(u"electricos", [])
        self.ambientes = nivel[u"ambientes"]
        self.techos = nivel[u"techos"]
        self.molduras = nivel[u"molduras"]
        self.vigas = nivel[u"vigas"]
        self.muro_por_id = {m[u"id"]: m for m in self.muros}
        self.geometria_muro = {m[u"id"]: m for m in calculado.get(u"muros", [])}
        self.geometria_abertura = {a[u"id"]: a for a in calculado.get(u"aberturas", [])}
        self.geometria_electrico = {e[u"id"]: e for e in calculado.get(u"electricos", [])}
        self.geometria_ambiente = {a[u"id"]: a for a in calculado.get(u"ambientes", [])}
        self.geometria_cara = {(c[u"muroId"], c[u"cara"]): c for c in calculado.get(u"caras", [])}
        self.controles = calculado.get(u"controles", [])

    def cara(self, muro_id, cara):
        """Las dos esquinas de una cara del muro, tal como las resolvió el motor."""
        return self.geometria_cara.get((muro_id, cara))

    def altura_de_muro(self, muro):
        """La del muro si la midió; si no, la altura general del nivel."""
        altura = muro.get(u"altura")
        return altura[u"valor"] if altura else self.altura_general


def _calculado_de(datos, nivel_id):
    for n in datos.get(u"calculado", {}).get(u"niveles", []):
        if n[u"id"] == nivel_id:
            return n
    return {}


def leer_texto(texto):
    """Valida el contenido del archivo y devuelve una `Lectura`.

    Levanta `ErrorDeArchivo` con el motivo escrito para Bruno, no para un
    programador: el botón lo muestra tal cual.
    """
    try:
        datos = json.loads(texto)
    except ValueError:
        raise ErrorDeArchivo(u"El archivo no se puede leer: no es un JSON válido.")
    if not isinstance(datos, dict):
        raise ErrorDeArchivo(u"El archivo no tiene la forma de un relevamiento.")

    if datos.get(u"formato") != FORMATO:
        raise ErrorDeArchivo(u"Este archivo no es un relevamiento de la app.")
    version = datos.get(u"version")
    if version != VERSION:
        raise ErrorDeArchivo(
            u"El relevamiento es de la versión %s y el botón lee la %s. Hay que exportarlo de nuevo desde la app."
            % (version, VERSION)
        )
    if datos.get(u"unidades") != u"cm":
        raise ErrorDeArchivo(u"El relevamiento tiene que venir en centímetros.")
    if not datos.get(u"niveles"):
        raise ErrorDeArchivo(u"El relevamiento no tiene ningún nivel.")
    if not datos.get(u"calculado"):
        raise ErrorDeArchivo(
            u"Al archivo le falta la geometría calculada. Hay que exportarlo desde la app, no copiarlo a mano."
        )

    for nivel in datos[u"niveles"]:
        _revisar_nivel(nivel, datos[u"calculado"])
    return Lectura(datos)


def leer_archivo(ruta):
    with io.open(ruta, u"r", encoding=u"utf-8") as f:
        return leer_texto(f.read())


def _revisar_nivel(nivel, calculado):
    nombre = nivel.get(u"nombre") or nivel.get(u"id")
    geometria = _calculado_de({u"calculado": calculado}, nivel[u"id"])
    if not geometria:
        raise ErrorDeArchivo(u"Al nivel %s le falta la geometría calculada." % nombre)

    nodos = set(n[u"id"] for n in nivel[u"nodos"])
    muros = set(m[u"id"] for m in nivel[u"muros"])
    ambientes = set(a[u"id"] for a in nivel[u"ambientes"])
    con_geometria = set(m[u"id"] for m in geometria.get(u"muros", []))

    for m in nivel[u"muros"]:
        if m[u"desde"] not in nodos or m[u"hasta"] not in nodos:
            raise ErrorDeArchivo(u"El muro %s del nivel %s apunta a una esquina que no existe." % (m[u"id"], nombre))
        if m[u"id"] not in con_geometria:
            raise ErrorDeArchivo(u"Al muro %s del nivel %s le falta su geometría calculada." % (m[u"id"], nombre))
    for a in nivel[u"aberturas"]:
        if a[u"muroId"] not in muros:
            raise ErrorDeArchivo(u"La abertura %s no está en ningún muro." % a[u"codigo"])
    for e in nivel.get(u"electricos", []):
        if e[u"muroId"] not in muros:
            raise ErrorDeArchivo(u"El punto eléctrico %s no está en ningún muro." % e[u"codigo"])
    for t in nivel[u"techos"]:
        if t.get(u"ambienteId") and t[u"ambienteId"] not in ambientes:
            raise ErrorDeArchivo(u"Una zona de techo apunta a un ambiente que no existe.")
    for m in nivel[u"molduras"]:
        if m[u"ambienteId"] not in ambientes:
            raise ErrorDeArchivo(u"Una moldura apunta a un ambiente que no existe.")
