import { Geist, Geist_Mono } from "next/font/google";
import Script from 'next/script';
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { AuthProvider } from '../contexts/AuthContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'ImpactLinks | Play Your Game. Fund the Future.',
  description: 'The exclusive subscription platform that turns your weekend Stableford scores into life-changing charity donations.',
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-slate-50 text-slate-900 font-sans antialiased pt-24">
        <AuthProvider>
          <Navbar />
          <main>
            {children}
          </main>
          <Script
            src="https://checkout.razorpay.com/v1/checkout.js"
            strategy="lazyOnload"
          />
        </AuthProvider>
      </body>
    </html>
  );
}
