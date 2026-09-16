const skeleton = 'animate-pulse rounded-md bg-gray-200 dark:bg-gray-800'

export function EditorLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="relative min-h-screen flex flex-col bg-[#F5F7FA] dark:bg-gray-950"
    >
      <span className="sr-only">Carregando curso...</span>

      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-[#e5e7eb] dark:border-gray-800 sticky top-0 z-50">
        <div className="px-3 sm:px-6 py-3">
          <div className="flex h-10 items-center justify-between gap-4" aria-hidden>
            <div className="flex items-center gap-3">
              <div className={`${skeleton} h-8 w-8`} />
              <div className={`${skeleton} h-5 w-40 sm:w-64`} />
            </div>
            <div className={`${skeleton} hidden h-9 w-72 md:block`} />
            <div className="flex items-center gap-2">
              <div className={`${skeleton} h-8 w-8`} />
              <div className={`${skeleton} h-8 w-8`} />
              <div className={`${skeleton} h-9 w-24`} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-3 sm:px-6 py-6" aria-hidden>
        <div className="max-w-[760px] mx-auto flex flex-col gap-6">
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className={`${skeleton} h-5 w-20`} />
            <div className={`${skeleton} mt-4 h-7 w-3/4`} />
            <div className={`${skeleton} mt-3 h-4 w-full`} />
            <div className={`${skeleton} mt-2 h-4 w-2/3`} />
          </div>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="rounded-xl border border-[#e5e7eb] bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className={`${skeleton} h-4 w-full`} />
              <div className={`${skeleton} mt-2 h-4 w-5/6`} />
              <div className={`${skeleton} mt-2 h-4 w-1/2`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
