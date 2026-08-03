import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { pb } from "../lib/pb"

interface Clase {
  id: string
  title: string
  description: string
  date: string
  meetingUrl: string
  status: string
}

interface Recording {
  id: string
  title: string
  url: string
  duration: string
  classId: string
}

const getDiplomadoId = async () => {
  const records = await pb.collection("diplomados").getFullList()
  return records[0]?.id || ""
}

export default function ClassesPage() {
  const navigate = useNavigate()
  const [classes, setClasses] = useState<Clase[]>([])
  const [recordingsByClass, setRecordingsByClass] = useState<Record<string, Recording[]>>({})
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Clase | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [meetingUrl, setMeetingUrl] = useState("")

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      const dipId = await getDiplomadoId()
      const records = await pb.collection("classes").getFullList<Clase>({
        filter: `diplomadoId="${dipId}"`,
        sort: "+date",
      })
      setClasses(records)

      // Fetch recordings for all classes
      const classIds = records.map((c) => c.id)
      if (classIds.length > 0) {
        const recs = await pb.collection("recordings").getFullList<Recording>({
          filter: classIds.map((id) => `classId="${id}"`).join("||"),
          sort: "+created",
        })
        const map: Record<string, Recording[]> = {}
        for (const r of recs) {
          if (!map[r.classId]) map[r.classId] = []
          map[r.classId].push(r)
        }
        setRecordingsByClass(map)
      }
    } catch {
      pb.authStore.clear()
      navigate("/login")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!title || !date) return
    try {
      const dipId = await getDiplomadoId()
      if (editing) {
        await pb.collection("classes").update(editing.id, { title, description, date, meetingUrl })
        toast.success("Clase actualizada")
      } else {
        await pb.collection("classes").create({
          title,
          description,
          date,
          meetingUrl,
          diplomadoId: dipId,
          status: "SCHEDULED",
        })
        toast.success("Clase creada")
      }
      setShowModal(false)
      setEditing(null)
      setTitle("")
      setDescription("")
      setDate("")
      setMeetingUrl("")
      fetchClasses()
    } catch {
      toast.error("Error al guardar")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta clase?")) return
    try {
      await pb.collection("classes").delete(id)
      toast.success("Clase eliminada")
      fetchClasses()
    } catch {
      toast.error("Error al eliminar")
    }
  }

  const handleAddRecording = async (classId: string) => {
    const t = prompt("Título de la grabación:")
    const u = prompt("URL de la grabación:")
    if (!t || !u) return
    try {
      await pb.collection("recordings").create({
        title: t,
        url: u,
        duration: "",
        classId,
      })
      toast.success("Grabación agregada")
      fetchClasses()
    } catch {
      toast.error("Error al agregar grabación")
    }
  }

  const handleDeleteRecording = async (id: string) => {
    if (!confirm("¿Eliminar esta grabación?")) return
    try {
      await pb.collection("recordings").delete(id)
      toast.success("Grabación eliminada")
      fetchClasses()
    } catch {
      toast.error("Error al eliminar grabación")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border bg-white px-6 py-4">
        <h1 className="font-sora text-lg font-bold text-primary">ASSII Diplomados</h1>
        <div className="flex items-center gap-4">
          <nav className="flex gap-4 text-sm">
            <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground">
              Estudiantes
            </button>
            <button onClick={() => navigate("/classes")} className="font-medium text-foreground">
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
            onClick={() => { pb.authStore.clear(); navigate("/login") }}
            className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-sora text-xl font-semibold">Clases y Grabaciones</h2>
          <button
            onClick={() => setShowModal(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Nueva clase
          </button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : classes.length === 0 ? (
          <p className="text-muted-foreground">No hay clases programadas.</p>
        ) : (
          <div className="space-y-4">
            {classes.map((c) => (
              <div key={c.id} className="rounded-xl border border-border bg-white p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{c.title}</h3>
                    {c.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                    )}
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(c.date).toLocaleDateString("es-MX", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {c.meetingUrl && (
                      <a
                        href={c.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-sm text-primary underline"
                      >
                        Link de sesión
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditing(c)
                        setTitle(c.title)
                        setDescription(c.description || "")
                        setDate(c.date.slice(0, 16))
                        setMeetingUrl(c.meetingUrl || "")
                        setShowModal(true)
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                {recordingsByClass[c.id] && recordingsByClass[c.id].length > 0 && (
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Grabaciones</p>
                    {recordingsByClass[c.id].map((r) => (
                      <div key={r.id} className="flex items-center justify-between py-1 text-sm">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          {r.title}
                        </a>
                        <button
                          onClick={() => handleDeleteRecording(r.id)}
                          className="text-xs text-red-500"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => handleAddRecording(c.id)}
                  className="mt-3 text-xs font-medium text-primary hover:underline"
                >
                  + Agregar grabación
                </button>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-lg">
              <h3 className="mb-4 font-sora text-lg font-semibold">
                {editing ? "Editar clase" : "Nueva clase"}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Título</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Descripción</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Fecha y hora</label>
                  <input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">URL de la sesión</label>
                  <input
                    type="url"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    placeholder="https://meet.google.com/..."
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowModal(false)
                      setEditing(null)
                      setTitle("")
                      setDescription("")
                      setDate("")
                      setMeetingUrl("")
                    }}
                    className="flex-1 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
                  >
                    {editing ? "Guardar cambios" : "Crear clase"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
