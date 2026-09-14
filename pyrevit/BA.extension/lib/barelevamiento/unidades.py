# -*- coding: utf-8 -*-
"""
Centímetros a pies y pantalla a Revit.

El archivo del teléfono viene en centímetros con `y` hacia abajo, como se ve en
la pantalla. Revit trabaja en pies con `y` hacia arriba. Toda la conversión vive
acá y en ningún otro lado: si esto está bien, el resto del botón no vuelve a
pensar en unidades.
"""

CM_POR_PIE = 30.48

#: Debajo de esto dos medidas son la misma. Medio centímetro, como el plan.
TOLERANCIA_CM = 0.5


def pies(cm):
    """Centímetros a pies."""
    return float(cm) / CM_POR_PIE


def centimetros(pies_):
    """Pies a centímetros. Solo para los mensajes del informe."""
    return float(pies_) * CM_POR_PIE


def punto(p):
    """Un punto de la pantalla a coordenadas de Revit, en pies.

    La `y` se da vuelta porque en la pantalla crece hacia abajo.
    """
    return (pies(p["x"]), pies(-p["y"]))


def vector(v):
    """Un vector se transforma igual que un punto: la `y` cambia de signo.

    Por eso una cara "izquierda" sigue cayendo del lado correcto en Revit sin
    tener que razonarlo de nuevo en cada elemento.
    """
    return (float(v["x"]), -float(v["y"]))


def contorno(puntos):
    """Una lista de puntos de la pantalla, en el mismo orden."""
    return [punto(p) for p in puntos]


def unitario(a, b):
    """Dirección de `a` a `b`, ya en coordenadas de Revit y de largo 1."""
    dx = b[0] - a[0]
    dy = b[1] - a[1]
    largo = (dx * dx + dy * dy) ** 0.5
    return (0.0, 0.0) if largo == 0 else (dx / largo, dy / largo)


def normal_por_defecto(u):
    """Hacia dónde mira un elemento recién insertado en un muro que va en `u`.

    Revit orienta lo hospedado con la dirección de la curva girada un cuarto de
    vuelta **en sentido antihorario**: un muro que va hacia +X deja su cara
    mirando hacia +Y. No es una deducción: se midió adentro de Revit el
    14/09/2026, creando un muro y una puerta de prueba, después de que la
    primera corrida dejara la puerta y los enchufes mirando para afuera del
    cuarto.
    """
    return (-u[1], u[0])


def normal_cara(u, cara):
    """La normal de la cara "izquierda" o "derecha" del muro, en Revit.

    En la pantalla la cara izquierda queda del lado de `(uy, -ux)`, con la `y`
    hacia abajo; al dar vuelta la `y` eso se convierte en `(uy, ux)`, que es
    exactamente la normal por defecto de Revit. De ahí la regla de una sola
    línea: **la cara izquierda es la que Revit usa sola, la derecha va
    invertida.**
    """
    n = normal_por_defecto(u)
    return n if cara == "izquierda" else (-n[0], -n[1])


def nombre_tipo_muro(espesor_cm):
    """`BA Muro 15`: el prefijo separa lo creado por el botón de la plantilla de Gigi."""
    return u"BA Muro %s" % _numero(espesor_cm)


def nombre_tipo_abertura(ancho_cm, alto_cm):
    """`BA 80 x 210`, en centímetros, que es como Bruno las nombra."""
    return u"BA %s x %s" % (_numero(ancho_cm), _numero(alto_cm))


def nombre_tipo_columna(ancho_cm, profundidad_cm):
    return u"BA Columna %s x %s" % (_numero(ancho_cm), _numero(profundidad_cm))


def _numero(valor):
    """Sin decimales cuando no hacen falta: 15, no 15.0."""
    entero = int(round(float(valor)))
    return str(entero) if abs(float(valor) - entero) < 0.05 else ("%.1f" % float(valor))
