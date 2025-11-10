export const metadata = {
  title: 'Ocean Sense',
  description: 'Coastal and marine insights powered by Ocean Sense.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
