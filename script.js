// Requirement: Tombol "Tampilkan Pesan" [cite: 244]
function showWelcomeMessage() {
    // Requirement: Alert berisi kalimat sapaan [cite: 245]
    alert("Halo, saya Arcana! Selamat datang di website portofolio saya.");
}

// Requirement: Fitur ubah tema warna 
const themeBtn = document.getElementById('theme-toggle');
const body = document.body;

themeBtn.addEventListener('click', function() {
    body.classList.toggle('dark-mode');
    
    // Optional: Change button text based on mode
    if (body.classList.contains('dark-mode')) {
        themeBtn.innerText = "Mode Terang";
    } else {
        themeBtn.innerText = "Mode Gelap";
    }
});