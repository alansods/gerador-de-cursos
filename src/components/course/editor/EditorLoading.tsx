export function EditorLoading() {
  return (
    <div
      role="status"
      className="min-h-screen flex items-center justify-center bg-[#F5F7FA] dark:bg-gray-950"
    >
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400">Carregando curso...</p>
      </div>
    </div>
  )
}
