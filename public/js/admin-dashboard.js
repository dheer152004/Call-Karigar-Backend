// Admin-specific dashboard functionality
class AdminDashboard extends DashboardManager {
    constructor() {
        super();
        this.stats = {};
        this.activity = [];
        this.tasks = [];
    }

    async init() {
        await super.init();
        await this.loadDashboardData();
        this.setupAdminEventListeners();
    }

    async loadDashboardData() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/dashboard', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            if (data.success) {
                this.stats = data.data.stats;
                this.activity = data.data.activity;
                this.tasks = data.data.tasks;
                this.updateDashboardUI();
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showToast('Error loading dashboard data', 'error');
        }
    }

    setupAdminEventListeners() {
        // Task checkboxes
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => this.handleTaskUpdate(e));
        });

        // Add any other admin-specific event listeners
        document.querySelectorAll('[data-action]').forEach(element => {
            element.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                switch (action) {
                    case 'verify-worker':
                        this.handleWorkerVerification(e.target.dataset.id);
                        break;
                    case 'view-booking':
                        this.handleViewBooking(e.target.dataset.id);
                        break;
                    case 'resolve-ticket':
                        this.handleSupportTicket(e.target.dataset.id);
                        break;
                }
            });
        });
    }

    updateDashboardUI() {
        // Update statistics
        Object.entries(this.stats).forEach(([key, value]) => {
            const element = document.querySelector(`[data-stat="${key}"]`);
            if (element) {
                element.textContent = value;
                
                // Update trend indicators
                const trend = element.nextElementSibling;
                if (trend && value.trend) {
                    trend.innerHTML = value.trend > 0 
                        ? `<i class="fas fa-arrow-up text-green-600"></i> ${value.trend}%`
                        : `<i class="fas fa-arrow-down text-red-600"></i> ${Math.abs(value.trend)}%`;
                }
            }
        });

        // Update recent activity
        const activityContainer = document.querySelector('.recent-activity');
        if (activityContainer && this.activity.length) {
            activityContainer.innerHTML = this.activity.map(item => `
                <div class="flex items-start space-x-4 p-4 hover:bg-gray-50">
                    <div class="flex-shrink-0">
                        <span class="inline-flex items-center justify-center h-8 w-8 rounded-full ${this.getActivityIconClass(item.type)}">
                            <i class="${this.getActivityIcon(item.type)}"></i>
                        </span>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">${item.message}</p>
                        <p class="text-xs text-gray-400">${this.formatTimeAgo(item.timestamp)}</p>
                    </div>
                </div>
            `).join('');
        }

        // Update tasks
        const tasksContainer = document.querySelector('.pending-tasks');
        if (tasksContainer && this.tasks.length) {
            tasksContainer.innerHTML = this.tasks.map(task => `
                <div class="flex items-center justify-between p-4 hover:bg-gray-50">
                    <div class="flex items-center space-x-3">
                        <input type="checkbox" 
                               class="rounded text-blue-600"
                               data-task-id="${task.id}"
                               ${task.completed ? 'checked' : ''}>
                        <span class="text-sm ${task.completed ? 'text-gray-400 line-through' : 'text-gray-600'}">
                            ${task.description}
                        </span>
                    </div>
                    <span class="text-xs ${this.getPriorityClass(task.priority)}">
                        ${task.priority} Priority
                    </span>
                </div>
            `).join('');
        }
    }

    getActivityIcon(type) {
        const icons = {
            'user': 'fas fa-user-plus text-blue-600',
            'booking': 'fas fa-calendar-check text-green-600',
            'support': 'fas fa-ticket-alt text-yellow-600',
            'payment': 'fas fa-money-bill text-purple-600',
            'system': 'fas fa-cog text-gray-600'
        };
        return icons[type] || icons.system;
    }

    getActivityIconClass(type) {
        const classes = {
            'user': 'bg-blue-100',
            'booking': 'bg-green-100',
            'support': 'bg-yellow-100',
            'payment': 'bg-purple-100',
            'system': 'bg-gray-100'
        };
        return classes[type] || classes.system;
    }

    getPriorityClass(priority) {
        const classes = {
            'High': 'text-red-600',
            'Medium': 'text-yellow-600',
            'Low': 'text-blue-600'
        };
        return classes[priority] || '';
    }

    formatTimeAgo(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        if (seconds < 60) return 'just now';
        
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };
        
        for (let [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval} ${unit}${interval !== 1 ? 's' : ''} ago`;
            }
        }
    }

    async handleTaskUpdate(event) {
        const taskId = event.target.dataset.taskId;
        const completed = event.target.checked;

        try {
            const response = await fetch(`/api/admin/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ completed })
            });

            if (response.ok) {
                this.showToast(`Task ${completed ? 'completed' : 'uncompleted'}`, 'success');
                await this.loadDashboardData(); // Refresh data
            } else {
                throw new Error('Failed to update task');
            }
        } catch (error) {
            console.error('Error updating task:', error);
            this.showToast('Failed to update task', 'error');
            event.target.checked = !completed; // Revert checkbox
        }
    }

    // Admin-specific action handlers
    async handleWorkerVerification(workerId) {
        // Implementation for worker verification
    }

    async handleViewBooking(bookingId) {
        // Implementation for viewing booking details
    }

    async handleSupportTicket(ticketId) {
        // Implementation for handling support tickets
    }
}

// Initialize admin dashboard
window.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new AdminDashboard();
});
