import "./globals.css";

export const metadata = {
  title: "OceanSense 🌊",
  description: "Live ocean intelligence assistant",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
