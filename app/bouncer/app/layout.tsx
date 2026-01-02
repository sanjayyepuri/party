import localFont from "next/font/local";
import "./globals.css";
import { Navbar } from "./components/navbar";
import Footer from "./components/footer";
import { PartyProvider } from "@/lib/providers/party-provider";
import { RsvpProvider } from "@/lib/providers/rsvp-provider";

const departureMono = localFont({
  src: [
    {
      path: "../public/fonts/DepartureMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-departure-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${departureMono.variable} antialiased min-h-screen max-w-xl mx-4 mt-8`}
      >
        <main className="flex-auto min-w-0 mt-6 flex flex-col px-2 md:px-0 relative z-10">
          <Navbar />
          <div className="flex gap-4">
            <h1
              className="writing-mode-vertical flex-shrink-0 tracking-tighter sticky self-start hidden sm:block"
              style={{ top: "2rem", fontSize: "22px" }}
            >
              sanjay <span> • party </span>
            </h1>
            <div className="flex-1">
              <PartyProvider>
                <RsvpProvider>{children}</RsvpProvider>
              </PartyProvider>
              <Footer />
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
