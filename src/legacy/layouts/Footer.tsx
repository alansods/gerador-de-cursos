export default function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white py-8 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">
            SENAI - Serviço Nacional de Aprendizagem Industrial
          </h3>
          <p className="text-muted-foreground text-sm">
            Desenvolvendo competências para a indústria brasileira
          </p>
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-muted-foreground text-xs">
            © 2025 SENAI. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
