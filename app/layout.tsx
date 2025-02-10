import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "File Converter - Convert Images and Documents Online",
  description: "Free online tool to convert files between different formats. Convert images (BMP, EPS, GIF, ICO, JPEG, PNG, SVG, WEBP) and documents (DOCX, PDF, TXT).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <Header />
          
          <div className="flex-1 flex flex-col lg:flex-row">
            {/* Left Sidebar - Ad Space */}
            <aside className="hidden lg:block w-[160px] min-w-[160px] bg-gray-50">
              <div className="sticky top-20 p-4">
                <div className="w-full h-[600px] bg-gray-100 flex items-center justify-center text-sm text-gray-400">
                  Ad Space
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-screen w-full max-w-full">
              {/* Top Ad Space */}
              <div className="w-full bg-gray-50 p-4 flex justify-center">
                <div className="w-full max-w-[728px] h-[90px] bg-gray-100 flex items-center justify-center text-sm text-gray-400">
                  Ad Space
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
                {children}
              </div>

              {/* Bottom Ad Space */}
              <div className="w-full bg-gray-50 p-4 flex justify-center">
                <div className="w-full max-w-[728px] h-[90px] bg-gray-100 flex items-center justify-center text-sm text-gray-400">
                  Ad Space
                </div>
              </div>
            </main>

            {/* Right Sidebar - Ad Space */}
            <aside className="hidden lg:block w-[160px] min-w-[160px] bg-gray-50">
              <div className="sticky top-20 p-4">
                <div className="w-full h-[600px] bg-gray-100 flex items-center justify-center text-sm text-gray-400">
                  Ad Space
                </div>
              </div>
            </aside>
          </div>

          <Footer />
        </div>
      </body>
    </html>
  );
}
