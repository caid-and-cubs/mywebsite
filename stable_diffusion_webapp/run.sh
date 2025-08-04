#!/bin/bash

# Script de lancement pour l'application Stable Diffusion Web App
# Usage: ./run.sh [dev|prod|stop|logs]

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier si Docker est installé
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé. Veuillez l'installer d'abord."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose n'est pas installé. Veuillez l'installer d'abord."
        exit 1
    fi
}

# Fonction pour le mode développement
dev_mode() {
    log_info "Lancement en mode développement..."
    
    # Créer les dossiers nécessaires
    mkdir -p generated_images
    
    # Lancer avec docker-compose
    docker-compose up --build
}

# Fonction pour le mode production
prod_mode() {
    log_info "Lancement en mode production avec Nginx..."
    
    # Créer les dossiers nécessaires
    mkdir -p generated_images ssl
    
    # Vérifier si les certificats SSL existent
    if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
        log_warning "Certificats SSL non trouvés. L'application sera lancée en HTTP uniquement."
        log_info "Pour activer HTTPS, placez vos certificats dans le dossier ssl/ :"
        log_info "  - ssl/cert.pem (certificat)"
        log_info "  - ssl/key.pem (clé privée)"
    fi
    
    # Lancer avec le profil production
    docker-compose --profile production up -d --build
    
    log_success "Application lancée en mode production !"
    log_info "Accès HTTP: http://localhost"
    log_info "Accès HTTPS: https://localhost (si certificats configurés)"
}

# Fonction pour arrêter l'application
stop_app() {
    log_info "Arrêt de l'application..."
    docker-compose --profile production down
    log_success "Application arrêtée."
}

# Fonction pour afficher les logs
show_logs() {
    log_info "Affichage des logs..."
    docker-compose logs -f
}

# Fonction pour nettoyer
cleanup() {
    log_info "Nettoyage des ressources Docker..."
    docker-compose down --volumes --remove-orphans
    docker system prune -f
    log_success "Nettoyage terminé."
}

# Fonction pour afficher l'aide
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  dev     Lancer en mode développement"
    echo "  prod    Lancer en mode production avec Nginx"
    echo "  stop    Arrêter l'application"
    echo "  logs    Afficher les logs"
    echo "  clean   Nettoyer les ressources Docker"
    echo "  help    Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  $0 dev      # Lancement développement"
    echo "  $0 prod     # Lancement production"
    echo "  $0 logs     # Voir les logs"
    echo "  $0 stop     # Arrêter l'app"
}

# Fonction principale
main() {
    # Vérifier Docker
    check_docker
    
    # Traiter les arguments
    case "${1:-help}" in
        "dev")
            dev_mode
            ;;
        "prod")
            prod_mode
            ;;
        "stop")
            stop_app
            ;;
        "logs")
            show_logs
            ;;
        "clean")
            cleanup
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Exécuter la fonction principale avec tous les arguments
main "$@"