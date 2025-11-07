import '../../src/styles/globals.css'
import Navbar from '../../src/components/Navbar'
import Footer from '../../src/components/Footer'
export const metadata = { title: 'Ocean Sense — StormSense' }
export default function RootLayout({ children }){
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
