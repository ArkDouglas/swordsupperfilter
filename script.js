// Boss Database Application
class BossDatabase {
    constructor() {
        this.bosses = [];
        this.filteredBosses = [];
        this.sortOrder = 'asc';
        this.currentSort = 'level';
        this.completedBosses = new Set();
        this.abilities = [];
        this.items = [];
        this.filteredItems = [];
        this.levelGoldCosts = [];
        this.init();
    }

    async init() {
        await this.loadData();
        this.loadCompletedBosses();
        this.setupEventListeners();
        this.renderBosses();
        this.updateStats();
        this.initializeAbilities();
        this.initializeItems();
        this.loadItemsFromLocalStorage();
        this.loadLevelGoldFromLocalStorage();
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
        document.getElementById('mysteryIconFilter').addEventListener('change', (e) => this.handleFilter());
        document.getElementById('completionFilter').addEventListener('change', (e) => this.handleFilter());
        document.getElementById('hideCompletedToggle').addEventListener('change', (e) => this.handleFilter());

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

        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Add item functionality
        document.getElementById('addItemBtn').addEventListener('click', () => this.openItemModal());
        document.getElementById('contributeItemBtn').addEventListener('click', () => this.openItemModal());
        document.getElementById('addItemForm').addEventListener('submit', (e) => this.handleAddItem(e));
        document.getElementById('cancelItemBtn').addEventListener('click', () => this.closeItemModal());

        // Item filters
        document.getElementById('itemTypeFilter').addEventListener('change', () => this.filterItems());
        document.getElementById('itemRarityFilter').addEventListener('change', () => this.filterItems());
        document.getElementById('itemPropertyFilter').addEventListener('change', () => this.filterItems());
        document.getElementById('itemSearchInput').addEventListener('input', (e) => this.searchItems(e.target.value));

        // Ability categories
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterAbilities(e.target.dataset.category));
        });

        // Level/Gold functionality
        document.getElementById('addLevelGoldBtn').addEventListener('click', () => this.openLevelGoldModal());
        document.getElementById('addLevelGoldForm').addEventListener('submit', (e) => this.handleAddLevelGold(e));
        document.getElementById('cancelLevelGoldBtn').addEventListener('click', () => this.closeLevelGoldModal());

        // Modal close functionality
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal.id === 'addBossModal') {
                    this.closeModal();
                } else if (modal.id === 'addItemModal') {
                    this.closeItemModal();
                }
            });
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                if (e.target.id === 'addBossModal') {
                    this.closeModal();
                } else if (e.target.id === 'addItemModal') {
                    this.closeItemModal();
                }
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
        const mysteryIconFilter = document.getElementById('mysteryIconFilter').value;
        const completionFilter = document.getElementById('completionFilter').value;
        const hideCompleted = document.getElementById('hideCompletedToggle').checked;

        this.filteredBosses = this.bosses.filter(boss => {
            const levelMatch = !levelFilter || boss.level === levelFilter;
            const difficultyMatch = !difficultyFilter || boss.difficulty.toString() === difficultyFilter;
            const typeMatch = !typeFilter || boss.type === typeFilter;
            const completionMatch = !completionFilter || 
                (completionFilter === 'completed' && this.completedBosses.has(boss.id)) ||
                (completionFilter === 'incomplete' && !this.completedBosses.has(boss.id));
            
            // Mystery icon filter
            let mysteryMatch = true;
            if (mysteryIconFilter) {
                if (mysteryIconFilter === 'ruined-path') {
                    mysteryMatch = boss.hasRuinedPath || false;
                } else if (mysteryIconFilter === 'increased') {
                    mysteryMatch = boss.hasIncreased || false;
                }
            }
            
            // Hide completed bosses if toggle is on
            const hideMatch = !hideCompleted || !this.completedBosses.has(boss.id);
            
            return levelMatch && difficultyMatch && typeMatch && completionMatch && mysteryMatch && hideMatch;
        });

        this.sortBosses();
    }

    sortBosses() {
        this.filteredBosses.sort((a, b) => {
            // First, sort by completion status (completed bosses go to bottom)
            const aCompleted = this.completedBosses.has(a.id);
            const bCompleted = this.completedBosses.has(b.id);
            
            if (aCompleted !== bCompleted) {
                return aCompleted ? 1 : -1; // Completed bosses go to bottom
            }

            // Then sort by the selected criteria
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
        const isCompleted = this.completedBosses.has(boss.id);
        const isBossRush = boss.difficulty === 'boss-rush';
        const isBoss = boss.instanceType === 'boss';
        
        // Get appropriate icon - only show boss icon for actual bosses
        let iconHtml = '';
        if (isBoss) {
            iconHtml = '<img src="images/bossicon.png" alt="Boss" class="boss-icon">';
        }
        
        // Difficulty display
        let difficultyDisplay = '';
        if (isBossRush) {
            difficultyDisplay = '🏃 Boss Rush';
        } else {
            difficultyDisplay = '⭐'.repeat(boss.difficulty);
        }
        
        // User attribution
        let submittedByHtml = '';
        if (boss.submittedBy) {
            submittedByHtml = `
                <div class="submitted-by">
                    Added by <a href="https://www.reddit.com/user/${boss.submittedBy}" target="_blank">/u/${boss.submittedBy}</a>
                </div>
            `;
        }
        
        return `
            <tr class="${isCompleted ? 'completed' : ''}">
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
                        <div class="${isCompleted ? 'boss-name completed' : 'boss-name'}">
                            ${this.escapeHtml(boss.name)}
                            ${submittedByHtml}
                        </div>
                    </td>
                <td>
                    <span class="boss-level">Level ${boss.level}</span>
                </td>
                <td>
                    <div class="boss-difficulty">${difficultyDisplay}</div>
                </td>
                    <td>
                        <div class="boss-type">
                            ${iconHtml}${boss.type}
                            ${boss.hasRuinedPath ? '<img src="images/ruinedpath.png" alt="Ruined Path" class="mystery-icon">' : ''}
                            ${boss.hasIncreased ? '<img src="images/increased.png" alt="Increased" class="mystery-icon">' : ''}
                        </div>
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
        document.getElementById('hasRuinedPath').checked = false;
        document.getElementById('hasIncreased').checked = false;
    }

    generateType(instanceType, difficulty) {
        if (difficulty === 'boss-rush') {
            return 'Boss Rush';
        } else if (instanceType === 'boss') {
            return 'Regular Boss';
        } else {
            return 'Normal Instance';
        }
    }

    handleAddBoss(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const newBoss = {
            id: Date.now(), // Simple ID generation
            name: document.getElementById('bossName').value,
            level: document.getElementById('bossLevel').value,
            difficulty: document.getElementById('bossDifficulty').value,
            instanceType: document.getElementById('bossInstanceType').value,
            type: this.generateType(document.getElementById('bossInstanceType').value, document.getElementById('bossDifficulty').value),
            location: document.getElementById('bossLocation').value,
            redditLink: document.getElementById('bossRedditLink').value,
            submittedBy: document.getElementById('bossSubmittedBy').value,
            hasRuinedPath: document.getElementById('hasRuinedPath').checked,
            hasIncreased: document.getElementById('hasIncreased').checked,
            dateAdded: new Date().toISOString().split('T')[0]
        };

        // Validate required fields
        if (!newBoss.name || !newBoss.level || !newBoss.difficulty || !newBoss.instanceType) {
            this.showMessage('Please fill in all required fields.', 'error');
            return;
        }

        this.bosses.push(newBoss);
        this.filteredBosses = [...this.bosses];
        this.sortBosses();
        this.updateStats();
        this.closeModal();
        
        this.showMessage('Instance added locally! Submitting to database...', 'success');
        
        // Save to localStorage for persistence
        this.saveToLocalStorage();
        
        // Submit to database for community access
        this.submitInstanceToDatabase(newBoss);
    }

    editBoss(id) {
        const boss = this.bosses.find(b => b.id === id);
        if (!boss) return;

        // Pre-fill the form with existing data
        document.getElementById('bossName').value = boss.name;
        document.getElementById('bossLevel').value = boss.level;
        document.getElementById('bossDifficulty').value = boss.difficulty;
        document.getElementById('bossInstanceType').value = boss.instanceType || '';
        document.getElementById('bossLocation').value = boss.location || '';
        document.getElementById('bossRedditLink').value = boss.redditLink || '';
        document.getElementById('bossSubmittedBy').value = boss.submittedBy || '';
        document.getElementById('hasRuinedPath').checked = boss.hasRuinedPath || false;
        document.getElementById('hasIncreased').checked = boss.hasIncreased || false;

        // Change form to edit mode
        const form = document.getElementById('addBossForm');
        form.dataset.editId = id;
        document.querySelector('.modal-header h2').textContent = 'Edit Instance';
        
        this.openModal();
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

    // Tab Navigation
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    // Abilities Section
    initializeAbilities() {
        // Comprehensive abilities from Sword and Supper Wiki
        this.abilities = [
            // Rage Abilities
            { name: "Add Rage On Heal", description: "Add rage whenever you heal.", category: "equipment" },
            { name: "Add Rage On Crit", description: "Adds a small amount of rage each time you land a critical hit", category: "equipment" },
            { name: "Add Rage On Hit 5", description: "Adds rage every 5 hits", category: "equipment" },
            { name: "Add Rage on Enemy Death", description: "Gains rage when an enemy dies - great for dealing with big fights", category: "equipment" },
            
            // Shield Abilities
            { name: "Gain Shield On Enemy Death", description: "Gains shield when an enemy dies", category: "equipment" },
            { name: "Gain Shield On Hit 5", description: "Gains shield every 5 hits", category: "equipment" },
            { name: "Gain Shield On Rage", description: "Gains shield when using rage abilities", category: "equipment" },
            { name: "Gain Shield On Turn 4", description: "Gains shield on turn 4 of combat", category: "equipment" },
            
            // Healing Abilities
            { name: "Heal On Target Death", description: "Heals when a target dies", category: "equipment" },
            { name: "Heal Every Two Hits", description: "Heals every two hits landed", category: "equipment" },
            { name: "Critical Recovery", description: "Heal for 3% of Max HP whenever you land a critical hit.", category: "equipment" },
            { name: "Heal on Bolt", description: "Heal a small amount whenever a lightning bolt fires.", category: "equipment" },
            { name: "Second Wind", description: "Heal for 10% of Max HP at the start of each of your next 3 turns the first time you dip below 30% HP.", category: "equipment" },
            
            // Lightning Abilities
            { name: "Lightning Bolt", description: "Zap your target with a lightning bolt at the start of your turn.", category: "temple" },
            { name: "Lightning On Attack", description: "When you attack, zap your target with a lightning bolt.", category: "equipment" },
            { name: "Lightning On Crit", description: "When you make a critical attack, zap your target with a lightning bolt.", category: "equipment" },
            { name: "Lightning on Target Death", description: "Triggers lightning damage when a target dies", category: "equipment" },
            
            // Magic Knife Abilities
            { name: "Magic Knife", description: "Throw a magic knife at the start of your turn.", category: "temple" },
            { name: "Magic Knife on Crit", description: "Throw a magic knife whenever you make a critical attack.", category: "equipment" },
            { name: "Magic Knife On Rage", description: "On Rage activation, throw a magic knife.", category: "equipment" },
            { name: "Magic Knife On Hit 3", description: "Throws magic knife every 3 hits", category: "equipment" },
            { name: "Fire Knife On Attack", description: "Throws a fire knife when attacking", category: "equipment" },
            
            // Combat Abilities
            { name: "Boost Attack On High HP", description: "Boosts attack when HP is 100%.", category: "equipment" },
            { name: "Strike Twice Every Other", description: "Every other turn, attack twice with your main weapon.", category: "equipment" },
            { name: "Dodge if Low", description: "Increases dodge chance by 20% when HP is below 30%.", category: "equipment" },
            
            // Temple Blessings
            { name: "Blessing of Strength", description: "Increases attack power for the duration of the mission", category: "temple" },
            { name: "Blessing of Protection", description: "Increases defense and reduces incoming damage", category: "temple" },
            { name: "Blessing of Speed", description: "Increases movement and attack speed", category: "temple" },
            { name: "Blessing of Fortune", description: "Increases critical hit chance and loot drops", category: "temple" }
        ];
        this.filteredAbilities = [...this.abilities];
        this.renderAbilities();
    }

    renderAbilities() {
        const container = document.getElementById('abilitiesList');
        container.innerHTML = this.filteredAbilities.map(ability => `
            <div class="ability-card ${ability.category}">
                <div class="ability-name">${ability.name}</div>
                <div class="ability-description">${ability.description}</div>
            </div>
        `).join('');
    }

    filterAbilities(category) {
        // Update category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');

        // Filter abilities
        if (category === 'all') {
            this.filteredAbilities = [...this.abilities];
        } else {
            this.filteredAbilities = this.abilities.filter(ability => ability.category === category);
        }
        this.renderAbilities();
    }

    // Items Section
    initializeItems() {
        // Initialize with some items from the Sword and Supper Wiki
        this.items = [
            {
                id: 1,
                name: "Amberfire Ring",
                type: "accessory",
                rarity: "rare",
                description: "Grants the ability to throw a fire knife when attacking",
                imageUrl: "",
                goldValue: 500,
                crit: 5,
                dodge: 0,
                fireResist: 0,
                elecResist: 0,
                source: "Equipment drop or crafting",
                dateAdded: new Date().toISOString().split('T')[0],
                submittedBy: "Wiki Data"
            },
            {
                id: 2,
                name: "Soulplate",
                type: "armor",
                rarity: "epic",
                description: "Allows charging a shield by 20% of max HP when an enemy dies",
                imageUrl: "",
                goldValue: 750,
                crit: 0,
                dodge: 10,
                fireResist: 15,
                elecResist: 15,
                source: "Boss drop or blueprint crafting",
                dateAdded: new Date().toISOString().split('T')[0],
                submittedBy: "Wiki Data"
            },
            {
                id: 3,
                name: "Ferocity Ring",
                type: "accessory",
                rarity: "uncommon",
                description: "Adds rage each time you land a critical hit",
                imageUrl: "",
                goldValue: 300,
                crit: 8,
                dodge: 0,
                fireResist: 0,
                elecResist: 0,
                source: "Equipment drop",
                dateAdded: new Date().toISOString().split('T')[0],
                submittedBy: "Wiki Data"
            },
            {
                id: 4,
                name: "Battlethirsty Vest",
                type: "armor",
                rarity: "rare",
                description: "Crafted from Blueprint: Battlethirsty Vest, provides enhanced combat abilities",
                imageUrl: "",
                goldValue: 600,
                crit: 3,
                dodge: 5,
                fireResist: 10,
                elecResist: 10,
                source: "Blueprint crafting (requires 320 Ore, 140 Wood)",
                dateAdded: new Date().toISOString().split('T')[0],
                submittedBy: "Wiki Data"
            }
        ];
        this.filteredItems = [...this.items];
        this.renderItems();
    }

    renderItems() {
        const container = document.getElementById('itemsList');
        if (this.filteredItems.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-gem"></i>
                    <h3>No items found</h3>
                    <p>Add some items to get started!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredItems.map(item => `
            <div class="item-card ${item.type}">
                <div class="item-header">
                    <div>
                        <h3 class="item-name">${this.escapeHtml(item.name)}</h3>
                        ${item.rarity ? `<div class="item-rarity ${item.rarity}">${item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}</div>` : ''}
                    </div>
                    <span class="item-type">${item.type}</span>
                </div>
                
                ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}" class="item-image">` : ''}
                
                <div class="item-description">${this.escapeHtml(item.description)}</div>
                
                ${item.goldValue ? `<div class="item-gold-value">💰 ${item.goldValue} Gold</div>` : ''}
                
                ${this.renderItemProperties(item)}
                
                ${item.source ? `<div class="item-source">Source: ${this.escapeHtml(item.source)}</div>` : ''}
            </div>
        `).join('');
    }

    renderItemProperties(item) {
        const properties = [];
        if (item.crit && item.crit > 0) properties.push({ name: 'Crit', value: `${item.crit}%` });
        if (item.dodge && item.dodge > 0) properties.push({ name: 'Dodge', value: `${item.dodge}%` });
        if (item.fireResist && item.fireResist > 0) properties.push({ name: 'Fire Resist', value: `${item.fireResist}%` });
        if (item.elecResist && item.elecResist > 0) properties.push({ name: 'Electric Resist', value: `${item.elecResist}%` });

        if (properties.length === 0) return '';

        return `
            <div class="item-properties">
                <div class="property-list">
                    ${properties.map(prop => `
                        <div class="property-item">
                            <span class="property-name">${prop.name}</span>
                            <span class="property-value">${prop.value}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    filterItems() {
        const typeFilter = document.getElementById('itemTypeFilter').value;
        const rarityFilter = document.getElementById('itemRarityFilter').value;
        const propertyFilter = document.getElementById('itemPropertyFilter').value;
        const searchTerm = document.getElementById('itemSearchInput').value.toLowerCase();

        this.filteredItems = this.items.filter(item => {
            const typeMatch = !typeFilter || item.type === typeFilter;
            const rarityMatch = !rarityFilter || item.rarity === rarityFilter;
            const searchMatch = !searchTerm || 
                item.name.toLowerCase().includes(searchTerm) ||
                item.description.toLowerCase().includes(searchTerm);
            
            let propertyMatch = true;
            if (propertyFilter) {
                switch (propertyFilter) {
                    case 'crit':
                        propertyMatch = item.crit && item.crit > 0;
                        break;
                    case 'dodge':
                        propertyMatch = item.dodge && item.dodge > 0;
                        break;
                    case 'fireResist':
                        propertyMatch = item.fireResist && item.fireResist > 0;
                        break;
                    case 'elecResist':
                        propertyMatch = item.elecResist && item.elecResist > 0;
                        break;
                }
            }
            
            return typeMatch && rarityMatch && searchMatch && propertyMatch;
        });
        this.renderItems();
    }

    searchItems(query) {
        this.filterItems();
    }

    openItemModal() {
        document.getElementById('addItemModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeItemModal() {
        document.getElementById('addItemModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        document.getElementById('addItemForm').reset();
    }

    handleAddItem(e) {
        e.preventDefault();
        
        const newItem = {
            id: Date.now(),
            name: document.getElementById('itemName').value,
            type: document.getElementById('itemType').value,
            rarity: document.getElementById('itemRarity').value,
            description: document.getElementById('itemDescription').value,
            imageUrl: document.getElementById('itemImageUrl').value,
            goldValue: document.getElementById('itemGoldValue').value ? parseInt(document.getElementById('itemGoldValue').value) : null,
            crit: document.getElementById('itemCrit').value ? parseFloat(document.getElementById('itemCrit').value) : null,
            dodge: document.getElementById('itemDodge').value ? parseFloat(document.getElementById('itemDodge').value) : null,
            fireResist: document.getElementById('itemFireResist').value ? parseFloat(document.getElementById('itemFireResist').value) : null,
            elecResist: document.getElementById('itemElecResist').value ? parseFloat(document.getElementById('itemElecResist').value) : null,
            source: document.getElementById('itemSource').value,
            dateAdded: new Date().toISOString().split('T')[0],
            submittedBy: 'Website User'
        };

        // Validate required fields
        if (!newItem.name || !newItem.type || !newItem.description || !newItem.rarity) {
            this.showMessage('Please fill in all required fields (Name, Type, Description, Rarity).', 'error');
            return;
        }

        // Add to local display immediately
        this.items.push(newItem);
        this.filteredItems = [...this.items];
        this.renderItems();
        this.closeItemModal();
        
        this.showMessage('Item added locally! Submitting to database...', 'success');
        
        // Save to localStorage
        this.saveItemsToLocalStorage();
        
        // Submit to GitHub for permanent storage
        this.submitItemToGitHub(newItem);
    }

    submitItemToGitHub(item) {
        // Create a GitHub issue URL with the item data
        const issueTitle = `Add new item: ${item.name}`;
        const issueBody = `## New Item Submission

**Item Name:** ${item.name}
**Type:** ${item.type}
**Rarity:** ${item.rarity}
**Description:** ${item.description}
**Image URL:** ${item.imageUrl || 'None provided'}
**Gold Value:** ${item.goldValue || 'None'}
**Source:** ${item.source || 'None provided'}

### Properties:
- **Crit %:** ${item.crit || 0}
- **Dodge %:** ${item.dodge || 0}
- **Fire Resist %:** ${item.fireResist || 0}
- **Electric Resist %:** ${item.elecResist || 0}

### JSON Data:
\`\`\`json
${JSON.stringify(item, null, 2)}
\`\`\`

This item was submitted through the website and should be added to the database.`;

        const issueUrl = `https://github.com/ArkDouglas/swordsupperfilter/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}&labels=item-submission`;
        
        // Open the GitHub issue creation page
        window.open(issueUrl, '_blank');
        
        this.showMessage('Item saved locally! Please submit via the GitHub issue that opened.', 'success');
    }

    async submitInstanceToDatabase(instance) {
        try {
            // Use GitHub's repository dispatch API to trigger the workflow
            const response = await fetch('https://api.github.com/repos/ArkDouglas/swordsupperfilter/dispatches', {
                method: 'POST',
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    event_type: 'add-instance',
                    client_payload: {
                        instance: instance,
                        timestamp: new Date().toISOString()
                    }
                })
            });

            if (response.ok) {
                this.showMessage('Instance submitted to database successfully!', 'success');
            } else {
                throw new Error('Failed to submit to database');
            }
        } catch (error) {
            console.error('Error submitting instance:', error);
            // Fallback to GitHub Issues approach
            this.submitInstanceToGitHub(instance);
        }
    }

    submitInstanceToGitHub(instance) {
        // Create a GitHub issue URL with the instance data
        const issueTitle = `Add new instance: ${instance.name}`;
        const issueBody = `## New Instance Submission

**Instance Name:** ${instance.name}
**Level:** ${instance.level}
**Difficulty:** ${instance.difficulty}
**Instance Type:** ${instance.instanceType}
**Type:** ${instance.type}
**Location:** ${instance.location || 'None provided'}
**Reddit Link:** ${instance.redditLink || 'None provided'}
**Submitted By:** ${instance.submittedBy || 'Anonymous'}

### Special Properties:
- **Has Ruined Path:** ${instance.hasRuinedPath ? 'Yes' : 'No'}
- **Has Increased:** ${instance.hasIncreased ? 'Yes' : 'No'}

### JSON Data:
\`\`\`json
${JSON.stringify(instance, null, 2)}
\`\`\`

This instance was submitted through the website and should be added to the database.`;

        const issueUrl = `https://github.com/ArkDouglas/swordsupperfilter/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}&labels=instance-submission`;
        
        // Open the GitHub issue creation page
        window.open(issueUrl, '_blank');
        
        this.showMessage('Instance saved locally! Please submit via the GitHub issue that opened.', 'info');
    }

    saveItemsToLocalStorage() {
        try {
            localStorage.setItem('swordAndSupperItems', JSON.stringify(this.items));
        } catch (error) {
            console.error('Error saving items to localStorage:', error);
        }
    }

    loadItemsFromLocalStorage() {
        try {
            const saved = localStorage.getItem('swordAndSupperItems');
            if (saved) {
                this.items = JSON.parse(saved);
                this.filteredItems = [...this.items];
                this.renderItems();
            }
        } catch (error) {
            console.error('Error loading items from localStorage:', error);
        }
    }

    // Level/Gold functionality
    openLevelGoldModal() {
        document.getElementById('addLevelGoldModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeLevelGoldModal() {
        document.getElementById('addLevelGoldModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        document.getElementById('addLevelGoldForm').reset();
    }

    handleAddLevelGold(e) {
        e.preventDefault();
        
        const newLevelGold = {
            id: Date.now(),
            level: parseInt(document.getElementById('levelGoldLevel').value),
            cost: parseInt(document.getElementById('levelGoldCost').value),
            submittedBy: document.getElementById('levelGoldSubmittedBy').value,
            dateAdded: new Date().toISOString().split('T')[0]
        };

        // Validate required fields
        if (!newLevelGold.level || !newLevelGold.cost) {
            this.showMessage('Please fill in all required fields.', 'error');
            return;
        }

        this.levelGoldCosts.push(newLevelGold);
        this.renderLevelGoldCosts();
        this.closeLevelGoldModal();
        
        this.showMessage('Level/Gold cost added successfully!', 'success');
        
        // Save to localStorage
        this.saveLevelGoldToLocalStorage();
    }

    renderLevelGoldCosts() {
        const container = document.getElementById('levelGoldList');
        if (this.levelGoldCosts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-coins"></i>
                    <h3>No level/gold costs yet</h3>
                    <p>Add some level/gold costs to get started!</p>
                </div>
            `;
            return;
        }

        // Sort by level
        const sortedCosts = [...this.levelGoldCosts].sort((a, b) => a.level - b.level);

        container.innerHTML = sortedCosts.map(cost => `
            <div class="level-gold-card">
                <div class="level-gold-level">Level ${cost.level}</div>
                <div class="level-gold-cost">${cost.cost} Gold</div>
                ${cost.submittedBy ? `
                    <div class="level-gold-submitted">
                        Added by <a href="https://www.reddit.com/user/${cost.submittedBy}" target="_blank">/u/${cost.submittedBy}</a>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    saveLevelGoldToLocalStorage() {
        try {
            localStorage.setItem('swordAndSupperLevelGold', JSON.stringify(this.levelGoldCosts));
        } catch (error) {
            console.error('Error saving level/gold to localStorage:', error);
        }
    }

    loadLevelGoldFromLocalStorage() {
        try {
            const savedLevelGold = localStorage.getItem('swordAndSupperLevelGold');
            if (savedLevelGold) {
                this.levelGoldCosts = JSON.parse(savedLevelGold);
            } else {
                // Initialize with some example data from the wiki
                this.levelGoldCosts = [
                    {
                        id: 1,
                        level: 22,
                        cost: 750,
                        submittedBy: "Wiki Data",
                        dateAdded: new Date().toISOString().split('T')[0]
                    }
                ];
            }
            this.renderLevelGoldCosts();
        } catch (error) {
            console.error('Error loading level/gold from localStorage:', error);
        }
    }
}

// Initialize the application
let bossDB;
document.addEventListener('DOMContentLoaded', () => {
    bossDB = new BossDatabase();
});

// Export for global access
window.bossDB = bossDB;
