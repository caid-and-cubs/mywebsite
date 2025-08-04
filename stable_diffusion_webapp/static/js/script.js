// Variables globales
let currentFilename = null;
let gallery = [];

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    initializeSliders();
    checkServerStatus();
    loadGallery();
});

// Initialiser les sliders avec mise à jour des valeurs
function initializeSliders() {
    const stepsSlider = document.getElementById('steps');
    const guidanceSlider = document.getElementById('guidance');
    const stepsValue = document.getElementById('stepsValue');
    const guidanceValue = document.getElementById('guidanceValue');

    stepsSlider.addEventListener('input', function() {
        stepsValue.textContent = this.value;
    });

    guidanceSlider.addEventListener('input', function() {
        guidanceValue.textContent = this.value;
    });
}

// Vérifier le statut du serveur
async function checkServerStatus() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        
        if (!data.model_loaded) {
            showError('Le modèle n\'est pas encore chargé. Veuillez patienter...');
        }
    } catch (error) {
        showError('Impossible de se connecter au serveur');
    }
}

// Basculer l'affichage des paramètres avancés
function toggleAdvanced() {
    const panel = document.getElementById('advancedPanel');
    const button = document.querySelector('.toggle-advanced');
    
    if (panel.classList.contains('show')) {
        panel.classList.remove('show');
        button.innerHTML = '<i class="fas fa-cog"></i> Paramètres avancés';
    } else {
        panel.classList.add('show');
        button.innerHTML = '<i class="fas fa-cog"></i> Masquer les paramètres';
    }
}

// Fonction principale de génération d'image
async function generateImage() {
    const prompt = document.getElementById('prompt').value.trim();
    
    if (!prompt) {
        showError('Veuillez entrer une description pour votre image');
        return;
    }

    // Récupérer les paramètres
    const params = {
        prompt: prompt,
        steps: parseInt(document.getElementById('steps').value),
        guidance_scale: parseFloat(document.getElementById('guidance').value),
        width: parseInt(document.getElementById('width').value),
        height: parseInt(document.getElementById('height').value)
    };

    // Afficher le loading
    showLoading();
    disableGenerateButton();

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showResult(data);
            addToGallery(data);
        } else {
            showError(data.error || 'Erreur lors de la génération');
        }
    } catch (error) {
        showError('Erreur de connexion: ' + error.message);
    } finally {
        hideLoading();
        enableGenerateButton();
    }
}

// Afficher le loading
function showLoading() {
    hideError();
    hideResult();
    document.getElementById('loading').classList.add('show');
}

// Masquer le loading
function hideLoading() {
    document.getElementById('loading').classList.remove('show');
}

// Afficher le résultat
function showResult(data) {
    hideError();
    hideLoading();
    
    const resultContainer = document.getElementById('resultContainer');
    const generatedImage = document.getElementById('generatedImage');
    const usedPrompt = document.getElementById('usedPrompt');
    
    generatedImage.src = data.image_data;
    usedPrompt.textContent = data.prompt;
    currentFilename = data.filename;
    
    resultContainer.classList.add('show');
    
    // Scroll vers le résultat
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Masquer le résultat
function hideResult() {
    document.getElementById('resultContainer').classList.remove('show');
}

// Afficher une erreur
function showError(message) {
    hideLoading();
    hideResult();
    
    const errorContainer = document.getElementById('errorContainer');
    const errorText = document.getElementById('errorText');
    
    errorText.textContent = message;
    errorContainer.classList.add('show');
    
    // Masquer l'erreur après 5 secondes
    setTimeout(() => {
        hideError();
    }, 5000);
}

// Masquer l'erreur
function hideError() {
    document.getElementById('errorContainer').classList.remove('show');
}

// Désactiver le bouton de génération
function disableGenerateButton() {
    const btn = document.getElementById('generateBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Génération...';
}

// Réactiver le bouton de génération
function enableGenerateButton() {
    const btn = document.getElementById('generateBtn');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Générer l\'image';
}

// Télécharger l'image
function downloadImage() {
    if (!currentFilename) {
        showError('Aucune image à télécharger');
        return;
    }
    
    const link = document.createElement('a');
    link.href = `/api/download/${currentFilename}`;
    link.download = currentFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Partager l'image
async function shareImage() {
    if (!currentFilename) {
        showError('Aucune image à partager');
        return;
    }

    const shareData = {
        title: 'Image générée par IA',
        text: document.getElementById('usedPrompt').textContent,
        url: window.location.origin + `/api/download/${currentFilename}`
    };

    try {
        if (navigator.share && navigator.canShare(shareData)) {
            await navigator.share(shareData);
        } else {
            // Fallback: copier l'URL dans le presse-papiers
            await navigator.clipboard.writeText(shareData.url);
            showTemporaryMessage('Lien copié dans le presse-papiers!');
        }
    } catch (error) {
        console.error('Erreur lors du partage:', error);
        showTemporaryMessage('Impossible de partager l\'image');
    }
}

// Afficher un message temporaire
function showTemporaryMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'temporary-message';
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success-color);
        color: white;
        padding: 15px 20px;
        border-radius: var(--border-radius);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 300);
    }, 3000);
}

