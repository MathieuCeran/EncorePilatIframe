import type { Metadata } from "next";
import { GoogleTagManager } from "@next/third-parties/google";
import Script from "next/script";
import "./globals.css";
import config from "@/config";
import Providers from "./providers";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CookieBanner from "@/components/CookieBanner";

export const metadata: Metadata = {
  title: config.appName,
  description: config.appDescription,
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="/fonts/TT Drugs Regular.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/chillax/Chillax-Regular.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/chillax/Chillax-Light.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/chillax/Chillax-Semibold.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased bg-[#f9f7f3b8] font-ttdrugs">
        <GoogleTagManager gtmId="GTM-WZ3QF2DX" />
        
        {/* Meta Pixel Code */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1565956417699701');
            fbq('track', 'PageView');
          `}
        </Script>
        
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            height="1" 
            width="1" 
            style={{display:'none'}}
            src="https://www.facebook.com/tr?id=1565956417699701&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        
        <Providers>
          <Navbar />
          <div className="md:pt-12">
            <CookieBanner />
            {children}
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
