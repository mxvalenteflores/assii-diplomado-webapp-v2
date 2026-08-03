import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { pb } from "../lib/pb"

interface Student {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  empresa: string
  puesto: string
  created: string
}

interface Enrollment {
  id: string
  status: string
  studentId: string
  created: string
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

export default function StudentsPage() {
  const [students, setStudents] = useState<(Student & { enrollmentStatus?: string; enrollmentId?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newStudent, setNewStudent] = useState({ firstName: "", lastName: "", email: "", phone: "", empresa: "", puesto: "" })
  const navigate = useNavigate()

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const [studentList, enrollments] = await Promise.all([
        pb.collection("students").getFullList<Student>({ sort: "-created" }),
        pb.collection("enrollments").getFullList<Enrollment>({ sort: "-created" }),
      ])

      const enrollMap: Record<string, { status: string; id: string }> = {}
      for (const e of enrollments) {
        if (e.studentId && !enrollMap[e.studentId]) {
          enrollMap[e.studentId] = { status: e.status, id: e.id }
        }
      }

      setStudents(
        studentList.map((s) => ({
          ...s,
          enrollmentStatus: enrollMap[s.id]?.status,
          enrollmentId: enrollMap[s.id]?.id,
        }))
      )
    } catch {
      toast.error("Error al cargar estudiantes")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const student = await pb.collection("students").create(newStudent)

      const diplomados = await pb.collection("diplomados").getFullList()
      const diplomadoId = diplomados[0]?.id || ""

      await pb.collection("enrollments").create({
        studentId: student.id,
        diplomadoId,
        status: "PENDING_PAYMENT",
        paymentAmount: 5000,
      })

      toast.success("Estudiante creado")
      setShowCreateModal(false)
      setNewStudent({ firstName: "", lastName: "", email: "", phone: "", empresa: "", puesto: "" })
      fetchStudents()
    } catch {
      toast.error("Error al crear estudiante")
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando estudiantes...</div>
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-sora text-xl font-semibold">Estudiantes</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          Crear estudiante
        </button>
      </div>

      {students.length === 0 ? (
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
                <th className="px-4 py-3 text-left font-medium">Teléfono</th>
                <th className="px-4 py-3 text-left font-medium">Empresa</th>
                <th className="px-4 py-3 text-left font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => {
                    if (s.enrollmentId) {
                      navigate(`/dashboard/students/${s.enrollmentId}`)
                    }
                  }}
                  className={`border-b border-border transition hover:bg-muted/30 ${s.enrollmentId ? "cursor-pointer" : ""}`}
                >
                  <td className="px-4 py-3 font-medium">
                    {s.firstName} {s.lastName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.email || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.phone || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.empresa || "—"}</td>
                  <td className="px-4 py-3">
                    {s.enrollmentStatus ? (
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s.enrollmentStatus] || ""}`}>
                        {STATUS_LABELS[s.enrollmentStatus] || s.enrollmentStatus}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin inscripción</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-lg">
            <h3 className="mb-4 font-sora text-lg font-semibold">Crear estudiante</h3>
            <form onSubmit={handleCreateStudent} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium">Nombre *</label>
                  <input
                    required
                    value={newStudent.firstName}
                    onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                    className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">Apellido *</label>
                  <input
                    required
                    value={newStudent.lastName}
                    onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                    className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Email *</label>
                <input
                  required
                  type="email"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Teléfono</label>
                <input
                  value={newStudent.phone}
                  onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                  className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Empresa</label>
                <input
                  value={newStudent.empresa}
                  onChange={(e) => setNewStudent({ ...newStudent, empresa: e.target.value })}
                  className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Puesto</label>
                <input
                  value={newStudent.puesto}
                  onChange={(e) => setNewStudent({ ...newStudent, puesto: e.target.value })}
                  className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
                >
                  Crear estudiante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
