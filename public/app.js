class GameManager {
    constructor() {
        this.apiUrl = '/api/games';
        this.currentEditId = null;
        this.games = [];
        this.currentFilter = 'all';
        this.init();
    }
    
    init() {
        this.loadGames();
        this.setupEventListeners();
        this.setupFilters();
    }
    
    setupEventListeners() {
        const form = document.getElementById('gameForm');
        const cancelBtn = document.getElementById('cancelBtn');
        
        form.addEventListener('submit', (e) => this.handleSubmit(e));
        cancelBtn.addEventListener('click', () => this.cancelEdit());
    }

    setupFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.renderGames(this.games);
            });
        });
    }
    
    async loadGames() {
        try {
            const response = await fetch(this.apiUrl);
            const data = await response.json();
            
            if (response.ok) {
                this.games = data.games;
                this.renderGames(this.games);
                this.updateStats(this.games);
            } else {
                this.showMessage('Error al cargar videojuegos: ' + data.error, 'error');
            }
        } catch (error) {
            this.showMessage('Error de conexión: ' + error.message, 'error');
        } finally {
            document.getElementById('loading').style.display = 'none';
        }
    }

    updateStats(games) {
        const totalGames = games.length;
        const genres = [...new Set(games.map(g => g.genre))].length;
        const platforms = [...new Set(games.map(g => g.platform))].length;
        const avgRating = games.length > 0 ? 
            (games.reduce((sum, g) => sum + (g.rating || 0), 0) / games.length).toFixed(1) : 0;

        document.getElementById('totalGames').textContent = totalGames;
        document.getElementById('totalGenres').textContent = genres;
        document.getElementById('totalPlatforms').textContent = platforms;
        document.getElementById('avgRating').textContent = avgRating;
    }
    
    renderGames(games) {
        const container = document.getElementById('gamesContainer');
        
        // Filtrar juegos
        const filteredGames = this.currentFilter === 'all' ? 
            games : games.filter(game => game.genre === this.currentFilter);
        
        if (filteredGames.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666; grid-column: 1 / -1;">
                    <i class="fas fa-gamepad" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                    <p>No hay videojuegos ${this.currentFilter !== 'all' ? 'en este género' : 'registrados'}</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = filteredGames.map(game => `
            <div class="game-card" data-id="${game.id}">
                <div class="game-header">
                    <div>
                        <div class="game-title">${game.title}</div>
                    </div>
                    ${game.rating ? `
                        <div class="game-rating">
                            <i class="fas fa-star"></i>
                            ${game.rating}/10
                        </div>
                    ` : ''}
                </div>
                
                <div class="game-info">
                    <div class="info-item">
                        <span class="info-label">Género</span>
                        <span class="info-value">${game.genre}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Plataforma</span>
                        <span class="info-value">${game.platform}</span>
                    </div>
                    ${game.developer ? `
                        <div class="info-item">
                            <span class="info-label">Desarrollador</span>
                            <span class="info-value">${game.developer}</span>
                        </div>
                    ` : ''}
                    ${game.release_date ? `
                        <div class="info-item">
                            <span class="info-label">Lanzamiento</span>
                            <span class="info-value">${new Date(game.release_date).toLocaleDateString('es-ES')}</span>
                        </div>
                    ` : ''}
                    ${game.price ? `
                        <div class="info-item">
                            <span class="info-label">Precio</span>
                            <span class="info-value">$${game.price}</span>
                        </div>
                    ` : ''}
                </div>
                
                ${game.description ? `
                    <div class="game-description">${game.description}</div>
                ` : ''}
                
                <div class="game-actions">
                    <button class="btn btn-edit" onclick="gameManager.editGame(${game.id})">
                        <i class="fas fa-edit"></i>
                        Editar
                    </button>
                    <button class="btn btn-delete" onclick="gameManager.deleteGame(${game.id})">
                        <i class="fas fa-trash"></i>
                        Eliminar
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const gameData = Object.fromEntries(formData.entries());
        
        // Convertir valores numéricos
        if (gameData.price) gameData.price = parseFloat(gameData.price);
        if (gameData.rating) gameData.rating = parseFloat(gameData.rating);
        
        // Validar rating
        if (gameData.rating && (gameData.rating < 1 || gameData.rating > 10)) {
            this.showMessage('El rating debe estar entre 1 y 10', 'error');
            return;
        }
        
        try {
            const url = this.currentEditId ? `${this.apiUrl}/${this.currentEditId}` : this.apiUrl;
            const method = this.currentEditId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gameData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showMessage(
                    this.currentEditId ? 'Videojuego actualizado exitosamente' : 'Videojuego creado exitosamente',
                    'success'
                );
                this.resetForm();
                this.loadGames();
            } else {
                this.showMessage('Error: ' + result.error, 'error');
            }
        } catch (error) {
            this.showMessage('Error de conexión: ' + error.message, 'error');
        }
    }
    
    async editGame(id) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const game = await response.json();
            
            this.fillForm(game);
            this.currentEditId = id;
            document.getElementById('form-title').innerHTML = `
                <i class="fas fa-edit"></i>
                Editar Videojuego
            `;
            document.getElementById('submitBtn').innerHTML = `
                <i class="fas fa-save"></i>
                Actualizar Videojuego
            `;
            document.getElementById('cancelBtn').style.display = 'inline-flex';
            
            // Scroll al formulario
            document.querySelector('.form-section').scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
            
            // Highlight del juego seleccionado
            document.querySelectorAll('.game-card').forEach(card => {
                card.style.transform = '';
                card.style.boxShadow = '';
            });
            
            const selectedCard = document.querySelector(`[data-id="${id}"]`);
            if (selectedCard) {
                selectedCard.style.transform = 'scale(1.02)';
                selectedCard.style.boxShadow = '0 20px 40px rgba(102, 126, 234, 0.3)';
            }
            
        } catch (error) {
            this.showMessage('Error al cargar videojuego: ' + error.message, 'error');
        }
    }
    
    async deleteGame(id) {
        // Encontrar el juego para mostrar su nombre
        const game = this.games.find(g => g.id === id);
        const gameName = game ? game.title : 'este videojuego';
        
        if (!confirm(`¿Estás seguro de que quieres eliminar "${gameName}"?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            this.showMessage(`"${gameName}" eliminado exitosamente`, 'success');
            this.loadGames();
            
            // Si estábamos editando este juego, cancelar la edición
            if (this.currentEditId == id) {
                this.cancelEdit();
            }
            
        } catch (error) {
            this.showMessage('Error al eliminar: ' + error.message, 'error');
        }
    }
    
    fillForm(game) {
        const form = document.getElementById('gameForm');
        Object.keys(game).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = game[key] || '';
            }
        });
    }
    
    resetForm() {
        document.getElementById('gameForm').reset();
        this.cancelEdit();
    }
    
    cancelEdit() {
        this.currentEditId = null;
        document.getElementById('form-title').innerHTML = `
            <i class="fas fa-plus-circle"></i>
            Agregar Nuevo Videojuego
        `;
        document.getElementById('submitBtn').innerHTML = `
            <i class="fas fa-save"></i>
            Agregar Videojuego
        `;
        document.getElementById('cancelBtn').style.display = 'none';
        document.getElementById('gameForm').reset();
        
        // Remover highlight de las tarjetas
        document.querySelectorAll('.game-card').forEach(card => {
            card.style.transform = '';
            card.style.boxShadow = '';
        });
    }
    
    showMessage(message, type) {
        const messageDiv = document.getElementById('message');
        messageDiv.innerHTML = `
            <div class="${type}">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
                ${message}
            </div>
        `;
        
        setTimeout(() => {
            messageDiv.innerHTML = '';
        }, 5000);
    }
}

// Inicializar la aplicación
const gameManager = new GameManager();

// Agregar efectos de carga suaves
document.addEventListener('DOMContentLoaded', () => {
    // Animación de entrada para las tarjetas
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    });
    
    // Observar nuevas tarjetas cuando se agreguen
    const observeCards = () => {
        document.querySelectorAll('.game-card').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(card);
        });
    };
    
    // Observar cambios en el contenedor de juegos
    const gamesContainer = document.getElementById('gamesContainer');
    const gamesObserver = new MutationObserver(observeCards);
    gamesObserver.observe(gamesContainer, { childList: true });
});