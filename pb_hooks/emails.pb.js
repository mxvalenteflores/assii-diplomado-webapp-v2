/// <reference path="./pb_data/lib.d.ts" />

const agentmailKey = $os.getenv("AGENTMAIL_API_KEY") || ""
const inbox = "arqonlabs%40agentmail.to"

function sendEmail(to, subject, text) {
  if (!agentmailKey) {
    console.log("[EMAIL MOCK]", { to, subject, text: text.slice(0, 80) })
    return
  }
  try {
    $http.send({
      url: `https://api.agentmail.to/v0/inboxes/${inbox}/messages/send`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${agentmailKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to, subject, text }),
    })
  } catch (e) {
    console.error("[EMAIL ERROR]", e)
  }
}

function getStudentEmail(enrollmentId) {
  try {
    const enrollment = $app.findRecordById("enrollments", enrollmentId)
    if (!enrollment) return null
    const studentId = enrollment.get("studentId")
    const student = $app.findRecordById("students", studentId)
    if (!student) return null
    return {
      email: student.get("email"),
      name: `${student.get("firstName")} ${student.get("lastName")}`,
    }
  } catch (_) {
    return null
  }
}

function notifyAdmins(subject, text) {
  try {
    const admins = $app.findRecordsByFilter("admins", "", "", 0, 0)
    for (const a of admins) {
      sendEmail(a.get("email"), subject, text)
    }
  } catch (_) {}
}

onRecordAfterCreateSuccess((e) => {
  const record = e.record
  const colName = record.collection()?.name

  if (colName === "form_responses") {
    const data = record.get("data") || {}
    const email = data.correo_electronico
    const name = data.nombre_completo

    if (email) {
      sendEmail(
        email,
        "Confirmación de inscripción — Diplomado GSST",
        `Hola ${name || ""},\n\nHemos recibido tu inscripción al Diplomado en Competencias Gerenciales para la Gestión de la SST.\n\nEn breve recibirás instrucciones para completar tu proceso de inscripción y realizar el pago correspondiente.\n\nSaludos,\nEquipo ASSII`
      )
    }

    notifyAdmins(
      "Nueva inscripción recibida",
      `${name || "Alguien"} se ha inscrito al diplomado.`
    )
  }

  if (colName === "payments") {
    const enrollmentId = record.get("enrollmentId")
    try {
      const enrollment = $app.findRecordById("enrollments", enrollmentId)
      if (enrollment) {
        enrollment.set("status", "PAYMENT_SUBMITTED")
        $app.save(enrollment)

        const student = getStudentEmail(enrollmentId)
        if (student) {
          sendEmail(
            student.email,
            "Comprobante de pago recibido",
            `Hola ${student.name},\n\nHemos recibido tu comprobante de pago. Un administrador lo validará en breve.\n\nSaludos,\nEquipo ASSII`
          )
        }
      }
    } catch (_) {}
  }
})

onRecordAfterUpdateSuccess((e) => {
  const record = e.record
  const colName = record.collection()?.name

  if (colName !== "payments") return

  const status = record.get("status")
  const enrollmentId = record.get("enrollmentId")
  const rejectionReason = record.get("rejectionReason")

  try {
    const enrollment = $app.findRecordById("enrollments", enrollmentId)
    if (!enrollment) return

    if (status === "VALIDATED") {
      enrollment.set("status", "ACTIVE")
    } else if (status === "REJECTED") {
      enrollment.set("status", "PAYMENT_REJECTED")
    }
    $app.save(enrollment)

    const student = getStudentEmail(enrollmentId)
    if (!student) return

    if (status === "VALIDATED") {
      sendEmail(
        student.email,
        "Pago validado — Acceso al diplomado confirmado",
        `Hola ${student.name},\n\nTu pago ha sido validado. Ya tienes acceso al diplomado.\n\nRecibirás las ligas de acceso a las sesiones en tu correo.\n\nSaludos,\nEquipo ASSII`
      )
    } else if (status === "REJECTED") {
      sendEmail(
        student.email,
        "Pago rechazado — Acción requerida",
        `Hola ${student.name},\n\nTu comprobante de pago ha sido rechazado.\n\nMotivo: ${rejectionReason || "No especificado"}\n\nPor favor sube un nuevo comprobante o contacta al administrador.\n\nSaludos,\nEquipo ASSII`
      )
    }
  } catch (_) {}
})
