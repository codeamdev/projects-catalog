import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <p className="text-7xl font-black text-gray-200 mb-4">404</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Página no encontrada</h1>
        <p className="text-gray-500 text-sm mb-8">
          La URL que buscás no existe o fue movida.
        </p>
        <Link
          href="/"
          className="inline-block bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
