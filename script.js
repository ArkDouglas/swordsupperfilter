// Boss Database Application
class BossDatabase {
    constructor() {
        this.bosses = [];
        this.filteredBosses = [];
        this.sortOrder = 'asc';
        this.currentSort = 'level';
        this.completedBosses = new Set();
        this.init();
    }

    async init() {
        await this.loadData();
        this.loadCompletedBosses();
        this.setupEventListeners();
        this.renderBosses();
        this.updateStats();
    }

    async loadData() {
        try {
            const response = await fetch('data.json');
            const data = await response.json();
            this.bosses = data.bosses;
            this.filteredBosses = [...this.bosses];
        } catch (error) {
            console.error('Error loading data:', error);
            this.showMessage('Error loading boss data. Please refresh the page.', 'error');
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));

        // Filter functionality
        document.getElementById('levelFilter').addEventListener('change', (e) => this.handleFilter());
        document.getElementById('difficultyFilter').addEventListener('change', (e) => this.handleFilter());
        document.getElementById('typeFilter').addEventListener('change', (e) => this.handleFilter());
        document.getElementById('completionFilter').addEventListener('change', (e) => this.handleFilter());

        // Sort functionality
        document.getElementById('sortBy').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.sortBosses();
        });

        document.getElementById('sortOrder').addEventListener('click', () => {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
            this.updateSortButton();
            this.sortBosses();
        });

        // Add boss functionality
        document.getElementById('addBossBtn').addEventListener('click', () => this.openModal());
        document.getElementById('addBossForm').addEventListener('submit', (e) => this.handleAddBoss(e));
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        
        // Clear completions functionality
        document.getElementById('clearCompletionsBtn').addEventListener('click', () => this.clearAllCompletions());

        // Modal close functionality
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('addBossModal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    handleSearch(query) {
        const searchTerm = query.toLowerCase();
        this.filteredBosses = this.bosses.filter(boss => 
            boss.name.toLowerCase().includes(searchTerm) ||
            boss.location.toLowerCase().includes(searchTerm) ||
            boss.description.toLowerCase().includes(searchTerm)
        );
        this.sortBosses();
    }

    handleFilter() {
        const levelFilter = document.getElementById('levelFilter').value;
        const difficultyFilter = document.getElementById('difficultyFilter').value;
        const typeFilter = document.getElementById('typeFilter').value;
        const completionFilter = document.getElementById('completionFilter').value;

        this.filteredBosses = this.bosses.filter(boss => {
            const levelMatch = !levelFilter || boss.level === levelFilter;
            const difficultyMatch = !difficultyFilter || boss.difficulty.toString() === difficultyFilter;
            const typeMatch = !typeFilter || boss.type === typeFilter;
            const completionMatch = !completionFilter || 
                (completionFilter === 'completed' && this.completedBosses.has(boss.id)) ||
                (completionFilter === 'incomplete' && !this.completedBosses.has(boss.id));
            
            return levelMatch && difficultyMatch && typeMatch && completionMatch;
        });

        this.sortBosses();
    }

    sortBosses() {
        this.filteredBosses.sort((a, b) => {
            let aValue, bValue;

            switch (this.currentSort) {
                case 'level':
                    aValue = this.getLevelValue(a.level);
                    bValue = this.getLevelValue(b.level);
                    break;
                case 'difficulty':
                    aValue = a.difficulty;
                    bValue = b.difficulty;
                    break;
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'type':
                    aValue = a.type;
                    bValue = b.type;
                    break;
                default:
                    aValue = a.level;
                    bValue = b.level;
            }

            if (this.sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        this.renderBosses();
    }

    getLevelValue(level) {
        const levelMap = {
            '1-5': 1,
            '6-20': 2,
            '21-40': 3,
            '41-60': 4,
            '61-80': 5,
            '81-100': 6,
            '101-120': 7,
            '121-140': 8,
            '141-160': 9,
            '221-240': 10
        };
        return levelMap[level] || 0;
    }

    updateSortButton() {
        const sortButton = document.getElementById('sortOrder');
        const icon = sortButton.querySelector('i');
        icon.className = this.sortOrder === 'asc' ? 'fas fa-sort-amount-down' : 'fas fa-sort-amount-up';
    }

    renderBosses() {
        const container = document.getElementById('bossTableBody');
        
        if (this.filteredBosses.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fas fa-search"></i>
                        <h3>No bosses found</h3>
                        <p>Try adjusting your search or filter criteria</p>
                    </td>
                </tr>
            `;
            return;
        }

        container.innerHTML = this.filteredBosses.map(boss => this.createBossRow(boss)).join('');
    }

    createBossRow(boss) {
        const difficultyStars = '⭐'.repeat(boss.difficulty);
        const typeClass = boss.type === 'boss-rush' ? 'boss-rush' : '';
        const typeLabel = boss.type === 'boss-rush' ? 'Boss Rush' : 'Regular Boss';
        const isCompleted = this.completedBosses.has(boss.id);
        const completedClass = isCompleted ? 'completed' : '';
        const nameClass = isCompleted ? 'boss-name completed' : 'boss-name';
        
        return `
            <tr class="${completedClass}">
                <td>
                    <label class="completion-checkbox">
                        <input type="checkbox" ${isCompleted ? 'checked' : ''} 
                               onchange="bossDB.toggleCompletion(${boss.id})">
                        <span class="checkmark">
                            <i class="fas fa-check"></i>
                        </span>
                    </label>
                </td>
                <td>
                    <div class="${nameClass}">${this.escapeHtml(boss.name)}</div>
                </td>
                <td>
                    <span class="boss-level">Level ${boss.level}</span>
                </td>
                <td>
                    <div class="boss-difficulty">${difficultyStars}</div>
                </td>
                <td>
                    <span class="boss-type ${typeClass}">${typeLabel}</span>
                </td>
                <td>
                    <div class="boss-location">${boss.location ? this.escapeHtml(boss.location) : '-'}</div>
                </td>
                <td>
                    <div class="table-actions">
                        ${boss.redditLink ? `<a href="${boss.redditLink}" target="_blank" class="btn btn-small btn-primary"><i class="fab fa-reddit"></i></a>` : ''}
                        <button class="btn btn-small btn-secondary" onclick="bossDB.editBoss(${boss.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-small btn-secondary" onclick="bossDB.deleteBoss(${boss.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    updateStats() {
        const totalBosses = this.bosses.length;
        const bossRushes = this.bosses.filter(boss => boss.type === 'boss-rush').length;
        const completedCount = this.completedBosses.size;
        const averageDifficulty = this.bosses.length > 0 
            ? (this.bosses.reduce((sum, boss) => sum + boss.difficulty, 0) / this.bosses.length).toFixed(1)
            : 0;

        document.getElementById('totalBosses').textContent = totalBosses;
        document.getElementById('bossRushes').textContent = bossRushes;
        document.getElementById('averageDifficulty').textContent = averageDifficulty;
        
        // Update completion percentage if element exists
        const completionElement = document.getElementById('completionRate');
        if (completionElement) {
            const completionRate = totalBosses > 0 ? ((completedCount / totalBosses) * 100).toFixed(1) : 0;
            completionElement.textContent = `${completionRate}%`;
        }
    }

    openModal() {
        document.getElementById('addBossModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('addBossModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        document.getElementById('addBossForm').reset();
    }

    handleAddBoss(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const newBoss = {
            id: Date.now(), // Simple ID generation
            name: document.getElementById('bossName').value,
            level: document.getElementById('bossLevel').value,
            difficulty: parseInt(document.getElementById('bossDifficulty').value),
            type: document.getElementById('bossType').value,
            location: document.getElementById('bossLocation').value,
            redditLink: document.getElementById('bossRedditLink').value,
            dateAdded: new Date().toISOString().split('T')[0]
        };

        // Validate required fields
        if (!newBoss.name || !newBoss.level || !newBoss.difficulty || !newBoss.type) {
            this.showMessage('Please fill in all required fields.', 'error');
            return;
        }

        this.bosses.push(newBoss);
        this.filteredBosses = [...this.bosses];
        this.sortBosses();
        this.updateStats();
        this.closeModal();
        
        this.showMessage('Boss added successfully!', 'success');
        
        // Save to localStorage for persistence
        this.saveToLocalStorage();
    }

    editBoss(id) {
        const boss = this.bosses.find(b => b.id === id);
        if (!boss) return;

        // Pre-fill the form with existing data
        document.getElementById('bossName').value = boss.name;
        document.getElementById('bossLevel').value = boss.level;
        document.getElementById('bossDifficulty').value = boss.difficulty;
        document.getElementById('bossType').value = boss.type;
        document.getElementById('bossLocation').value = boss.location || '';
        document.getElementById('bossRedditLink').value = boss.redditLink || '';

        // Change form to edit mode
        const form = document.getElementById('addBossForm');
        form.dataset.editId = id;
        document.querySelector('.modal-header h2').textContent = 'Edit Boss';
        
        this.openModal();
    }

    deleteBoss(id) {
        if (confirm('Are you sure you want to delete this boss?')) {
            this.bosses = this.bosses.filter(boss => boss.id !== id);
            this.filteredBosses = [...this.bosses];
            this.renderBosses();
            this.updateStats();
            this.saveToLocalStorage();
            this.showMessage('Boss deleted successfully!', 'success');
        }
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('swordAndSupperBosses', JSON.stringify(this.bosses));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('swordAndSupperBosses');
            if (saved) {
                const savedBosses = JSON.parse(saved);
                // Merge with existing data, avoiding duplicates
                const existingIds = new Set(this.bosses.map(b => b.id));
                const newBosses = savedBosses.filter(b => !existingIds.has(b.id));
                this.bosses = [...this.bosses, ...newBosses];
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }
    }

    showMessage(message, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;

        // Insert at the top of main content
        const main = document.querySelector('.main');
        main.insertBefore(messageDiv, main.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Completion tracking methods
    toggleCompletion(bossId) {
        if (this.completedBosses.has(bossId)) {
            this.completedBosses.delete(bossId);
        } else {
            this.completedBosses.add(bossId);
        }
        
        this.saveCompletedBosses();
        this.renderBosses();
        this.updateStats();
        
        const boss = this.bosses.find(b => b.id === bossId);
        const message = this.completedBosses.has(bossId) 
            ? `Marked "${boss.name}" as completed!` 
            : `Unmarked "${boss.name}" as completed.`;
        this.showMessage(message, 'success');
    }

    loadCompletedBosses() {
        try {
            const saved = localStorage.getItem('swordAndSupperCompletedBosses');
            if (saved) {
                const completedIds = JSON.parse(saved);
                this.completedBosses = new Set(completedIds);
            }
        } catch (error) {
            console.error('Error loading completed bosses:', error);
        }
    }

    saveCompletedBosses() {
        try {
            const completedIds = Array.from(this.completedBosses);
            localStorage.setItem('swordAndSupperCompletedBosses', JSON.stringify(completedIds));
        } catch (error) {
            console.error('Error saving completed bosses:', error);
        }
    }

    clearAllCompletions() {
        if (confirm('Are you sure you want to clear all completion marks? This cannot be undone.')) {
            this.completedBosses.clear();
            this.saveCompletedBosses();
            this.renderBosses();
            this.updateStats();
            this.showMessage('All completion marks cleared!', 'success');
        }
    }

    getCompletionStats() {
        const total = this.bosses.length;
        const completed = this.completedBosses.size;
        const percentage = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
        
        return {
            total,
            completed,
            remaining: total - completed,
            percentage
        };
    }
}

// Initialize the application
let bossDB;
document.addEventListener('DOMContentLoaded', () => {
    bossDB = new BossDatabase();
});

// Export for global access
window.bossDB = bossDB;
