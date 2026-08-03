/// <reference path="./pb_data/lib.d.ts" />

console.log("[HOOKS] Loading email hooks...")

onRecordAfterCreateSuccess(function(e) {
  var record = e.record
  var colName = record.collection() ? record.collection().name : ""

  // Goja doesn't support outer scope closure variables — call $os.getenv inside callbacks
  var key = $os.getenv("AGENTMAIL_API_KEY") || ""

  if (colName === "students") {
    var formData = record.get("formData")
    if (!formData) return

    var data = null
    try { data = JSON.parse(formData) } catch (_) {}
    if (!data) return

    var email = data.correo_electronico
    var name = data.nombre_completo || ""

    if (email && key) {
      var escapedName = name.replace(/</g, "&lt;") || "Futuro diplomante"

      var html = "<!DOCTYPE html><html lang=\"es\"><head><meta charset=\"UTF-8\"></head>" +
        "<body style=\"margin:0;padding:0;background-color:#f4f6fa;font-family:Arial,Helvetica,sans-serif\">" +
        "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color:#f4f6fa;padding:40px 0\">" +
        "<tr><td align=\"center\">" +
        "<table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)\">" +
        "<tr><td align=\"center\" style=\"background-color:#1e40af;padding:48px 24px\">" +
        "<h1 style=\"color:#ffffff;font-size:24px;font-weight:700;margin:0;font-family:Arial,Helvetica,sans-serif\">ASSII Diplomados</h1>" +
        "<p style=\"color:#bfdbfe;font-size:14px;margin:8px 0 0\">Hemos recibido tu formulario</p>" +
        "</td></tr>" +
        "<tr><td style=\"padding:40px 32px\">" +
        "<p style=\"color:#1f2937;font-size:16px;line-height:1.6;margin:0 0 16px\">Hola <strong style=\"color:#1e40af\">" + escapedName + "</strong>,</p>" +
        "<p style=\"color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px\">Bienvenido al <strong>Diplomado en Competencias Gerenciales para la Gesti\u00f3n de la SST</strong>. Tu registro ha sido recibido exitosamente.</p>" +
        "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color:#eff6ff;border-radius:8px;border:1px solid #bfdbfe\">" +
        "<tr><td style=\"padding:24px\"><p style=\"color:#1e40af;font-size:14px;font-weight:600;margin:0 0 8px\">Pr\u00f3ximos pasos</p>" +
        "<p style=\"color:#374151;font-size:14px;line-height:1.6;margin:0\">En breve recibir\u00e1s un correo con los datos de pago para completar tu proceso de inscripci\u00f3n.</p>" +
        "</td></tr></table>" +
        "<p style=\"color:#6b7280;font-size:13px;line-height:1.6;margin:24px 0 0\">Si tienes dudas, cont\u00e1ctanos por WhatsApp.</p>" +
        "</td></tr>" +
        "<tr><td align=\"center\" style=\"background-color:#f9fafb;padding:24px 32px;border-top:1px solid #e5e7eb\">" +
        "<p style=\"color:#9ca3af;font-size:12px;margin:0;line-height:1.5\">ASSII Diplomados \u2014 Portal de formaci\u00f3n profesional</p>" +
        "</td></tr></table></td></tr></table></body></html>"

      var plainText = "Hola " + name + ",\n\nHemos recibido tu inscripci\u00f3n al Diplomado en Competencias Gerenciales para la Gesti\u00f3n de la SST.\n\nEn breve recibir\u00e1s instrucciones para completar tu proceso de inscripci\u00f3n.\n\nSaludos,\nEquipo ASSII"

      try {
        $http.send({
          url: "https://api.agentmail.to/v0/inboxes/arqonlabs%40agentmail.to/messages/send",
          method: "POST",
          headers: {
            Authorization: "Bearer " + key,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ to: email, subject: "Hemos recibido tu formulario \u2014 Diplomado GSST", text: plainText, html: html }),
        })
        console.log("[EMAIL SENT]", email)
      } catch (err) {
        console.error("[EMAIL ERROR]", email, String(err))
      }

      // Notify admins
      try {
        var admins = $app.findRecordsByFilter("admins", "", "", 0, 0)
        for (var ai = 0; ai < admins.length; ai++) {
          try {
            $http.send({
              url: "https://api.agentmail.to/v0/inboxes/arqonlabs%40agentmail.to/messages/send",
              method: "POST",
              headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
              body: JSON.stringify({ to: admins[ai].get("email"), subject: "Nueva inscripci\u00f3n", text: (name || "Alguien") + " se ha inscrito al diplomado." }),
            })
          } catch (_) {}
        }
      } catch (_) {}
    }
  }

  if (colName === "payments") {
    var enrollmentId = record.get("enrollmentId")
    try {
      var enrollment = $app.findRecordById("enrollments", enrollmentId)
      if (enrollment) {
        enrollment.set("status", "PAYMENT_SUBMITTED")
        $app.save(enrollment)

        var studentEmail = null
        var studentName = ""
        try {
          var sid = enrollment.get("studentId")
          var s = $app.findRecordById("students", sid)
          if (s) { studentEmail = s.get("email"); studentName = s.get("firstName") + " " + s.get("lastName") }
        } catch (_) {}

        if (studentEmail && key) {
          try {
            $http.send({
              url: "https://api.agentmail.to/v0/inboxes/arqonlabs%40agentmail.to/messages/send",
              method: "POST",
              headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
              body: JSON.stringify({ to: studentEmail, subject: "Comprobante de pago recibido", text: "Hola " + studentName + ",\n\nHemos recibido tu comprobante de pago. Un administrador lo validar\u00e1 en breve.\n\nSaludos,\nEquipo ASSII" }),
            })
            console.log("[EMAIL SENT] payment receipt to", studentEmail)
          } catch (_) {}
        }
      }
    } catch (_) {}
  }
})

