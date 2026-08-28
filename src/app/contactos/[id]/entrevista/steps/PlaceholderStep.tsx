"use client";

export function PlaceholderStep() {
  return (
    <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-4 py-10 text-center">
      <p className="text-sm font-medium text-neutral-700">Este paso todavía no está portado a esta versión.</p>
      <p className="mt-1 text-sm text-neutral-500">
        Es una de las partes más ricas del wizard original (fotos, calificaciones, paletas, materiales) — la estamos construyendo a
        continuación. Por ahora podés seguir a los pasos siguientes sin problema.
      </p>
    </div>
  );
}
