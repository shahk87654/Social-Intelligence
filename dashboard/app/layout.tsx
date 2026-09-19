import "./globals.css";
import HowToGuide from "@/components/HowToGuide";

export const metadata = {
  title: "Social Intelligence Dashboard",
  description: "Keyword monitoring for public Facebook & Instagram content",
  icons: {
    icon: "/logo.png?v=3",
    shortcut: "/logo.png?v=3",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try { if (localStorage.getItem("signal-theme") === "dark") document.documentElement.classList.add("dark"); } catch (_) {}` }} />
      </head>
      <body className="min-h-screen">{children}<HowToGuide /></body>
    </html>
  );
}
