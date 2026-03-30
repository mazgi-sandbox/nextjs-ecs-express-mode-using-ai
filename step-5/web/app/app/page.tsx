import Link from 'next/link'

export default function Home() {
  return (
    <main>
      <h1>Hello, Next.js!</h1>
      <p><Link href="/items">Items</Link></p>
    </main>
  )
}
