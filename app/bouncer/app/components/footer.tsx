export default function Footer() {
  return (
    <footer className="mb-16">
      <p className="text-xs uppercase mt-8">
        © {new Date().getFullYear()} Sanjay Yepuri <span>• chasing light</span>
      </p>
      <p className="text-xs uppercase mt-2 text-neutral-500 dark:text-neutral-400">
        Built for my friends.
      </p>
      <p className="text-xs uppercase mt-2 text-neutral-500 dark:text-neutral-400">
        Typeset in{' '}
        <a
          href="https://departuremono.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-neutral-800 dark:hover:text-neutral-200 transition-all"
        >
          Departure Mono
        </a>{' '}
        by Helena Zhang
      </p>
    </footer>
  )
}
