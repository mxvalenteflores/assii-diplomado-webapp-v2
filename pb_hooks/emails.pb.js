/// <reference path="./pb_data/lib.d.ts" />

console.log("[HOOKS] Loading email hooks...")

function getPaymentInfo(scheme) {
  var s = (scheme || "").toLowerCase()
  if (s.indexOf("pago unico - publico") !== -1 || s.indexOf("pago único - público") !== -1) return { name: "Pago único - Público General", amount: "$9,000.00 MXN", type: "unico", link: "" }
  if (s.indexOf("pago unico - comunidad") !== -1 || s.indexOf("pago único - comunidad") !== -1) return { name: "Pago único - Comunidad ASSII", amount: "$7,000.00 MXN", type: "unico", link: "" }
  if (s.indexOf("6 meses") !== -1 && s.indexOf("publico") !== -1 || s.indexOf("público general") !== -1) return { name: "6 Meses sin intereses - Público General", amount: "$1,667.00 MXN mensuales", type: "parcialidades", link: "https://mpago.la/2ASRrNs" }
  if (s.indexOf("6 meses") !== -1 && s.indexOf("assii") !== -1) return { name: "6 Meses sin intereses - Comunidad ASSII", amount: "$1,250.00 MXN mensuales", type: "parcialidades", link: "https://mpago.la/23bhuAu" }
  return { name: scheme || "No especificado", amount: "Consultar", type: "consultar", link: "" }
}

