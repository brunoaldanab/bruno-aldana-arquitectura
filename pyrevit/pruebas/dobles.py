# -*- coding: utf-8 -*-
"""
Un Revit de mentira, para correr el constructor sin abrir Revit.

No reemplaza a la prueba adentro del modelo: no sabe de geometría ni de cómo se
comporta la API de verdad. Lo que sí hace es recorrer el constructor entero —las
once etapas, con el cuarto de Bruno y la casa de ejemplo— y cantar cualquier
método mal escrito, argumento de más o parámetro inventado. Es el error más
probable y el más caro: que Bruno apriete el botón y no pase nada.

Cada doble acepta **solo** lo que el constructor usa de verdad. Si mañana el
constructor llama a algo nuevo, acá revienta y hay que agregarlo a mano, que es
justamente el aviso que se busca.
"""
import math
import sys
import types


class Registro(object):
    """Lo que se le fue pidiendo al Revit de mentira."""

    def __init__(self):
        self.creados = []
        self.parametros = []
        self.volteos = []
        self.rotaciones = []
        self.transacciones = []
        self.instancias = []

    def anotar(self, que, dato=None):
        self.creados.append((que, dato))

    def cuantos(self, que):
        return len([1 for q, _ in self.creados if q == que])


REGISTRO = Registro()


# -- lo mínimo del lenguaje -------------------------------------------------


class _Enumeracion(object):
    """`DB.BuiltInParameter.LO_QUE_SEA` devuelve algo con nombre, sin validar."""

    def __init__(self, nombre=u"enum"):
        self._nombre = nombre

    def __getattr__(self, atributo):
        if atributo.startswith(u"_"):
            raise AttributeError(atributo)
        valor = _Valor(u"%s.%s" % (self._nombre, atributo))
        setattr(self, atributo, valor)
        return valor


class _Valor(object):
    def __init__(self, nombre):
        self.nombre = nombre

    def __repr__(self):
        return self.nombre


BuiltInParameter = _Enumeracion(u"BuiltInParameter")
BuiltInCategory = _Enumeracion(u"BuiltInCategory")
MaterialFunctionAssignment = _Enumeracion(u"MaterialFunctionAssignment")
WallKind = _Enumeracion(u"WallKind")
_Structure = _Enumeracion(u"StructuralType")


class XYZ(object):
    BasisZ = None  # se completa abajo

    def __init__(self, x, y, z):
        self.X = float(x)
        self.Y = float(y)
        self.Z = float(z)

    def DistanceTo(self, otro):
        return math.sqrt((self.X - otro.X) ** 2 + (self.Y - otro.Y) ** 2 + (self.Z - otro.Z) ** 2)

    def __repr__(self):
        return u"XYZ(%.3f, %.3f, %.3f)" % (self.X, self.Y, self.Z)


XYZ.BasisZ = XYZ(0, 0, 1)


class UV(object):
    def __init__(self, u, v):
        self.U = float(u)
        self.V = float(v)


class ElementId(object):
    InvalidElementId = None

    def __init__(self, valor):
        self.IntegerValue = valor


ElementId.InvalidElementId = ElementId(-1)


class Parametro(object):
    def __init__(self, nombre, valor=0.0, solo_lectura=False):
        self.nombre = nombre
        self.valor = valor
        self.IsReadOnly = solo_lectura

    def AsDouble(self):
        return self.valor

    def AsString(self):
        return self.valor if isinstance(self.valor, type(u"")) else u""

    def Set(self, valor):
        self.valor = valor
        REGISTRO.parametros.append((self.nombre, valor))
        return True


_contador = [0]


class Elemento(object):
    """Cualquier cosa creada o encontrada en el documento de mentira."""

    def __init__(self, nombre=u"", parametros=None):
        _contador[0] += 1
        self.Id = ElementId(_contador[0])
        self.Name = nombre
        self._parametros = parametros or {}

    def get_Parameter(self, incorporado):
        return self._parametros.get(u"%s" % incorporado)

    def LookupParameter(self, nombre):
        return self._parametros.get(nombre)

    #: Con qué orientación nace todo lo que se inserta en el doble. En Revit
    #: depende de la familia y del lado del eje donde cae el punto; acá es
    #: siempre la misma, para que la prueba sepa qué esperar.
    FacingOrientation = XYZ(1, 0, 0)

    #: Las familias eléctricas de la plantilla de Gigi no se dejan voltear: hay
    #: que girarlas. El doble lo copia para que la prueba recorra ese camino.
    CanFlipFacing = True

    #: Sin muro anfitrión, como entran esas mismas familias.
    Host = None

    def flipFacing(self):
        if not self.CanFlipFacing:
            return  # en Revit no avisa: simplemente no pasa nada
        self.FacingOrientation = XYZ(-self.FacingOrientation.X, -self.FacingOrientation.Y, 0)
        REGISTRO.volteos.append((self.Name, u"cara"))

    def flipHand(self):
        REGISTRO.volteos.append((self.Name, u"mano"))


