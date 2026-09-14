# -*- coding: utf-8 -*-
"""
Encontrar en el proyecto el tipo que hace falta, o fabricarlo.

Un muro, una puerta o una ventana necesitan un tipo que exista en el documento.
Acá está toda la búsqueda: primero se busca uno que ya sirva, y recién si no
hay se duplica el más parecido. Todo lo que se crea lleva el prefijo `BA `, así
se distingue de los tipos de la plantilla de Gigi y se pueden borrar juntos.

Este módulo sí toca la API de Revit, así que no se prueba con `unittest`: se
prueba abriendo el modelo.
"""
from pyrevit import DB

#: Medio centímetro, en pies: dos espesores que difieren menos son el mismo.
TOLERANCIA = 0.5 / 30.48

CATEGORIA = {
    u"puerta": DB.BuiltInCategory.OST_Doors,
    u"ventana": DB.BuiltInCategory.OST_Windows,
    u"columna": DB.BuiltInCategory.OST_Columns,
    u"dispositivos-electricos": DB.BuiltInCategory.OST_ElectricalFixtures,
    u"dispositivos-de-iluminacion": DB.BuiltInCategory.OST_LightingDevices,
    u"dispositivos-de-comunicacion": DB.BuiltInCategory.OST_CommunicationDevices,
    u"viga": DB.BuiltInCategory.OST_StructuralFraming,
    u"columna-estructural": DB.BuiltInCategory.OST_StructuralColumns,
}

#: Dónde más buscar cuando la categoría exacta no tiene ninguna familia cargada.
#: Sale de la plantilla de Gigi, que no trae columnas arquitectónicas —sí
#: estructurales— ni dispositivos de comunicación, pero sí eléctricos.
RESPALDO = {
    u"columna": [u"columna-estructural"],
    u"dispositivos-de-comunicacion": [u"dispositivos-electricos", u"dispositivos-de-iluminacion"],
    u"dispositivos-de-iluminacion": [u"dispositivos-electricos"],
    u"dispositivos-electricos": [u"dispositivos-de-iluminacion"],
}

#: Cómo se nombra cada categoría cuando hay que pedirle a Bruno que cargue una familia.
NOMBRE_LARGO = {
    u"dispositivos-electricos": u"tomacorrientes",
    u"dispositivos-de-iluminacion": u"llaves de luz",
    u"dispositivos-de-comunicacion": u"salidas de TV, red o teléfono",
    u"viga": u"vigas",
    u"columna": u"columnas arquitectónicas",
    u"puerta": u"puertas",
    u"ventana": u"ventanas",
}

#: Los nombres con que cada parámetro aparece según el idioma de la plantilla.
#: La de Bruno es la de Gigi Arruda, que está en portugués.
NOMBRES_ANCHO = [u"Width", u"Ancho", u"Largura"]
NOMBRES_ALTO = [u"Height", u"Alto", u"Altura"]
NOMBRES_PROFUNDIDAD = [u"Depth", u"Profundidad", u"Profundidade"]


class SinTipo(Exception):
    """No hay ningún tipo de esa clase en el proyecto y no se puede inventar uno."""


def simbolos(doc, categoria, con_respaldo=True):
    """Los tipos de familia cargados de esa categoría, o de la que la reemplaza.

    Un enchufe colocado con una familia de la categoría vecina sigue estando en
    el lugar exacto y con su código anotado, que es lo que Bruno necesita del
    relevamiento. Quedarse sin el punto sería peor.
    """
    encontrados = _de_categoria(doc, categoria)
    if encontrados or not con_respaldo:
        return encontrados
    for otra in RESPALDO.get(categoria, []):
        encontrados = _de_categoria(doc, otra)
        if encontrados:
            return encontrados
    return []


def _de_categoria(doc, categoria):
    bic = CATEGORIA[categoria]
    return list(
        DB.FilteredElementCollector(doc).OfCategory(bic).OfClass(DB.FamilySymbol).ToElements()
    )


