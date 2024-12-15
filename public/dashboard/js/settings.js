document.addEventListener('DOMContentLoaded', () => {
    fetchUserSettings();
});

async function fetchUserSettings() {
    try {
        // Simulating API data fetch
        const mockData = {
            profile: {
                username: 'JohnDoe',
                email: 'john.doe@example.com'
            },
            notifications: {
                email: true,
                sms: false,
                push: true
            }
        };

        populateProfileForm(mockData.profile);
        populateNotificationForm(mockData.notifications);
    } catch (error) {
        console.error('Error fetching user settings:', error);
        Swal.fire('Error', 'Failed to load user settings', 'error');
    }
}

function populateProfileForm(profile) {
    document.getElementById('username').value = profile.username;
    document.getElementById('email').value = profile.email;
}

function populateNotificationForm(notifications) {
    document.getElementById('email-notifications').checked = notifications.email;
    document.getElementById('sms-notifications').checked = notifications.sms;
    document.getElementById('push-notifications').checked = notifications.push;
}

document.getElementById('profile-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
        // Simulate form submission
        Swal.fire('Success', 'Profile settings saved', 'success');
    } catch (error) {
        console.error('Error saving profile settings:', error);
        Swal.fire('Error', 'Failed to save profile settings', 'error');
    }
});

document.getElementById('notification-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
        // Simulate form submission
        Swal.fire('Success', 'Notification preferences saved', 'success');
    } catch (error) {
        console.error('Error saving notification preferences:', error);
        Swal.fire('Error', 'Failed to save notification preferences', 'error');
    }
});