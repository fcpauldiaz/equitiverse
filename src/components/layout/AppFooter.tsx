import { Logo } from '#/components/ui/Logo'

export function AppFooter() {
  return (
    <footer className="mt-auto bg-rs-dark shell-gutter py-12 text-white">
      <div className="mx-auto max-w-[1194px]">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <Logo variant="inverse" linked={false} />
            <p className="mt-3 max-w-sm text-sm text-white/70">
              Your equity position universe. Deciphering the Enigma of Markets.
            </p>
            <p className="mt-2 text-xs text-white/50">
              by{' '}
              <a
                href="https://www.edgebyrs.com/"
                target="_blank"
                rel="noreferrer"
                className="text-rs-blue hover:text-white/80"
              >
                EdgebyRS
              </a>
            </p>
          </div>

          <p className="max-w-md text-xs leading-relaxed text-white/50">
            Prices are delayed (~15 minutes) and for informational purposes
            only. Not financial advice. Past performance does not guarantee
            future results.
          </p>
        </div>

        <p className="mt-8 text-xs text-white/40">
          © {new Date().getFullYear()} EquitiVerse. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
