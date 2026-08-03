import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { pb } from "../lib/pb"

interface Enrollment {
  id: string
  status: string
  created: string
  expand?: {
    studentId: {
      id: string
      email: string
      firstName: string
      lastName: string
    }
  }
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Pendiente de pago",
  PAYMENT_SUBMITTED: "Pago enviado",
  ACTIVE: "Activo",
  PAYMENT_REJECTED: "Pago rechazado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
}

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
  PAYMENT_SUBMITTED: "bg-blue-100 text-blue-800",
  ACTIVE: "bg-green-100 text-green-800",
  PAYMENT_REJECTED: "bg-red-100 text-red-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-gray-100 text-gray-500",
}

export default function Dashboard() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const records = await pb.collection("enrollments").getFullList<Enrollment>({
          sort: "-created",
          expand: "studentId",
        })
        setEnrollments(records)
      } catch {
        pb.authStore.clear()
        navigate("/login")
      } finally {
        setLoading(false)
      }
    }
    fetchEnrollments()
  }, [navigate])

  const handleLogout = () => {
    pb.authStore.clear()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border bg-white px-6 py-4">
        <h1 className="font-sora text-lg font-bold text-primary">ASSII Diplomados</h1>
        <div className="flex items-center gap-4">
          <nav className="flex gap-4 text-sm">
            <button onClick={() => navigate("/dashboard")} className="font-medium text-foreground">
              Estudiantes
            </button>
            <button onClick={() => navigate("/classes")} className="text-muted-foreground hover:text-foreground">
              Clases
            </button>
            <a href="/_/" target="_blank" className="text-muted-foreground hover:text-foreground">
              Admin PB
            </a>
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
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-sora text-xl font-semibold">Estudiantes inscritos</h2>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Cargando estudiantes...</p>
        ) : enrollments.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">No hay estudiantes registrados aún.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                  <th className="px-4 py-3 text-left font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => navigate(`/students/${e.id}`)}
                    className="cursor-pointer border-b border-border transition hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      {e.expand?.studentId
                        ? `${e.expand.studentId.firstName} ${e.expand.studentId.lastName}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {e.expand?.studentId?.email || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[e.status] || ""}`}
                      >
                        {STATUS_LABELS[e.status] || e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(e.created).toLocaleDateString("es-MX")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