onRecordAfterUpdateSuccess(function(e) {
  var record = e.record
  var colName = record.collection() ? record.collection().name : ""

  if (colName !== "payments") return

  var key = $os.getenv("AGENTMAIL_API_KEY") || ""
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

    var studentEmailUpd = null
    var studentNameUpd = ""
    try {
      var sid2 = enrollment.get("studentId")
      var s2 = $app.findRecordById("students", sid2)
      if (s2) { studentEmailUpd = s2.get("email"); studentNameUpd = s2.get("firstName") + " " + s2.get("lastName") }
    } catch (_) {}

    if (studentEmailUpd && key) {
      if (status === "VALIDATED") {
        try {
          $http.send({
            url: "https://api.agentmail.to/v0/inboxes/arqonlabs%40agentmail.to/messages/send",
            method: "POST",
            headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
            body: JSON.stringify({ to: studentEmailUpd, subject: "Pago validado \u2014 Acceso al diplomado confirmado", text: "Hola " + studentNameUpd + ",\n\nTu pago ha sido validado. Ya tienes acceso al diplomado.\n\nRecibir\u00e1s las ligas de acceso a las sesiones en tu correo.\n\nSaludos,\nEquipo ASSII" }),
          })
          console.log("[EMAIL SENT] validation to", studentEmailUpd)
        } catch (_) {}
      } else if (status === "REJECTED") {
        try {
          $http.send({
            url: "https://api.agentmail.to/v0/inboxes/arqonlabs%40agentmail.to/messages/send",
            method: "POST",
            headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
            body: JSON.stringify({ to: studentEmailUpd, subject: "Pago rechazado \u2014 Acci\u00f3n requerida", text: "Hola " + studentNameUpd + ",\n\nTu comprobante de pago ha sido rechazado.\n\nMotivo: " + (rejectionReason || "No especificado") + "\n\nPor favor sube un nuevo comprobante o contacta al administrador.\n\nSaludos,\nEquipo ASSII" }),
          })
          console.log("[EMAIL SENT] rejection to", studentEmailUpd)
        } catch (_) {}
      }
    }
  } catch (_) {}
})
