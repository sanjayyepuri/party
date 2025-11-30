import localFont from 'next/font/local'

const departureMono = localFont({
  src: [
    {
      path: '../public/fonts/DepartureMono-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-departure-mono',
})

import "@ory/elements-react/theme/styles.css"
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${departureMono.variable} antialiased h-screen overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