class TipoConNombre(Elemento):
    """Un tipo, con la trampa que le costó a Bruno la segunda prueba.

    En Revit, leer `WallType.Name` o `FamilySymbol.Name` desde Python falla: la
    propiedad viene heredada de `ElementType`, que la vuelve a declarar, y el
    puente con .NET no la resuelve. El nombre sí se puede leer por su parámetro.
    El doble copia ese comportamiento para que las pruebas lo vean.
    """

    def __init__(self, nombre=u"", parametros=None):
        _contador[0] += 1
        self.Id = ElementId(_contador[0])
        self._parametros = parametros or {}
        self._parametros[u"%s" % BuiltInParameter.SYMBOL_NAME_PARAM] = Parametro(u"nombre de tipo", nombre)

    @property
    def Name(self):
        raise AttributeError(u"Name")

    def Duplicate(self, nombre):
        copia = type(self)(nombre, dict(self._parametros))
        REGISTRO.anotar(u"duplicado", nombre)
        _DOC.agregar(copia)
        return copia


class WallType(TipoConNombre):
    def __init__(self, nombre=u"", parametros=None, ancho=0.5):
        TipoConNombre.__init__(self, nombre, parametros)
        self.Width = ancho
        self.Kind = WallKind.Basic

    def SetCompoundStructure(self, capa):
        self.Width = capa.ancho


class FloorType(TipoConNombre):
    FamilyName = u"Piso"


class CeilingType(TipoConNombre):
    FamilyName = u"Cielo raso"


class FamilySymbol(TipoConNombre):
    def __init__(self, nombre=u"", parametros=None, categoria=None):
        TipoConNombre.__init__(self, nombre, parametros)
        self.categoria = categoria
        self.IsActive = False
        self.FamilyName = u"%s" % nombre

    def Activate(self):
        self.IsActive = True


class Level(Elemento):
    def __init__(self, nombre=u"", elevacion=0.0):
        Elemento.__init__(self, nombre)
        self.Elevation = elevacion


# -- las fábricas de la API -------------------------------------------------


class _Line(object):
    @staticmethod
    def CreateBound(a, b):
        if a.DistanceTo(b) < 1e-9:
            raise Exception(u"una línea de largo cero")
        return {u"desde": a, u"hasta": b}


class _Wall(object):
    @staticmethod
    def Create(doc, linea, tipo_id, nivel_id, altura, offset, flip, estructural):
        if altura <= 0:
            raise Exception(u"un muro sin altura")
        muro = Elemento(u"muro", {u"%s" % BuiltInParameter.WALL_HEIGHT_TYPE: Parametro(u"WALL_HEIGHT_TYPE")})
        REGISTRO.anotar(u"muro", linea)
        doc.agregar(muro)
        return muro


class _Level(object):
    @staticmethod
    def Create(doc, elevacion):
        nivel = Level(u"Nivel", elevacion)
        REGISTRO.anotar(u"nivel", elevacion)
        doc.agregar(nivel)
        return nivel


class _Floor(object):
    @staticmethod
    def Create(doc, bucles, tipo_id, nivel_id):
        piso = Elemento(u"piso", {u"%s" % BuiltInParameter.FLOOR_HEIGHTABOVELEVEL_PARAM: Parametro(u"desnivel")})
        REGISTRO.anotar(u"piso", bucles)
        doc.agregar(piso)
        return piso


class _Ceiling(object):
    @staticmethod
    def Create(doc, bucles, tipo_id, nivel_id):
        techo = Elemento(u"techo", {u"%s" % BuiltInParameter.CEILING_HEIGHTABOVELEVEL_PARAM: Parametro(u"altura")})
        REGISTRO.anotar(u"techo", bucles)
        doc.agregar(techo)
        return techo


class _Plane(object):
    @staticmethod
    def CreateByNormalAndOrigin(normal, origen):
        return {u"normal": normal, u"origen": origen}


class _SketchPlane(object):
    @staticmethod
    def Create(doc, plano):
        REGISTRO.anotar(u"plano de trabajo", plano)
        return plano


class _CompoundStructure(object):
    @staticmethod
    def CreateSingleLayerCompoundStructure(funcion, ancho, material_id):
        capa = types.SimpleNamespace(ancho=ancho)
        return capa


