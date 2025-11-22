import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HLife - You are safe with us",
  description: "Premium insurance services for your peace of mind",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