function buildWelcomeEmail(name, paymentInfo) {
  var n = (name || "Participante").replace(/</g, "&lt;")
  var pn = paymentInfo.name.replace(/</g, "&lt;")
  var pa = paymentInfo.amount.replace(/</g, "&lt;")
  var link = paymentInfo.link || ""

  var tipoPagoText = paymentInfo.type === "unico"
    ? "<p style=\"color:#374151;font-size:14px;line-height:1.6;margin:0 0 8px\"><strong>Pagos Únicos:</strong> Deberán ser cubiertos en su totalidad a más tardar 3 días hábiles antes del inicio del Diplomado para garantizar su acceso a la plataforma.</p>"
    : "<p style=\"color:#374151;font-size:14px;line-height:1.6;margin:0 0 8px\"><strong>Esquema de Parcialidades (6 meses):</strong></p><p style=\"color:#374151;font-size:14px;line-height:1.6;margin:0 0 8px\">El primer pago (Inscripción/Mensualidad 1) debe realizarse antes del inicio del Diplomado.</p><p style=\"color:#374151;font-size:14px;line-height:1.6;margin:0 0 8px\">Las 3 parcialidades restantes deberán cubrirse durante los primeros 5 días naturales de cada mes subsecuente.</p>"

  var linkHtml = ""
  if (link) {
    linkHtml = "<p style=\"color:#374151;font-size:14px;line-height:1.6;margin:0 0 8px\"><strong>Link de pago:</strong> <a href=\"" + link + "\" style=\"color:#1e40af;font-weight:600\">" + link + "</a></p>"
  }

  return "<!DOCTYPE html><html lang=\"es\"><head><meta charset=\"UTF-8\"></head>" +
"<body style=\"margin:0;padding:0;background-color:#f4f6fa;font-family:Arial,Helvetica,sans-serif\">" +
"<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color:#f4f6fa;padding:40px 0\"><tr><td align=\"center\">" +
"<table width=\"620\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)\">" +

// Header
"<tr><td align=\"center\" style=\"background-color:#1e40af;padding:40px 24px\">" +
"<h1 style=\"color:#ffffff;font-size:22px;font-weight:700;margin:0\">ASSII Diplomados</h1>" +
"<p style=\"color:#bfdbfe;font-size:13px;margin:8px 0 0\">Bienvenida y Detalles Administrativos</p>" +
"</td></tr>" +

// Body
"<tr><td style=\"padding:32px 28px\">" +

"<p style=\"color:#1f2937;font-size:15px;line-height:1.7;margin:0 0 16px\">Estimado/a <strong style=\"color:#1e40af\">" + n + "</strong>,</p>" +

"<p style=\"color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px\">Le damos la más cordial bienvenida al <strong>Diplomado en Competencias Gerenciales para la Gestión de la Seguridad y Salud en el Trabajo</strong>. Este programa está diseñado bajo los más altos estándares de calidad para potenciar su perfil profesional y asegurar el cumplimiento normativo en su organización.</p>" +

"<p style=\"color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px\">Para garantizar una experiencia fluida y transparente, a continuación le compartimos los lineamientos administrativos gestionados a través de <strong>ISIBSA mx</strong>.</p>" +

// Section I
"<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color:#f0f9ff;border-radius:8px;border:1px solid #bae6fd;margin-bottom:20px\"><tr><td style=\"padding:20px\">" +
"<p style=\"color:#0369a1;font-size:15px;font-weight:700;margin:0 0 8px\">I. Términos y Condiciones de Inversión</p>" +
"<p style=\"color:#374151;font-size:14px;line-height:1.6;margin:0 0 8px\">De acuerdo con su registro, su esquema de inversión elegido es: <strong style=\"color:#1e40af\">" + pn + "</strong> por un monto de <strong style=\"color:#1e40af\">" + pa + "</strong>.</p>" +
tipoPagoText +
linkHtml +
"<p style=\"color:#374151;font-size:14px;line-height:1.6;margin:0\"><strong>Nota de cumplimiento:</strong> El atraso en el pago de una parcialidad causará la suspensión temporal del acceso a las sesiones sincrónicas y al material del diplomado hasta regularizar el estatus.</p>" +
"</td></tr></table>" +

// Section II
"<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;margin-bottom:20px\"><tr><td style=\"padding:20px\">" +
"<p style=\"color:#15803d;font-size:15px;font-weight:700;margin:0 0 8px\">II. Datos Bancarios</p>" +
"<p style=\"color:#374151;font-size:13px;line-height:1.6;margin:0 0 4px\">Todos los cobros y la administración financiera del proyecto están a cargo de <strong>ISIBSA mx</strong>, operando fiscalmente bajo el régimen de Persona Física con Actividad Empresarial.</p>" +
"<p style=\"color:#374151;font-size:13px;line-height:1.6;margin:0 0 4px\"><strong>Beneficiario:</strong> Alejandro Barriguete Borrell</p>" +
"<p style=\"color:#374151;font-size:13px;line-height:1.6;margin:0 0 4px\"><strong>Banco:</strong> Scotiabank Inverlat, S.A.</p>" +
"<p style=\"color:#374151;font-size:13px;line-height:1.6;margin:0 0 4px\"><strong>Tarjeta:</strong> 5579 2091 5724 9431</p>" +
"<p style=\"color:#374151;font-size:13px;line-height:1.6;margin:0 0 4px\"><strong>CLABE Interbancaria:</strong> 044790256062122910</p>" +
"<p style=\"color:#374151;font-size:13px;line-height:1.6;margin:0 0 4px\"><strong>Concepto de pago obligatorio:</strong> Nombre completo del Diplomante + ASSII_DCG_GSST_A_2026</p>" +
"<p style=\"color:#374151;font-size:13px;line-height:1.6;margin:0\">Una vez realizado su pago, es indispensable enviar el comprobante en formato PDF o imagen legible al correo <strong>assii.org.net@gmail.com</strong> o vía WhatsApp al <strong>+52 9934618242</strong>.</p>" +
"</td></tr></table>" +

// Section III
"<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color:#fefce8;border-radius:8px;border:1px solid #fde68a;margin-bottom:20px\"><tr><td style=\"padding:20px\">" +
"<p style=\"color:#a16207;font-size:15px;font-weight:700;margin:0 0 8px\">III. Políticas de Facturación (CFDI 4.0)</p>" +
"<p style=\"color:#374151;font-size:13px;line-height:1.6;margin:0 0 8px\">Si requiere comprobante fiscal por su inversión, las reglas aplicables son las siguientes:</p>" +
"<p style=\"color:#374151;font-size:13px;line-height:1.6;margin:0 0 4px\"><strong>Solicitud en el mes en curso:</strong> La factura debe solicitarse exclusivamente dentro del mismo mes calendario en que se realizó el depósito o transferencia.</p>" +
"<p style=\"color:#374151;font-size:13px;line-height:1.6;margin:0 0 4px\"><strong>Documentación requerida:</strong> Constancia de Situación Fiscal (CSF) actualizada, uso del CFDI, y forma de pago utilizada.</p>" +
"<p style=\"color:#374151;font-size:13px;line-height:1.6;margin:0\"><strong>Emisión:</strong> El CFDI será emitido y enviado a su correo en un plazo máximo de 48 a 72 horas hábiles.</p>" +
"</td></tr></table>" +

// Section IV
"<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color:#fff1f2;border-radius:8px;border:1px solid #fecdd3;margin-bottom:20px\"><tr><td style=\"padding:20px\">" +
"<p style=\"color:#be123c;font-size:15px;font-weight:700;margin:0 0 8px\">IV. Políticas de Cancelación y Reembolso</p>" +
"<p style=\"color:#374151;font-size:13px;line-height:1.6;margin:0 0 4px\">En caso de declinar su participación, deberá notificarlo por escrito con al menos 5 días de anticipación al inicio del programa para procesar una devolución (aplicando un cargo del 10% por gastos administrativos).</p>" +
"<p style=\"color:#374151;font-size:13px;line-height:1.6;margin:0\">Una vez iniciado el Diplomado, no habrá devoluciones bajo ninguna circunstancia.</p>" +
"</td></tr></table>" +

"<p style=\"color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px\">Estamos seguros de que esta formación será un detonante clave en su desarrollo gerencial. Quedamos a su entera disposición para cualquier duda sobre este proceso.</p>" +

"<p style=\"color:#374151;font-size:14px;line-height:1.7;margin:0 0 4px\">Atentamente,</p>" +
"<p style=\"color:#1e40af;font-size:15px;font-weight:700;margin:0\">Comité Administrativo y Académico | ASSII</p>" +

"</td></tr>" +

// Footer
"<tr><td align=\"center\" style=\"background-color:#f9fafb;padding:20px 28px;border-top:1px solid #e5e7eb\">" +
"<p style=\"color:#9ca3af;font-size:11px;margin:0;line-height:1.5\">ASSII Diplomados — Gestión administrativa: ISIBSA mx</p>" +
"</td></tr>" +

"</table></td></tr></table></body></html>"
}

