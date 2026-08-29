import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm";

/**
 * La acción principal es negra, no azul.
 *
 * El sistema quedó monocromo —negro, plomo, blanco— y el azul de acento peleaba
 * con las fotos, que son el contenido real de la entrevista. Se reserva el azul
 * para enlaces, donde sí conviene que se lea como "esto es un enlace".
 */
const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    "bg-neutral-900 text-white hover:bg-neutral-800 active:bg-neutral-950 disabled:bg-neutral-300",
  secondary:
    "bg-neutral-900/[0.06] text-neutral-800 hover:bg-neutral-900/[0.1] active:bg-neutral-900/[0.14]",
  ghost: "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-900/[0.06]",
  danger: "text-danger-600 hover:bg-danger-50 active:bg-danger-50",
};

const SIZE_CLASS: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  sm: "px-3.5 py-1.5 text-xs",
};

/**
 * Las propiedades de la transición van nombradas: `transition` a secas anima
 * todo lo que cambie, incluidas cosas que nadie pidió animar.
 */
const BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
};

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = CommonProps & {
  href: string;
  target?: string;
  rel?: string;
};

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = "primary", size = "md", className = "", children } = props;
  const classes = `${BASE} ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`;

  if ("href" in props && props.href !== undefined) {
    const { href, target, rel } = props;
    return (
      <Link href={href} target={target} rel={rel} className={classes}>
        {children}
      </Link>
    );
  }

  const buttonProps = props as ButtonAsButton;
  const rest: ButtonHTMLAttributes<HTMLButtonElement> = { ...buttonProps };
  delete (rest as Record<string, unknown>).variant;
  delete (rest as Record<string, unknown>).size;
  delete (rest as Record<string, unknown>).className;
  delete (rest as Record<string, unknown>).children;
  return (
    <button {...rest} type={buttonProps.type ?? "button"} className={classes}>
      {children}
    </button>
  );
}
