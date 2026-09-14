# -*- coding: utf-8 -*-
"""
Ejecuta el plan adentro de Revit.

Es deliberadamente tonto: no calcula nada, no decide nada. Recibe las órdenes
que armó `plan.py`, ya en pies y en coordenadas de Revit, y las va creando en el
orden que le llegan. Todo lo que se puede equivocar ya se equivocó —o no— antes
de llegar acá.

Tres reglas que no cambian:

* **No modifica ni borra nada de lo que ya existía.** Solo agrega.
* **Un elemento que falla no tumba la etapa.** Se anota el motivo y se sigue.
* **Una transacción por etapa**, todas dentro de un grupo: si una etapa entera
  se cae, las anteriores quedan hechas.
"""
from pyrevit import DB

from barelevamiento import plan as planificador

from . import tipos as buscador

XYZ = DB.XYZ


class Constructor(object):
    def __init__(self, doc, plan, resultado):
        self.doc = doc
        self.plan = plan
        self.resultado = resultado
        self.niveles = {}
        self.muros = {}
        self.techos = {}
        self.tipos = {}

    # -- el recorrido ------------------------------------------------------

    def construir(self):
        grupo = DB.TransactionGroup(self.doc, u"Traer relevamiento")
        grupo.Start()
        try:
            for etapa, hacer in self._etapas():
                self._etapa(etapa, hacer)
            grupo.Assimilate()
        except Exception:
            grupo.RollBack()
            raise
        return self.resultado

    def _etapas(self):
        return [
            (u"niveles", self._niveles),
            (u"tipos", self._tipos),
            (u"muros", self._muros),
            (u"aberturas", self._aberturas),
            (u"vanos", self._vanos),
            (u"columnas", self._columnas),
            (u"ambientes", self._ambientes),
            (u"techos", self._techos),
            (u"molduras", self._molduras),
            (u"vigas", self._vigas),
            (u"electricos", self._electricos),
        ]

    def _etapa(self, nombre, hacer):
        ordenes = self.plan.de_etapa(nombre)
        if not ordenes:
            return
        transaccion = DB.Transaction(self.doc, u"Relevamiento · %s" % nombre)
        transaccion.Start()
        try:
            hacer(ordenes)
            self.doc.Regenerate()
            transaccion.Commit()
        except Exception as e:
            transaccion.RollBack()
            self.resultado.aviso(u"La etapa de %s no se pudo hacer: %s" % (nombre, e))

    def _cada(self, ordenes, hacer):
        """Crea uno por uno y anota el que falla, sin cortar la etapa."""
        for orden in ordenes:
            clase = type(orden).__name__
            try:
                hacer(orden)
            except buscador.SinTipo as e:
                self.resultado.fallo(clase, _nombre_de(orden), u"%s" % e)
            except Exception as e:
                self.resultado.fallo(clase, _nombre_de(orden), u"%s" % e)

    # -- las etapas --------------------------------------------------------

    def _niveles(self, ordenes):
        existentes = list(DB.FilteredElementCollector(self.doc).OfClass(DB.Level).ToElements())

        def crear(orden):
            ya_esta = buscador.por_nombre(existentes, orden.nombre)
            if ya_esta is None:
                ya_esta = _cercano(existentes, orden.elevacion)
            if ya_esta is None:
                ya_esta = DB.Level.Create(self.doc, orden.elevacion)
                try:
                    # Si el nombre ya está tomado, el nivel sirve igual con el suyo.
                    ya_esta.Name = orden.nombre
                except Exception:
                    pass
                self.resultado.creado(u"OrdenNivel", orden.nombre)
            self.niveles[orden.nivel_id] = ya_esta

        self._cada(ordenes, crear)

    def _tipos(self, ordenes):
        def crear(orden):
            if isinstance(orden, planificador.OrdenTipoMuro):
                buscador.tipo_de_muro(self.doc, orden, self.tipos)
            elif isinstance(orden, planificador.OrdenTipoAbertura):
                buscador.tipo_de_abertura(self.doc, orden, self.tipos)
            elif isinstance(orden, planificador.OrdenTipoColumna):
                buscador.tipo_de_columna(self.doc, orden, self.tipos)

        self._cada(ordenes, crear)

    def _muros(self, ordenes):
        def crear(orden):
            nivel = self._nivel(orden)
            tipo = self.tipos.get(orden.tipo) or buscador.tipo_de_muro(
                self.doc,
                planificador.OrdenTipoMuro(nombre=orden.tipo, espesor=orden.espesor_cm / 30.48, espesor_cm=orden.espesor_cm),
                self.tipos,
            )
            linea = DB.Line.CreateBound(self._xyz(orden.inicio, nivel), self._xyz(orden.fin, nivel))
            muro = DB.Wall.Create(self.doc, linea, tipo.Id, nivel.Id, orden.altura, 0.0, False, False)
            # Que Revit no ate el muro a un nivel de arriba: la altura es la medida.
            _fijar(muro, DB.BuiltInParameter.WALL_HEIGHT_TYPE, DB.ElementId.InvalidElementId)
            self.muros[orden.id] = muro
            self.resultado.creado(u"OrdenMuro", orden.id)

        self._cada(ordenes, crear)

    def _aberturas(self, ordenes):
        def crear(orden):
            nivel = self._nivel(orden)
            muro = self._muro(orden)
            tipo = self.tipos.get(orden.tipo) or buscador.tipo_de_abertura(
                self.doc,
                planificador.OrdenTipoAbertura(
                    nombre=orden.tipo,
                    categoria=orden.categoria,
                    ancho=orden.ancho,
                    alto=orden.alto,
                    ancho_cm=0,
                    alto_cm=0,
                ),
                self.tipos,
            )
            punto = self._xyz(orden.punto, nivel, orden.antepecho)
            instancia = self.doc.Create.NewFamilyInstance(
                punto, tipo, muro, nivel, DB.Structure.StructuralType.NonStructural
            )
            _fijar(instancia, DB.BuiltInParameter.INSTANCE_SILL_HEIGHT_PARAM, orden.antepecho)
            _voltear(instancia, orden.invertir_cara, orden.invertir_mano)
            _comentario(instancia, orden.codigo, orden.notas)
            self.resultado.creado(u"OrdenAbertura", orden.codigo)

        self._cada(ordenes, crear)

    def _vanos(self, ordenes):
        """Un hueco rectangular en el muro: no necesita familia ni tipo."""

        def crear(orden):
            nivel = self._nivel(orden)
            muro = self._muro(orden)
            mitad = (orden.direccion[0] * orden.ancho / 2.0, orden.direccion[1] * orden.ancho / 2.0)
            base = nivel.Elevation + orden.antepecho
            uno = XYZ(orden.punto[0] - mitad[0], orden.punto[1] - mitad[1], base)
            otro = XYZ(orden.punto[0] + mitad[0], orden.punto[1] + mitad[1], base + orden.alto)
            self.doc.Create.NewOpening(muro, uno, otro)
            self.resultado.creado(u"OrdenVano", orden.codigo)

        self._cada(ordenes, crear)

    def _columnas(self, ordenes):
        def crear(orden):
            nivel = self._nivel(orden)
            tipo = self.tipos.get(orden.tipo) or buscador.tipo_de_columna(
                self.doc,
                planificador.OrdenTipoColumna(nombre=orden.tipo, ancho=0.5, profundidad=0.5),
                self.tipos,
            )
            punto = self._xyz(orden.punto, nivel)
            columna = self.doc.Create.NewFamilyInstance(punto, tipo, nivel, DB.Structure.StructuralType.NonStructural)
            _fijar(columna, DB.BuiltInParameter.FAMILY_TOP_LEVEL_PARAM, nivel.Id)
            _fijar(columna, DB.BuiltInParameter.FAMILY_TOP_LEVEL_OFFSET_PARAM, orden.altura)
            if abs(orden.rotacion) > 1e-9:  # noqa: la rotación de una columna es opcional
                eje = DB.Line.CreateBound(punto, XYZ(punto.X, punto.Y, punto.Z + 1))
                DB.ElementTransformUtils.RotateElement(self.doc, columna.Id, eje, orden.rotacion)
            self.resultado.creado(u"OrdenColumna", orden.id)

        self._cada(ordenes, crear)

    def _ambientes(self, ordenes):
        piso = None
        try:
            piso = buscador.tipo_por_defecto(self.doc, DB.FloorType, u"piso")
        except buscador.SinTipo as e:
            self.resultado.aviso(u"%s No se crearon los pisos." % e)

        def crear(orden):
            nivel = self._nivel(orden)
            if isinstance(orden, planificador.OrdenAmbiente):
                ambiente = self.doc.Create.NewRoom(nivel, DB.UV(orden.punto[0], orden.punto[1]))
                _fijar(ambiente, DB.BuiltInParameter.ROOM_NAME, orden.nombre)
                self.resultado.creado(u"OrdenAmbiente", orden.nombre)
                return
            if piso is None:
                return
            losa = DB.Floor.Create(self.doc, _bucles(orden.contorno, 0.0), piso.Id, nivel.Id)
            _fijar(losa, DB.BuiltInParameter.FLOOR_HEIGHTABOVELEVEL_PARAM, orden.desnivel)
            self.resultado.creado(u"OrdenPiso", orden.nombre)

        self._cada(ordenes, crear)

    def _techos(self, ordenes):
        try:
            tipo = buscador.tipo_por_defecto(self.doc, DB.CeilingType, u"cielo raso")
        except buscador.SinTipo as e:
            self.resultado.aviso(u"%s No se crearon los techos." % e)
            return

        def crear(orden):
            nivel = self._nivel(orden)
            techo = DB.Ceiling.Create(self.doc, _bucles(orden.contorno, 0.0), tipo.Id, nivel.Id)
            _fijar(techo, DB.BuiltInParameter.CEILING_HEIGHTABOVELEVEL_PARAM, orden.altura)
            self.techos[orden.id] = techo
            self.resultado.creado(u"OrdenTecho", orden.id)

        self._cada(ordenes, crear)

    def _molduras(self, ordenes):
        """La moldura entra como línea de modelo a la altura del cielo.

        El sólido de la gola depende de un perfil que cada proyecto arma
        distinto; la línea, en cambio, deja el recorrido exacto para barrerlo
        adentro de Revit. Por eso el informe lo avisa.
        """

        def crear(orden):
            nivel = self._nivel(orden)
            z = nivel.Elevation + orden.altura
            plano = DB.SketchPlane.Create(self.doc, DB.Plane.CreateByNormalAndOrigin(XYZ.BasisZ, XYZ(0, 0, z)))
            hechos = 0
            for desde, hasta in orden.segmentos:
                uno = XYZ(desde[0], desde[1], z)
                otro = XYZ(hasta[0], hasta[1], z)
                if uno.DistanceTo(otro) < 1e-6:
                    continue
                self.doc.Create.NewModelCurve(DB.Line.CreateBound(uno, otro), plano)
                hechos += 1
            if hechos:
                self.resultado.creado(u"OrdenMoldura", orden.id)

        self._cada(ordenes, crear)
        if ordenes:
            self.resultado.aviso(
                u"Las molduras entraron como líneas de modelo a la altura del cielo: el perfil se barre adentro de Revit."
            )

    def _vigas(self, ordenes):
        def crear(orden):
            nivel = self._nivel(orden)
            tipo = buscador.tipo_de_viga(self.doc, self.tipos)
            z = nivel.Elevation + orden.altura
            linea = DB.Line.CreateBound(
                XYZ(orden.inicio[0], orden.inicio[1], z), XYZ(orden.fin[0], orden.fin[1], z)
            )
            viga = self.doc.Create.NewFamilyInstance(linea, tipo, nivel, DB.Structure.StructuralType.Beam)
            for parametro in (
                DB.BuiltInParameter.STRUCTURAL_BEAM_END0_ELEVATION,
                DB.BuiltInParameter.STRUCTURAL_BEAM_END1_ELEVATION,
            ):
                _fijar(viga, parametro, orden.altura)
            self.resultado.creado(u"OrdenViga", orden.id)

        self._cada(ordenes, crear)

    def _electricos(self, ordenes):
        def crear(orden):
            nivel = self._nivel(orden)
            muro = self._muro(orden)
            tipo = buscador.tipo_electrico(self.doc, orden.categoria, self.tipos)
            punto = self._xyz(orden.punto, nivel, orden.altura)
            instancia = self.doc.Create.NewFamilyInstance(
                punto, tipo, muro, nivel, DB.Structure.StructuralType.NonStructural
            )
            _voltear(instancia, orden.invertir_cara)
            _comentario(instancia, orden.codigo, orden.notas)
            self.resultado.creado(u"OrdenElectrico", orden.codigo)

        self._cada(ordenes, crear)

    # -- ayudas ------------------------------------------------------------

    def _nivel(self, orden):
        nivel = self.niveles.get(orden.nivel_id)
        if nivel is None:
            raise Exception(u"El nivel del relevamiento no se pudo crear.")
        return nivel

    def _muro(self, orden):
        muro = self.muros.get(orden.muro_id)
        if muro is None:
            raise Exception(u"Su muro no se creó, así que no tiene dónde ir.")
        return muro

    def _xyz(self, punto, nivel, altura=0.0):
        return XYZ(punto[0], punto[1], nivel.Elevation + altura)


