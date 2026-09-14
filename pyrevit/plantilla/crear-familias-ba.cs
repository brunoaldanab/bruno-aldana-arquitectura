// Genera las familias propias en pyrevit/familias/, desde las plantillas de
// familia que trae Revit. Se ejecuta con el conector `revit` encendido.
//
// Son deliberadamente básicas y paramétricas: una sola puerta que se estira a la
// medida que diga el relevamiento, en vez de un catálogo de puertas. Lo que hoy
// les falta es geometría propia —la puerta abre el vano pero no tiene hoja
// dibujada— y está anotado en LEEME.md.
//
// Los nombres de los tipos del punto eléctrico son un contrato con la
// aplicación: la misma tabla está en
// pyrevit/BA.extension/lib/barelevamiento/plan.py (TIPO_DE_PUNTO) y una prueba
// la compara contra el catálogo de src/lib/plano/electricos.ts.

var app = document.Application;
var tpl = @"C:\ProgramData\Autodesk\RVT 2024\Family Templates\English\";
var carpeta = @"E:\BRUNO_CLAUDE\BA_ARQUITECTURA\app-entrevistas\pyrevit\familias";
var sb = new System.Text.StringBuilder();
System.IO.Directory.CreateDirectory(carpeta);

// --- BA Puerta y BA Ventana: la plantilla ya trae Width, Height y el vano.
foreach (var par in new[] {
  new[] { "Metric Door.rft", "BA Puerta", "900", "2100" },
  new[] { "Metric Window.rft", "BA Ventana", "1000", "1000" } }) {
  try {
    var fdoc = app.NewFamilyDocument(tpl + par[0]);
    try {
      var fm = fdoc.FamilyManager;
      using (var t = new Transaction(fdoc, "tipo")) {
        t.Start();
        var tipo = fm.NewType(par[1]);
        fm.CurrentType = tipo;
        var ancho = fm.get_Parameter("Width"); if (ancho != null) fm.Set(ancho, double.Parse(par[2]) / 304.8);
        var alto = fm.get_Parameter("Height"); if (alto != null) fm.Set(alto, double.Parse(par[3]) / 304.8);
        t.Commit();
      }
      fdoc.SaveAs(System.IO.Path.Combine(carpeta, par[1] + ".rfa"), new SaveAsOptions { OverwriteExistingFile = true });
      sb.AppendLine(par[1] + ": guardada");
    } finally { fdoc.Close(false); }
  } catch (Exception e) { sb.AppendLine(par[1] + " FALLO: " + e.Message); }
}

// --- BA Punto electrico: hospedada en muro, un tipo por punto del catálogo.
var puntos = new[] {
 "Tomacorriente simple","Tomacorriente doble","Tomacorriente triple","Tomacorriente con USB",
 "Tomacorriente sobre mesada","Tomacorriente de piso","Llave de 1 tecla","Llave de 2 teclas",
 "Llave de 3 teclas","Conmutador","Dimmer","Sensor de movimiento","Llave mas tomacorriente",
 "Salida de TV","Salida de red","Doble salida de red","Salida de telefono","Aire acondicionado",
 "Termotanque","Cocina u horno","Lavadora","Timbre o aplique" };
try {
  var fdoc = app.NewFamilyDocument(tpl + "Metric Electrical Fixture wall based.rft");
  try {
    var fm = fdoc.FamilyManager;
    using (var t = new Transaction(fdoc, "tipos")) {
      t.Start();
      var pTipo = fm.AddParameter("Tipo BA", GroupTypeId.IdentityData, SpecTypeId.String.Text, false);
      foreach (var n in puntos) { var tipo = fm.NewType("BA " + n); fm.CurrentType = tipo; fm.Set(pTipo, n); }
      t.Commit();
    }
    fdoc.SaveAs(System.IO.Path.Combine(carpeta, "BA Punto electrico.rfa"), new SaveAsOptions { OverwriteExistingFile = true });
    sb.AppendLine("BA Punto electrico: guardada con " + puntos.Length + " tipos");
  } finally { fdoc.Close(false); }
} catch (Exception e) { sb.AppendLine("BA Punto electrico FALLO: " + e.Message); }
return sb.ToString();
