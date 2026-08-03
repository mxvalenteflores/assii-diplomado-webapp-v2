/// <reference path="./pb_data/lib.d.ts" />

const agentmailKey = $os.getenv("AGENTMAIL_API_KEY") || ""
const inbox = "arqonlabs%40agentmail.to"

function sendEmail(to, subject, text, html) {
  if (!agentmailKey) {
    console.log("[EMAIL MOCK]", { to, subject, text: text?.slice(0, 80) })
    return
  }
  try {
    const body = { to, subject, text: text || "" }
    if (html) body.html = html
    $http.send({
      url: `https://api.agentmail.to/v0/inboxes/${inbox}/messages/send`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${agentmailKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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

function registrationEmail(name) {
  const escapedName = (name || "Futuro diplomante").replace(/</g, "&lt;")
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f6fa;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6fa;padding:40px 0">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
        <!-- Header -->
        <tr>
          <td align="center" style="background-color:#1e40af;padding:48px 24px">
            <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0;font-family:Arial,Helvetica,sans-serif">ASSII Diplomados</h1>
            <p style="color:#bfdbfe;font-size:14px;margin:8px 0 0">Hemos recibido tu formulario</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 32px">
            <p style="color:#1f2937;font-size:16px;line-height:1.6;margin:0 0 16px">
              Hola <strong style="color:#1e40af">${escapedName}</strong>,
            </p>
            <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px">
              Bienvenido al <strong>Diplomado en Competencias Gerenciales para la Gestión de la SST</strong>. Tu registro ha sido recibido exitosamente.
            </p>
            <!-- Info box -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eff6ff;border-radius:8px;border:1px solid #bfdbfe">
              <tr>
                <td style="padding:24px">
                  <p style="color:#1e40af;font-size:14px;font-weight:600;margin:0 0 8px">Próximos pasos</p>
                  <p style="color:#374151;font-size:14px;line-height:1.6;margin:0">
                    En breve recibirás un correo con los datos de pago para completar tu proceso de inscripción. Una vez realizado el pago, tendrás acceso completo al diplomado.
                  </p>
                </td>
              </tr>
            </table>
            <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:24px 0 0">
              Si tienes dudas, contáctanos por WhatsApp al dar clic en "Aceptar" en el formulario después de registrarte.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td align="center" style="background-color:#f9fafb;padding:24px 32px;border-top:1px solid #e5e7eb">
            <p style="color:#9ca3af;font-size:12px;margin:0;line-height:1.5">
              ASSII Diplomados — Portal de formación profesional
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

onRecordAfterCreateSuccess((e) => {
  const record = e.record
  const colName = record.collection()?.name

  if (colName === "students") {
    const formData = record.get("formData")
    if (!formData) return
    try {
      const data = JSON.parse(formData)
      const email = data.correo_electronico
      const name = data.nombre_completo

      if (email) {
        const html = registrationEmail(name)
        sendEmail(
          email,
          "Hemos recibido tu formulario — Diplomado GSST",
          `Hola ${name || ""},\n\nHemos recibido tu inscripción al Diplomado en Competencias Gerenciales para la Gestión de la SST.\n\nEn breve recibirás instrucciones para completar tu proceso de inscripción.\n\nSaludos,\nEquipo ASSII`,
          html
        )
      }

      notifyAdmins(
        "Nueva inscripción recibida",
        `${name || "Alguien"} se ha inscrito al diplomado.`
      )
    } catch (_) {}
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