onRecordAfterCreateSuccess(function(e) {
  var record = e.record
  var colName = record.collection() ? record.collection().name : ""
  var key = $os.getenv("AGENTMAIL_API_KEY") || ""

  if (colName === "students") {
    var formData = record.get("formData")
    if (!formData) return

    var data = null
    try { data = JSON.parse(formData) } catch (_) {}
    if (!data) return

    var email = data.correo_electronico
    var name = data.nombre_completo || ""
    var scheme = data.esquema_pago || ""

    if (email && key) {
      try {
        var paymentInfo = getPaymentInfo(scheme)
        var html = buildWelcomeEmail(name, paymentInfo)
        var subject = "Bienvenida y Detalles Administrativos - Diplomado en Competencias Gerenciales SST"
        var plainText = "Estimado/a " + name + ",\n\nLe damos la más cordial bienvenida al Diplomado en Competencias Gerenciales para la Gestión de la Seguridad y Salud en el Trabajo.\n\nSu esquema de inversión elegido es: " + paymentInfo.name + " por " + paymentInfo.amount + ".\n\nConsulte los detalles administrativos, datos bancarios y políticas en el cuerpo del correo.\n\nAtentamente,\nComité Administrativo y Académico | ASSII"

        $http.send({
          url: "https://api.agentmail.to/v0/inboxes/arqonlabs%40agentmail.to/messages/send",
          method: "POST",
          headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
          body: JSON.stringify({ to: email, subject: subject, text: plainText, html: html }),
        })
        console.log("[EMAIL SENT] welcome to", email)
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
              body: JSON.stringify({ to: admins[ai].get("email"), subject: "Nueva inscripción", text: (name || "Alguien") + " se ha inscrito al diplomado. Esquema: " + paymentInfo.name }),
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
        try {
          var sid = enrollment.get("studentId")
          var s = $app.findRecordById("students", sid)
          if (s && key) {
            $http.send({
              url: "https://api.agentmail.to/v0/inboxes/arqonlabs%40agentmail.to/messages/send",
              method: "POST",
              headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
              body: JSON.stringify({ to: s.get("email"), subject: "Comprobante de pago recibido", text: "Hola " + (s.get("firstName")||"") + ",\n\nHemos recibido tu comprobante de pago. Un administrador lo validará en breve.\n\nSaludos,\nEquipo ASSII" }),
            })
            console.log("[EMAIL SENT] payment to", s.get("email"))
          }
        } catch (_) {}
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

  try {
    var enrollment = $app.findRecordById("enrollments", enrollmentId)
    if (!enrollment) return
    if (status === "VALIDATED") enrollment.set("status", "ACTIVE")
    else if (status === "REJECTED") enrollment.set("status", "PAYMENT_REJECTED")
    $app.save(enrollment)

    var sid = enrollment.get("studentId")
    var s = $app.findRecordById("students", sid)
    if (!s || !key) return
    var sEmail = s.get("email")
    var sName = (s.get("firstName")||"") + " " + (s.get("lastName")||"")

    if (status === "VALIDATED") {
      $http.send({
        url: "https://api.agentmail.to/v0/inboxes/arqonlabs%40agentmail.to/messages/send",
        method: "POST",
        headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
        body: JSON.stringify({ to: sEmail, subject: "Pago validado", text: "Hola " + sName + ",\n\nTu pago ha sido validado. Ya tienes acceso al diplomado.\n\nEquipo ASSII" }),
      })
    } else if (status === "REJECTED") {
      var reason = record.get("rejectionReason") || "No especificado"
      $http.send({
        url: "https://api.agentmail.to/v0/inboxes/arqonlabs%40agentmail.to/messages/send",
        method: "POST",
        headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
        body: JSON.stringify({ to: sEmail, subject: "Pago rechazado", text: "Hola " + sName + ",\n\nTu comprobante de pago ha sido rechazado.\nMotivo: " + reason + "\n\nEquipo ASSII" }),
      })
    }
  } catch (_) {}
})
