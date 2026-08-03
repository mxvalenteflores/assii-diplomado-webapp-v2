/// <reference path="./pb_data/lib.d.ts" />

console.log("[HOOKS] Loading email hooks...")

const agentmailKey = $os.getenv("AGENTMAIL_API_KEY") || ""
const inbox = "arqonlabs%40agentmail.to"
console.log("[HOOKS] AgentMail key:", agentmailKey ? "SET" : "NOT SET")

// Must be defined before any event handler references it
function registrationEmail(name) {
  var n = (name || "Futuro diplomante").replace(/</g, "&lt;")
  return "<!DOCTYPE html><html lang=\"es\"><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"></head>" +
"<body style=\"margin:0;padding:0;background-color:#f4f6fa;font-family:Arial,Helvetica,sans-serif\">" +
"<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color:#f4f6fa;padding:40px 0\"><tr><td align=\"center\">" +
"<table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)\">" +
"<tr><td align=\"center\" style=\"background-color:#1e40af;padding:48px 24px\">" +
"<h1 style=\"color:#ffffff;font-size:24px;font-weight:700;margin:0;font-family:Arial,Helvetica,sans-serif\">ASSII Diplomados</h1>" +
"<p style=\"color:#bfdbfe;font-size:14px;margin:8px 0 0\">Hemos recibido tu formulario</p>" +
"</td></tr><tr><td style=\"padding:40px 32px\">" +
"<p style=\"color:#1f2937;font-size:16px;line-height:1.6;margin:0 0 16px\">Hola <strong style=\"color:#1e40af\">" + n + "</strong>,</p>" +
"<p style=\"color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px\">Bienvenido al <strong>Diplomado en Competencias Gerenciales para la Gesti\u00f3n de la SST</strong>. Tu registro ha sido recibido exitosamente.</p>" + 
"<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color:#eff6ff;border-radius:8px;border:1px solid #bfdbfe\"><tr><td style=\"padding:24px\">" +
"<p style=\"color:#1e40af;font-size:14px;font-weight:600;margin:0 0 8px\">Pr\u00f3ximos pasos</p>" +
"<p style=\"color:#374151;font-size:14px;line-height:1.6;margin:0\">En breve recibir\u00e1s un correo con los datos de pago para completar tu proceso de inscripci\u00f3n.</p>" +
"</td></tr></table><p style=\"color:#6b7280;font-size:13px;line-height:1.6;margin:24px 0 0\">Si tienes dudas, cont\u00e1ctanos por WhatsApp.</p>" +
"</td></tr><tr><td align=\"center\" style=\"background-color:#f9fafb;padding:24px 32px;border-top:1px solid #e5e7eb\">" +
"<p style=\"color:#9ca3af;font-size:12px;margin:0;line-height:1.5\">ASSII Diplomados \u2014 Portal de formaci\u00f3n profesional</p>" +
"</td></tr></table></td></tr></table></body></html>"
}

