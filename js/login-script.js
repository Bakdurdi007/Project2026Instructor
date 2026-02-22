// 1. Supabase ulanish ma'lumotlari
const SUPABASE_URL = 'https://wczijkqackrmzssfgdqm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indjemlqa3FhY2tybXpzc2ZnZHFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1OTk4MzksImV4cCI6MjA4NzE3NTgzOX0.ooRafiR7nR08d1f0_XEyX19AXPHRaOzjurNYw7SvZwI';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DIQQAT: checkAuth bu erda chaqirilmaydi! Faqat instructor_panel.js da chaqirilishi shart.

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const loginValue = document.getElementById('login').value.trim();
            const passwordValue = document.getElementById('password').value.trim();
            const errorMessage = document.getElementById('error-message');
            const loginBtn = document.getElementById('login-btn');

            // Tozalash
            errorMessage.style.display = 'none';
            loginBtn.disabled = true;
            loginBtn.innerText = "Tekshirilmoqda...";

            try {
                // Supabase so'rovi
                const { data: instructor, error } = await _supabase
                    .from('instructors')
                    .select('*')
                    .eq('login', loginValue) // AGAR BAZADA 'phone' BO'LSA! 'login' bo'lsa o'zgartirmang.
                    .eq('password', passwordValue)
                    .maybeSingle();

                if (error) throw error;

                if (!instructor) {
                    errorMessage.style.display = 'block';
                    errorMessage.innerText = "Login yoki parol xato!";
                } else {
                    // Muvaffaqiyatli login
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('userRole', 'instructor');
                    localStorage.setItem('instructorUser', JSON.stringify(instructor));

                    window.location.replace('instructor_panel.html');
                }
            } catch (err) {
                console.error("Login xatosi:", err);
                errorMessage.style.display = 'block';
                errorMessage.innerText = "Baza bilan aloqa yo'q yoki internet uzilgan!";
            } finally {
                loginBtn.disabled = false;
                loginBtn.innerText = "Kirish";
            }
        });
    }
});

/**
 * Tizimdan chiqish funksiyasi
 */
function logout() {
    if (confirm("Rostdan ham tizimdan chiqmoqchimisiz?")) {
        // Barcha login ma'lumotlarini tozalash
        localStorage.clear();
        // Login sahifasiga qaytarish
        window.location.replace('index.html');
    }
}

// Funksiyani HTML-dagi onclick hodisasi ko'rishi uchun global obyektga bog'laymiz
window.logout = logout;