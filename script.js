const WEBHOOK_NOTIFY = "https://discord.com/api/webhooks/1446569276768129105/2axI5c4jfCx8GQGrqpQCnxneKvHslnN5qZZI7Dgxjn16-GE-VgAAdu45xA7wx7HCsnpc";
const WEBHOOK_CLAIM = "https://discord.com/api/webhooks/1447244203045163028/pQ5Xe-1bMLG_jjtk1rJuAlBk39Y6N5W-XYW1JLSP3k5uxKGRgmRqznEwy5skiYFiinqf";

// ----------------------------
// CLAIM SYSTEM
// ----------------------------
function sendClaim() {
    const buyer = document.getElementById("buyer").value;
    const receiver = document.getElementById("receiver").value;
    const email = document.getElementById("email").value;

    if (!buyer || !receiver || !email) {
        alert("Completa todos los campos.");
        return;
    }

    const claimCode = "FWF-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    document.getElementById("claimCodeBox").innerHTML =
        "Tu código de claim es: <b>" + claimCode + "</b>";

    let data = {
        content: `@1446574262159671366 **Nuevo Claim Order**`,
        embeds: [{
            title: "Claim recibido 🎄",
            color: 16711680,
            fields: [
                {name: "Comprador", value: buyer},
                {name: "Receptor", value: receiver},
                {name: "Correo", value: email},
                {name: "Código Claim", value: claimCode}
            ]
        }]
    };

    fetch(WEBHOOK_CLAIM, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    });

    saveOrder(buyer, receiver, email, claimCode);
}

// ----------------------------
// SAVE LOCALLY FOR ADMIN
// ----------------------------
function saveOrder(buyer, receiver, email, code) {
    let orders = JSON.parse(localStorage.getItem("orders") || "[]");

    orders.push({buyer, receiver, email, code});
    localStorage.setItem("orders", JSON.stringify(orders));
}

// ----------------------------
// ADMIN LOGIN
// ----------------------------
function loginAdmin() {
    const pass = document.getElementById("adminPass").value;
    if (pass !== "1010") return alert("Contraseña incorrecta");

    document.getElementById("loginBox").style.display = "none";
    document.getElementById("panel").style.display = "block";

    loadOrders();
}

function loadOrders() {
    let orders = JSON.parse(localStorage.getItem("orders") || "[]");
    let box = document.getElementById("orders");

    box.innerHTML = "";

    orders.forEach(o => {
        box.innerHTML += `
            <div class="order-card">
                <p><strong>Comprador:</strong> ${o.buyer}</p>
                <p><strong>Receptor:</strong> ${o.receiver}</p>
                <p><strong>Correo:</strong> ${o.email}</p>
                <p><strong>Claim Code:</strong> ${o.code}</p>
            </div>
        `;
    });
}
