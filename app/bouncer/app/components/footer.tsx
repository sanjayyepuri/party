
function ArrowIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="mb-16">
      <p className="text-xs uppercase mt-8 ">
        © {new Date().getFullYear()} Sanjay Yepuri <span>• chasing light</span>

      </p>
      <p className="text-xs uppercase mt-2 text-neutral-500 dark:text-neutral-400">
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
