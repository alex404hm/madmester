document.addEventListener('DOMContentLoaded', () => {
    // Tab Switching Functionality
    const joinTab = document.getElementById('join-tab');
    const createTab = document.getElementById('create-tab');
    const joinForm = document.getElementById('join-family-form');
    const createForm = document.getElementById('create-family-form');

    joinTab.addEventListener('click', () => {
        joinTab.classList.add('border-purple-600', 'text-purple-600');
        joinTab.setAttribute('aria-selected', 'true');
        createTab.classList.remove('border-purple-600', 'text-purple-600');
        createTab.setAttribute('aria-selected', 'false');
        joinForm.classList.remove('hidden');
        createForm.classList.add('hidden');
    });

    createTab.addEventListener('click', () => {
        createTab.classList.add('border-purple-600', 'text-purple-600');
        createTab.setAttribute('aria-selected', 'true');
        joinTab.classList.remove('border-purple-600', 'text-purple-600');
        joinTab.setAttribute('aria-selected', 'false');
        createForm.classList.remove('hidden');
        joinForm.classList.add('hidden');
    });

    // Initialize to show Join a Family by default
    joinTab.click();

    // Notification Area (Using SweetAlert2 instead)
    function showNotification(message, type) {
        if (type === 'success') {
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: message,
                timer: 2000,
                showConfirmButton: false
            });
        } else if (type === 'error') {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: message,
                confirmButtonText: 'OK'
            });
        }
    }

    // Modal Elements
    const shareCodeModal = document.getElementById('share-code-modal');
    const closeModalButton = document.getElementById('close-modal');
    const familyShareCode = document.getElementById('family-share-code');
    const copyCodeButton = document.getElementById('copy-code');

    // Function to Show Modal with Share Code
    function showShareCodeModal(code) {
        familyShareCode.textContent = code;
        shareCodeModal.classList.remove('hidden');
        shareCodeModal.classList.add('modal-active');

        // Redirect to /dashboard after 3 seconds
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 3000); // 3 seconds delay
    }

    // Function to Hide Modal
    function hideShareCodeModal() {
        shareCodeModal.classList.add('hidden');
        shareCodeModal.classList.remove('modal-active');
        window.location.href = '/dashboard';
    }

    // Close Modal on Close Button Click
    closeModalButton.addEventListener('click', hideShareCodeModal);

    // Close Modal on Outside Click
    window.addEventListener('click', (e) => {
        if (e.target === shareCodeModal) {
            hideShareCodeModal();
        }
    });

    // Copy Code to Clipboard
    copyCodeButton.addEventListener('click', () => {
        const code = familyShareCode.textContent;
        navigator.clipboard.writeText(code).then(() => {
            showNotification('Family share code copied to clipboard!', 'success');
        }).catch((err) => {
            console.error('Failed to copy code:', err);
            showNotification('Failed to copy code. Please try manually.', 'error');
        });
    });

    // Form Validation and Submission for Join Family
    const joinFamilyFormElement = document.getElementById('join-family-form');
    const familyCodeInput = document.getElementById('family-code');
    const familyCodeError = document.getElementById('family-code-error');
    const joinSubmitText = document.getElementById('join-submit-text');
    const joinSubmitSpinner = document.getElementById('join-submit-spinner');

    joinFamilyFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Reset error messages and notifications
        familyCodeError.classList.add('hidden');

        // Get form values
        const familyCode = familyCodeInput.value.trim();

        let hasError = false;

        // Validate Family Code
        if (familyCode === '') {
            familyCodeError.textContent = 'Family code is required.';
            familyCodeError.classList.remove('hidden');
            hasError = true;
        }

        if (hasError) return;

        // Show loading spinner
        joinSubmitText.classList.add('hidden');
        joinSubmitSpinner.classList.remove('hidden');

        try {
            const response = await fetch('/api/join-family', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include', // Ensure cookies are sent
                body: JSON.stringify({ familyCode })
            });

            const result = await response.json();

            if (response.ok) {
                // Show success notification
                showNotification('Successfully joined the family! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
            } else {
                // Show error notification
                const errorMessage = result.error || 'Failed to join family.';
                showNotification(`Failed to join family: ${errorMessage}`, 'error');
            }
        } catch (error) {
            console.error('Error during joining family:', error);
            showNotification('An unexpected error occurred. Please try again later.', 'error');
        } finally {
            // Hide loading spinner and show submit text
            joinSubmitText.classList.remove('hidden');
            joinSubmitSpinner.classList.add('hidden');
        }
    });

    // Form Validation and Submission for Create Family
    const createFamilyFormElement = document.getElementById('create-family-form');
    const familyNameInput = document.getElementById('family-name');
    const familyNameError = document.getElementById('family-name-error');
    const familySizeInput = document.getElementById('family-size');
    const familySizeError = document.getElementById('family-size-error');
    const createSubmitText = document.getElementById('create-submit-text');
    const createSubmitSpinner = document.getElementById('create-submit-spinner');
    const backButton = document.getElementById('back-button');

    // Form Steps
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');

    // Back Button Functionality
    backButton.addEventListener('click', () => {
        step2.classList.add('hidden');
        step1.classList.remove('hidden');
        backButton.classList.add('hidden');
        createSubmitText.textContent = 'Next';
    });

    createFamilyFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Reset error messages and notifications
        familyNameError.classList.add('hidden');
        familySizeError.classList.add('hidden');

        // Get form values
        const familyName = familyNameInput.value.trim();
        const familySize = familySizeInput.value.trim();

        let hasError = false;

        // Determine current step based on visibility
        if (!step2.classList.contains('hidden')) {
            // Step 2: Validate Family Size
            const familySizeNumber = parseInt(familySize, 10);
            if (familySize === '' || isNaN(familySizeNumber) || familySizeNumber < 1) {
                familySizeError.textContent = 'Please enter a valid number of family members.';
                familySizeError.classList.remove('hidden');
                hasError = true;
            }
        } else {
            // Step 1: Validate Family Name
            if (familyName === '') {
                familyNameError.textContent = 'Family name is required.';
                familyNameError.classList.remove('hidden');
                hasError = true;
            }
        }

        if (hasError) return;

        if (!step2.classList.contains('hidden')) {
            // Proceed to submit the form
            // Show loading spinner
            createSubmitText.classList.add('hidden');
            createSubmitSpinner.classList.remove('hidden');

            try {
                const response = await fetch('/api/create-family', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include', // Ensure cookies are sent
                    body: JSON.stringify({ familyName, familySize: parseInt(familySize, 10) })
                });

                const result = await response.json();

                if (response.ok) {
                    // Show share code modal with the received familyCode
                    const familyCode = result.familyCode;
                    showShareCodeModal(familyCode);
                } else {
                    // Show error notification
                    const errorMessage = result.error || 'Failed to create family.';
                    showNotification(`Failed to create family: ${errorMessage}`, 'error');
                }
            } catch (error) {
                console.error('Error during creating family:', error);
                showNotification('An unexpected error occurred. Please try again later.', 'error');
            } finally {
                // Hide loading spinner and show submit text
                createSubmitText.classList.remove('hidden');
                createSubmitSpinner.classList.add('hidden');
            }
        } else {
            // Move to Step 2
            step1.classList.add('hidden');
            step2.classList.remove('hidden');
            backButton.classList.remove('hidden');
            createSubmitText.textContent = 'Create Family';
        }
    });
});