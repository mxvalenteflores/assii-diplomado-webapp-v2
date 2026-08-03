import { useEffect, useState } from "react"
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

export default function FormResponsesPage() {
  const [responses, setResponses] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [convertingId, setConvertingId] = useState<string | null>(null)

  useEffect(() => {
    fetchResponses()
  }, [])

  const fetchResponses = async () => {
    try {
      const result = await pb.collection("students").getList<Student>(1, 1000, {
        sort: "-created",
      })
      setResponses(result.items.filter((s) => s.formData && s.formData !== ""))
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

  const handleConvertToStudent = async (student: Student) => {
    setConvertingId(student.id)
    try {
      const diplomados = await pb.collection("diplomados").getList(1, 1000, {})
      const diplomadoId = diplomados.items[0]?.id || ""

      const existing = await pb.collection("enrollments").getList(1, 1000, {
        filter: `studentId="${student.id}"`,
      })

      if (existing.items.length > 0) {
        toast.info("Este estudiante ya tiene una inscripción")
        setConvertingId(null)
        return
      }

      await pb.collection("enrollments").create({
        studentId: student.id,
        diplomadoId,
        status: "PENDING_PAYMENT",
        paymentAmount: 5000,
      })

      toast.success(`${student.firstName} ${student.lastName} inscrito correctamente`)
      fetchResponses()
    } catch (e) {
      toast.error("Error al crear inscripción")
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
              {responses.map((r) => (
                <tr key={r.id} className="border-b border-border">
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
                      onClick={() => handleConvertToStudent(r)}
                      disabled={convertingId === r.id}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dark disabled:opacity-50"
                    >
                      {convertingId === r.id ? "Inscribiendo..." : "Crear inscripción"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
