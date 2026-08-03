import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
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
  paymentAmount: number
  studentId: string
  diplomadoId: string
  created: string
}

interface Payment {
  id: string
  amount: number
  status: string
  proof: string
  rejectionReason: string
  created: string
}

interface FormResponse {
  id: string
  data: string | Record<string, unknown>
  formId: string
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

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  VALIDATED: "Validado",
  REJECTED: "Rechazado",
}

export default function StudentDetail() {
  const { enrollmentId } = useParams<{ enrollmentId: string }>()
  const navigate = useNavigate()
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [student, setStudent] = useState<Student | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [formConfigs, setFormConfigs] = useState<Record<string, { title: string; fields: Array<{ name: string; label: string }> }>>({})
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentFile, setPaymentFile] = useState<File | null>(null)
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)
  const [editingAmount, setEditingAmount] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      if (!enrollmentId) return
      try {
        const e = await pb.collection("enrollments").getOne<Enrollment>(enrollmentId)
        setEnrollment(e)

        if (e.studentId) {
          const s = await pb.collection("students").getOne<Student>(e.studentId)
          setStudent(s)

          const r = await pb.collection("inbox").getFullList<FormResponse>({
            filter: `studentId="${e.studentId}"`,
            sort: "-created",
          })
          setResponses(r)

          const formIds = [...new Set(r.map((resp) => resp.formId).filter(Boolean))]
          if (formIds.length > 0) {
            const forms = await pb.collection("forms").getFullList<{ id: string; title: string; fields: Array<{ name: string; label: string }> }>({
              filter: formIds.map((id) => `id="${id}"`).join("||"),
            })
            const configs: Record<string, { title: string; fields: Array<{ name: string; label: string }> }> = {}
            for (const f of forms) {
              configs[f.id] = { title: f.title, fields: f.fields }
            }
            setFormConfigs(configs)
          }
        }

        const p = await pb.collection("payments").getFullList<Payment>({
          filter: `enrollmentId="${enrollmentId}"`,
          sort: "-created",
        })
        setPayments(p)
      } catch {
        navigate("/dashboard")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [enrollmentId, navigate])

  const handleUploadPayment = async () => {
    if (!paymentFile || !enrollmentId || !paymentAmount) return
    try {
      const formData = new FormData()
      formData.append("amount", paymentAmount)
      formData.append("enrollmentId", enrollmentId)
      formData.append("proof", paymentFile)

      await pb.collection("payments").create(formData)
      toast.success("Comprobante subido")

      const p = await pb.collection("payments").getFullList<Payment>({
        filter: `enrollmentId="${enrollmentId}"`,
        sort: "-created",
      })
      setPayments(p)
      setShowPaymentModal(false)
      setPaymentAmount("")
      setPaymentFile(null)
    } catch {
      toast.error("Error al subir comprobante")
    }
  }

  const handleValidate = async (id: string) => {
    try {
      await pb.collection("payments").update(id, { status: "VALIDATED" })
      toast.success("Pago validado")
      const p = await pb.collection("payments").getFullList<Payment>({
        filter: `enrollmentId="${enrollmentId}"`,
        sort: "-created",
      })
      setPayments(p)
    } catch {
      toast.error("Error al validar pago")
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt("Motivo del rechazo:")
    if (!reason) return
    try {
      await pb.collection("payments").update(id, {
        status: "REJECTED",
        rejectionReason: reason,
      })
      toast.success("Pago rechazado")
      const p = await pb.collection("payments").getFullList<Payment>({
        filter: `enrollmentId="${enrollmentId}"`,
        sort: "-created",
      })
      setPayments(p)
    } catch {
      toast.error("Error al rechazar pago")
    }
  }

  const handleUpdateAmount = async (id: string) => {
    if (!editingAmount) return
    try {
      await pb.collection("payments").update(id, { amount: parseFloat(editingAmount) })
      toast.success("Monto actualizado")
      setEditingPaymentId(null)
      setEditingAmount("")
      const p = await pb.collection("payments").getFullList<Payment>({
        filter: `enrollmentId="${enrollmentId}"`,
        sort: "-created",
      })
      setPayments(p)
    } catch {
      toast.error("Error al actualizar monto")
    }
  }

  const handleDeletePayment = async (id: string) => {
    if (!confirm("¿Eliminar este pago?")) return
    try {
      await pb.collection("payments").delete(id)
      toast.success("Pago eliminado")
      const p = await pb.collection("payments").getFullList<Payment>({
        filter: `enrollmentId="${enrollmentId}"`,
        sort: "-created",
      })
      setPayments(p)
    } catch {
      toast.error("Error al eliminar pago")
    }
  }

  const getProofUrl = (payment: Payment) => {
    if (!payment.proof) return null
    return pb.files.getUrl(payment, payment.proof)
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>
  if (!enrollment) return null

  return (
    <div>
      <Link to="/dashboard/students" className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← Volver a estudiantes
      </Link>
        <div className="mb-8">
          <h1 className="font-sora text-2xl font-bold">
            {student ? `${student.firstName} ${student.lastName}` : "Estudiante"}
          </h1>
          <div className="mt-2 flex flex-wrap gap-6 text-sm text-muted-foreground">
            {student?.email && <span>Email: {student.email}</span>}
            {student?.phone && <span>Tel: {student.phone}</span>}
            {student?.empresa && <span>Empresa: {student.empresa}</span>}
            {student?.puesto && <span>Puesto: {student.puesto}</span>}
          </div>
          <span
            className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-medium ${enrollment.status === "ACTIVE" ? "bg-green-100 text-green-800" : enrollment.status === "PENDING_PAYMENT" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}
          >
            {STATUS_LABELS[enrollment.status] || enrollment.status}
          </span>
        </div>

        <div className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-sora text-lg font-semibold">Pagos</h2>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Registrar pago
            </button>
          </div>

          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay pagos registrados.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-white">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Monto</th>
                    <th className="px-4 py-3 text-left font-medium">Estado</th>
                    <th className="px-4 py-3 text-left font-medium">Fecha</th>
                    <th className="px-4 py-3 text-left font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-border">
                      <td className="px-4 py-3">
                        {editingPaymentId === p.id ? (
                          <input
                            type="number"
                            className="w-24 rounded border px-2 py-1 text-sm"
                            value={editingAmount}
                            onChange={(e) => setEditingAmount(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleUpdateAmount(p.id)}
                          />
                        ) : (
                          `$${p.amount.toFixed(2)} MXN`
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            p.status === "VALIDATED"
                              ? "bg-green-100 text-green-800"
                              : p.status === "REJECTED"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {PAYMENT_STATUS_LABELS[p.status] || p.status}
                        </span>
                        {p.rejectionReason && (
                          <p className="mt-1 text-xs text-red-600">Motivo: {p.rejectionReason}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(p.created).toLocaleDateString("es-MX")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {p.proof && (
                            <a
                              href={getProofUrl(p)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary underline"
                            >
                              Ver comprobante
                            </a>
                          )}
                          {editingPaymentId === p.id ? (
                            <button
                              onClick={() => handleUpdateAmount(p.id)}
                              className="text-xs font-medium text-green-600"
                            >
                              Guardar
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingPaymentId(p.id)
                                setEditingAmount(String(p.amount))
                              }}
                              className="text-xs text-muted-foreground hover:text-foreground"
                            >
                              Editar
                            </button>
                          )}
                          {p.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleValidate(p.id)}
                                className="text-xs font-medium text-green-600"
                              >
                                Validar
                              </button>
                              <button
                                onClick={() => handleReject(p.id)}
                                className="text-xs font-medium text-red-600"
                              >
                                Rechazar
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeletePayment(p.id)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-4 font-sora text-lg font-semibold">Formularios respondidos</h2>
          {responses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No ha respondido ningún formulario.</p>
          ) : (
            responses.map((r) => (
              <div key={r.id} className="mb-4 rounded-xl border border-border bg-white p-4">
                <p className="mb-2 text-sm font-medium">
                  {formConfigs[r.formId]?.title || "Formulario"} —{" "}
                  {new Date(r.created).toLocaleDateString("es-MX")}
                </p>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  {formConfigs[r.formId]?.fields?.map((field) => {
                    const parsedData: Record<string, unknown> = typeof r.data === "string" ? JSON.parse(r.data) : r.data
                    return (
                    <div key={field.name}>
                      <dt className="text-muted-foreground">{field.label}</dt>
                      <dd className="font-medium">
                        {Array.isArray(parsedData[field.name])
                          ? (parsedData[field.name] as string[]).join(", ")
                          : String(parsedData[field.name] ?? "—")}
                      </dd>
                    </div>
                    )
                  })}
                </dl>
              </div>
            ))
          )}
        </div>

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-lg">
            <h3 className="mb-4 font-sora text-lg font-semibold">Registrar pago</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Monto (MXN)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="5000.00"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Comprobante (imagen o PDF)
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                  className="w-full text-sm"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    setPaymentAmount("")
                    setPaymentFile(null)
                  }}
                  className="flex-1 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUploadPayment}
                  disabled={!paymentFile || !paymentAmount}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
                >
                  Subir comprobante
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
