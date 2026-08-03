import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { pb } from "../lib/pb"

interface Field {
  name: string
  label: string
  type: "text" | "email" | "tel" | "select" | "textarea" | "radio" | "checkbox" | "scale"
  required?: boolean
  options?: string[]
}

interface FormConfig {
  id: string
  title: string
  fields: Field[]
}

interface Diplomado {
  id: string
  name: string
}

export default function FormPage() {
  const { diplomado } = useParams<{ diplomado: string }>()
  const [form, setForm] = useState<FormConfig | null>(null)
  const [diplomadoData, setDiplomadoData] = useState<Diplomado | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [values, setValues] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const d = await pb
          .collection("diplomados")
          .getFirstListItem<Diplomado>(`slug="${diplomado}"`)
        setDiplomadoData(d)

        const f = await pb
          .collection("forms")
          .getFirstListItem<FormConfig>(`diplomadoId="${d.id}" && isActive=true`)
        setForm(f)
      } catch {
        setError("Formulario no encontrado")
      } finally {
        setLoading(false)
      }
    }
    fetchForm()
  }, [diplomado])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return

    const email = values.correo_electronico || ""
    const firstName = values.nombre_completo?.split(" ")[0] || ""
    const lastName = values.nombre_completo?.split(" ").slice(1).join(" ") || ""
    const phone = values.telefono_celular || ""

    try {
      const existingStudents = await pb.collection("students").getFullList({
        filter: `email="${email}"`,
      })

      let studentId: string
      if (existingStudents.length > 0) {
        studentId = existingStudents[0].id
      } else {
        const newStudent = await pb.collection("students").create({
          email,
          firstName,
          lastName,
          phone,
          empresa: values.empresa_organizacion || "",
          puesto: values.puesto_cargo || "",
        })
        studentId = newStudent.id
      }

      await pb.collection("form_responses").create({
        formId: form.id,
        studentId,
        data: values,
      })

      setSubmitted(true)
    } catch {
      setError("Error al enviar el formulario. Intenta de nuevo.")
    }
  }

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Cargando formulario...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mb-2 font-sora text-xl font-bold">Registro enviado</h1>
          <p className="text-sm text-muted-foreground">
            Hemos recibido tu inscripción. Revisa tu correo electrónico para continuar con el proceso.
          </p>
        </div>
      </div>
    )
  }

  if (!form) return null

  const renderField = (field: Field) => {
    const val = values[field.name] || ""

    switch (field.type) {
      case "textarea":
        return (
          <textarea
            id={field.name}
            required={field.required}
            value={val}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            rows={3}
          />
        )
      case "select":
        return (
          <select
            id={field.name}
            required={field.required}
            value={val}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Seleccionar...</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )
      case "radio":
        return (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label key={opt} className="flex items-start gap-2 text-sm">
                <input
                  type="radio"
                  name={field.name}
                  value={opt}
                  checked={val === opt}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="mt-0.5"
                />
                {opt}
              </label>
            ))}
          </div>
        )
      case "checkbox":
        return (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label key={opt} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  name={field.name}
                  value={opt}
                  checked={values[field.name] === opt}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="mt-0.5"
                />
                {opt}
              </label>
            ))}
          </div>
        )
      case "scale":
        return (
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">Básico</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="flex flex-col items-center gap-1">
                  <input
                    type="radio"
                    name={field.name}
                    value={String(n)}
                    checked={val === String(n)}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className="sr-only"
                  />
                  <span
                    className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-sm transition ${
                      val === String(n)
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground hover:bg-primary/20"
                    }`}
                    onClick={() => handleChange(field.name, String(n))}
                  >
                    {n}
                  </span>
                </label>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">Avanzado</span>
          </div>
        )
      case "tel":
        return (
          <input
            id={field.name}
            type="tel"
            required={field.required}
            value={val}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="Solo números"
          />
        )
      case "email":
        return (
          <input
            id={field.name}
            type="email"
            required={field.required}
            value={val}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        )
      default:
        return (
          <input
            id={field.name}
            type="text"
            required={field.required}
            value={val}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <h1 className="font-sora text-lg font-bold text-primary">ASSII Diplomados</h1>
          <span className="text-sm text-muted-foreground">
            {diplomadoData?.name || diplomado}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-6">
        <div className="mb-8">
          <h2 className="font-sora text-2xl font-bold">{form.title}</h2>
          <div className="mt-3 space-y-1 text-sm text-muted-foreground">
            <p>Bienvenido al registro oficial para su inscripción al Diplomado.</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Modalidad: En línea, sincrónico (Google Meet).</li>
              <li>Duración: 12 semanas.</li>
              <li>Sesiones: Domingos del 16 de Agosto al 08 de Noviembre de 2026 de 9:00 a 14:00 hrs.</li>
              <li>Inversión del programa: $10,000.00 MXN (sujeto a esquemas de pago único con descuento o parcialidades según corresponda).</li>
            </ul>
            <p>
              Puede consultar nuestro aviso de privacidad en el siguiente enlace:{" "}
              <a
                href="https://bit.ly/ASSII_AVISODEPRIVACIDADUSODEDATOS_2026"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Aviso de Privacidad
              </a>
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-border bg-white p-6"
        >
          {form.fields.map((field) => (
            <div key={field.name}>
              <label htmlFor={field.name} className="mb-1 block text-sm font-medium">
                {field.label}
                {field.required && <span className="ml-0.5 text-red-500">*</span>}
              </label>
              {renderField(field)}
            </div>
          ))}
          <button
            type="submit"
            className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-white transition hover:bg-primary-dark"
          >
            Enviar inscripción
          </button>
        </form>
      </main>
    </div>
  )
}
