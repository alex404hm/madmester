document.addEventListener('DOMContentLoaded', () => {
    const steps = [
        {
            question: 'Hvor gammel er du? 🧒👦👨👩👴👵',
            type: 'select',
            options: [
                'Barn (0-12 år)',
                'Teenager (13-19 år)',
                'Voksen (20-64 år)',
                'Ældre (65+ år)'
            ],
            name: 'age'
        },
        {
            question: 'Hvad er dit køn? 🚹🚺',
            type: 'radio',
            options: ['Mand', 'Kvinde', 'Andet'],
            name: 'gender'
        },
        {
            question: 'Har du nogen specifikke diætbehov eller præferencer? 🌱🍞🍗🍖',
            type: 'checkbox',
            options: ['Vegan', 'Vegetar', 'Glutenfri', 'Lavkarbo', 'Andet'],
            name: 'dietPreferences'
        },
        {
            question: 'Er der nogen fødevarer, du ikke kan lide eller helst vil undgå? 🚫🍄🐟',
            type: 'text',
            placeholder: 'Fx aubergine, fisk, svampe eller noget andet',
            name: 'dislikedFoods'
        },
        {
            question: 'Hvilke proteiner foretrækker du mest i dine måltider? 🍗🥩🐟',
            type: 'radio',
            options: ['Kylling', 'Oksekød', 'Fisk', 'Vegetarisk'],
            name: 'proteinPreference'
        },
        {
            question: 'Hvilke grøntsager er dine favoritter? 🥦🥕🍅',
            type: 'text',
            placeholder: 'Vælg dine top 3, fx broccoli, søde kartofler, spinat, gulerødder',
            name: 'favoriteVeggies'
        },
        {
            question: 'Hvilke typer mad gør dig glad? 🍕🍣🍔',
            type: 'radio',
            options: ['Italiensk', 'Mexicansk', 'Asiatisk', 'Dansk mad', 'Amerikansk', 'Andet'],
            name: 'happyFoodType'
        },
        {
            question: 'Hvilken smag foretrækker du i dine retter? 🌶️🍋🍯',
            type: 'checkbox',
            options: ['Krydret', 'Frisk', 'Sødt', 'Saltet', 'Cremet', 'Mildt', 'Balanceret', 'Andet'],
            name: 'flavorPreferences'
        },
        {
            question: 'Hvis du skulle vælge en ret til en speciel dag, hvad ville det være? 🎉🍛',
            type: 'text',
            placeholder: 'Fx en festmiddag eller comfort food',
            name: 'specialDayDish'
        },
        {
            question: 'Er der nogen retter eller ingredienser, du altid har ønsket at prøve? 🌟🍜',
            type: 'text',
            placeholder: 'Fx ramen, hjemmelavet sushi eller en spændende gryderet',
            name: 'desiredDishes'
        }
    ];

    const form = document.getElementById('preferences-form');
    const progressBar = document.getElementById('progress-bar');

    let currentStep = 0;

    function renderStep(stepIndex) {
        form.innerHTML = '';
        const step = steps[stepIndex];

        const questionLabel = document.createElement('label');
        questionLabel.className = 'block text-lg font-medium';
        questionLabel.textContent = step.question;
        form.appendChild(questionLabel);

        if (step.type === 'select') {
            const select = document.createElement('select');
            select.name = step.name;
            select.required = true;
            select.className = 'mt-1 block w-full px-3 py-2 border border-gray-700 rounded-lg shadow-sm bg-gray-700 focus:ring-green-500 focus:border-green-500';
            step.options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                select.appendChild(optionElement);
            });
            form.appendChild(select);
        } else if (step.type === 'radio' || step.type === 'checkbox') {
            step.options.forEach(option => {
                const label = document.createElement('label');
                label.className = 'inline-flex items-center mt-2';
                const input = document.createElement('input');
                input.type = step.type;
                input.name = step.name;
                input.value = option;
                input.className = 'form-' + step.type + ' text-green-600';
                label.appendChild(input);
                const span = document.createElement('span');
                span.className = 'ml-2';
                span.textContent = option;
                label.appendChild(span);
                form.appendChild(label);
            });
        } else if (step.type === 'text') {
            const input = document.createElement('input');
            input.type = 'text';
            input.name = step.name;
            input.placeholder = step.placeholder;
            input.required = true;
            input.className = 'mt-1 block w-full px-3 py-2 border border-gray-700 rounded-lg shadow-sm bg-gray-700 focus:ring-green-500 focus:border-green-500';
            form.appendChild(input);
        }

        const navButtons = document.createElement('div');
        navButtons.className = 'flex justify-between mt-4';

        if (stepIndex > 0) {
            const backButton = document.createElement('button');
            backButton.type = 'button';
            backButton.className = 'bg-gray-700 text-gray-300 py-2 px-4 rounded-lg font-medium hover:bg-gray-600 focus:outline-none';
            backButton.innerHTML = '<i class="fas fa-arrow-left mr-2"></i> Tilbage';
            backButton.onclick = () => renderStep(stepIndex - 1);
            navButtons.appendChild(backButton);
        }

        if (stepIndex < steps.length - 1) {
            const nextButton = document.createElement('button');
            nextButton.type = 'button';
            nextButton.className = 'bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 focus:outline-none';
            nextButton.innerHTML = 'Næste <i class="fas fa-arrow-right ml-2"></i>';
            nextButton.onclick = () => renderStep(stepIndex + 1);
            navButtons.appendChild(nextButton);
        } else {
            const submitButton = document.createElement('button');
            submitButton.type = 'submit';
            submitButton.className = 'bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 focus:outline-none';
            submitButton.innerHTML = 'Indsend <i class="fas fa-check ml-2"></i>';
            navButtons.appendChild(submitButton);
        }

        form.appendChild(navButtons);

        renderProgressBar(stepIndex);
    }

    function renderProgressBar(stepIndex) {
        progressBar.innerHTML = '';
        steps.forEach((_, index) => {
            const stepElement = document.createElement('div');
            stepElement.className = 'w-8 h-8 rounded-full flex items-center justify-center ' + (index <= stepIndex ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300');
            stepElement.textContent = index + 1;
            progressBar.appendChild(stepElement);
        });
    }

    renderStep(currentStep);
});

