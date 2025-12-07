/* script.js - FWFigures
   - genera claim code
   - guarda orders en localStorage (fwf_orders)
   - envia a webhook claim y webhook notify
   - admin: listado, filtrar, verificar, borrar, descargar
*/

const WEBHOOK_CLAIM = "https://discord.com/api/webhooks/1447244203045163028/pQ5Xe-1bMLG_jjtk1rJuAlBk39Y6N5W-XYW1JLSP3k5uxKGRgmRqznEwy5skiYFiinqf";
const WEBHOOK_NOTIFY = "https://discord.com/api/webhooks/1446569276768129105/2axI5c4jfCx8GQGrqpQCnxneKvHslnN5qZZI7Dgxjn16-GE-VgAAdu45xA7wx7HCsnpc";
const DISCORD_MENTION = "@1446574262159671366";
const STORAGE_KEY = "fwf_orders";
const ADMIN_PASS = "1010";

/* ---------- helpers storage ---------- */
function loadOrders(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch(e){ console.warn("loadOrders error", e); return []; }
}
function saveOrders(list){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/* ---------- generate claim code ---------- */
function generateClaimCode(){
  const part = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FWF-${part()}-${part()}`;
}

/* ---------- open/close claim modal helpers (used on product pages) ---------- */
function openClaim(modelName){
  // If claim overlay exists, show and fill; else redirect to claim.html with param
  const overlay = document.getElementById("claimOverlay");
  if(overlay){
    document.getElementById("claimTitle").innerText = `Claim your order — ${modelName}`;
    document.getElementById("claimModel").value = modelName;
    // update preview image if present
    const preview = document.getElementById("claimPreview") || document.getElementById("claimPreview2");
    if(preview){
      preview.src = modelName === "Mujer" ? "images/mujer.png" : "images/hombre.png";
    }
    overlay.style.display = "flex";
    document.getElementById("purchased_user").value = "";
    document.getElementById("target_user").value = "";
    document.getElementById("email").value = "";
    document.getElementById("image_url").value = "";
    document.getElementById("notes").value = "";
    return;
  }
  // otherwise redirect to claim page with product query
  location.href = `claim.html?producto=${encodeURIComponent(modelName)}`;
}
function closeClaim(){
  const overlay = document.getElementById("claimOverlay");
  if(overlay) overlay.style.display = "none";
}

/* ---------- submit claim (works from claim.html and product modal) ---------- */
async function submitClaim(){
  // look for fields (claim.html uses different ids)
  const buyer = (document.getElementById("claimUser") && document.getElementById("claimUser").value.trim()) ||
                (document.getElementById("purchased_user") && document.getElementById("purchased_user").value.trim());
  const receiver = (document.getElementById("modelUser") && document.getElementById("modelUser").value.trim()) ||
                   (document.getElementById("target_user") && document.getElementById("target_user").value.trim());
  const email = (document.getElementById("claimEmail") && document.getElementById("claimEmail").value.trim()) ||
                (document.getElementById("email") && document.getElementById("email").value.trim());
  const image = (document.getElementById("claimImage") && document.getElementById("claimImage").value.trim()) ||
                (document.getElementById("image_url") && document.getElementById("image_url").value.trim());
  const notes = (document.getElementById("claimNotes") && document.getElementById("claimNotes").value.trim()) ||
                (document.getElementById("notes") && document.getElementById("notes").value.trim());
  const product = (document.getElementById("claimProduct") && document.getElementById("claimProduct").value.trim()) ||
                  (document.getElementById("claimModel") && document.getElementById("claimModel").value.trim()) ||
                  "No especificado";

  if(!buyer || !receiver || !email){
    showClaimAlert("Completa usuario comprador, usuario para la comisión y email.", "error");
    return;
  }

  // generar codigo
  const code = generateClaimCode();

  // build order object
  const order = {
    id: Date.now().toString(36),
    product, buyer, receiver, email, image: image || null, notes: notes || null,
    code, date: new Date().toLocaleString(), verified: false
  };

  // save local
  const list = loadOrders();
  list.unshift(order);
  saveOrders(list);

  // show code in UI (if present)
  const codeBox = document.getElementById("claimResult") || document.getElementById("claimCodeBox");
  if(codeBox){
    codeBox.style.display = "block";
    codeBox.innerHTML = `Tu código de claim es: <strong>${code}</strong> <button style="margin-left:10px;padding:6px;border-radius:8px" onclick="copyToClipboard('${code}')">Copiar</button>`;
  }

  // feedback
  showClaimAlert("Orden registrada. Revisa tu código y únete al soporte si necesitas ayuda.", "success");

  // send to CLAIM webhook (para bot de tickets)
  const content_claim = `${DISCORD_MENTION}\n**Nueva Orden - Claim**\n• Producto: ${order.product}\n• Comprador: ${order.buyer}\n• Receptor: ${order.receiver}\n• Email: ${order.email}\n• Código: ${order.code}\n• Fecha: ${order.date}\n• Notas: ${order.notes || "—"}\n• Imagen: ${order.image || "—"}`;
  safePostWebhook(WEBHOOK_CLAIM, { content: content_claim });

  // send to NOTIFY webhook (notificación secundaria)
  const content_notify = `🔔 Nueva orden enviada en la web\n• ${order.product} — ${order.code}\n• Comprador: ${order.buyer}`;
  safePostWebhook(WEBHOOK_NOTIFY, { content: content_notify });

  // if claim modal was open, close it after a bit
  setTimeout(()=>{ closeClaim(); }, 1600);

  // redirect to home after small delay if on claim.html
  if(location.pathname.endsWith("claim.html")){
    setTimeout(()=>{ /* keep user seeing code for 3s */ }, 1000);
  }
}

/* ---------- helper: safe webhook POST (no crash on CORS) ---------- */
function safePostWebhook(url, payload){
  try {
    // Fire-and-forget: browsers may block cross-site POST to discord due to CORS.
    // But when allowed, this will post. We still do it; admin will see saved order locally anyway.
    fetch(url, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    }).then(res=>{
      // best-effort: no need to handle result
    }).catch(err=>{
      console.warn("Webhook post error (likely CORS):", err);
    });
  } catch(e){
    console.warn("safePostWebhook error", e);
  }
}

/* ---------- small UI helpers for claim page ---------- */
function showClaimAlert(msg, type){
  const el = document.getElementById("claimAlert") || document.getElementById("msgAlert");
  if(!el) return alert(msg);
  el.style.display = "block";
  el.className = "alert " + (type === "error" ? "error" : "success");
  el.innerText = msg;
  setTimeout(()=>{ el.style.display = "none"; }, 6000);
}
function copyToClipboard(text){
  navigator.clipboard?.writeText(text).then(()=>alert("Copiado al portapapeles: " + text), ()=>alert("No se pudo copiar"));
}

/* ---------- ADMIN functions ---------- */
function loginAdminFromUI(){
  const passInput = document.getElementById("adminPass");
  const pass = passInput?.value || "";
  if(pass !== ADMIN_PASS){ alert("Contraseña incorrecta."); return; }
  // show admin area
  const panel = document.getElementById("panelArea") || document.getElementById("panel");
  if(panel) panel.style.display = "block";
  const loginBox = document.getElementById("loginBox");
  if(loginBox) loginBox.style.display = "none";
  renderAdminOrders();
}

function renderAdminOrders(){
  const list = loadOrders();
  const filter = (document.getElementById("filterModel")?.value || "").toLowerCase();
  const q = (document.getElementById("searchQ")?.value || "").toLowerCase();
  const container = document.getElementById("ordersList") || document.getElementById("orders") || document.getElementById("ordersArea");
  if(!container) return;
  container.innerHTML = "";

  const filtered = list.filter(o=>{
    const byModel = filter ? (o.product || "").toLowerCase() === filter : true;
    const byQ = q ? ((o.buyer + o.receiver + o.email + (o.code||"") + (o.notes||"")).toLowerCase().includes(q)) : true;
    return byModel && byQ;
  });

  if(filtered.length === 0){
    container.innerHTML = `<div class="small">No hay órdenes</div>`;
    return;
  }

  filtered.forEach(o=>{
    const div = document.createElement("div");
    div.className = "order-item";
    div.innerHTML = `
      <div>
        <div style="font-weight:700">${o.product} • <span style="color:#6b7280;font-weight:600;font-size:13px">${o.date}</span></div>
        <div class="meta"><b>Comprador:</b> ${o.buyer} • <b>Para:</b> ${o.receiver}</div>
        <div class="meta"><b>Email:</b> ${o.email}</div>
        <div class="meta"><b>Código:</b> ${o.code}  ${o.verified ? ' <span style="color:#20c997;font-weight:700">(VERIFICADO)</span>' : ''}</div>
        <div class="meta"><b>Notas:</b> ${o.notes || '—'}</div>
        <div class="meta"><b>Imagen:</b> ${o.image ? `<a href="${o.image}" target="_blank">ver</a>` : '—'}</div>
      </div>
      <div class="order-actions">
        <button class="copy" onclick="copyToClipboard('${o.code}')">Copiar código</button>
        <button class="btn" onclick='verifyOrder("${o.id}")'>Verificar</button>
        <button class="del" onclick='deleteOrder("${o.id}")'>Eliminar</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function verifyOrder(id){
  let list = loadOrders();
  const idx = list.findIndex(x=>x.id === id);
  if(idx === -1) return alert("Orden no encontrada");
  if(!confirm("Marcar orden como verificada y notificar?")) return;
  list[idx].verified = true;
  saveOrders(list);
  renderAdminOrders();

  // send notification to notify webhook
  const o = list[idx];
  const content = `✅ Orden verificada\n• Producto: ${o.product}\n• Comprador: ${o.buyer}\n• Código: ${o.code}\n• Email: ${o.email}`;
  safePostWebhook(WEBHOOK_NOTIFY, { content });
  alert("Orden verificada y notificación enviada.");
}

function deleteOrder(id){
  if(!confirm("Eliminar esta orden?")) return;
  let list = loadOrders();
  list = list.filter(x=>x.id !== id);
  saveOrders(list);
  renderAdminOrders();
}

function clearAllOrders(){
  if(!confirm("Borrar todas las órdenes?")) return;
  localStorage.removeItem(STORAGE_KEY);
  renderAdminOrders();
}

function downloadOrders(){
  const data = loadOrders();
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "fwf_orders.json";
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

/* ---------- init ---------- */
document.addEventListener("DOMContentLoaded", ()=>{
  // auto-wire admin inputs present on many pages
  const adminInput = document.getElementById("adminPass");
  if(adminInput){
    adminInput.addEventListener("keyup", (e)=>{ if(e.key === 'Enter') loginAdminFromUI(); });
  }

  // If this page has an ordersArea (product page), load on admin login
  // Nothing else to init; orders are rendered on demand.
});

