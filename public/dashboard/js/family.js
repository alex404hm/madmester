document.addEventListener('DOMContentLoaded', () => {
    fetchFamilyInfo();
    fetchFamilyMembers();
    setupAddMemberForm();
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
            document.getElementById('family-name').textContent = familyName;
            document.getElementById('welcome-message').textContent = `Welcome, ${familyName}!`;
        } else {
            console.error('Failed to fetch family info');
            document.getElementById('family-name').textContent = 'MadMester Family';
            document.getElementById('welcome-message').textContent = 'Welcome to MadMester';
        }
    } catch (error) {
        console.error('Error fetching family info:', error);
        document.getElementById('family-name').textContent = 'MadMester Family';
        document.getElementById('welcome-message').textContent = 'Welcome to MadMester';
    }
}

/**
 * Fetch Family Members
 */
async function fetchFamilyMembers() {
    try {
        const response = await fetch('/api/family-members', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const members = data.members || [];
            document.getElementById('family-members-count').textContent = `${members.length} Member(s)`;

            const membersList = document.getElementById('family-members-list');
            membersList.innerHTML = ''; // Clear existing list

            if (members.length === 0) {
                membersList.innerHTML = '<p class="text-gray-500">No family members found.</p>';
                return;
            }

            members.forEach(member => {
                const memberCard = document.createElement('div');
                memberCard.className = 'bg-gray-100 p-4 rounded-lg flex flex-col items-center space-y-2';

                const avatar = document.createElement('img');
                avatar.src = member.avatarUrl || 'https://via.placeholder.com/100';
                avatar.alt = `${member.name} Avatar`;
                avatar.className = 'w-24 h-24 rounded-full';
                avatar.loading = 'lazy';

                const memberName = document.createElement('p');
                memberName.className = 'font-semibold text-lg';
                memberName.textContent = member.name;

                const memberRelation = document.createElement('p');
                memberRelation.className = 'text-sm text-gray-500';
                memberRelation.textContent = `Relation: ${member.relation}`;

                const favoriteFoodsHeader = document.createElement('h3');
                favoriteFoodsHeader.className = 'text-lg font-medium mt-2';
                favoriteFoodsHeader.textContent = 'Favorite Foods';

                const favoriteFoodsList = document.createElement('ul');
                favoriteFoodsList.className = 'list-disc list-inside text-left';
                member.favoriteFoods.forEach(food => {
                    const foodItem = document.createElement('li');
                    foodItem.textContent = food;
                    favoriteFoodsList.appendChild(foodItem);
                });

                memberCard.appendChild(avatar);
                memberCard.appendChild(memberName);
                memberCard.appendChild(memberRelation);
                memberCard.appendChild(favoriteFoodsHeader);
                memberCard.appendChild(favoriteFoodsList);

                membersList.appendChild(memberCard);
            });
        } else {
            console.error('Failed to fetch family members');
            document.getElementById('family-members-count').textContent = '0 Member(s)';
        }
    } catch (error) {
        console.error('Error fetching family members:', error);
        document.getElementById('family-members-count').textContent = '0 Member(s)';
    }
}

/**
 * Setup Add Member Form
 */
function setupAddMemberForm() {
    const addMemberButton = document.getElementById('add-member-button');
    const addMemberModal = document.getElementById('add-member-modal');
    const closeModalButton = document.getElementById('close-modal');
    const addMemberForm = document.getElementById('add-member-form');

    // Open Modal
    addMemberButton.addEventListener('click', () => {
        addMemberModal.classList.remove('hidden');
    });

    // Close Modal
    closeModalButton.addEventListener('click', () => {
        addMemberModal.classList.add('hidden');
        addMemberForm.reset();
    });

    // Close Modal on Outside Click
    window.addEventListener('click', (e) => {
        if (e.target === addMemberModal) {
            addMemberModal.classList.add('hidden');
            addMemberForm.reset();
        }
    });

    // Handle Form Submission
    addMemberForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const memberName = document.getElementById('member-name').value.trim();
        const memberRelation = document.getElementById('member-relation').value;
        const memberFoodsInput = document.getElementById('member-foods').value.trim();

        if (!memberName || !memberRelation || !memberFoodsInput) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Input',
                text: 'Please provide name, relation, and favorite foods.',
                confirmButtonText: 'OK'
            });
            return;
        }

        const favoriteFoods = memberFoodsInput.split(',').map(food => food.trim()).filter(food => food !== '');

        if (favoriteFoods.length === 0) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Input',
                text: 'Please enter at least one favorite food.',
                confirmButtonText: 'OK'
            });
            return;
        }

        try {
            const response = await fetch('/api/add-family-member', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: memberName, relation: memberRelation, favoriteFoods })
            });

            const data = await response.json();

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Member Added',
                    text: `${memberName} has been added to your family.`,
                    timer: 2000,
                    showConfirmButton: false
                });
                addMemberModal.classList.add('hidden');
                addMemberForm.reset();
                fetchFamilyMembers(); // Refresh the members list
            } else {
                const errorMsg = data.error || 'Failed to add family member.';
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: errorMsg,
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error('Error adding family member:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An unexpected error occurred. Please try again later.',
                confirmButtonText: 'OK'
            });
        }
    });
}