// Function to show the next step
function nextStep(step) {
    updateProgressBar(step);
    document.querySelectorAll('.step').forEach((stepDiv) => {
        stepDiv.classList.add('hidden');
        stepDiv.classList.remove('active');
    });
    document.getElementById(`step-${step}`).classList.remove('hidden');
    document.getElementById(`step-${step}`).classList.add('active');
    scrollToTop();
}

// Function to go back to the previous step
function prevStep(step) {
    updateProgressBar(step);
    document.querySelectorAll('.step').forEach((stepDiv) => {
        stepDiv.classList.add('hidden');
        stepDiv.classList.remove('active');
    });
    document.getElementById(`step-${step}`).classList.remove('hidden');
    document.getElementById(`step-${step}`).classList.add('active');
    scrollToTop();
}

// Function to update the progress bar
function updateProgressBar(currentStep) {
    const steps = document.querySelectorAll('.progress-step');
    steps.forEach((stepDiv, index) => {
        if (index < currentStep - 1) {
            stepDiv.classList.add('completed');
            stepDiv.classList.remove('active');
        } else if (index === currentStep - 1) {
            stepDiv.classList.add('active');
            stepDiv.classList.remove('completed');
        } else {
            stepDiv.classList.remove('active', 'completed');
        }
    });
}

// Function to scroll to the top of the page
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show or hide additional input fields based on selection
document.addEventListener('DOMContentLoaded', () => {
    const dietCheckboxes = document.getElementsByName('dietPreferences');
    dietCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const otherDiet = document.getElementById('other-diet');
            if (document.querySelector('input[name="dietPreferences"][value="Andet"]').checked) {
                otherDiet.style.display = 'block';
            } else {
                otherDiet.style.display = 'none';
                document.getElementById('otherDietInput').value = '';
            }
        });
    });

    const happyFoodTypeRadios = document.getElementsByName('happyFoodType');
    happyFoodTypeRadios.forEach(rb => {
        rb.addEventListener('change', () => {
            const otherHappyFood = document.getElementById('other-happy-food');
            if (document.querySelector('input[name="happyFoodType"][value="Andet"]').checked) {
                otherHappyFood.style.display = 'block';
            } else {
                otherHappyFood.style.display = 'none';
                document.getElementById('otherHappyFoodInput').value = '';
            }
        });
    });

    const flavorCheckboxes = document.getElementsByName('flavorPreferences');
    flavorCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const otherFlavor = document.getElementById('other-flavor');
            if (document.querySelector('input[name="flavorPreferences"][value="Andet"]').checked) {
                otherFlavor.style.display = 'block';
            } else {
                otherFlavor.style.display = 'none';
                document.getElementById('otherFlavorInput').value = '';
            }
        });
    });
});