// Ajouter à la galerie
function addToGallery(data) {
    gallery.unshift({
        filename: data.filename,
        prompt: data.prompt,
        image_data: data.image_data,
        timestamp: new Date()
    });
    
    // Limiter la galerie à 12 éléments
    if (gallery.length > 12) {
        gallery = gallery.slice(0, 12);
    }
    
    updateGalleryDisplay();
    saveGallery();
}

// Mettre à jour l'affichage de la galerie
function updateGalleryDisplay() {
    const galleryGrid = document.getElementById('galleryGrid');
    
    if (gallery.length === 0) {
        galleryGrid.innerHTML = '<p style="text-align: center; color: var(--text-muted); grid-column: 1 / -1;">Aucune image générée récemment</p>';
        return;
    }
    
    galleryGrid.innerHTML = gallery.map(item => `
        <div class="gallery-item" onclick="viewGalleryImage('${item.filename}', '${item.prompt.replace(/'/g, "\\'")}')">
            <img src="${item.image_data}" alt="Image générée" loading="lazy">
            <div class="gallery-item-info">
                <p>${truncateText(item.prompt, 80)}</p>
            </div>
        </div>
    `).join('');
}

// Voir une image de la galerie
function viewGalleryImage(filename, prompt) {
    const item = gallery.find(g => g.filename === filename);
    if (item) {
        showResult({
            filename: filename,
            prompt: prompt,
            image_data: item.image_data
        });
    }
}

// Tronquer le texte
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Sauvegarder la galerie dans le localStorage
function saveGallery() {
    try {
        localStorage.setItem('imageGallery', JSON.stringify(gallery));
    } catch (error) {
        console.warn('Impossible de sauvegarder la galerie:', error);
    }
}

// Charger la galerie depuis le localStorage
function loadGallery() {
    try {
        const saved = localStorage.getItem('imageGallery');
        if (saved) {
            gallery = JSON.parse(saved);
            updateGalleryDisplay();
        }
    } catch (error) {
        console.warn('Impossible de charger la galerie:', error);
        gallery = [];
    }
}

// Gestion des touches clavier
document.addEventListener('keydown', function(event) {
    // Ctrl/Cmd + Enter pour générer
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        generateImage();
    }
    
    // Escape pour masquer les erreurs
    if (event.key === 'Escape') {
        hideError();
    }
});

// Gestion du redimensionnement de la textarea
document.getElementById('prompt').addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 200) + 'px';
});

// Suggestions de prompts
const promptSuggestions = [
    "un astronaute chevauchant un cheval sur Mars, style réaliste, haute qualité",
    "un château flottant dans les nuages, style fantastique, lumière dorée",
    "un robot futuriste dans une ville cyberpunk, néons, pluie",
    "un paysage de montagne au coucher de soleil, style impressionniste",
    "un chat portant un chapeau de magicien, style cartoon, coloré",
    "une forêt enchantée avec des champignons lumineux, style féerique",
    "un vaisseau spatial explorant une galaxie lointaine, style science-fiction",
    "un dragon majestueux survolant un village médiéval, style épique"
];

// Ajouter des suggestions de prompts
function addPromptSuggestions() {
    const promptTextarea = document.getElementById('prompt');
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'prompt-suggestions';
    suggestionsContainer.innerHTML = `
        <h4>Suggestions :</h4>
        <div class="suggestions-grid">
            ${promptSuggestions.map(suggestion => `
                <button type="button" class="suggestion-btn" onclick="usePromptSuggestion('${suggestion.replace(/'/g, "\\'")}')">
                    ${truncateText(suggestion, 50)}
                </button>
            `).join('')}
        </div>
    `;
    
    promptTextarea.parentNode.appendChild(suggestionsContainer);
}

// Utiliser une suggestion de prompt
function usePromptSuggestion(suggestion) {
    document.getElementById('prompt').value = suggestion;
    document.getElementById('prompt').focus();
}

// Ajouter les styles pour les suggestions
const suggestionStyles = `
    .prompt-suggestions {
        margin-top: 15px;
        padding: 20px;
        background: var(--background-color);
        border-radius: var(--border-radius);
        border: 1px solid var(--border-color);
    }
    
    .prompt-suggestions h4 {
        color: var(--text-primary);
        margin-bottom: 15px;
        font-size: 1rem;
    }
    
    .suggestions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 10px;
    }
    
    .suggestion-btn {
        padding: 10px 15px;
        background: var(--surface-hover);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: left;
        font-size: 0.9rem;
    }
    
    .suggestion-btn:hover {
        background: var(--primary-color);
        color: white;
        transform: translateY(-1px);
    }
    
    .temporary-message {
        animation: slideIn 0.3s ease;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;

// Ajouter les styles au document
const styleSheet = document.createElement('style');
styleSheet.textContent = suggestionStyles;
document.head.appendChild(styleSheet);

// Initialiser les suggestions après le chargement
setTimeout(() => {
    addPromptSuggestions();
}, 100);