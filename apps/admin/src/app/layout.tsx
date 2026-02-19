import "./globals.css";
import { Sidebar } from "@/components/sidebar";

export const metadata = {
  title: "CalorieHero Admin",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex h-screen bg-zinc-50 text-zinc-900 antialiased">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </body>
    </html>
  );
}
