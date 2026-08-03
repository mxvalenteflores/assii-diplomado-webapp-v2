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
  formData: string
  created: string
}

interface Enrollment {
  id: string
  studentId: string
}

export default function FormResponsesPage() {
  const [responses, setResponses] = useState<Student[]>([])
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [convertingId, setConvertingId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchResponses()
  }, [])

  const fetchResponses = async () => {
    try {
      const [studentRes, enrollmentRes] = await Promise.all([
        pb.collection("students").getList<Student>(1, 1000, { sort: "-created" }),
        pb.collection("enrollments").getList<Enrollment>(1, 5000),
      ])

      const enrolled = new Set(enrollmentRes.items.map((e) => e.studentId).filter(Boolean))
      setEnrolledIds(enrolled)
      setResponses(studentRes.items.filter((s) => s.formData && s.formData !== ""))
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const getField = (rawData: string | undefined, key: string): string => {
    if (!rawData) return "—"
    try {
      const data = JSON.parse(rawData)
      const val = data[key]
      if (typeof val === "string") return val
      if (Array.isArray(val)) return val.join(", ")
      if (val !== undefined && val !== null) return String(val)
      return "—"
    } catch {
      return "—"
    }
  }

  const handleCreateStudent = async (student: Student) => {
    if (enrolledIds.has(student.id)) return
    setConvertingId(student.id)
    try {
      const diplomados = await pb.collection("diplomados").getList(1, 1000, {})
      const diplomadoId = diplomados.items[0]?.id || ""

      await pb.collection("enrollments").create({
        studentId: student.id,
        diplomadoId,
        status: "PENDING_PAYMENT",
        paymentAmount: 5000,
      })

      setEnrolledIds((prev) => new Set([...prev, student.id]))
      toast.success(`${student.firstName} ${student.lastName} ahora es estudiante`)
    } catch {
      toast.error("Error al crear estudiante")
    } finally {
      setConvertingId(null)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando respuestas...</div>
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-sora text-xl font-semibold">Respuestas del formulario</h2>
      </div>

      {responses.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No hay respuestas de formulario aún.</p>
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
                <th className="px-4 py-3 text-left font-medium">Fecha</th>
                <th className="px-4 py-3 text-left font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((r) => {
                const isEnrolled = enrolledIds.has(r.id)
                return (
                <tr
                  key={r.id}
                  onClick={() => navigate(`/dashboard/responses/${r.id}`)}
                  className="cursor-pointer border-b border-border transition hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium">
                    {getField(r.formData, "nombre_completo")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {getField(r.formData, "correo_electronico")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {getField(r.formData, "telefono")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {getField(r.formData, "empresa")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.created ? new Date(r.created).toLocaleDateString("es-MX") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCreateStudent(r) }}
                      disabled={isEnrolled || convertingId === r.id}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        isEnrolled
                          ? "cursor-not-allowed bg-gray-300 text-gray-500"
                          : "bg-primary text-white hover:bg-primary-dark disabled:opacity-50"
                      }`}
                    >
                      {isEnrolled ? "Ya es estudiante" : convertingId === r.id ? "Creando..." : "Crear estudiante"}
                    </button>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
