import "./globals.css";
import "@ory/elements-react/theme/styles.css"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased h-screen overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
