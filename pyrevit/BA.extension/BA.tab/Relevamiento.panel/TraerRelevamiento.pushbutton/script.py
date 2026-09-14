# -*- coding: utf-8 -*-
#! python3
"""
Trae a Revit el relevamiento que Bruno hizo en el teléfono.

Abre el archivo `ba-relevamiento` que sale de la app, lo revisa, muestra lo que
va a crear y —si Bruno da el visto bueno— lo crea en el proyecto abierto. Al
terminar deja un informe con lo que entró, lo que no pudo entrar y las medidas
que quedaron a ojo.

No modifica ni borra nada de lo que ya existía en el modelo: solo agrega.
"""
from pyrevit import forms, revit, script

from barelevamiento import informe as informes
from barelevamiento import plan as planificador
from barelevamiento.lectura import ErrorDeArchivo, leer_archivo
from barevit.constructor import Constructor

salida = script.get_output()
doc = revit.doc


def resumen(plan):
    """Qué se va a crear, para que Bruno diga que sí antes de tocar el modelo."""
    lineas = []
    for clase in informes.ORDEN_DE_CLASES:
        ordenes = [o for o in plan.ordenes if type(o).__name__ == clase]
        if ordenes:
            singular, plural = informes.NOMBRES[clase]
            lineas.append(u"%s %s" % (len(ordenes), singular if len(ordenes) == 1 else plural))
    return u"\n".join(lineas)


def principal():
    if doc is None or doc.IsFamilyDocument:
        forms.alert(u"Abrí primero el proyecto de Revit donde querés traer el relevamiento.", title=u"Traer relevamiento")
        return

    ruta = forms.pick_file(file_ext=u"json", title=u"Elegí el relevamiento que sale de la app")
    if not ruta:
        return

    try:
        lectura = leer_archivo(ruta)
    except ErrorDeArchivo as e:
        forms.alert(u"%s" % e, title=u"El archivo no sirve")
        return
    except Exception as e:
        forms.alert(u"No se pudo abrir el archivo: %s" % e, title=u"El archivo no sirve")
        return

    plan = planificador.armar(lectura)
    if not len(plan):
        forms.alert(u"El relevamiento está vacío: no hay nada para crear.", title=u"Traer relevamiento")
        return

    seguir = forms.alert(
        u"%s, relevado el %s.\n\nSe va a crear:\n\n%s\n\nNada de lo que ya está en el modelo se toca."
        % (lectura.nombre, informes.fecha_legible(lectura.fecha), resumen(plan)),
        title=u"Traer relevamiento",
        yes=True,
        no=True,
    )
    if not seguir:
        return

    resultado = informes.Resultado()
    with forms.ProgressBar(title=u"Trayendo el relevamiento...", indeterminate=True):
        try:
            Constructor(doc, plan, resultado).construir()
        except Exception as e:
            salida.print_md(u"# No se pudo traer el relevamiento\n\n%s" % e)
            return

    salida.print_md(informes.texto(plan, resultado))


principal()
