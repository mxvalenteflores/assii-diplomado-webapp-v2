/// <reference path="./pb_data/lib.d.ts" />

console.log("[HOOKS] Loading email hooks v5 — Resend")

var RESEND_URL = "https://api.resend.com/emails"
var FROM = "ASSII Diplomados <contacto@diplomadosassii.site>"

onRecordAfterCreateSuccess(function(e) {
  var record = e.record
  var colName = record.collection() ? record.collection().name : ""
  var key = $os.getenv("RESEND_API_KEY") || ""

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
        // Build email content inline (Goja closure workaround)
        var s = scheme.toLowerCase()
        var paymentName = scheme || "No especificado"
        var paymentAmount = "Consultar"
        var paymentType = "consultar"
        var paymentLink = ""

        if (s.indexOf("pago unico") !== -1 && s.indexOf("publico") !== -1) {
          paymentName = "Pago único - Público General"; paymentAmount = "$9,000.00 MXN"; paymentType = "unico"
        } else if (s.indexOf("pago unico") !== -1 && s.indexOf("comunidad") !== -1) {
          paymentName = "Pago único - Comunidad ASSII"; paymentAmount = "$7,000.00 MXN"; paymentType = "unico"
        } else if (s.indexOf("6 meses") !== -1 && s.indexOf("publico") !== -1) {
          paymentName = "6 Meses sin intereses - Público General"; paymentAmount = "$1,667.00 MXN mensuales"; paymentType = "parcialidades"; paymentLink = "https://mpago.la/2ASRrNs"
        } else if (s.indexOf("6 meses") !== -1 && s.indexOf("assii") !== -1) {
          paymentName = "6 Meses sin intereses - Comunidad ASSII"; paymentAmount = "$1,250.00 MXN mensuales"; paymentType = "parcialidades"; paymentLink = "https://mpago.la/23bhuAu"
        }

        var n = name.replace(/</g, "&lt;") || "Participante"
        var pn = paymentName.replace(/</g, "&lt;")
        var pa = paymentAmount.replace(/</g, "&lt;")

        var tipoPagoText = paymentType === "unico"
          ? "<p style=\"color:#374151;font-size:14px;line-height:1.6;margin:0 0 8px\"><strong>Pagos Únicos:</strong> Deberán ser cubiertos en su totalidad a más tardar 3 días hábiles antes del inicio del Diplomado para garantizar su acceso a la plataforma.</p>"
          : "<p style=\"color:#374151;font-size:14px;line-height:1.6;margin:0 0 8px\"><strong>Esquema de Parcialidades (6 meses):</strong></p><p style=\"color:#374151;font-size:14px;line-height:1.6;margin:0 0 8px\">El primer pago (Inscripción/Mensualidad 1) debe realizarse antes del inicio del Diplomado.</p><p style=\"color:#374151;font-size:14px;line-height:1.6;margin:0 0 8px\">Las 3 parcialidades restantes deberán cubrirse durante los primeros 5 días naturales de cada mes subsecuente.</p>"

        var msiButtonHtml = ""
        if (paymentType === "parcialidades" && paymentLink) {
          var btnLabel = (s.indexOf("assii") !== -1 || s.indexOf("comunidad") !== -1)
            ? "Pagar con 6 meses sin intereses (25% descuento)"
            : "Pagar con 6 meses sin intereses (precio regular)"
          msiButtonHtml = "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"margin-top:12px;margin-bottom:8px\"><tr><td align=\"center\">" +
            "<a href=\"" + paymentLink + "\" style=\"display:inline-block;background-color:#16a34a;color:#ffffff;font-size:15px;font-weight:700;padding:16px 36px;border-radius:8px;text-decoration:none;text-align:center\">" + btnLabel + "</a>" +
            "</td></tr></table>"
        }

        var bankDetailsHtml = ""
        if (paymentType === "unico") {
          bankDetailsHtml = "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;margin-bottom:20px\"><tr><td style=\"padding:20px\">" +
            "<p style=\"color:#15803d;font-size:15px;font-weight:700;margin:0 0 8px\">II. Datos Bancarios</p>" +
            "<p style=\"color:#374151;font-size:13px;line-height:1.6;margin:0 0 4px\">Todos los cobros y la administracion estan a cargo de <strong>ISIBSA mx</strong>.</p>" +
            "<p style=\"color:#374151;font-size:13px;line-height:1.6;margin:0 0 4px\"><strong>Beneficiario:</strong> Alejandro Barriguete Borrell</p>" +
            "<p style=\"color:#374151;font-size:13px;line-height:1.6;margin:0 0 4px\"><strong>Banco:</strong> Scotiabank Inverlat, S.A.</p>" +
            "<p style=\"color:#374151;font-size:13px;line-height:1.6;margin:0 0 4px\"><strong>Tarjeta:</strong> 5579 2091 5724 9431</p>" +
            "<p style=\"color:#374151;font-size:13px;line-height:1.6;margin:0 0 4px\"><strong>CLABE:</strong> 044790256062122910</p>" +
            "<p style=\"color:#374151;font-size:13px;line-height:1.6;margin:0\"><strong>Concepto:</strong> Nombre completo + ASSII_DCG_GSST_A_2026</p>" +
            "</td></tr></table>"
        }

        var html = "<!DOCTYPE html><html lang=\"es\"><head><meta charset=\"UTF-8\"></head>" +
"<body style=\"margin:0;padding:0;background-color:#f4f6fa;font-family:Arial,Helvetica,sans-serif\">" +
"<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color:#f4f6fa;padding:40px 0\"><tr><td align=\"center\">" +
"<table width=\"620\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)\">" +
"<tr><td align=\"center\" style=\"background-color:#1e40af;padding:40px 24px\">" +
"<h1 style=\"color:#ffffff;font-size:22px;font-weight:700;margin:0\">ASSII Diplomados</h1>" +
"<p style=\"color:#bfdbfe;font-size:13px;margin:8px 0 0\">Bienvenida y Detalles Administrativos</p>" +
"</td></tr>" +
"<tr><td style=\"padding:32px 28px\">" +
"<p style=\"color:#1f2937;font-size:15px;line-height:1.7;margin:0 0 16px\">Estimado/a <strong style=\"color:#1e40af\">" + n + "</strong>,</p>" +
"<p style=\"color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px\">Le damos la más cordial bienvenida al <strong>Diplomado en Competencias Gerenciales para la Gestión de la Seguridad y Salud en el Trabajo</strong>. Este programa está diseñado bajo los más altos estándares de calidad para potenciar su perfil profesional y asegurar el cumplimiento normativo en su organización.</p>" +
"<p style=\"color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px\">Para garantizar una experiencia fluida y transparente, a continuación le compartimos los lineamientos administrativos gestionados a través de <strong>ISIBSA mx</strong>.</p>" +
// I. Términos
"<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color:#f0f9ff;border-radius:8px;border:1px solid #bae6fd;margin-bottom:20px\"><tr><td style=\"padding:20px\">" +
"<p style=\"color:#0369a1;font-size:15px;font-weight:700;margin:0 0 8px\">I. Términos y Condiciones de Inversión</p>" +
"<p style=\"color:#374151;font-size:14px;line-height:1.6;margin:0 0 8px\">De acuerdo con su registro, su esquema de inversión elegido es: <strong style=\"color:#1e40af\">" + pn + "</strong> por un monto de <strong style=\"color:#1e40af\">" + pa + "</strong>.</p>" +
tipoPagoText + msiButtonHtml +
"<p style=\"color:#374151;font-size:14px;line-height:1.6;margin:0\"><strong>Nota de cumplimiento:</strong> El atraso en el pago de una parcialidad causará la suspensión temporal del acceso a las sesiones sincrónicas y al material del diplomado hasta regularizar el estatus.</p>" +
"</td></tr></table>" +
bankDetailsHtml +
// III. Facturación
"<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color:#fefce8;border-radius:8px;border:1px solid #fde68a;margin-bottom:20px\"><tr><td style=\"padding:20px\">" +
"<p style=\"color:#a16207;font-size:15px;font-weight:700;margin:0 0 8px\">III. Políticas de Facturación (CFDI 4.0)</p>" +
"<p style=\"color:#374151;font-size:13px;line-height:1.6;margin:0 0 8px\">Si requiere comprobante fiscal: solicítelo dentro del mismo mes del pago, enviando su Constancia de Situación Fiscal actualizada. Emisión en 48-72 horas hábiles.</p>" +
"</td></tr></table>" +
// IV. Cancelación
"<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color:#fff1f2;border-radius:8px;border:1px solid #fecdd3;margin-bottom:20px\"><tr><td style=\"padding:20px\">" +
"<p style=\"color:#be123c;font-size:15px;font-weight:700;margin:0 0 8px\">IV. Políticas de Cancelación y Reembolso</p>" +
"<p style=\"color:#374151;font-size:13px;line-height:1.6;margin:0 0 4px\">Notificación con 5 días de anticipación (cargo del 10% por gastos administrativos). Una vez iniciado, no hay devoluciones.</p>" +
"</td></tr></table>" +
"<p style=\"color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px\">Estamos seguros de que esta formación será un detonante clave en su desarrollo gerencial.</p>" +
"<p style=\"color:#374151;font-size:14px;margin:0 0 4px\">Atentamente,</p>" +
"<p style=\"color:#1e40af;font-size:15px;font-weight:700;margin:0\">Comité Administrativo y Académico | ASSII</p>" +
"</td></tr>" +
"<tr><td align=\"center\" style=\"background-color:#f9fafb;padding:20px 28px;border-top:1px solid #e5e7eb\">" +
"<p style=\"color:#9ca3af;font-size:11px;margin:0\">ASSII Diplomados — Gestión administrativa: ISIBSA mx</p>" +
"</td></tr></table></td></tr></table></body></html>"

        var subject = "Bienvenida y Detalles Administrativos - Diplomado en Competencias Gerenciales SST"
        var plainText = "Estimado/a " + name + ",\n\nBienvenido al Diplomado GSST. Esquema: " + paymentName + " por " + paymentAmount + ".\n\nEquipo ASSII"

        $http.send({
          url: RESEND_URL,
          method: "POST",
          headers: { Authorization: "Bearer " + key, "Content-Type": "application/json", "User-Agent": "assii/1.0" },
          body: JSON.stringify({ from: FROM, to: [email], subject: subject, text: plainText, html: html }),
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
              url: RESEND_URL,
              method: "POST",
              headers: { Authorization: "Bearer " + key, "Content-Type": "application/json", "User-Agent": "assii/1.0" },
              body: JSON.stringify({ from: FROM, to: [admins[ai].get("email")], subject: "Nueva inscripcion", text: (name || "Alguien") + " se ha inscrito. Esquema: " + paymentName }),
            })
          } catch (_) {}
        }
      } catch (_) {}
    }
  }
})

onRecordAfterUpdateSuccess(function(e) {
  var record = e.record
  var colName = record.collection() ? record.collection().name : ""
  if (colName !== "payments") return

  var key = $os.getenv("RESEND_API_KEY") || ""
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
        url: RESEND_URL,
        method: "POST",
        headers: { Authorization: "Bearer " + key, "Content-Type": "application/json", "User-Agent": "assii/1.0" },
        body: JSON.stringify({ from: FROM, to: [sEmail], subject: "Pago validado", text: "Hola " + sName + ",\n\nTu pago ha sido validado. Ya tienes acceso al diplomado.\n\nEquipo ASSII" }),
      })
    } else if (status === "REJECTED") {
      var reason = record.get("rejectionReason") || "No especificado"
      $http.send({
        url: RESEND_URL,
        method: "POST",
        headers: { Authorization: "Bearer " + key, "Content-Type": "application/json", "User-Agent": "assii/1.0" },
        body: JSON.stringify({ from: FROM, to: [sEmail], subject: "Pago rechazado", text: "Hola " + sName + ",\n\nTu comprobante ha sido rechazado.\nMotivo: " + reason + "\n\nEquipo ASSII" }),
      })
    }
  } catch (_) {}
})
