import type { Metadata } from "next";
import { Audiowide, IBM_Plex_Mono, Iceland } from "next/font/google";
import "./globals.css";

const audiowide = Audiowide({
  variable: "--font-audiowide",
  subsets: ["latin"],
  weight: "400",
});

const iceland = Iceland({
  variable: "--font-iceland",
  subsets: ["latin"],
  weight: "400",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Dev Arena · Mufakose Innovation Hub",
    template: "%s · Dev Arena",
  },
  description:
    "Developer progression for Mufakose Innovation Hub. Build, solve, explain, help, compete, level up.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${audiowide.variable} ${iceland.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-sand-100">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-100 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-[0.12em] focus:text-sand-50"
        >
          Skip to content
        </a>
        <div id="main">{children}</div>
      </body>
    </html>
  );
}


 