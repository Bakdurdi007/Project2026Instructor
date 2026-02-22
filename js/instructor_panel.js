const SUBAPASE_URL = "https://wczijkqackrmzssfgdqm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indjemlqa3FhY2tybXpzc2ZnZHFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1OTk4MzksImV4cCI6MjA4NzE3NTgzOX0.ooRafiR7nR08d1f0_XEyX19AXPHRaOzjurNYw7SvZwI";
// Nom o'zgartirildi: supabaseClient (xatolikni oldini olish uchun)
const supabaseClient = supabase.createClient(SUBAPASE_URL, SUPABASE_KEY);

let currentInstructor = null;
let activeTicket = null;

async function initApp() {
    const instructorId = localStorage.getItem('instructor_id');
    const { data: inst } = await supabaseClient.from('instructors').select('*').eq('id', instructorId).single();
    if (inst) {
        currentInstructor = inst;
        document.getElementById('instructor-name').innerText = inst.full_name;
        startScanner();
    }
}

function startScanner() {
    const html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, onScanSuccess).catch(err => console.error("Kamera xatosi:", err));
}

async function onScanSuccess(decodedText) {
    const { data: ticket } = await supabaseClient.from('tickets').select('*, centers(name)').eq('id', decodedText).single();
    if (ticket && ticket.is_active) {
        activeTicket = ticket;
        showSection('customer-card');
        document.getElementById('c-id').innerText = ticket.id;
        document.getElementById('c-name').innerText = ticket.full_name;
        document.getElementById('c-center').innerText = ticket.centers?.name || "Noma'lum";
        document.getElementById('c-sum').innerText = ticket.payment_amount.toLocaleString();
    } else {
        alert("Yaroqsiz QR kod!");
    }
}

window.showSection = function(id) {
    document.querySelectorAll('.panel-section').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
};

window.logout = function() {
    localStorage.clear();
    window.location.replace('index.html');
};

initApp();