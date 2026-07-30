import "./globals.css";

export const metadata = {
  title: "Support Workspace",
  description: "Knowledge-grounded support workspace UI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
