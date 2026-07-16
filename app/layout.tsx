import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Startup Navigator — Comprehensive Guide to Startups",
  description: "Explore company registration, funding, legal, hiring, branding, tax, and query our RAG AI Search Assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white bg-grid">
        {children}
      </body>
    </html>
  );
}
