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
}

#: Los nombres con que cada parámetro aparece según el idioma de la plantilla.
#: La de Bruno es la de Gigi Arruda, que está en portugués.
NOMBRES_ANCHO = [u"Width", u"Ancho", u"Largura"]
NOMBRES_ALTO = [u"Height", u"Alto", u"Altura"]
NOMBRES_PROFUNDIDAD = [u"Depth", u"Profundidad", u"Profundidade"]


class SinTipo(Exception):
    """No hay ningún tipo de esa clase en el proyecto y no se puede inventar uno."""


def simbolos(doc, categoria):
    """Todos los tipos de familia cargados de esa categoría."""
    bic = CATEGORIA[categoria]
    return list(
        DB.FilteredElementCollector(doc).OfCategory(bic).OfClass(DB.FamilySymbol).ToElements()
    )


def por_nombre(elementos, nombre):
    for e in elementos:
        if DB.Element.Name.GetValue(e) == nombre:
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
            u"No hay ninguna familia de %s cargada en el proyecto." % (u"puertas" if orden.categoria == u"puerta" else u"ventanas")
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
        raise SinTipo(u"No hay ninguna familia de columnas arquitectónicas cargada.")
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
        raise SinTipo(u"No hay ninguna familia de la categoría %s cargada." % categoria.replace(u"-", u" "))
    cache[categoria] = cargados[0]
    return _activado(cargados[0])


def tipo_de_viga(doc, cache):
    if u"viga" in cache:
        return cache[u"viga"]
    cargados = simbolos(doc, u"viga")
    if not cargados:
        raise SinTipo(u"No hay ninguna familia de vigas cargada.")
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
