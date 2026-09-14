# -*- coding: utf-8 -*-
"""
El relevamiento convertido en una lista de órdenes.

Acá se resuelve todo lo que se puede equivocar —unidades, coordenadas, hacia
dónde abre una puerta, qué tipo hay que buscar— y **no se toca la API de Revit**.
El constructor solo ejecuta lo que sale de acá, así que el grueso del riesgo se
prueba con `unittest` en la computadora, sin abrir Revit.

La geometría no se vuelve a calcular: el bloque `calculado` del archivo ya trae
las esquinas resueltas, el centro de cada abertura sobre el eje del muro y el
contorno interior de cada ambiente. El motor de la app es la única fuente.
"""
import math

from . import unidades

#: El orden en que se crean las cosas: cada etapa necesita la anterior hecha.
ETAPAS = [
    u"niveles",
    u"tipos",
    u"muros",
    u"aberturas",
    u"vanos",
    u"columnas",
    u"ambientes",
    u"techos",
    u"molduras",
    u"vigas",
    u"electricos",
]

#: Con qué categoría de Revit entra cada familia del catálogo eléctrico.
CATEGORIA_ELECTRICA = {
    u"tomacorriente": u"dispositivos-electricos",
    u"interruptor": u"dispositivos-de-iluminacion",
    u"mixto": u"dispositivos-electricos",
    u"datos": u"dispositivos-de-comunicacion",
    u"fuerza": u"dispositivos-electricos",
}

#: La familia del catálogo a la que pertenece cada tipo de punto. Es la misma
#: tabla de `src/lib/plano/electricos.ts`: si allá se agrega un tipo, va acá.
FAMILIA_DE_PUNTO = {
    u"toma-simple": u"tomacorriente",
    u"toma-doble": u"tomacorriente",
    u"toma-triple": u"tomacorriente",
    u"toma-usb": u"tomacorriente",
    u"toma-mesada": u"tomacorriente",
    u"toma-piso": u"tomacorriente",
    u"int-simple": u"interruptor",
    u"int-doble": u"interruptor",
    u"int-triple": u"interruptor",
    u"int-conmutador": u"interruptor",
    u"int-dimmer": u"interruptor",
    u"int-sensor": u"interruptor",
    u"mixto-int-toma": u"mixto",
    u"datos-tv": u"datos",
    u"datos-red": u"datos",
    u"datos-red-doble": u"datos",
    u"datos-telefono": u"datos",
    u"fuerza-aire": u"fuerza",
    u"fuerza-termo": u"fuerza",
    u"fuerza-cocina": u"fuerza",
    u"fuerza-lavadora": u"fuerza",
    u"fuerza-timbre": u"fuerza",
}


class Orden(object):
    """Una cosa para crear en Revit, con todo ya calculado en pies."""

    etapa = None

    def __init__(self, **campos):
        self.__dict__.update(campos)

    def __repr__(self):
        campos = u", ".join(u"%s=%r" % (k, v) for k, v in sorted(self.__dict__.items()))
        return u"%s(%s)" % (type(self).__name__, campos)


def _orden(nombre_clase, etapa):
    return type(str(nombre_clase), (Orden,), {u"etapa": etapa})


OrdenNivel = _orden(u"OrdenNivel", u"niveles")
OrdenTipoMuro = _orden(u"OrdenTipoMuro", u"tipos")
OrdenTipoAbertura = _orden(u"OrdenTipoAbertura", u"tipos")
OrdenTipoColumna = _orden(u"OrdenTipoColumna", u"tipos")
OrdenMuro = _orden(u"OrdenMuro", u"muros")
OrdenAbertura = _orden(u"OrdenAbertura", u"aberturas")
OrdenVano = _orden(u"OrdenVano", u"vanos")
OrdenColumna = _orden(u"OrdenColumna", u"columnas")
OrdenAmbiente = _orden(u"OrdenAmbiente", u"ambientes")
OrdenPiso = _orden(u"OrdenPiso", u"ambientes")
OrdenTecho = _orden(u"OrdenTecho", u"techos")
OrdenMoldura = _orden(u"OrdenMoldura", u"molduras")
OrdenViga = _orden(u"OrdenViga", u"vigas")
OrdenElectrico = _orden(u"OrdenElectrico", u"electricos")


