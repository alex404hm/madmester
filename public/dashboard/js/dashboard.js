document.addEventListener('DOMContentLoaded', () => {
    // Redirect to /dashboard if not already on a dashboard page
    if (!window.location.pathname.startsWith('/dashboard')) {
        window.location.href = '/dashboard';
    }

    fetchFamilyInfo();
    fetchTodaysMeal();
    setupSearchFunctionality();
});

/**
 * Fetch Family Information
 */
async function fetchFamilyInfo() {
    try {
        const response = await fetch('/api/family-info', {
            method: 'GET',
            credentials: 'include', // Include cookies if needed
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const familyName = data.familyName || 'MadMester Family';
            document.getElementById('welcome-message').textContent = `Welcome, ${familyName}!`;
        } else {
            console.error('Failed to fetch family info');
            document.getElementById('welcome-message').textContent = 'Welcome to MadMester';
        }
    } catch (error) {
        console.error('Error fetching family info:', error);
        document.getElementById('welcome-message').textContent = 'Welcome to MadMester';
    }
}

/**
 * Fetch Today's Meal
 */
async function fetchTodaysMeal() {
    try {
        const response = await fetch('/api/todays-meal', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            document.getElementById('meal-title').textContent = data.mealName || 'Grilled Chicken Salad';
            document.getElementById('meal-calories').textContent = `Calories: ${data.calories || 350}`;
            const mealImageContainer = document.getElementById('meal-image-container');
            const mealImage = document.createElement('img');
            mealImage.src = data.imageUrl || 'https://source.unsplash.com/300x200/?healthy,meal';
            mealImage.alt = data.mealName || 'Healthy Meal';
            mealImage.classList.add('w-full', 'h-40', 'object-cover', 'rounded-lg', 'mb-4');
            mealImage.loading = 'lazy';

            // Clear loading spinner and append image
            mealImageContainer.innerHTML = '';
            mealImageContainer.appendChild(mealImage);
        } else {
            console.error('Failed to fetch today\'s meal');
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load today\'s meal. Please try again later.',
                confirmButtonText: 'OK'
            });
            // Update UI to reflect error
            document.getElementById('meal-title').textContent = 'Unavailable';
            document.getElementById('meal-calories').textContent = '';
            const mealImageContainer = document.getElementById('meal-image-container');
            mealImageContainer.innerHTML = '<i class="fas fa-exclamation-triangle text-red-500"></i>';
        }
    } catch (error) {
        console.error('Error fetching today\'s meal:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An unexpected error occurred while fetching your meal.',
            confirmButtonText: 'OK'
        });
        // Update UI to reflect error
        document.getElementById('meal-title').textContent = 'Unavailable';
        document.getElementById('meal-calories').textContent = '';
        const mealImageContainer = document.getElementById('meal-image-container');
        mealImageContainer.innerHTML = '<i class="fas fa-exclamation-triangle text-red-500"></i>';
    }
}

/**
 * Setup Search Functionality
 */
function setupSearchFunctionality() {
    const searchInput = document.getElementById('search-input');

    searchInput.addEventListener('input', debounce(async (e) => {
        const query = e.target.value.trim();
        if (query.length === 0) {
            // Optionally, reset search results
            return;
        }

        try {
            const response = await fetch(`/api/search-meals?q=${encodeURIComponent(query)}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                displaySearchResults(data.meals);
            } else {
                console.error('Failed to search meals');
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to search meals. Please try again later.',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error('Error searching meals:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An unexpected error occurred while searching.',
                confirmButtonText: 'OK'
            });
        }
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
 * Display Search Results
 */
function displaySearchResults(meals) {
    // Implement how you want to display search results
    // For example, redirect to a search results page or display a dropdown
    // Here, we'll use SweetAlert2 to display a simple list
    if (meals.length === 0) {
        Swal.fire({
            icon: 'info',
            title: 'No Results',
            text: 'No meals found matching your search.',
            confirmButtonText: 'OK'
        });
        return;
    }

    const mealList = meals.map(meal => `<li>${meal.mealName} - ${meal.calories} Calories</li>`).join('');
    Swal.fire({
        icon: 'success',
        title: 'Search Results',
        html: `<ul class="list-disc list-inside text-left">${mealList}</ul>`,
        confirmButtonText: 'OK'
    });
}