class _ElementTransformUtils(object):
    @staticmethod
    def RotateElement(doc, elemento_id, eje, angulo):
        REGISTRO.rotaciones.append(angulo)
        for e in doc.elementos:
            if e.Id is elemento_id or getattr(e, u"Id", None) == elemento_id:
                mira = e.FacingOrientation
                cos = math.cos(angulo)
                sen = math.sin(angulo)
                e.FacingOrientation = XYZ(mira.X * cos - mira.Y * sen, mira.X * sen + mira.Y * cos, 0)


class CurveLoop(object):
    def __init__(self):
        self.curvas = []

    def Append(self, curva):
        self.curvas.append(curva)


class _DescriptorDeNombre(object):
    """`DB.Element.Name` en CPython es el descriptor de la propiedad, y nada más.

    El rodeo de IronPython —`Element.Name.GetValue(elemento)`— revienta en el
    motor CPython de pyRevit con "'getset_descriptor' object has no attribute
    'GetValue'". Pasó de verdad la primera vez que Bruno apretó el botón: el
    doble no lo reproducía y por eso las pruebas no lo vieron. Ahora sí.
    """

    def __getattr__(self, atributo):
        raise AttributeError(u"'getset_descriptor' object has no attribute '%s'" % atributo)


class _Element(object):
    Name = _DescriptorDeNombre()


class Transaction(object):
    def __init__(self, doc, nombre):
        self.nombre = nombre

    def Start(self):
        REGISTRO.transacciones.append((u"abre", self.nombre))

    def Commit(self):
        REGISTRO.transacciones.append((u"cierra", self.nombre))

    def RollBack(self):
        REGISTRO.transacciones.append((u"deshace", self.nombre))


class TransactionGroup(Transaction):
    def Assimilate(self):
        REGISTRO.transacciones.append((u"junta", self.nombre))


class FilteredElementCollector(object):
    def __init__(self, doc):
        self.doc = doc
        self.clase = None
        self.categoria = None

    def OfClass(self, clase):
        self.clase = clase
        return self

    def OfCategory(self, categoria):
        self.categoria = categoria
        return self

    def ToElements(self):
        elementos = self.doc.elementos
        if self.clase is not None:
            elementos = [e for e in elementos if isinstance(e, self.clase)]
        if self.categoria is not None:
            elementos = [e for e in elementos if getattr(e, u"categoria", None) is self.categoria]
        return list(elementos)


# -- el documento -----------------------------------------------------------


#: Categorías cuyas familias, en la plantilla de Bruno, no se dejan voltear.
_SIN_VOLTEO = ()


class Creador(object):
    def __init__(self, doc):
        self.doc = doc

    def NewFamilyInstance(self, *argumentos):
        punto = argumentos[0] if argumentos and isinstance(argumentos[0], XYZ) else XYZ(0, 0, 0)
        instancia = Elemento(
            u"instancia",
            {u"%s" % BuiltInParameter.INSTANCE_SILL_HEIGHT_PARAM: Parametro(u"antepecho"),
             u"%s" % BuiltInParameter.ALL_MODEL_INSTANCE_COMMENTS: Parametro(u"comentario", u""),
             u"%s" % BuiltInParameter.FAMILY_TOP_LEVEL_PARAM: Parametro(u"nivel de arriba"),
             u"%s" % BuiltInParameter.FAMILY_TOP_LEVEL_OFFSET_PARAM: Parametro(u"altura"),
             u"%s" % BuiltInParameter.STRUCTURAL_BEAM_END0_ELEVATION: Parametro(u"arranque"),
             u"%s" % BuiltInParameter.STRUCTURAL_BEAM_END1_ELEVATION: Parametro(u"final")},
        )
        instancia.Location = types.SimpleNamespace(Point=punto)
        # Las eléctricas de Gigi: no se voltean y entran sueltas.
        if len(argumentos) > 1 and getattr(argumentos[1], u"categoria", None) in _SIN_VOLTEO:
            instancia.CanFlipFacing = False
        else:
            instancia.Host = object()
        REGISTRO.anotar(u"instancia", argumentos)
        REGISTRO.instancias.append(instancia)
        self.doc.agregar(instancia)
        return instancia

    def NewOpening(self, muro, uno, otro):
        if uno.DistanceTo(otro) < 1e-9:
            raise Exception(u"un vano sin tamaño")
        REGISTRO.anotar(u"vano", (uno, otro))
        return Elemento(u"vano")

    def NewRoom(self, nivel, uv):
        ambiente = Elemento(u"ambiente", {u"%s" % BuiltInParameter.ROOM_NAME: Parametro(u"nombre", u"")})
        REGISTRO.anotar(u"ambiente", uv)
        self.doc.agregar(ambiente)
        return ambiente

    def NewModelCurve(self, linea, plano):
        REGISTRO.anotar(u"linea de modelo", linea)
        return Elemento(u"línea")


