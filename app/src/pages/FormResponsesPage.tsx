import { useEffect, useState } from "react"
import { toast } from "sonner"
import { pb } from "../lib/pb"

interface FormResponse {
  id: string
  studentId: string
  formId: string
  data: string | Record<string, unknown>
  created: string
}

interface Student {
  id: string
  email: string
  firstName: string
  lastName: string
}

export default function FormResponsesPage() {
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [convertingId, setConvertingId] = useState<string | null>(null)

  useEffect(() => {
    fetchResponses()
  }, [])

  const fetchResponses = async () => {
    try {
      const records = await pb.collection("form_submissions").getFullList<FormResponse>({
        sort: "-created",
      })
      setResponses(records)
    } catch (e) {
      console.error("Form responses fetch error:", e)
      toast.error("Error al cargar respuestas")
    } finally {
      setLoading(false)
    }
  }

  const getField = (rawData: string | Record<string, unknown>, key: string): string => {
    const data = typeof rawData === "string" ? JSON.parse(rawData) : rawData
    const val = data[key]
    if (typeof val === "string") return val
    if (Array.isArray(val)) return val.join(", ")
    if (val !== undefined && val !== null) return String(val)
    return "—"
  }

  const handleConvertToStudent = async (response: FormResponse) => {
    setConvertingId(response.id)
    try {
      const email = getField(response.data, "correo_electronico")
      const fullName = getField(response.data, "nombre_completo")
      const firstName = fullName.split(" ")[0] || ""
      const lastName = fullName.split(" ").slice(1).join(" ") || ""

      let studentId = response.studentId

      if (!studentId) {
        const existing = await pb.collection("students").getFullList<Student>({
          filter: `email="${email}"`,
        })
        if (existing.length > 0) {
          studentId = existing[0].id
        } else {
          const newStudent = await pb.collection("students").create({
            email,
            firstName,
            lastName,
            phone: getField(response.data, "telefono"),
            empresa: getField(response.data, "empresa"),
            puesto: getField(response.data, "puesto"),
          })
          studentId = newStudent.id
          await pb.collection("form_submissions").update(response.id, { studentId })
        }
      }

      const diplomados = await pb.collection("diplomados").getFullList()
      const diplomadoId = diplomados[0]?.id || ""

      await pb.collection("enrollments").create({
        studentId,
        diplomadoId,
        status: "PENDING_PAYMENT",
        paymentAmount: 5000,
      })

      toast.success(`${firstName} ${lastName} convertido a estudiante`)
      fetchResponses()
    } catch (e) {
      const msg = (e as { message?: string })?.message || ""
      if (msg.includes("Ya existe")) {
        toast.info("Este estudiante ya tiene una inscripción")
      } else {
        toast.error("Error al convertir en estudiante")
      }
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
                    {getField(r.data, "nombre_completo")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {getField(r.data, "correo_electronico")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {getField(r.data, "telefono")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {getField(r.data, "empresa")}
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
                      {convertingId === r.id ? "Convirtiendo..." : "Convertir en estudiante"}
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
