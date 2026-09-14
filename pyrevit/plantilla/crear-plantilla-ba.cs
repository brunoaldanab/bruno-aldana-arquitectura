// Crea F:\BA ARQUITECTURA\PLANTILLAS\BA ARQ 2024.rte desde cero.
//
// Se ejecuta con el conector `revit` encendido (Revit MCP Switch, en la pestaña
// Add-Ins), que corre este código adentro de Revit. No sale de ninguna plantilla
// comprada: arranca de un proyecto métrico en blanco.
//
// OJO: vuelve a escribir el archivo entero. Lo que se haya agregado a mano a la
// plantilla se pierde. Lo que se ajuste a mano hay que anotarlo en LEEME.md.
//
// Las familias propias (BA Puerta, BA Ventana, BA Punto electrico) se generan
// aparte, con crear-familias-ba.cs, y viven en pyrevit/familias/.

var app = document.Application;
var sb = new System.Text.StringBuilder();
var carpeta = @"F:\BA ARQUITECTURA\PLANTILLAS";
var familias = @"E:\BRUNO_CLAUDE\BA_ARQUITECTURA\app-entrevistas\pyrevit\familias";
var destino = System.IO.Path.Combine(carpeta, "BA ARQ 2024.rte");
System.IO.Directory.CreateDirectory(carpeta);

var doc = app.NewProjectDocument(UnitSystem.Metric);
try {
  using (var t = new Transaction(doc, "BA ARQ")) {
    t.Start();

    // Unidades: Bruno mide y piensa en centímetros.
    var u = doc.GetUnits();
    u.SetFormatOptions(SpecTypeId.Length, new FormatOptions(UnitTypeId.Centimeters) { Accuracy = 0.1 });
    u.SetFormatOptions(SpecTypeId.Area, new FormatOptions(UnitTypeId.SquareMeters) { Accuracy = 0.01 });
    u.SetFormatOptions(SpecTypeId.Volume, new FormatOptions(UnitTypeId.CubicMeters) { Accuracy = 0.01 });
    doc.SetUnits(u);

    // Niveles.
    var niveles = new FilteredElementCollector(doc).OfClass(typeof(Level)).Cast<Level>().OrderBy(l => l.Elevation).ToList();
    if (niveles.Count > 0) { try { niveles[0].Name = "PLANTA BAJA"; } catch {} }
    try { var n2 = Level.Create(doc, 300.0 / 30.48); n2.Name = "PLANTA ALTA"; } catch (Exception e) { sb.AppendLine("nivel 2: " + e.Message); }

    // Muros: una sola capa, sin material. El espesor es lo único que los define.
    var baseWt = new FilteredElementCollector(doc).OfClass(typeof(WallType)).Cast<WallType>()
      .Where(w => w.Kind == WallKind.Basic).OrderBy(w => w.Width).First();
    foreach (var cm in new[] { 7, 10, 12, 15, 18, 20, 25 }) {
      var nuevo = baseWt.Duplicate("BA Muro " + cm) as WallType;
      nuevo.SetCompoundStructure(CompoundStructure.CreateSingleLayerCompoundStructure(
        MaterialFunctionAssignment.Structure, cm / 30.48, ElementId.InvalidElementId));
    }

    // Pisos y cielos rasos, con el mismo criterio.
    var ft = new FilteredElementCollector(doc).OfClass(typeof(FloorType)).Cast<FloorType>()
      .Where(f => f.Category != null && f.Category.Id.IntegerValue == (int)BuiltInCategory.OST_Floors)
      .OrderBy(f => f.Name).FirstOrDefault();
    if (ft != null) foreach (var cm in new[] { 2, 10, 20 }) {
      var nuevo = ft.Duplicate("BA Piso " + cm) as FloorType;
      try { nuevo.SetCompoundStructure(CompoundStructure.CreateSingleLayerCompoundStructure(
        MaterialFunctionAssignment.Structure, cm / 30.48, ElementId.InvalidElementId)); } catch {}
    }
    var ct = new FilteredElementCollector(doc).OfClass(typeof(CeilingType)).Cast<CeilingType>().FirstOrDefault();
    if (ct != null) foreach (var cm in new[] { 2, 10 }) {
      var nuevo = ct.Duplicate("BA Cielo raso " + cm) as CeilingType;
      try { nuevo.SetCompoundStructure(CompoundStructure.CreateSingleLayerCompoundStructure(
        MaterialFunctionAssignment.Structure, cm / 30.48, ElementId.InvalidElementId)); } catch {}
    }

    // Las familias propias entran cargadas en la plantilla.
    foreach (var f in new[] { "BA Puerta.rfa", "BA Ventana.rfa", "BA Punto electrico.rfa" }) {
      Family fam = null;
      try { doc.LoadFamily(System.IO.Path.Combine(familias, f), out fam); }
      catch (Exception e) { sb.AppendLine(f + ": " + e.Message); }
    }
    t.Commit();
  }
  doc.SaveAs(destino, new SaveAsOptions { OverwriteExistingFile = true });
  sb.AppendLine("GUARDADA: " + destino);
} finally { doc.Close(false); }
return sb.ToString();
