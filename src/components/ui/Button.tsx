import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm";

/**
 * La acción principal es la tinta de la marca sobre grafito, no un color.
 *
 * El manual no tiene color de acento a propósito: el color lo pone el render del
 * proyecto y nunca la marca. Así que la jerarquía se construye con luz —cuánto
 * se separa del fondo— y no con matiz. La primaria es el único bloque claro de
 * la pantalla, y por eso se encuentra sola sin necesidad de teñirla.
 */
const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    "bg-neutral-100 text-neutral-950 hover:bg-white active:bg-neutral-200 disabled:bg-neutral-700 disabled:text-neutral-400",
  secondary:
    "bg-white/[0.07] text-neutral-200 hover:bg-white/[0.12] active:bg-white/[0.16]",
  ghost: "text-neutral-400 hover:bg-white/[0.07] hover:text-neutral-100",
  danger: "text-danger-600 hover:bg-danger-50 active:bg-danger-50",
};

const SIZE_CLASS: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  sm: "px-3.5 py-1.5 text-xs",
};

/**
 * Las propiedades de la transición van nombradas: `transition` a secas anima
 * todo lo que cambie, incluidas cosas que nadie pidió animar.
 *
 * El peso es 400 y no 500: el manual pide que el énfasis se haga con tamaño y
 * espacio, nunca con negrita.
 */
const BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-full font-normal transition-[transform,background-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-100 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950";

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
