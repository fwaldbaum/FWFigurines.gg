// ⭐ Generate Claim Code
function generateClaimCode() {
    const part = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    return `FWF-${part()}-${part()}`;
}

// ⭐ Submit Claim
function submitClaim() {
    const username = document.getElementById("claimUser").value;
    const modelUser = document.getElementById("modelUser").value;
    const email = document.getElementById("claimEmail").value;
    const product = document.getElementById("claimProduct").value;

    const claimCode = generateClaimCode();

    alert("Tu Claim Code es:\n" + claimCode);

// ⭐ Save to Admin
    const order = { username, modelUser, email, product, claimCode };
    const orders = JSON.parse(localStorage.getItem("fwfOrders")) || [];
    orders.push(order);
    localStorage.setItem("fwfOrders", JSON.stringify(orders));

// ⭐ Send to Discord
    fetch("https://discord.com/api/webhooks/1447244203045163028/pQ5Xe-1bMLG_jjtk1rJuAlBk39Y6N5W-XYW1JLSP3k5uxKGRgmRqznEwy5skiYFiinqf", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            content: "@1446574262159671366 **Nueva Orden FWF**\n" +
                     "👤 **Comprador:** " + username + "\n" +
                     "🎨 **Comisión para:** " + modelUser + "\n" +
                     "📧 **Email:** " + email + "\n" +
                     "🛒 **Producto:** " + product + "\n" +
                     "🔐 **Claim Code:** " + claimCode
        })
    });
}

// ⭐ Admin Login
function loginAdmin() {
    const pass = document.getElementById("adminPass").value;
    if(pass === "1010") {
        document.getElementById("loginBox").classList.add("hidden");
        document.getElementById("adminPanel").classList.remove("hidden");
        loadAdminOrders();
    } else {
        alert("Contraseña incorrecta");
    }
}

// ⭐ Load Orders in Admin
function loadAdminOrders() {
    const orders = JSON.parse(localStorage.getItem("fwfOrders")) || [];
    const box = document.getElementById("adminOrders");

    box.innerHTML = "";

    orders.forEach(o => {
        box.innerHTML += `
            <div class="order-box">
                <p><b>Comprador:</b> ${o.username}</p>
                <p><b>Para:</b> ${o.modelUser}</p>
                <p><b>Email:</b> ${o.email}</p>
                <p><b>Producto:</b> ${o.product}</p>
                <p><b>Claim Code:</b> ${o.claimCode}</p>
            </div>
        `;
    });
}
