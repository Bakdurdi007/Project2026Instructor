const SUBAPASE_URL = "https://wczijkqackrmzssfgdqm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indjemlqa3FhY2tybXpzc2ZnZHFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1OTk4MzksImV4cCI6MjA4NzE3NTgzOX0.ooRafiR7nR08d1f0_XEyX19AXPHRaOzjurNYw7SvZwI";
const _supabase = supabase.createClient(SUBAPASE_URL, SUPABASE_KEY);

const loginForm = document.getElementById('login-form');
const errorDiv = document.getElementById('error-message');
const loginBtn = document.getElementById('login-btn');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loginInput = document.getElementById('login').value.trim();
        const passwordInput = document.getElementById('password').value.trim();

        loginBtn.innerText = "Tekshirilmoqda...";
        loginBtn.disabled = true;
        errorDiv.style.display = 'none';

        try {
            const { data: instructor, error } = await _supabase
                .from('instructors')
                .select('id, full_name')
                .eq('login', loginInput)
                .eq('password', passwordInput)
                .single();

            if (error || !instructor) throw new Error("Login yoki parol xato!");

            localStorage.setItem('instructor_id', instructor.id);
            localStorage.setItem('instructor_name', instructor.full_name);
            window.location.replace('instructor_panel.html');
        } catch (err) {
            errorDiv.innerText = err.message;
            errorDiv.style.display = 'block';
            loginBtn.innerText = "Kirish";
            loginBtn.disabled = false;
        }
    });
}