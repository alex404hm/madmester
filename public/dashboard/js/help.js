document.addEventListener('DOMContentLoaded', () => {
    fetchFAQs();
    setupFAQToggle();
    setupSearchFunctionality();
    setupContactForm();
});

/**
 * Fetch FAQs from API
 */
async function fetchFAQs() {
    try {
        const response = await fetch('/api/faqs', {
            method: 'GET',
            credentials: 'include', // Include cookies if needed
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const faqs = data.faqs || [];
            displayFAQs(faqs);
        } else {
            console.error('Failed to fetch FAQs');
            document.getElementById('faqs-list').innerHTML = '<p class="text-gray-500 dark:text-gray-400">Unable to load FAQs at this time.</p>';
        }
    } catch (error) {
        console.error('Error fetching FAQs:', error);
        document.getElementById('faqs-list').innerHTML = '<p class="text-gray-500 dark:text-gray-400">Unable to load FAQs at this time.</p>';
    }
}

/**
 * Display FAQs on the page
 * @param {Array} faqs - Array of FAQ objects
 */
function displayFAQs(faqs) {
    const faqsList = document.getElementById('faqs-list');
    faqsList.innerHTML = ''; // Clear existing FAQs

    if (faqs.length === 0) {
        faqsList.innerHTML = '<p class="text-gray-500 dark:text-gray-400">No FAQs available.</p>';
        return;
    }

    faqs.forEach(faq => {
        const faqItem = document.createElement('div');
        faqItem.className = 'faq-item';

        const faqButton = document.createElement('button');
        faqButton.className = 'w-full text-left flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none';
        faqButton.setAttribute('aria-expanded', 'false');
        faqButton.setAttribute('aria-controls', `faq-answer-${faq.id}`);
        faqButton.innerHTML = `
            <span>${faq.question}</span>
            <i class="fas fa-chevron-down"></i>
        `;

        const faqAnswer = document.createElement('div');
        faqAnswer.id = `faq-answer-${faq.id}`;
        faqAnswer.className = 'faq-answer p-4 bg-gray-50 dark:bg-gray-600 rounded-lg hidden';
        faqAnswer.innerHTML = `<p>${faq.answer}</p>`;

        faqItem.appendChild(faqButton);
        faqItem.appendChild(faqAnswer);
        faqsList.appendChild(faqItem);
    });
}

/**
 * Setup FAQ Toggle Functionality
 */
function setupFAQToggle() {
    document.addEventListener('click', (event) => {
        if (event.target.closest('.faq-item button')) {
            const button = event.target.closest('.faq-item button');
            const isExpanded = button.getAttribute('aria-expanded') === 'true';
            const faqAnswer = document.getElementById(button.getAttribute('aria-controls'));

            // Close all open FAQs
            document.querySelectorAll('.faq-item button').forEach(btn => {
                btn.setAttribute('aria-expanded', 'false');
                btn.querySelector('i').classList.remove('fa-chevron-up');
                btn.querySelector('i').classList.add('fa-chevron-down');
                document.getElementById(btn.getAttribute('aria-controls')).classList.add('hidden');
            });

            if (!isExpanded) {
                // Open the clicked FAQ
                button.setAttribute('aria-expanded', 'true');
                button.querySelector('i').classList.remove('fa-chevron-down');
                button.querySelector('i').classList.add('fa-chevron-up');
                faqAnswer.classList.remove('hidden');
            }
        }
    });
}

/**
 * Setup Search Functionality for FAQs
 */
function setupSearchFunctionality() {
    const searchInput = document.getElementById('search-input');

    searchInput.addEventListener('input', debounce((e) => {
        const query = e.target.value.trim().toLowerCase();
        const faqItems = document.querySelectorAll('.faq-item');

        faqItems.forEach(item => {
            const question = item.querySelector('button span').textContent.toLowerCase();
            if (question.includes(query)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }, 300));
}

/**
 * Debounce Function to Limit API Calls
 */
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Setup Contact Form Submission
 */
function setupContactForm() {
    const contactForm = document.getElementById('contact-form');

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('contact-name').value.trim();
        const email = document.getElementById('contact-email').value.trim();
        const message = document.getElementById('contact-message').value.trim();

        if (!name || !email || !message) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Input',
                text: 'Please fill in all fields.',
                confirmButtonText: 'OK'
            });
            return;
        }

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, message })
            });

            const data = await response.json();

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Message Sent',
                    text: 'Your message has been sent successfully.',
                    timer: 2000,
                    showConfirmButton: false
                });
                contactForm.reset();
            } else {
                const errorMsg = data.error || 'Failed to send your message.';
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: errorMsg,
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error('Error sending contact message:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An unexpected error occurred. Please try again later.',
                confirmButtonText: 'OK'
            });
        }
    });
}