#: Los parámetros donde vive el nombre según la clase de elemento.
NOMBRE_EN_PARAMETRO = [
    DB.BuiltInParameter.SYMBOL_NAME_PARAM,  # tipos de familia
    DB.BuiltInParameter.ALL_MODEL_TYPE_NAME,  # tipos de sistema
    DB.BuiltInParameter.DATUM_TEXT,  # niveles y ejes
]


def nombre_de(elemento):
    """El nombre de un elemento, probando las tres formas que hay de pedirlo.

    Leer un nombre en Revit desde Python es sorprendentemente frágil, y las dos
    pruebas de Bruno del 14/09/2026 lo mostraron una tras otra:

    1. `Element.Name.GetValue(elemento)` es el rodeo de **IronPython** y en el
       motor CPython de pyRevit revienta con "getset_descriptor".
    2. `elemento.Name` funciona en un nivel, pero **no en un tipo**: `WallType`
       y `FamilySymbol` heredan la propiedad de `ElementType`, que la vuelve a
       declarar, y el puente entre Python y .NET no la resuelve. Daba un simple
       "Name".

    Por eso acá se prueban las tres en orden y se devuelve la primera que
    conteste. Un nombre que no se puede leer devuelve una cadena vacía, que
    nunca coincide con un nombre buscado: el tipo se crea de nuevo en vez de
    tumbar el elemento.
    """
    try:
        return elemento.Name
    except Exception:
        pass
    try:
        # La forma de pedirle a Python el valor de una propiedad de .NET.
        return DB.Element.Name.__get__(elemento)
    except Exception:
        pass
    for incorporado in NOMBRE_EN_PARAMETRO:
        try:
            p = elemento.get_Parameter(incorporado)
            if p is not None:
                texto = p.AsString()
                if texto:
                    return texto
        except Exception:
            continue
    return u""


def por_nombre(elementos, nombre):
    for e in elementos:
        if nombre_de(e) == nombre:
            return e
    return None


def tipo_de_muro(doc, orden, cache):
    """El tipo de muro con ese espesor: el que ya está, o uno nuevo de una capa."""
    if orden.nombre in cache:
        return cache[orden.nombre]

    tipos = [
        t
        for t in DB.FilteredElementCollector(doc).OfClass(DB.WallType).ToElements()
        if t.Kind == DB.WallKind.Basic
    ]
    if not tipos:
        raise SinTipo(u"El proyecto no tiene ningún tipo de muro básico.")

    ya_esta = por_nombre(tipos, orden.nombre)
    if ya_esta:
        cache[orden.nombre] = ya_esta
        return ya_esta
    for t in tipos:
        if abs(t.Width - orden.espesor) < TOLERANCIA:
            cache[orden.nombre] = t
            return t

    # Ninguno sirve: se duplica el más delgado y se le pone una sola capa del espesor pedido.
    base = sorted(tipos, key=lambda t: t.Width)[0]
    nuevo = base.Duplicate(orden.nombre)
    capa = DB.CompoundStructure.CreateSingleLayerCompoundStructure(
        DB.MaterialFunctionAssignment.Structure, orden.espesor, DB.ElementId.InvalidElementId
    )
    nuevo.SetCompoundStructure(capa)
    cache[orden.nombre] = nuevo
    return nuevo


def tipo_de_abertura(doc, orden, cache):
    """El tipo de puerta o ventana con esa medida, duplicando el más parecido."""
    if orden.nombre in cache:
        return cache[orden.nombre]

    cargados = simbolos(doc, orden.categoria)
    if not cargados:
        raise SinTipo(
            u"El proyecto no tiene ninguna familia de %s. Cargá una con Insertar → Cargar familia y volvé a "
            u"apretar el botón." % NOMBRE_LARGO[orden.categoria]
        )

    ya_esta = por_nombre(cargados, orden.nombre)
    if ya_esta:
        cache[orden.nombre] = ya_esta
        return _activado(ya_esta)

    parecido = _el_mas_parecido(cargados, orden.ancho, orden.alto)
    nuevo = parecido.Duplicate(orden.nombre)
    _cargar(nuevo, NOMBRES_ANCHO, DB.BuiltInParameter.GENERIC_WIDTH, orden.ancho)
    _cargar(nuevo, NOMBRES_ALTO, DB.BuiltInParameter.GENERIC_HEIGHT, orden.alto)
    cache[orden.nombre] = nuevo
    return _activado(nuevo)


