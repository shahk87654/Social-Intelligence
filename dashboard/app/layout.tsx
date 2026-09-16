import "./globals.css";

export const metadata = {
  title: "Social Intelligence Dashboard",
  description: "Keyword monitoring for public Facebook & Instagram content",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
