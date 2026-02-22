// 1. Supabase sozlamalari
const SUBAPASE_URL = "https://wczijkqackrmzssfgdqm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indjemlqa3FhY2tybXpzc2ZnZHFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1OTk4MzksImV4cCI6MjA4NzE3NTgzOX0.ooRafiR7nR08d1f0_XEyX19AXPHRaOzjurNYw7SvZwI";
const _supabase = supabase.createClient(SUBAPASE_URL, SUPABASE_KEY);

let currentInstructor = null;
let activeTicket = null;

// --- GLOBAL FUNKSIYALAR ---
window.showSection = function(id) {
    document.querySelectorAll('main section').forEach(s => s.style.display = 'none');
    const target = document.getElementById(id);
    if (target) target.style.display = 'block';
};

window.logout = function() {
    localStorage.clear();
    window.location.replace('login.html');
};

// 2. Ilovani boshlash va Auth Guard
async function initApp() {
    const instructorId = localStorage.getItem('instructor_id');

    if (!instructorId) {
        window.location.replace('login.html');
        return;
    }

    const { data, error } = await _supabase
        .from('instructors')
        .select('*')
        .eq('id', instructorId)
        .single();

    if (data) {
        currentInstructor = data;
        document.getElementById('instructor-name').innerText = data.full_name;

        // Agar status false bo'lsa, skanerni bloklash
        if (!data.status) {
            document.getElementById('reader').innerHTML = `
                <div class="alert-box">
                    Siz hali bandsiz! Iltimos dars mashg'ulotingiz tugashini kuting.
                </div>`;
        } else {
            startScanner();
        }
    } else {
        window.location.replace('login.html');
    }
}

// 3. QR Skaner
function startScanner() {
    const html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess
    ).catch(err => console.error("Kamera xatosi:", err));
}

async function onScanSuccess(decodedText) {
    // Instructor statusini qayta tekshirish
    const { data: inst } = await _supabase.from('instructors').select('status').eq('id', currentInstructor.id).single();
    if (!inst.status) {
        alert("Siz hali bandsiz!");
        return;
    }

    const { data: ticket, error } = await _supabase
        .from('tickets')
        .select('*, centers(name)')
        .eq('id', decodedText)
        .single();

    if (!ticket || !ticket.is_active) {
        alert("Ushbu chek yaroqsiz yoki oldin ishlatilgan!");
        return;
    }

    activeTicket = ticket;
    displayTicketInfo(ticket);
}

function displayTicketInfo(ticket) {
    showSection('customer-card');
    document.getElementById('c-id').innerText = ticket.id;
    document.getElementById('c-name').innerText = ticket.full_name;
    document.getElementById('c-center').innerText = ticket.centers?.name || "Noma'lum";
    document.getElementById('c-type').innerText = ticket.direction_category;
    document.getElementById('c-group').innerText = ticket.group;
    document.getElementById('c-sum').innerText = ticket.payment_amount.toLocaleString();
    document.getElementById('c-time').innerText = ticket.minute;
    document.getElementById('c-date').innerText = new Date(ticket.created_at).toLocaleString();
}

// 4. Mashg'ulotni boshlash va Hisob-kitob
document.getElementById('start-lesson-btn').addEventListener('click', async () => {
    if (!activeTicket || !currentInstructor) return;

    const startTime = new Date();
    const stopTime = new Date(startTime.getTime() + activeTicket.minute * 60000);
    const actual_minute = activeTicket.minute; // Boshlang'ich qiymat

    try {
        // Instructor statusini band qilish
        await _supabase.from('instructors').update({ status: false }).eq('id', currentInstructor.id);

        // Ticket ma'lumotlarini yangilash
        await _supabase.from('tickets').update({
            lesson_start_time: startTime.toISOString(),
            lesson_stop_time: stopTime.toISOString(),
            actual_minute: actual_minute,
            is_active: false,
            instructor_id: currentInstructor.id
        }).eq('id', activeTicket.id);

        // --- HISOBOTLARNI YANGILASH (Reports table) ---
        await updateInstructorReports(actual_minute, activeTicket.payment_amount);

        alert("Mashg'ulot boshlandi!");
        location.reload();
    } catch (err) {
        console.error("Xatolik:", err);
    }
});

async function updateInstructorReports(minute, payment) {
    // Avvalgi hisobotni olish
    let { data: report } = await _supabase
        .from('reports')
        .select('*')
        .eq('instructor_id', currentInstructor.id)
        .single();

    if (!report) {
        // Agar hisobot bo'lmasa yangi qator ochish
        const { data: newReport } = await _supabase.from('reports').insert([{
            instructor_id: currentInstructor.id,
            daily_minute: 0, weekly_minute: 0, monthly_minute: 0, annual_minute: 0,
            daily_money: 0, weekly_money: 0, monthly_money: 0, annual_money: 0,
            cashback_money: 0
        }]).select().single();
        report = newReport;
    }

    // Yangi minutlarni hisoblash
    const newMonthlyMin = (report.monthly_minute || 0) + minute;

    // Oylik maosh stavkasini aniqlash (Delta)
    const delta = newMonthlyMin > 12000 ? 45000 : 40000;
    const addedMoney = (minute / 60) * delta;
    const cashback = payment * 0.01;

    // Bazani yangilash
    await _supabase.from('reports').update({
        ticket_id: activeTicket.id,
        daily_minute: (report.daily_minute || 0) + minute,
        weekly_minute: (report.weekly_minute || 0) + minute,
        monthly_minute: newMonthlyMin,
        annual_minute: (report.annual_minute || 0) + minute,
        daily_money: (report.daily_money || 0) + addedMoney,
        weekly_money: (report.weekly_money || 0) + addedMoney,
        monthly_money: (report.monthly_money || 0) + addedMoney,
        annual_money: (report.annual_money || 0) + addedMoney,
        cashback_money: (report.cashback_money || 0) + cashback
    }).eq('instructor_id', currentInstructor.id);
}

// 5. Hisobotlarni ekranga chiqarish
window.loadReports = async function() {
    const { data: report } = await _supabase
        .from('reports')
        .select('*')
        .eq('instructor_id', currentInstructor.id)
        .single();

    if (report) {
        document.getElementById('d-money').innerText = Math.round(report.daily_money).toLocaleString();
        document.getElementById('d-min').innerText = report.daily_minute;
        document.getElementById('w-money').innerText = Math.round(report.weekly_money).toLocaleString();
        document.getElementById('m-money').innerText = Math.round(report.monthly_money).toLocaleString();
        document.getElementById('cb-money').innerText = Math.round(report.cashback_money).toLocaleString();
    }
};

// 6. Mijozlar ro'yxati
window.loadCustomerList = async function() {
    const { data: list } = await _supabase
        .from('tickets')
        .select('*')
        .eq('instructor_id', currentInstructor.id)
        .order('lesson_start_time', { ascending: false });

    const tbody = document.getElementById('customers-body');
    tbody.innerHTML = '';

    list?.forEach((item, index) => {
        tbody.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${item.full_name}</td>
                <td>${item.lesson_start_time ? new Date(item.lesson_start_time).toLocaleDateString() : '---'}</td>
                <td>${item.actual_minute || 0} min</td>
            </tr>`;
    });
};

// Ilovani yurgizish
initApp();