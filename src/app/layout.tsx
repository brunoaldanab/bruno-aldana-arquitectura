import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { RegistroServiceWorker } from "@/components/RegistroServiceWorker";

/**
 * Las dos familias del manual de marca y ninguna más.
 *
 * Archivo carga los cuatro pesos que usa el sistema: 200 para los títulos
 * grandes, 300 para el texto corrido, 400 para lo destacado y 500 para lo poco
 * que necesita peso. JetBrains Mono va solo en 500, que es el peso de las
 * etiquetas y los números.
 */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

/**
 * Sin esto, en el iPhone el pellizco agranda toda la página —los botones, las
 * hojas y las barras— en vez de acercar el plano, y al alejar de más la página
 * se encoge y parece que Safari se cerró. El plano tiene su propio pellizco
 * adentro del lienzo, así que el del navegador solo estorba.
 *
 * `viewportFit: "cover"` es además lo que hace que funcionen los márgenes de
 * `env(safe-area-inset-*)` que usan las barras de arriba y de abajo.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0F1113",
};

export const metadata: Metadata = {
  title: "Bruno Aldana · Arquitectura",
  description: "Gestión de contactos, cotizaciones y fichas de entrevista del estudio.",
  icons: { icon: "/ab-cuadrado-negro.svg" },
};

/**
 * `color-scheme: dark` le avisa al navegador que la página es oscura, y con eso
 * las barras de scroll, los campos nativos y los menús del sistema salen
 * oscuros también. Sin esa línea quedan blancos y rompen el grafito.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${archivo.variable} ${jetbrainsMono.variable} h-full overscroll-none antialiased [color-scheme:dark]`}
    >
      <body className="min-h-full flex flex-col overscroll-none bg-neutral-950 text-neutral-100">
        {children}
        <RegistroServiceWorker />
      </body>
    </html>
  );
}
