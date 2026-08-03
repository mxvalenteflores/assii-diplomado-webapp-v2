import { useEffect, useState } from "react"
import { useParams, useNavigate, useLocation, Link } from "react-router-dom"
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

export default function ResponseDetail() {
  const { studentId } = useParams<{ studentId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const cameFrom = location.state?.from === "students" ? "students" : "responses"

  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) return
      try {
        const s = await pb.collection("students").getOne<Student>(studentId)
        setStudent(s)

        const enrollments = await pb.collection("enrollments").getList(1, 10, {
          filter: `studentId="${studentId}"`,
        })
        if (enrollments.items.length > 0) {
          setAlreadyEnrolled(true)
        }
      } catch {
        navigate("/dashboard/responses")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [studentId, navigate])

  const handleEnroll = async () => {
    if (!studentId || alreadyEnrolled) return
    setEnrolling(true)
    try {
      const diplomados = await pb.collection("diplomados").getList(1, 10)
      const diplomadoId = diplomados.items[0]?.id || ""

      await pb.collection("enrollments").create({
        studentId,
        diplomadoId,
        status: "PENDING_PAYMENT",
        paymentAmount: 5000,
      })

      toast.success("Inscripción creada correctamente")
      setAlreadyEnrolled(true)
    } catch {
      toast.error("Error al crear inscripción")
    } finally {
      setEnrolling(false)
    }
  }

  const getField = (key: string): string => {
    if (!student?.formData) return "—"
    try {
      const data = JSON.parse(student.formData)
      const val = data[key]
      if (typeof val === "string") return val
      if (Array.isArray(val)) return val.join(", ")
      if (val !== undefined && val !== null) return String(val)
      return "—"
    } catch {
      return "—"
    }
  }

  const formFields = [
    { key: "nombre_completo", label: "Nombre completo" },
    { key: "correo_electronico", label: "Correo electrónico" },
    { key: "telefono", label: "Teléfono" },
    { key: "empresa", label: "Empresa / Organización" },
    { key: "puesto", label: "Puesto / Cargo" },
    { key: "nivel_estudios", label: "Nivel máximo de estudios" },
    { key: "experiencia_sst", label: "Años de experiencia en SST" },
    { key: "conocimientos_previos", label: "Conocimientos previos (1-5)" },
    { key: "motivacion", label: "¿Por qué te interesa este diplomado?" },
    { key: "expectativas", label: "¿Qué esperas aprender?" },
    { key: "tipo_participante", label: "Tipo de participante" },
    { key: "areas_interes", label: "Áreas de interés" },
    { key: "como_se_entero", label: "¿Cómo se enteró?" },
    { key: "factura", label: "¿Requiere factura?" },
    { key: "comentarios", label: "Comentarios adicionales" },
  ]

  if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>
  if (!student) return null

  return (
    <div>
      <Link
        to={cameFrom === "students" ? "/dashboard/students" : "/dashboard/responses"}
        className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← Volver a {cameFrom === "students" ? "estudiantes" : "respuestas"}
      </Link>

      <div className="mb-8 rounded-xl border border-border bg-white p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="font-sora text-2xl font-bold">
              {student.firstName} {student.lastName}
            </h1>
            <div className="mt-2 flex flex-wrap gap-6 text-sm text-muted-foreground">
              {student.email && <span>Email: {student.email}</span>}
              {student.phone && <span>Tel: {student.phone}</span>}
              {student.empresa && <span>Empresa: {student.empresa}</span>}
              {student.puesto && <span>Puesto: {student.puesto}</span>}
            </div>
          </div>
          <button
            onClick={handleEnroll}
            disabled={alreadyEnrolled || enrolling}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
              alreadyEnrolled
                ? "cursor-not-allowed bg-gray-400"
                : "bg-primary hover:bg-primary-dark disabled:opacity-50"
            }`}
          >
            {alreadyEnrolled ? "Ya inscrito" : enrolling ? "Creando..." : "Crear inscripción"}
          </button>
        </div>

        <div className="border-t border-border pt-6">
          <h2 className="mb-4 font-sora text-lg font-semibold">Respuestas del formulario</h2>
          <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {formFields.map((field) => (
              <div key={field.key} className="rounded-lg bg-muted/30 p-3">
                <dt className="mb-1 text-xs font-medium text-muted-foreground">{field.label}</dt>
                <dd className="text-sm">{getField(field.key)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}
