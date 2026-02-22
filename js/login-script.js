// Supabase sozlamalari
const SUBAPASE_URL = "https://wczijkqackrmzssfgdqm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indjemlqa3FhY2tybXpzc2ZnZHFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1OTk4MzksImV4cCI6MjA4NzE3NTgzOX0.ooRafiR7nR08d1f0_XEyX19AXPHRaOzjurNYw7SvZwI";
const _supabase = supabase.createClient(SUBAPASE_URL, SUPABASE_KEY);

const loginForm = document.getElementById('login-form');
const errorDiv = document.getElementById('error-message');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const loginInput = document.getElementById('login').value;
    const passwordInput = document.getElementById('password').value;
    const loginBtn = document.getElementById('login-btn');

    // Tugmani vaqtincha faolsizlantirish
    loginBtn.innerText = "Tekshirilmoqda...";
    loginBtn.disabled = true;
    errorDiv.style.display = 'none';

    try {
        // 1. Bazadan login va password bo'yicha instructorni qidirish
        const { data: instructor, error } = await _supabase
            .from('instructors')
            .select('id, full_name, login, password')
            .eq('login', loginInput)
            .eq('password', passwordInput)
            .single();

        if (error || !instructor) {
            throw new Error("Login yoki parol xato!");
        }

        // 2. Muvaffaqiyatli kirish: ID ni saqlash
        localStorage.setItem('instructor_id', instructor.id);

        // 3. Panelga yo'naltirish
        window.location.href = 'instructor_panel.html';

    } catch (err) {
        errorDiv.innerText = err.message;
        errorDiv.style.display = 'block';
        loginBtn.innerText = "Kirish";
        loginBtn.disabled = false;
    }
});