def tipo_de_columna(doc, orden, cache):
    if orden.nombre in cache:
        return cache[orden.nombre]
    cargados = simbolos(doc, u"columna")
    if not cargados:
        raise SinTipo(
            u"El proyecto no tiene ninguna familia de columnas arquitectónicas. Cargá una con Insertar → "
            u"Cargar familia y volvé a apretar el botón."
        )
    ya_esta = por_nombre(cargados, orden.nombre)
    if ya_esta:
        cache[orden.nombre] = ya_esta
        return _activado(ya_esta)
    nuevo = cargados[0].Duplicate(orden.nombre)
    _cargar(nuevo, NOMBRES_ANCHO, DB.BuiltInParameter.GENERIC_WIDTH, orden.ancho)
    _cargar(nuevo, NOMBRES_PROFUNDIDAD, None, orden.profundidad)
    cache[orden.nombre] = nuevo
    return _activado(nuevo)


def tipo_electrico(doc, categoria, cache):
    """Cualquier familia de esa categoría sirve: el relevamiento marca dónde va, no cuál es."""
    if categoria in cache:
        return cache[categoria]
    cargados = simbolos(doc, categoria)
    if not cargados:
        raise SinTipo(
            u"El proyecto no tiene ninguna familia de %s. Cargá una con Insertar → Cargar familia y volvé a "
            u"apretar el botón." % NOMBRE_LARGO.get(categoria, categoria.replace(u"-", u" "))
        )
    cache[categoria] = cargados[0]
    return _activado(cargados[0])


def tipo_de_viga(doc, cache):
    if u"viga" in cache:
        return cache[u"viga"]
    cargados = simbolos(doc, u"viga")
    if not cargados:
        raise SinTipo(
            u"El proyecto no tiene ninguna familia de vigas. Cargá una con Insertar → Cargar familia y volvé "
            u"a apretar el botón."
        )
    cache[u"viga"] = cargados[0]
    return _activado(cargados[0])


def tipo_por_defecto(doc, clase, que_es):
    """El primer tipo de piso o de cielo raso que tenga el proyecto."""
    tipos = list(DB.FilteredElementCollector(doc).OfClass(clase).ToElements())
    tipos = [t for t in tipos if _es_usable(t)]
    if not tipos:
        raise SinTipo(u"El proyecto no tiene ningún tipo de %s." % que_es)
    return tipos[0]


def _es_usable(tipo):
    """Los tipos de cielo raso con familia de "cortina" o nulos no se pueden usar."""
    try:
        return tipo.FamilyName is not None
    except Exception:
        return True


def _activado(simbolo):
    """Un tipo de familia no se puede insertar si no está activado."""
    if not simbolo.IsActive:
        simbolo.Activate()
    return simbolo


def _el_mas_parecido(simbolos_, ancho, alto):
    def distancia(s):
        a = _leer(s, NOMBRES_ANCHO, DB.BuiltInParameter.GENERIC_WIDTH)
        h = _leer(s, NOMBRES_ALTO, DB.BuiltInParameter.GENERIC_HEIGHT)
        if a is None or h is None:
            return 1e9
        return abs(a - ancho) + abs(h - alto)

    return sorted(simbolos_, key=distancia)[0]


def _parametro(elemento, nombres, incorporado):
    if incorporado is not None:
        p = elemento.get_Parameter(incorporado)
        if p is not None and not p.IsReadOnly:
            return p
    for n in nombres:
        p = elemento.LookupParameter(n)
        if p is not None and not p.IsReadOnly:
            return p
    return None


def _leer(elemento, nombres, incorporado):
    p = _parametro(elemento, nombres, incorporado)
    return p.AsDouble() if p is not None else None


def _cargar(elemento, nombres, incorporado, valor):
    p = _parametro(elemento, nombres, incorporado)
    if p is not None:
        p.Set(valor)
        return True
    return False
