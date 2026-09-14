# -*- coding: utf-8 -*-
"""
El texto que ve Bruno cuando el botón termina.

Además de qué se creó y qué no, repite **los controles que traía el archivo**:
las cotas que quedaron sin medir y los ambientes que no cierran. Un muro
dibujado a ojo entra a Revit con la medida a ojo, y él tiene que saber cuáles
son antes de ponerse a diseñar encima.
"""

#: Cómo se nombra cada clase de orden en el informe: singular y plural.
NOMBRES = {
    u"OrdenNivel": (u"nivel", u"niveles"),
    u"OrdenTipoMuro": (u"tipo de muro", u"tipos de muro"),
    u"OrdenTipoAbertura": (u"tipo de abertura", u"tipos de abertura"),
    u"OrdenTipoColumna": (u"tipo de columna", u"tipos de columna"),
    u"OrdenMuro": (u"muro", u"muros"),
    u"OrdenAbertura": (u"abertura", u"puertas y ventanas"),
    u"OrdenVano": (u"vano", u"vanos"),
    u"OrdenColumna": (u"columna", u"columnas"),
    u"OrdenAmbiente": (u"ambiente", u"ambientes"),
    u"OrdenPiso": (u"piso", u"pisos"),
    u"OrdenTecho": (u"techo", u"techos y bandejas"),
    u"OrdenMoldura": (u"moldura", u"molduras"),
    u"OrdenViga": (u"viga", u"vigas"),
    u"OrdenElectrico": (u"punto eléctrico", u"puntos eléctricos"),
}

#: El orden en que se listan en el informe, que es el orden en que se crean.
ORDEN_DE_CLASES = list(NOMBRES.keys())


class Resultado(object):
    """Lo que fue pasando mientras se creaban los elementos.

    El constructor lo va llenando; el informe solo lo lee. Así el texto se puede
    probar sin Revit: se arma un resultado a mano y se compara.
    """

    def __init__(self):
        self.creados = []
        self.fallidos = []
        self.avisos = []

    def creado(self, clase, nombre=u""):
        self.creados.append((clase, nombre))

    def fallo(self, clase, nombre, motivo):
        self.fallidos.append((clase, nombre, _limpio(motivo)))

    def aviso(self, texto):
        self.avisos.append(texto)

    def cuenta(self, clase):
        return len([c for c, _ in self.creados if c == clase])

    @property
    def total(self):
        return len(self.creados)


def _limpio(motivo):
    """Un renglón: los errores de Revit vienen con saltos de línea y no entran en la lista."""
    texto = u" ".join(unicode_(motivo).split())
    return texto if len(texto) <= 200 else texto[:197] + u"..."


def unicode_(valor):
    try:
        return valor if isinstance(valor, type(u"")) else u"%s" % valor
    except Exception:
        return u"(sin motivo)"


def texto(plan, resultado):
    """El informe completo, en renglones de markdown que pyRevit muestra tal cual."""
    lineas = []
    proyecto = plan.proyecto or {}
    lineas.append(u"# %s" % (proyecto.get(u"nombre") or u"Relevamiento"))
    fecha = proyecto.get(u"fechaRelevamiento")
    if fecha:
        lineas.append(u"Relevado el %s." % fecha_legible(fecha))
    lineas.append(u"")

    lineas.append(u"## Lo que se creó")
    if resultado.total == 0:
        lineas.append(u"No se creó ningún elemento.")
    for clase in ORDEN_DE_CLASES:
        cuantos = resultado.cuenta(clase)
        if cuantos:
            singular, plural = NOMBRES[clase]
            lineas.append(u"- %s %s" % (cuantos, singular if cuantos == 1 else plural))

    if resultado.fallidos:
        lineas.append(u"")
        lineas.append(u"## Lo que no se pudo crear")
        for clase, nombre, motivo in resultado.fallidos:
            singular = NOMBRES.get(clase, (clase, clase))[0]
            etiqueta = u"%s %s" % (singular, nombre) if nombre else singular
            lineas.append(u"- **%s** — %s" % (etiqueta, motivo))

    if resultado.avisos:
        lineas.append(u"")
        lineas.append(u"## Avisos")
        for aviso in resultado.avisos:
            lineas.append(u"- %s" % aviso)

    lineas.extend(_controles(plan.controles))
    return u"\n".join(lineas)


def _controles(controles):
    """Los errores y las medidas pendientes que ya traía el archivo."""
    errores = [c for c in controles if c.get(u"tipo") == u"error"]
    pendientes = [c for c in controles if c.get(u"tipo") == u"pendiente"]
    lineas = []
    if errores:
        lineas.append(u"")
        lineas.append(u"## Problemas del relevamiento")
        for c in errores:
            lineas.append(u"- %s" % c.get(u"mensaje"))
    if pendientes:
        lineas.append(u"")
        lineas.append(u"## Medidas que quedaron a ojo (%s)" % len(pendientes))
        lineas.append(u"Estas entraron a Revit con el valor dibujado, no con el medido.")
        for c in pendientes[:40]:
            lineas.append(u"- %s" % c.get(u"mensaje"))
        if len(pendientes) > 40:
            lineas.append(u"- ...y %s más." % (len(pendientes) - 40))
    return lineas


def fecha_legible(iso):
    """De 2026-09-14 a 14/09/2026, que es como Bruno escribe las fechas."""
    partes = (iso or u"").split(u"-")
    return u"/".join(reversed(partes)) if len(partes) == 3 else iso
