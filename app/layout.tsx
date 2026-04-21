import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

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
      <body className="antialiased min-h-screen bg-[#0f1117] text-slate-200">
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
