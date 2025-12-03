import { Inter, Space_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
})

const spaceMono = Space_Mono({ 
  weight: '700',
  subsets: ['latin'],
  variable: '--font-space-mono'
})

export const metadata = {
  title: 'Cosmic Calendar | Astronomy Picture of the Day',
  description: 'An immersive web application displaying NASA\'s Astronomy Picture of the Day',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className={`${inter.variable} ${spaceMono.variable}`} style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
