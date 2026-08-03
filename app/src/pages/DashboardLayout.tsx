import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { pb } from "../lib/pb"

export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const isAdmin = pb.authStore.record?.email === "arqonlabshq@gmail.com"

  const handleLogout = () => {
    pb.authStore.clear()
    navigate("/login")
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border bg-white px-6 py-4">
        <h1 className="font-sora text-lg font-bold text-primary">ASSII Diplomados</h1>
        <div className="flex items-center gap-4">
          <nav className="flex gap-4 text-sm">
            <button
              onClick={() => navigate("/dashboard/responses")}
              className={isActive("/dashboard/responses") ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}
            >
              Respuestas
            </button>
            <button
              onClick={() => navigate("/dashboard/students")}
              className={isActive("/dashboard/students") ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}
            >
              Estudiantes
            </button>
            {isAdmin && (
              <a href="/_/" target="_blank" className="text-muted-foreground hover:text-foreground">
                Admin PB
              </a>
            )}
          </nav>
          <span className="text-sm text-muted-foreground">
            {pb.authStore.record?.email}
          </span>
          <button
            onClick={handleLogout}
            className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        <Outlet />
      </main>
    </div>
  )
}
