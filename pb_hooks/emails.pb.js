const AGENTMAIL_KEY = $os.getenv("AGENTMAIL_API_KEY") || "";
const INBOX = "arqonlabs%40agentmail.to";

function sendEmail(to, subject, text) {
  if (!AGENTMAIL_KEY) {
    console.log("[EMAIL MOCK]", { to, subject, text });
    return;
  }
  try {
    $http.send({
      url: `https://api.agentmail.to/v0/inboxes/${INBOX}/messages/send`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${AGENTMAIL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to, subject, text }),
    });
  } catch (e) {
    console.error("[EMAIL ERROR]", e);
  }
}

onRecordAfterCreateRequest((e) => {
  const col = e.collection?.name;
  const record = e.record;

  if (col === "form_responses") {
    const email = record.get("data")?.correo_electronico;
    const name = record.get("data")?.nombre_completo;

    if (email) {
      sendEmail(
        email,
        "Confirmacion de inscripcion - Diplomado GSST",
        `Hola ${name || ""},\n\nHemos recibido tu inscripcion al Diplomado en Competencias Gerenciales para la Gestion de la SST.\n\nEn breve recibiras instrucciones para completar tu proceso de inscripcion y realizar el pago correspondiente.\n\nSaludos,\nEquipo ASSII`
      );
    }

    const adminEmails = [];
    try {
      const admins = $app.findRecordsByFilter("admins", "", "", 0, 0);
      for (const a of admins) {
        adminEmails.push(a.get("email"));
      }
    } catch (_) {}

    for (const adminEmail of adminEmails) {
      sendEmail(
        adminEmail,
        "Nueva inscripcion recibida",
        `${name || "Alguien"} se ha inscrito al diplomado. Revisa el panel de administracion.`
      );
    }
  }

  if (col === "payments") {
    const enrollmentId = record.get("enrollmentId");
    let studentEmail = "";
    let studentName = "";

    try {
      const enrollment = $app.findRecordById("enrollments", enrollmentId);
      if (enrollment) {
        enrollment.set("status", "PAYMENT_SUBMITTED");
        $app.save(enrollment);

        const studentId = enrollment.get("studentId");
        const student = $app.findRecordById("students", studentId);
        if (student) {
          studentEmail = student.get("email");
          studentName = `${student.get("firstName")} ${student.get("lastName")}`;
        }
      }
    } catch (_) {}

    if (studentEmail) {
      sendEmail(
        studentEmail,
        "Comprobante de pago recibido",
        `Hola ${studentName},\n\nHemos recibido tu comprobante de pago. Un administrador lo validara en breve.\n\nSaludos,\nEquipo ASSII`
      );
    }
  }
});

onRecordAfterUpdateRequest((e) => {
  const col = e.collection?.name;
  const record = e.record;

  if (col === "payments") {
    const status = record.get("status");
    const enrollmentId = record.get("enrollmentId");
    const rejectionReason = record.get("rejectionReason");

    let studentEmail = "";
    let studentName = "";

    try {
      const enrollment = $app.findRecordById("enrollments", enrollmentId);
      if (enrollment) {
        if (status === "VALIDATED") {
          enrollment.set("status", "ACTIVE");
        } else if (status === "REJECTED") {
          enrollment.set("status", "PAYMENT_REJECTED");
        }
        $app.save(enrollment);

        const studentId = enrollment.get("studentId");
        const student = $app.findRecordById("students", studentId);
        if (student) {
          studentEmail = student.get("email");
          studentName = `${student.get("firstName")} ${student.get("lastName")}`;
        }
      }
    } catch (_) {}

    if (!studentEmail) return;

    if (status === "VALIDATED") {
      sendEmail(
        studentEmail,
        "Pago validado - Acceso al diplomado confirmado",
        `Hola ${studentName},\n\nTu pago ha sido validado. Ya tienes acceso al diplomado.\n\nRecibiras las ligas de acceso a las sesiones en tu correo.\n\nSaludos,\nEquipo ASSII`
      );
    } else if (status === "REJECTED") {
      sendEmail(
        studentEmail,
        "Pago rechazado - Accion requerida",
        `Hola ${studentName},\n\nTu comprobante de pago ha sido rechazado.\n\nMotivo: ${rejectionReason || "No especificado"}\n\nPor favor sube un nuevo comprobante o contacta al administrador.\n\nSaludos,\nEquipo ASSII`
      );
    }
  }
});
