// Common dashboard functionality
class DashboardManager {
    constructor() {
        this.user = null;
        this.profile = null;
        this.settings = null;
        this.navigation = null;
        this.init();
    }

    async init() {
        await this.loadUserData();
        this.setupEventListeners();
        this.updateUI();
        this.setupResponsiveness();
    }

    async loadUserData() {
        try {
            const userData = JSON.parse(localStorage.getItem('user'));
            const token = localStorage.getItem('token');

            if (!userData || !token) {
                window.location.href = '/login.html';
                return;
            }

            this.user = userData;
            
            // Load profile data from API
            const response = await fetch(`/api/${this.user.role}/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            if (data.success) {
                this.profile = data.data.profile;
                this.settings = data.data.settings;
                this.navigation = data.data.navigation;
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            this.showToast('Error loading profile data', 'error');
        }
    }

    setupEventListeners() {
        // Menu toggle for mobile
        document.getElementById('menuToggle').addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('-translate-x-full');
        });

        // Setup navigation event listeners
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavigation(link.getAttribute('href'));
            });
        });
    }

    updateUI() {
        // Update user info
        document.getElementById('userName').textContent = this.user.name;
        document.getElementById('userRole').textContent = this.capitalizeFirst(this.user.role);
        
        if (this.profile?.photo) {
            document.getElementById('userPhoto').src = this.profile.photo.startsWith('http') 
                ? this.profile.photo 
                : `/uploads/profiles/${this.profile.photo}`;
        }

        // Update navigation based on role
        this.updateNavigation();
    }

    updateNavigation() {
        const nav = document.querySelector('nav');
        nav.innerHTML = ''; // Clear existing items

        const commonItems = [
            { icon: 'fas fa-home', text: 'Dashboard', href: `/${this.user.role}/dashboard` },
            { icon: 'fas fa-user', text: 'Profile', href: `/${this.user.role}/profile` },
            { icon: 'fas fa-cog', text: 'Settings', href: `/${this.user.role}/settings` }
        ];

        const roleSpecificItems = this.getRoleSpecificNavItems();
        const navItems = [...commonItems, ...roleSpecificItems];

        navItems.forEach(item => {
            const isActive = window.location.pathname === item.href;
            nav.innerHTML += this.createNavItem(item, isActive);
        });
    }

    getRoleSpecificNavItems() {
        switch (this.user.role) {
            case 'admin':
                return [
                    { icon: 'fas fa-users', text: 'Users', href: '/admin/users' },
                    { icon: 'fas fa-briefcase', text: 'Services', href: '/admin/services' },
                    { icon: 'fas fa-chart-bar', text: 'Analytics', href: '/admin/analytics' }
                ];
            case 'worker':
                return [
                    { icon: 'fas fa-tasks', text: 'Jobs', href: '/worker/jobs' },
                    { icon: 'fas fa-wallet', text: 'Earnings', href: '/worker/earnings' },
                    { icon: 'fas fa-calendar', text: 'Availability', href: '/worker/availability' }
                ];
            case 'customer':
                return [
                    { icon: 'fas fa-calendar-check', text: 'Bookings', href: '/customer/bookings' },
                    { icon: 'fas fa-credit-card', text: 'Payments', href: '/customer/payments' },
                    { icon: 'fas fa-star', text: 'Reviews', href: '/customer/reviews' }
                ];
            default:
                return [];
        }
    }

    createNavItem({ icon, text, href }, isActive = false) {
        return `
            <a href="${href}" 
               class="flex items-center space-x-3 px-3 py-2 rounded-lg ${
                   isActive 
                       ? 'bg-blue-50 text-blue-600' 
                       : 'text-gray-600 hover:bg-gray-100'
               }">
                <i class="${icon}"></i>
                <span>${text}</span>
            </a>`;
    }

    setupResponsiveness() {
        const mediaQuery = window.matchMedia('(max-width: 1024px)');
        const sidebar = document.getElementById('sidebar');

        const handleResize = (e) => {
            if (!e.matches) {
                // Reset sidebar visibility on desktop
                sidebar.classList.remove('-translate-x-full');
            }
        };

        mediaQuery.addEventListener('change', handleResize);
        handleResize(mediaQuery);
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        const toastIcon = document.getElementById('toastIcon');

        toastMessage.textContent = message;
        
        // Update icon and colors based on type
        switch (type) {
            case 'error':
                toastIcon.className = 'fas fa-exclamation-circle text-red-500';
                break;
            case 'success':
                toastIcon.className = 'fas fa-check-circle text-green-500';
                break;
            case 'warning':
                toastIcon.className = 'fas fa-exclamation-triangle text-yellow-500';
                break;
            default:
                toastIcon.className = 'fas fa-info-circle text-blue-500';
        }

        // Show toast
        toast.classList.remove('translate-x-full');
        
        // Hide after 3 seconds
        setTimeout(() => this.closeToast(), 3000);
    }

    closeToast() {
        const toast = document.getElementById('toast');
        toast.classList.add('translate-x-full');
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    handleNavigation(path) {
        // Check if path is allowed
        if (this.navigation?.allowedRoutes?.includes(path)) {
            window.location.href = path;
        } else {
            this.showToast('Access denied', 'error');
        }
    }
}

// Initialize dashboard
window.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new DashboardManager();
});