class Documento(object):
    """Un proyecto con lo mínimo cargado: la plantilla de Bruno tiene mucho más."""

    def __init__(self, con_familias=True):
        self.elementos = []
        self.Create = Creador(self)
        self.IsFamilyDocument = False
        self.agregar(WallType(u"Muro genérico 15", ancho=15 / 30.48))
        self.agregar(FloorType(u"Piso genérico"))
        self.agregar(CeilingType(u"Cielo raso liso"))
        if con_familias:
            medidas = {
                u"Width": Parametro(u"Width", 0.9 * 3.28),
                u"Height": Parametro(u"Height", 2.1 * 3.28),
                u"Depth": Parametro(u"Depth", 0.3 * 3.28),
            }
            for categoria in (
                BuiltInCategory.OST_Doors,
                BuiltInCategory.OST_Windows,
                BuiltInCategory.OST_Columns,
                BuiltInCategory.OST_ElectricalFixtures,
                BuiltInCategory.OST_LightingDevices,
                BuiltInCategory.OST_CommunicationDevices,
                BuiltInCategory.OST_StructuralFraming,
            ):
                self.agregar(FamilySymbol(u"%s estándar" % categoria, dict(medidas), categoria))

    def agregar(self, elemento):
        self.elementos.append(elemento)
        return elemento

    def Regenerate(self):
        pass


CATEGORIA_DE = {
    u"dispositivos-electricos": BuiltInCategory.OST_ElectricalFixtures,
    u"dispositivos-de-iluminacion": BuiltInCategory.OST_LightingDevices,
    u"dispositivos-de-comunicacion": BuiltInCategory.OST_CommunicationDevices,
}

_DOC = None


def documento(con_familias=True, sin_volteo=()):
    """Un documento nuevo y un registro limpio.

    `sin_volteo` son las categorías cuyas familias no se dejan voltear, como las
    eléctricas de la plantilla de Gigi.
    """
    global _DOC, REGISTRO, _SIN_VOLTEO
    _SIN_VOLTEO = tuple(CATEGORIA_DE[c] for c in sin_volteo)
    REGISTRO = Registro()
    _module_db.__dict__[u"_REGISTRO"] = REGISTRO
    _DOC = Documento(con_familias)
    return _DOC


# -- el módulo `pyrevit` de mentira -----------------------------------------


def _armar_db():
    db = types.ModuleType(u"DB")
    db.XYZ = XYZ
    db.UV = UV
    db.ElementId = ElementId
    db.Element = _Element
    db.Line = _Line
    db.Wall = _Wall
    db.WallType = WallType
    db.WallKind = WallKind
    db.Level = _Level
    db.Floor = _Floor
    db.FloorType = FloorType
    db.Ceiling = _Ceiling
    db.CeilingType = CeilingType
    db.FamilySymbol = FamilySymbol
    db.Plane = _Plane
    db.SketchPlane = _SketchPlane
    db.CurveLoop = CurveLoop
    db.CompoundStructure = _CompoundStructure
    db.MaterialFunctionAssignment = MaterialFunctionAssignment
    db.ElementTransformUtils = _ElementTransformUtils
    db.Transaction = Transaction
    db.TransactionGroup = TransactionGroup
    db.FilteredElementCollector = FilteredElementCollector
    db.BuiltInParameter = BuiltInParameter
    db.BuiltInCategory = BuiltInCategory
    db.Structure = types.SimpleNamespace(StructuralType=_Structure)
    return db


_module_db = _armar_db()


def instalar():
    """Deja `from pyrevit import DB` y `System.Collections.Generic` funcionando."""
    pyrevit = types.ModuleType(u"pyrevit")
    pyrevit.DB = _module_db
    sys.modules[u"pyrevit"] = pyrevit
    sys.modules[u"pyrevit.DB"] = _module_db

    sistema = types.ModuleType(u"System")
    colecciones = types.ModuleType(u"System.Collections")
    genericas = types.ModuleType(u"System.Collections.Generic")

    class Lista(list):
        """`List[X]()` en C# es una lista con tipo; acá alcanza con una lista."""

        def __class_getitem__(cls, _tipo):
            return cls

        def Add(self, x):
            self.append(x)

    genericas.List = Lista
    sistema.Collections = colecciones
    colecciones.Generic = genericas
    sys.modules[u"System"] = sistema
    sys.modules[u"System.Collections"] = colecciones
    sys.modules[u"System.Collections.Generic"] = genericas
    return _module_db
