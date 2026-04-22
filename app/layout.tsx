import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "TeamHub — Team Connection App",
  description: "Connect your team with crew profiles, games, and kudos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f5c518" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TeamHub" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="antialiased min-h-screen bg-[#0f1117] text-slate-200">
        <ServiceWorkerRegistration />
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1e2130",
              color: "#e2e8f0",
              border: "1px solid #2d3348",
            },
          }}
        />
      </body>
    </html>
  );
}
