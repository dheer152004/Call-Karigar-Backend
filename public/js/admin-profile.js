// Admin profile functionality
class AdminProfile extends DashboardManager {
    constructor() {
        super();
        this.profileForm = null;
        this.photoUploadInput = null;
    }

    async init() {
        await super.init();
        this.profileForm = document.getElementById('profileForm');
        this.photoUploadInput = document.getElementById('photoUpload');
        this.setupProfileEventListeners();
        this.populateProfileData();
    }

    setupProfileEventListeners() {
        // Profile photo upload
        const photoContainer = document.getElementById('profilePhoto').parentElement;
        photoContainer.addEventListener('click', () => this.photoUploadInput.click());
        this.photoUploadInput.addEventListener('change', (e) => this.handlePhotoUpload(e));

        // Profile form submission
        this.profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));

        // Password change
        document.querySelector('button:contains("Change Password")').addEventListener('click', 
            () => this.handlePasswordChange());

        // Two-factor authentication
        document.querySelector('button:contains("Two-Factor Auth")').addEventListener('click',
            () => this.handle2FASetup());

        // Theme toggle
        document.querySelector('input[type="checkbox"][aria-label="Dark Mode"]').addEventListener('change',
            (e) => this.handleThemeChange(e));
    }

    populateProfileData() {
        if (!this.user || !this.profile) return;

        // Update header info
        document.getElementById('adminName').textContent = this.user.name;
        document.getElementById('adminRole').textContent = 
            `${this.capitalizeFirst(this.user.role)} - ${this.profile.department}`;

        // Update profile photo
        if (this.profile.photo) {
            document.getElementById('profilePhoto').src = this.profile.photo.startsWith('http') 
                ? this.profile.photo 
                : `/uploads/profiles/${this.profile.photo}`;
        }

        // Populate form fields
        const form = this.profileForm;
        form.name.value = this.user.name;
        form.email.value = this.user.email;
        form.phone.value = this.user.phone;
        form.department.value = this.profile.department;
        form.bio.value = this.profile.bio || '';

        // Set preferences
        document.querySelector('input[type="checkbox"][aria-label="Email Notifications"]').checked = 
            this.profile.preferences?.notifications ?? true;
        document.querySelector('input[type="checkbox"][aria-label="Dark Mode"]').checked = 
            this.profile.preferences?.theme === 'dark';
    }

    async handlePhotoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            this.showToast('Please select an image file', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('photo', file);

        try {
            const response = await fetch('/api/admin/profile/photo', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                document.getElementById('profilePhoto').src = `/uploads/profiles/${data.data.photo}`;
                this.showToast('Profile photo updated successfully', 'success');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            this.showToast('Failed to update profile photo', 'error');
        }
    }

    async handleProfileUpdate(event) {
        event.preventDefault();

        const formData = {
            name: this.profileForm.name.value,
            username: this.profileForm.username.value,
            email: this.profileForm.email.value,
            phone: this.profileForm.phone.value,
            department: this.profileForm.department.value,
            bio: this.profileForm.bio.value
        };

        try {
            const response = await fetch('/api/admin/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                this.showToast('Profile updated successfully', 'success');
                // Update local storage
                localStorage.setItem('user', JSON.stringify({
                    ...this.user,
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone
                }));
                // Update profile data
                this.profile = data.data.profile;
                this.populateProfileData();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showToast('Failed to update profile', 'error');
        }
    }

    async handlePasswordChange() {
        // Implement password change modal
        this.showToast('Password change feature coming soon', 'info');
    }

    async handle2FASetup() {
        // Implement 2FA setup
        this.showToast('Two-factor authentication coming soon', 'info');
    }

    async handleThemeChange(event) {
        const isDark = event.target.checked;
        const theme = isDark ? 'dark' : 'light';

        try {
            const response = await fetch('/api/admin/preferences', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    theme
                })
            });

            const data = await response.json();
            if (data.success) {
                document.documentElement.classList.toggle('dark', isDark);
                this.showToast(`Theme changed to ${theme} mode`, 'success');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error changing theme:', error);
            this.showToast('Failed to update theme preference', 'error');
            event.target.checked = !isDark;
        }
    }
}

// Initialize admin profile
window.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new AdminProfile();
});