class Plan(object):
    def __init__(self, proyecto, ordenes, controles):
        self.proyecto = proyecto
        self.ordenes = ordenes
        self.controles = controles

    def de_etapa(self, etapa):
        return [o for o in self.ordenes if o.etapa == etapa]

    def por_clase(self, clase):
        return [o for o in self.ordenes if isinstance(o, clase)]

    def __len__(self):
        return len(self.ordenes)


def armar(lectura):
    """De una `Lectura` a un `Plan`. No toca Revit ni el disco."""
    ordenes = []
    for nivel in lectura.niveles:
        ordenes.extend(_ordenes_de_nivel(nivel))
    ordenes.sort(key=lambda o: ETAPAS.index(o.etapa))
    return Plan(lectura.proyecto, ordenes, lectura.controles)


def _ordenes_de_nivel(nivel):
    ordenes = [OrdenNivel(nivel_id=nivel.id, nombre=nivel.nombre, elevacion=unidades.pies(nivel.cota_piso))]
    ordenes.extend(_tipos(nivel))
    ordenes.extend(_muros(nivel))
    ordenes.extend(_aberturas(nivel))
    ordenes.extend(_columnas(nivel))
    ordenes.extend(_ambientes(nivel))
    ordenes.extend(_techos(nivel))
    ordenes.extend(_molduras(nivel))
    ordenes.extend(_vigas(nivel))
    ordenes.extend(_electricos(nivel))
    return ordenes


def _tipos(nivel):
    """Un tipo por cada medida distinta, sin repetir: los duplicados ensucian el proyecto."""
    ordenes = []
    for espesor in sorted(set(m[u"espesor"][u"valor"] for m in nivel.muros)):
        ordenes.append(
            OrdenTipoMuro(nombre=unidades.nombre_tipo_muro(espesor), espesor=unidades.pies(espesor), espesor_cm=espesor)
        )
    vistas = set()
    for a in nivel.aberturas:
        if a[u"tipo"] == u"vano":
            continue
        clave = (a[u"tipo"], a[u"ancho"][u"valor"], a[u"alto"][u"valor"])
        if clave in vistas:
            continue
        vistas.add(clave)
        ordenes.append(
            OrdenTipoAbertura(
                nombre=unidades.nombre_tipo_abertura(a[u"ancho"][u"valor"], a[u"alto"][u"valor"]),
                categoria=a[u"tipo"],
                ancho=unidades.pies(a[u"ancho"][u"valor"]),
                alto=unidades.pies(a[u"alto"][u"valor"]),
                ancho_cm=a[u"ancho"][u"valor"],
                alto_cm=a[u"alto"][u"valor"],
            )
        )
    vistas = set()
    for c in nivel.columnas:
        clave = (c[u"ancho"][u"valor"], c[u"profundidad"][u"valor"])
        if clave in vistas:
            continue
        vistas.add(clave)
        ordenes.append(
            OrdenTipoColumna(
                nombre=unidades.nombre_tipo_columna(clave[0], clave[1]),
                ancho=unidades.pies(clave[0]),
                profundidad=unidades.pies(clave[1]),
            )
        )
    return ordenes


def _muros(nivel):
    ordenes = []
    for m in nivel.muros:
        g = nivel.geometria_muro[m[u"id"]]
        espesor = m[u"espesor"][u"valor"]
        ordenes.append(
            OrdenMuro(
                id=m[u"id"],
                nivel_id=nivel.id,
                tipo=unidades.nombre_tipo_muro(espesor),
                espesor_cm=espesor,
                inicio=unidades.punto(g[u"inicio"]),
                fin=unidades.punto(g[u"fin"]),
                largo_cm=g[u"largo"],
                altura=unidades.pies(nivel.altura_de_muro(m)),
            )
        )
    return ordenes


