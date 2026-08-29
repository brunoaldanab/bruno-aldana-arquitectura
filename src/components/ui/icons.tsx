type IconProps = { className?: string };

const base = "1.5" as const;

export function IconInbox({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 12h4.5l1.5 3h6l1.5-3H21" />
      <path d="M5.5 5.5h13l2.5 6.5v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z" />
    </svg>
  );
}

export function IconDocument({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M7 3.5h7l4 4V20a.75.75 0 0 1-.75.75H7A.75.75 0 0 1 6.25 20V4.25A.75.75 0 0 1 7 3.5Z" />
      <path d="M14 3.5V8h4.5" />
      <path d="M9 13h6M9 16.5h6" />
    </svg>
  );
}

/**
 * Íconos de los tipos de proyecto.
 *
 * Antes eran glifos de texto (⌂ ▣ ◧ △), que ni se pueden dibujar bien ni se
 * pueden animar. Están hechos con el mismo trazo que el resto del set para que
 * se lean como una familia, y con `pathLength={1}` para poder animar el dibujo
 * del trazo desde el componente sin depender de la longitud real de cada path.
 */
export function IconVivienda({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path pathLength={1} d="M3.5 10.5 12 4l8.5 6.5" />
      <path pathLength={1} d="M5.5 9.5V19a.75.75 0 0 0 .75.75h11.5a.75.75 0 0 0 .75-.75V9.5" />
      <path pathLength={1} d="M10 19.75V14h4v5.75" />
    </svg>
  );
}

export function IconOficina({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path pathLength={1} d="M4.5 20.25V4.75A.75.75 0 0 1 5.25 4h9.5a.75.75 0 0 1 .75.75v15.5" />
      <path pathLength={1} d="M15.5 10h3.25a.75.75 0 0 1 .75.75v9.5" />
      <path pathLength={1} d="M3 20.25h18" />
      <path pathLength={1} d="M8 8h1.5M8 12h1.5M8 16h1.5" />
    </svg>
  );
}

export function IconAmbiente({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path pathLength={1} d="M4 5.75A.75.75 0 0 1 4.75 5h14.5a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75H4.75a.75.75 0 0 1-.75-.75z" />
      <path pathLength={1} d="M14 19V9.5h5.75" />
      <path pathLength={1} d="M10.5 14.25v.01" />
    </svg>
  );
}

export function IconConstruccion({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path pathLength={1} d="M4 20.25h16" />
      <path pathLength={1} d="M6.5 20V6.5L18 4v4" />
      <path pathLength={1} d="M6.5 6.5 18 8" />
      <path pathLength={1} d="M14.5 8v3.5a2 2 0 1 1-4 0" />
    </svg>
  );
}
