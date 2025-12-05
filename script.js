// script.js - common logic for FWFigures
const WEBHOOK = "https://discord.com/api/webhooks/1446569276768129105/2axI5c4jfCx8GQGrqpQCnxneKvHslnN5qZZI7Dgxjn16-GE-VgAAdu45xA7wx7HCsnpc";
const MENTION = "@1446574262159671366";
const STORAGE_KEY = "fwf_orders";
const ADMIN_PASS = "1010";

/* ---------- helper storage ---------- */
function loadOrders(){
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch(e){ return []; }
}
function saveOrders(list){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/* ---------- claim modal control ---------- */
function openClaim(modelName){
  // modelName: 'Hombre' or 'Mujer'
  const overlay = document.getElementById("claimOverlay");
  overlay.style.display = "flex";
  // fill title + hidden model field
  document.getElementById("claimTitle").innerText = `Claim your order — ${modelName}`;
  document.getElementById("claimModel").value = modelName;
  // clear fields
  document.getElementById("purchased_user").value = "";
  document.getElementById("target_user").value = "";
  document.getElementById("email").value = "";
  document.getElementById("image_url").value = "";
  document.getElementById("notes").value = "";
  // scroll to top of modal
  overlay.scrollTop = 0;
}
function closeClaim(){
  document.getElementById("claimOverlay").style.display = "none";
}

/* ---------- submit claim ---------- */
async function submitClaim(){
  const model = document.getElementById("claimModel").value || "Modelo";
  const purchased = document.getElementById("purchased_user").value.trim();
  const target = document.getElementById("target_user").value.trim();
  const email = document.getElementById("email").value.trim();
  const image = document.getElementById("image_url").value.trim();
  const notes = document.getElementById("notes").value.trim();

  if(!purchased || !target || !email){
    alert("Por favor completa: usuario comprador, usuario de comisión y email.");
    return;
  }

  const order = {
    id: Date.now().toString(36),
    model, purchased, target, email, image, notes,
    date: new Date().toLocaleString()
  };

  // save locally (all models together)
  const list = loadOrders();
  list.unshift(order);
  saveOrders(list);

  // send to discord webhook
  const content = `${MENTION}\n**Nueva orden - ${model}**\n• **Usuario comprador:** ${purchased}\n• **Usuario para comisión:** ${target}\n• **Email:** ${email}\n• **Notas:** ${notes || "—"}\n• **Imagen:** ${image || "—"}\n• **Fecha:** ${order.date}`;

  // We try/catch fetch so page won't break if blocked
  try {
    await fetch(WEBHOOK, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ content })
    });
  } catch(e){
    console.warn("Webhook error:", e);
  }

  alert("Orden registrada. Gracias — te redirigimos al inicio.");
  closeClaim();
  window.location.href = "index.html";
}

/* ---------- admin ---------- */
function loginAdminFromUI(){
  const pass = document.getElementById("adminPass").value || "";
  if(pass !== ADMIN_PASS){
    alert("Contraseña incorrecta.");
    return;
  }
  renderAdminArea();
}

function renderAdminArea(){
  const area = document.getElementById("ordersArea");
  if(!area) return;
  const list = loadOrders();
  area.classList.remove("hidden");
  area.innerHTML = `<div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
      <strong>Órdenes (${list.length})</strong>
      <button style="margin-left:auto;padding:8px 10px;border-radius:8px;border:0;background:#ff6b6b;color:white;cursor:pointer" onclick="downloadOrders()">Descargar JSON</button>
      <button style="padding:8px 10px;border-radius:8px;border:0;background:#e6eafc;color:#0b57c6;cursor:pointer" onclick="clearAllOrders()">Borrar todo</button>
    </div>`;

  if(list.length === 0){
    area.innerHTML += `<div class="small">No hay órdenes aún.</div>`;
    return;
  }

  const filterHtml = `<div style="margin-bottom:12px;display:flex;gap:8px">
      <select id="adminFilter" onchange="applyFilter()" style="padding:8px;border-radius:8px;border:1px solid #eef2f7">
        <option value="">Todas</option>
        <option value="Hombre">Hombre</option>
        <option value="Mujer">Mujer</option>
      </select>
      <input id="adminSearch" placeholder="buscar usuario o email" style="padding:8px;border-radius:8px;border:1px solid #eef2f7;flex:1" oninput="applyFilter()">
    </div>`;
  area.innerHTML += filterHtml;

  const listHtml = list.map(o => {
    return `<div class="order-item">
      <div style="display:flex;justify-content:space-between;gap:8px">
        <div>
          <strong>${o.model}</strong> • <small style="color:#8b97a8">${o.date}</small><br>
          <b>Comprador:</b> ${o.purchased}<br>
          <b>Para:</b> ${o.target}<br>
          <b>Email:</b> ${o.email}<br>
          <b>Notas:</b> ${o.notes || "—"}<br>
          <b>Imagen:</b> ${o.image ? `<a href="${o.image}" target="_blank">ver</a>` : "—"}
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
          <button style="background:#ff6b6b;color:#fff;padding:8px;border-radius:8px;border:0;cursor:pointer" onclick="deleteOrder('${o.id}')">Eliminar</button>
        </div>
      </div>
    </div>`;
  }).join("");

  area.innerHTML += `<div id="adminList">${listHtml}</div>`;
}

function applyFilter(){
  const filter = (document.getElementById("adminFilter")?.value || "").toLowerCase();
  const q = (document.getElementById("adminSearch")?.value || "").toLowerCase();
  const list = loadOrders();
  const filtered = list.filter(o=>{
    const byModel = filter ? o.model.toLowerCase() === filter : true;
    const byQ = q ? (o.purchased + o.target + o.email + o.notes).toLowerCase().includes(q) : true;
    return byModel && byQ;
  });
  const el = document.getElementById("adminList");
  if(!el) return;
  el.innerHTML = filtered.map(o => {
    return `<div class="order-item">
      <div style="display:flex;justify-content:space-between;gap:8px">
        <div>
          <strong>${o.model}</strong> • <small style="color:#8b97a8">${o.date}</small><br>
          <b>Comprador:</b> ${o.purchased}<br>
          <b>Para:</b> ${o.target}<br>
          <b>Email:</b> ${o.email}<br>
          <b>Notas:</b> ${o.notes || "—"}<br>
          <b>Imagen:</b> ${o.image ? `<a href="${o.image}" target="_blank">ver</a>` : "—"}
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
          <button style="background:#ff6b6b;color:#fff;padding:8px;border-radius:8px;border:0;cursor:pointer" onclick="deleteOrder('${o.id}')">Eliminar</button>
        </div>
      </div>
    </div>`;
  }).join("");
}

function deleteOrder(id){
  if(!confirm("¿Eliminar esta orden?")) return;
  let list = loadOrders();
  list = list.filter(o => o.id !== id);
  saveOrders(list);
  renderAdminArea();
}

function downloadOrders(){
  const data = loadOrders();
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "fwf_orders.json";
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function clearAllOrders(){
  if(!confirm("Borrar todas las órdenes?")) return;
  localStorage.removeItem(STORAGE_KEY);
  renderAdminArea();
}

/* init: if admin inputs present on page, wire Enter key */
document.addEventListener("DOMContentLoaded", ()=>{
  const adminPassInput = document.getElementById("adminPass");
  if(adminPassInput){
    adminPassInput.addEventListener("keyup", (e)=>{
      if(e.key === "Enter") loginAdminFromUI();
    });
  }
});