def direccion_muro(nivel, muro_id):
    """La dirección del muro en Revit, de "desde" a "hasta" y de largo 1."""
    g = nivel.geometria_muro[muro_id]
    return unidades.unitario(unidades.punto(g[u"inicio"]), unidades.punto(g[u"fin"]))


def _aberturas(nivel):
    ordenes = []
    for a in nivel.aberturas:
        g = nivel.geometria_abertura[a[u"id"]]
        campos = dict(
            id=a[u"id"],
            codigo=a[u"codigo"],
            nivel_id=nivel.id,
            muro_id=a[u"muroId"],
            punto=unidades.punto(g[u"centro"]),
            direccion=direccion_muro(nivel, a[u"muroId"]),
            ancho=unidades.pies(a[u"ancho"][u"valor"]),
            alto=unidades.pies(a[u"alto"][u"valor"]),
            antepecho=unidades.pies(a[u"antepecho"][u"valor"]),
            notas=a.get(u"notas") or u"",
        )
        if a[u"tipo"] == u"vano":
            ordenes.append(OrdenVano(**campos))
            continue
        campos.update(
            categoria=a[u"tipo"],
            tipo=unidades.nombre_tipo_abertura(a[u"ancho"][u"valor"], a[u"alto"][u"valor"]),
            apertura=a.get(u"apertura"),
            invertir_cara=_invertir_cara(a),
            invertir_mano=_invertir_mano(a),
        )
        ordenes.append(OrdenAbertura(**campos))
    return ordenes


def _invertir_cara(abertura):
    """Una puerta que abre hacia la cara izquierda hay que darla vuelta.

    Revit inserta lo hospedado mirando hacia la normal por defecto del muro, que
    es exactamente la cara "derecha" de la pantalla (ver `unidades.normal_cara`).
    Si no se cargó hacia dónde abre, no se toca nada: darla vuelta a ciegas es
    peor que dejarla como la puso Revit.
    """
    return abertura.get(u"abreHacia") == u"izquierda"


def _invertir_mano(abertura):
    """La bisagra del lado del nodo "hasta" es la que hay que espejar.

    La referencia es la puerta estándar de Revit, que trae la bisagra del lado
    del arranque del muro. Es lo único de la orientación que no se puede probar
    sin Revit: queda para la prueba de Bruno adentro del modelo.
    """
    return abertura.get(u"bisagra") == u"fin"


def _columnas(nivel):
    ordenes = []
    for c in nivel.columnas:
        altura = c.get(u"altura")
        ordenes.append(
            OrdenColumna(
                id=c[u"id"],
                nivel_id=nivel.id,
                tipo=unidades.nombre_tipo_columna(c[u"ancho"][u"valor"], c[u"profundidad"][u"valor"]),
                punto=unidades.punto(c),
                # En la pantalla la `y` va al revés, así que un giro horario allá
                # es antihorario acá: el ángulo cambia de signo.
                rotacion=-math.radians(c.get(u"rotacion") or 0),
                altura=unidades.pies(altura[u"valor"] if altura else nivel.altura_general),
            )
        )
    return ordenes


def _ambientes(nivel):
    ordenes = []
    for a in nivel.ambientes:
        g = nivel.geometria_ambiente.get(a[u"id"])
        if not g:
            continue
        ordenes.append(
            OrdenAmbiente(
                id=a[u"id"],
                nivel_id=nivel.id,
                nombre=a[u"nombre"] or a[u"id"],
                punto=unidades.punto(g[u"puntoInterior"]),
                superficie_m2=g[u"superficie"],
            )
        )
        ordenes.append(
            OrdenPiso(
                id=a[u"id"],
                nivel_id=nivel.id,
                nombre=a[u"nombre"] or a[u"id"],
                contorno=unidades.contorno(g[u"contorno"]),
                # Un piso más abajo que el nivel lleva desnivel negativo, como en la app.
                desnivel=unidades.pies(a.get(u"desnivelPiso") or 0),
            )
        )
    return ordenes


