const API_KEY = 'ef66e4fffbmshc4ad32b653ea502p1c9116jsnef1759373801';
const API_HOST = 'free-tempmail-api.p.rapidapi.com';

let currentEmail = "";
let seenIds = new Set();

// Minta izin notifikasi
if (Notification.permission !== "granted") Notification.requestPermission();

async function callAPI(endpoint) {
    const res = await fetch(`https://${API_HOST}${endpoint}`, {
        method: 'GET',
        headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': API_HOST }
    });
    return await res.json();
}

async function generateNew() {
    document.getElementById('email-address').value = "Generating...";
    const data = await callAPI('/api/v1/generate');
    currentEmail = data.email;
    document.getElementById('email-address').value = currentEmail;
    document.getElementById('mail-list').innerHTML = '<p class="waiting">Menunggu email masuk...</p>';
    seenIds.clear();
}

async function checkInbox() {
    if (!currentEmail) return;
    try {
        const messages = await callAPI(`/api/v1/messages?email=${currentEmail}`);
        if (messages.length > 0) {
            const list = document.getElementById('mail-list');
            list.innerHTML = "";
            messages.forEach(msg => {
                // Notifikasi jika ada ID baru
                if (!seenIds.has(msg.id)) {
                    playNotif(msg.subject);
                    seenIds.add(msg.id);
                }

                const div = document.createElement('div');
                div.className = 'mail-item';
                div.innerHTML = `<strong>${msg.from}</strong><br><small>${msg.subject}</small>`;
                div.onclick = () => openMail(msg.id);
                list.appendChild(div);
            });
        }
    } catch (e) { console.log("Inbox masih kosong..."); }
}

async function openMail(id) {
    const mail = await callAPI(`/api/v1/message/${id}`);
    document.getElementById('view-subject').innerText = mail.subject;
    document.getElementById('view-from').innerText = mail.from;
    document.getElementById('view-body').innerHTML = mail.body_html || mail.body_text;
    document.getElementById('mail-modal').style.display = 'block';
}

function playNotif(subject) {
    new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play();
    if (Notification.permission === "granted") {
        new Notification("Email Baru!", { body: subject });
    }
}

function copyEmail() {
    const input = document.getElementById('email-address');
    input.select();
    navigator.clipboard.writeText(input.value);
    alert("Email disalin!");
}

function closeModal() { document.getElementById('mail-modal').style.display = 'none'; }

// Jalankan
generateNew();
setInterval(checkInbox, 5000); // Cek setiap 5 detik