// Handle form submission
document.getElementById('preferences-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Collect form data
    const age = document.getElementById('age').value;
    const gender = document.querySelector('input[name="gender"]:checked') ? document.querySelector('input[name="gender"]:checked').value : '';
    const dietPreferences = Array.from(document.querySelectorAll('input[name="dietPreferences"]:checked')).map(cb => cb.value);
    const otherDiet = document.getElementById('otherDietInput') ? document.getElementById('otherDietInput').value.trim() : '';
    const dislikedFoods = document.getElementById('dislikedFoods').value.trim();
    const proteinPreference = document.querySelector('input[name="proteinPreference"]:checked') ? document.querySelector('input[name="proteinPreference"]:checked').value : '';
    const favoriteVeggies = document.getElementById('favoriteVeggies').value.trim();
    const happyFoodType = document.querySelector('input[name="happyFoodType"]:checked') ? document.querySelector('input[name="happyFoodType"]:checked').value : '';
    const otherHappyFood = document.getElementById('otherHappyFoodInput') ? document.getElementById('otherHappyFoodInput').value.trim() : '';
    const flavorPreferences = Array.from(document.querySelectorAll('input[name="flavorPreferences"]:checked')).map(cb => cb.value);
    const otherFlavor = document.getElementById('otherFlavorInput') ? document.getElementById('otherFlavorInput').value.trim() : '';
    const specialDayDish = document.getElementById('special-day-dish').value.trim();
    const desiredDishes = document.getElementById('desired-dishes').value.trim();

    // Validation
    if (!age || !gender || dietPreferences.length === 0 || !dislikedFoods || !proteinPreference || !favoriteVeggies || !happyFoodType || flavorPreferences.length === 0 || !specialDayDish || !desiredDishes) {
        Swal.fire({
            icon: 'error',
            title: 'Incomplete Form',
            text: 'Please fill out all fields before submitting.',
            confirmButtonText: 'OK'
        });
        return;
    }

    // If "Other" is selected in dietPreferences, otherDiet must be filled
    if (dietPreferences.includes('Andet') && !otherDiet) {
        Swal.fire({
            icon: 'error',
            title: 'Incomplete Form',
            text: 'Please specify your other dietary needs.',
            confirmButtonText: 'OK'
        });
        return;
    }

    // If "Other" is selected in happyFoodType, otherHappyFood must be filled
    if (happyFoodType === 'Andet' && !otherHappyFood) {
        Swal.fire({
            icon: 'error',
            title: 'Incomplete Form',
            text: 'Please specify your other preferred food types.',
            confirmButtonText: 'OK'
        });
        return;
    }

    // If "Other" is selected in flavorPreferences, otherFlavor must be filled
    if (flavorPreferences.includes('Andet') && !otherFlavor) {
        Swal.fire({
            icon: 'error',
            title: 'Incomplete Form',
            text: 'Please specify your other flavor preferences.',
            confirmButtonText: 'OK'
        });
        return;
    }

    // Prepare payload
    const payload = {
        age,
        gender,
        dietPreferences: dietPreferences.includes('Andet') ? [...dietPreferences.filter(pref => pref !== 'Andet'), otherDiet] : dietPreferences,
        dislikedFoods,
        proteinPreference,
        favoriteVeggies,
        happyFoodType: happyFoodType === 'Andet' ? otherHappyFood : happyFoodType,
        flavorPreferences: flavorPreferences.includes('Andet') ? [...flavorPreferences.filter(pref => pref !== 'Andet'), otherFlavor] : flavorPreferences,
        specialDayDish,
        desiredDishes
    };

    try {
        const response = await fetch('/api/food-preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            credentials: 'include', // Send cookies with the request
        });

        const result = await response.json();
        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Your food preferences have been saved successfully!',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // Redirect to dashboard or reset the form
                window.location.href = 'dashboard.html';
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: result.error || 'There was a problem saving your preferences.',
                confirmButtonText: 'OK'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An unexpected error occurred. Please try again later.',
            confirmButtonText: 'OK'
        });
    }
});

// Allow navigation with the Enter key correctly
document.getElementById('preferences-form').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const activeStep = document.querySelector('.step.active');
        const nextButton = activeStep.querySelector('button[type="button"], button[type="submit"]');
        if (nextButton) {
            nextButton.click();
        }
    }
});