def _nombre_de(orden):
    return getattr(orden, u"codigo", None) or getattr(orden, u"nombre", None) or getattr(orden, u"id", u"")


def _cercano(niveles, elevacion):
    """Un nivel que ya está a esa altura se reusa: no se duplican plantas."""
    for n in niveles:
        if abs(n.Elevation - elevacion) < 0.01:
            return n
    return None


def _fijar(elemento, incorporado, valor):
    """Carga un parámetro, y si Revit lo rechaza sigue de largo.

    Un parámetro que no se deja escribir —porque la familia no lo tiene, o
    porque en ese tipo es de solo lectura— no puede tumbar un muro que ya se
    creó bien. El elemento vale más que el detalle.
    """
    try:
        p = elemento.get_Parameter(incorporado)
        if p is None or p.IsReadOnly:
            return False
        p.Set(valor)
        return True
    except Exception:
        return False


def _voltear(instancia, invertir_cara=False, invertir_mano=False):
    """Da vuelta la puerta, si la familia lo permite."""
    try:
        if invertir_cara:
            instancia.flipFacing()
        if invertir_mano:
            instancia.flipHand()
    except Exception:
        pass


def _comentario(elemento, codigo, notas):
    """El código del relevamiento queda escrito en el elemento, para encontrarlo después."""
    texto = codigo if not notas else u"%s · %s" % (codigo, notas)
    _fijar(elemento, DB.BuiltInParameter.ALL_MODEL_INSTANCE_COMMENTS, texto)


def _bucles(contorno, z):
    """El contorno como el `CurveLoop` cerrado que piden los pisos y los techos."""
    from System.Collections.Generic import List

    puntos = [XYZ(p[0], p[1], z) for p in contorno]
    bucle = DB.CurveLoop()
    for i, p in enumerate(puntos):
        siguiente = puntos[(i + 1) % len(puntos)]
        if p.DistanceTo(siguiente) > 1e-6:
            bucle.Append(DB.Line.CreateBound(p, siguiente))
    bucles = List[DB.CurveLoop]()
    bucles.Add(bucle)
    return bucles
