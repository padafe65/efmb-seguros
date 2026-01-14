export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-6 mt-12">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-sm opacity-70">
          © {new Date().getFullYear()} Plataforma EFMB Seguros — Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
