// Simple compare page functionality
document.addEventListener('DOMContentLoaded', function() {
    const compareText1 = document.getElementById('compareText1');
    const compareText2 = document.getElementById('compareText2');
    const charCount1 = document.getElementById('charCount1');
    const charCount2 = document.getElementById('charCount2');

    // Character counters
    if (compareText1 && charCount1) {
        compareText1.addEventListener('input', () => {
            charCount1.textContent = `${compareText1.value.length.toLocaleString()} characters`;
        });
    }

    if (compareText2 && charCount2) {
        compareText2.addEventListener('input', () => {
            charCount2.textContent = `${compareText2.value.length.toLocaleString()} characters`;
        });
    }
});