function sendEmail(to, subject, text, html) {
  if (!agentmailKey) {
    console.log("[EMAIL MOCK]", to, subject)
    return
  }
  try {
    var payload = { to: to, subject: subject, text: text || "" }
    if (html) payload.html = html
    $http.send({
      url: "https://api.agentmail.to/v0/inboxes/" + inbox + "/messages/send",
      method: "POST",
      headers: {
        Authorization: "Bearer " + agentmailKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
    console.log("[EMAIL SENT]", to)
  } catch (e) {
    console.error("[EMAIL ERROR]", to, String(e))
  }
}

function getStudentEmail(enrollmentId) {
  try {
    var enrollment = $app.findRecordById("enrollments", enrollmentId)
    if (!enrollment) return null
    var studentId = enrollment.get("studentId")
    var student = $app.findRecordById("students", studentId)
    if (!student) return null
    return {
      email: student.get("email"),
      name: student.get("firstName") + " " + student.get("lastName"),
    }
  } catch (_) {
    return null
  }
}

function notifyAdmins(subject, text) {
  try {
    var admins = $app.findRecordsByFilter("admins", "", "", 0, 0)
    for (var i = 0; i < admins.length; i++) {
      sendEmail(admins[i].get("email"), subject, text)
    }
  } catch (_) {}
}

onRecordAfterCreateSuccess(function(e) {
  var record = e.record
  var colName = record.collection() ? record.collection().name : ""

  if (colName === "students") {
    var formData = record.get("formData")
    if (!formData) return
    try {
      var data = JSON.parse(formData)
      var email = data.correo_electronico
      var name = data.nombre_completo

      if (email) {
        var html = registrationEmail(name)
        sendEmail(
          email,
          "Hemos recibido tu formulario \u2014 Diplomado GSST",
          "Hola " + (name || "") + ",\n\nHemos recibido tu inscripci\u00f3n al Diplomado en Competencias Gerenciales para la Gesti\u00f3n de la SST.\n\nEn breve recibir\u00e1s instrucciones para completar tu proceso de inscripci\u00f3n.\n\nSaludos,\nEquipo ASSII",
          html
        )

        // Inline admin notification (Goja closure workaround)
        try {
          var admins = $app.findRecordsByFilter("admins", "", "", 0, 0)
          for (var ai = 0; ai < admins.length; ai++) {
            sendEmail(admins[ai].get("email"), "Nueva inscripci\u00f3n recibida", (name || "Alguien") + " se ha inscrito al diplomado.")
          }
        } catch (_) {}
      }
    } catch (e) {
      console.error("[STUDENT EMAIL ERROR]", String(e))
    }
  }

  if (colName === "payments") {
    var enrollmentId = record.get("enrollmentId")
    try {
      var enrollment = $app.findRecordById("enrollments", enrollmentId)
      if (enrollment) {
        enrollment.set("status", "PAYMENT_SUBMITTED")
        $app.save(enrollment)

        var student = getStudentEmail(enrollmentId)
        if (student) {
          sendEmail(
            student.email,
            "Comprobante de pago recibido",
            "Hola " + student.name + ",\n\nHemos recibido tu comprobante de pago. Un administrador lo validar\u00e1 en breve.\n\nSaludos,\nEquipo ASSII"
          )
        }
      }
    } catch (_) {}
  }
})

onRecordAfterUpdateSuccess(function(e) {
  var record = e.record
  var colName = record.collection() ? record.collection().name : ""

  if (colName !== "payments") return

  var status = record.get("status")
  var enrollmentId = record.get("enrollmentId")
  var rejectionReason = record.get("rejectionReason")

  try {
    var enrollment = $app.findRecordById("enrollments", enrollmentId)
    if (!enrollment) return

    if (status === "VALIDATED") {
      enrollment.set("status", "ACTIVE")
    } else if (status === "REJECTED") {
      enrollment.set("status", "PAYMENT_REJECTED")
    }
    $app.save(enrollment)

    var student = getStudentEmail(enrollmentId)
    if (!student) return

    if (status === "VALIDATED") {
      sendEmail(
        student.email,
        "Pago validado \u2014 Acceso al diplomado confirmado",
        "Hola " + student.name + ",\n\nTu pago ha sido validado. Ya tienes acceso al diplomado.\n\nRecibir\u00e1s las ligas de acceso a las sesiones en tu correo.\n\nSaludos,\nEquipo ASSII"
      )
    } else if (status === "REJECTED") {
      sendEmail(
        student.email,
        "Pago rechazado \u2014 Acci\u00f3n requerida",
        "Hola " + student.name + ",\n\nTu comprobante de pago ha sido rechazado.\n\nMotivo: " + (rejectionReason || "No especificado") + "\n\nPor favor sube un nuevo comprobante o contacta al administrador.\n\nSaludos,\nEquipo ASSII"
      )
    }
  } catch (_) {}
})