def _techos(nivel):
    """Primero las zonas madre y después sus bandejas, que se apoyan en ellas."""
    ordenes = []
    for t in sorted(nivel.techos, key=lambda z: z.get(u"padreId") is not None):
        ordenes.append(
            OrdenTecho(
                id=t[u"id"],
                nivel_id=nivel.id,
                ambiente_id=t.get(u"ambienteId"),
                tipo=t[u"tipo"],
                contorno=unidades.contorno(t[u"contorno"]),
                altura=unidades.pies(t[u"altura"][u"valor"]),
                altura_cm=t[u"altura"][u"valor"],
                padre_id=t.get(u"padreId"),
            )
        )
    return ordenes


def _molduras(nivel):
    """Los segmentos que recorre la moldura, uno por cara, ya en Revit.

    La altura es la del cielo falso del ambiente cuando lo hay: una moldura de
    gola va pegada al cielo, no a la losa.

    Cada segmento va en el sentido del recorrido de su cara, no en el del muro:
    la cara derecha se recorre del nodo "hasta" al "desde". Así los segmentos se
    encadenan uno con otro y la moldura da la vuelta al ambiente sin cortes.
    """
    ordenes = []
    for m in nivel.molduras:
        segmentos = []
        for ref in m[u"caras"]:
            cara = nivel.cara(ref[u"muroId"], ref[u"cara"])
            if cara:
                extremos = (cara[u"desde"], cara[u"hasta"])
                if ref[u"cara"] == u"derecha":
                    extremos = (cara[u"hasta"], cara[u"desde"])
                segmentos.append((unidades.punto(extremos[0]), unidades.punto(extremos[1])))
        ordenes.append(
            OrdenMoldura(
                id=m[u"id"],
                nivel_id=nivel.id,
                ambiente_id=m[u"ambienteId"],
                segmentos=segmentos,
                ancho=unidades.pies(m[u"ancho"][u"valor"]),
                caida=unidades.pies(m[u"caida"][u"valor"]),
                altura=unidades.pies(_altura_de_cielo(nivel, m[u"ambienteId"])),
            )
        )
    return ordenes


def _altura_de_cielo(nivel, ambiente_id):
    zonas = [t for t in nivel.techos if t.get(u"ambienteId") == ambiente_id and not t.get(u"padreId")]
    return zonas[0][u"altura"][u"valor"] if zonas else nivel.altura_general


def _vigas(nivel):
    ordenes = []
    for v in nivel.vigas:
        ordenes.append(
            OrdenViga(
                id=v[u"id"],
                nivel_id=nivel.id,
                inicio=unidades.punto(v[u"inicio"]),
                fin=unidades.punto(v[u"fin"]),
                ancho=unidades.pies(v[u"ancho"][u"valor"]),
                peralte=unidades.pies(v[u"peralte"][u"valor"]),
                # La viga cuelga del techo: su cara de abajo queda el peralte más abajo.
                altura=unidades.pies(nivel.altura_general),
            )
        )
    return ordenes


def _electricos(nivel):
    ordenes = []
    for e in nivel.electricos:
        g = nivel.geometria_electrico.get(e[u"id"])
        if not g:
            continue
        familia = FAMILIA_DE_PUNTO.get(e[u"tipo"], u"tomacorriente")
        direccion = direccion_muro(nivel, e[u"muroId"])
        ordenes.append(
            OrdenElectrico(
                id=e[u"id"],
                codigo=e[u"codigo"],
                nivel_id=nivel.id,
                muro_id=e[u"muroId"],
                clave=e[u"tipo"],
                familia=familia,
                categoria=CATEGORIA_ELECTRICA[familia],
                punto=unidades.punto(g[u"punto"]),
                # Mira hacia adentro del ambiente, que es la cara donde se colocó.
                normal=unidades.normal_cara(direccion, e[u"cara"]),
                invertir_cara=(e[u"cara"] == u"izquierda"),
                altura=unidades.pies(e[u"altura"][u"valor"]),
                altura_cm=e[u"altura"][u"valor"],
                notas=e.get(u"notas") or u"",
            )
        )
    return ordenes
