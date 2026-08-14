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

const WHATSAPP_NUMBER = "529934618242"
const WHATSAPP_MESSAGE = "Hola, acabo de responder el formulario de inscripcion."

interface Sesion {
  fecha: string[]
  instructores: string[]
  temas: string[]
}

interface Modulo {
  numeral: string
  titulo: string
  sesiones: Sesion[]
}

const TEMARIO: Modulo[] = [
  {
    numeral: "I",
    titulo: "FUNDAMENTOS DE LA SEGURIDAD Y LA SALUD EN EL TRABAJO.",
    sesiones: [
      {
        fecha: ["Domingo 23 de agosto"],
        instructores: ["Alejandro Barriguete", "Mario Gil"],
        temas: ["Antecedentes", "Conceptos Básicos", "Estructura de Trabajo Final"],
      },
    ],
  },
  {
    numeral: "II",
    titulo: "MARCO NORMATIVO DE LA SEGURIDAD Y LA SALUD EN EL TRABAJO.",
    sesiones: [
      {
        fecha: ["Domingo 30 de agosto"],
        instructores: ["Luis Alberto Beltrán Arias", "Luis Alberto Rodríguez Palafox"],
        temas: ["Marco Normativo Nacional", "Convenios y Tratados", "Normas Internacionales"],
      },
    ],
  },
  {
    numeral: "III",
    titulo: "SEGURIDAD EN EL TRABAJO.",
    sesiones: [
      {
        fecha: ["Domingo 06 de septiembre", "Domingo 13 de septiembre"],
        instructores: ["Luis Alberto Rodríguez Palafox", "Michelle Roselló Osorio"],
        temas: ["Instalaciones", "Maquinaria", "Actividades de Riesgo"],
      },
    ],
  },
  {
    numeral: "IV",
    titulo: "SALUD EN EL TRABAJO.",
    sesiones: [
      {
        fecha: ["Domingo 20 de septiembre", "Domingo 27 de septiembre"],
        instructores: ["Cesar Ponce Patiño", "Adrián Esteban Díaz Romero"],
        temas: [
          "Agentes Químicos",
          "Agentes Físicos",
          "Agentes Biológicos",
          "Factores de Riesgo Psicosocial",
          "Factores de Riesgo Ergonómico",
        ],
      },
    ],
  },
  {
    numeral: "V",
    titulo: "GESTIÓN DE LA SEGURIDAD Y LA SALUD EN EL TRABAJO.",
    sesiones: [
      {
        fecha: ["Domingo 04 de octubre"],
        instructores: ["Michelle Roselló Osorio", "Luis Alberto Beltrán Arias"],
        temas: [
          "Servicios preventivos de SST",
          "Registro Estadístico de Riesgos de Trabajo",
          "Comisiones de Seguridad e Higiene",
        ],
      },
      {
        fecha: ["Domingo 11 de octubre"],
        instructores: ["Cesar Ponce Patiño", "Adrián Esteban Díaz Romero"],
        temas: ["Diagnóstico y Evaluación de SST para la Autogestión"],
      },
      {
        fecha: ["Domingo 18 de octubre"],
        instructores: ["Alejandro Barriguete", "Mario Gil"],
        temas: [
          "Análisis de Riesgos en las Organizaciones",
          "Programas Internos de Protección Civil",
          "Sistemas Integrados de Gestión",
        ],
      },
      {
        fecha: ["Domingo 25 de octubre"],
        instructores: ["Alejandro Barriguete", "Mario Gil"],
        temas: [
          "Análisis de Riesgos en las Organizaciones",
          "Programas Internos de Protección Civil",
          "Sistemas Integrados de Gestión",
        ],
      },
    ],
  },
  {
    numeral: "VI",
    titulo: "GESTIÓN TECNOLÓGICA CON PERSPECTIVA DE SEGURIDAD Y SALUD EN EL TRABAJO",
    sesiones: [
      {
        fecha: ["Domingo 01 de noviembre"],
        instructores: ["Alejandro Barriguete", "Mario Gil"],
        temas: ["Internet de las cosas", "Inteligencia artificial"],
      },
    ],
  },
  {
    numeral: "VII",
    titulo: "PROYECTO INTEGRAL DE SEGURIDAD Y SALUD EN EL TRABAJO (TRABAJO RECEPCIONAL)",
    sesiones: [
      {
        fecha: ["Domingo 08 de noviembre"],
        instructores: ["Todos"],
        temas: ["Revisión", "Presentación"],
      },
    ],
  },
]

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
    const phone = values.telefono || ""

    try {
      const existingStudents = await pb.collection("students").getList(1, 1000, {
        filter: `email="${email}"`,
      })

      let studentId: string
      if (existingStudents.items.length > 0) {
        studentId = existingStudents.items[0].id
        await pb.collection("students").update(studentId, {
          formData: JSON.stringify(values),
        })
      } else {
        const newStudent = await pb.collection("students").create({
          email,
          firstName,
          lastName,
          phone,
          empresa: values.empresa || "",
          puesto: values.puesto || "",
          formData: JSON.stringify(values),
        })
        studentId = newStudent.id
      }

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
    const waMessage = encodeURIComponent(WHATSAPP_MESSAGE)
    const waUrl = `https://api.whatsapp.com/send/?phone=${WHATSAPP_NUMBER}&text=${waMessage}`

    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mb-2 font-sora text-xl font-bold">Registro enviado con éxito</h1>
          <p className="mb-4 text-sm text-muted-foreground">
            En breve recibirás un correo electrónico con los datos de pago para continuar con tu proceso de inscripción.
          </p>
          <p className="mb-6 text-sm text-muted-foreground">
            Si tienes dudas, puedes contactarnos por WhatsApp.
          </p>
          <button
            onClick={() => window.open(waUrl, "_blank")}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-green-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
            </svg>
            Ir a WhatsApp
          </button>
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
          <h2 className="font-sora text-2xl font-bold">
            Diplomado en Competencias Gerenciales para la Gestión de la Seguridad y Salud en el Trabajo
          </h2>

          <div className="mt-4 space-y-4 text-sm text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground">Objetivo del diplomado</h3>
              <p className="mt-1">
                Desarrollar competencias en el personal de alta y media gerencia en materia de
                seguridad y salud en el trabajo, asegurando el cumplimiento normativo de manera
                práctica y sistemática, y creando así entornos laborales seguros y saludables,
                sincronizando el Marco Normativo Nacional con la Normatividad Internacional.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground">Dirigido a</h3>
              <p className="mt-1">
                Personal de alta y media gerencia y coordinaciones de Seguridad y Salud en el
                Trabajo en empresas e instituciones públicas de todos los giros; profesionistas con
                enfoque laboral en esta materia; personal operativo y dirigencias sindicales
                responsables del seguimiento de la seguridad y salud en el trabajo de sus agremiados.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground">Modalidad</h3>
              <p className="mt-1">
                En línea sincrónica. Las sesiones (5 horas) se llevarán a cabo en tiempo real con los
                instructores a través de la plataforma Google Meet, con actividades asincrónicas y
                espacios para la resolución de dudas.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground">Requerimientos técnicos</h3>
              <p className="mt-1">
                Computadora, tableta o teléfono celular con cámara y acceso estable a internet.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground">Duración</h3>
              <p className="mt-1">12 semanas, del 09 de agosto al 25 de octubre</p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground">Inversión del programa</h3>
              <p className="mt-1 font-semibold text-foreground">$10,000.00</p>
              <div className="mt-1 space-y-1">
                <p className="font-medium text-foreground">Descuento 25%</p>
                <p>Afiliados, Estudiantes y Egresados de Instituciones con convenio ASSII.</p>
                <p>Empresas, Sindicatos e Instituciones participantes del COCOESST y REDVITAB.</p>
                <p className="text-xs">*Detalles en la página https://diplomadosassii.site/</p>
              </div>
              <div className="mt-2 space-y-1">
                <p className="font-medium text-foreground">Entrega de reconocimientos</p>
                <p>Tercera semana de noviembre (Reunión COCOESST)*</p>
                <p className="text-xs">
                  *Es necesario haber cubierto la totalidad del diplomado para recibir documentación.
                </p>
              </div>
            </div>

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

        <div className="mb-8">
          <h3 className="font-sora text-lg font-bold">Temario</h3>
          <div className="mt-4 space-y-4">
            {TEMARIO.map((modulo) => (
              <div key={modulo.numeral} className="rounded-xl border border-border bg-white p-5">
                <h4 className="font-semibold text-foreground">
                  {modulo.numeral}. {modulo.titulo}
                </h4>
                {modulo.sesiones.map((sesion, i) => (
                  <div key={i} className="mt-3">
                    <p className="text-sm font-medium text-primary">{sesion.fecha.join(" y ")}</p>
                    <p className="text-sm text-muted-foreground">
                      Instructores: {sesion.instructores.join(", ")}
                    </p>
                    <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
                      {sesion.temas.map((tema) => (
                        <li key={tema}>{tema}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <h3 className="mb-4 font-sora text-lg font-bold">Formulario de Inscripción</h3>

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

          <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-primary mb-1">Información administrativa</p>
            <p>La gestión de la inversión al inscribirse al diplomado está administrada por <strong>Grupo ISIBSA MX</strong>. Una vez enviado el formulario, recibirá un correo electrónico con los detalles administrativos, datos bancarios y políticas de facturación.</p>
          </div>

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
