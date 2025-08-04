#!/bin/bash

# Script de lancement pour la démonstration
echo "🎨 Lancement de la démonstration AI Image Generator"
echo "📦 Installation des dépendances minimales..."

# Vérifier si Python3 est installé
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 n'est pas installé"
    exit 1
fi

# Créer un environnement virtuel si nécessaire
if [ ! -d "venv_demo" ]; then
    echo "🔧 Création de l'environnement virtuel..."
    python3 -m venv venv_demo
fi

# Activer l'environnement virtuel
source venv_demo/bin/activate

# Installer les dépendances
pip install -r requirements-demo.txt

# Créer le dossier des images
mkdir -p generated_images

echo "🚀 Lancement de la démonstration..."
echo "🌐 L'application sera accessible sur: http://localhost:5000"
echo "⚠️  Mode DEMO - génère des images de test (pas de vraie IA)"
echo ""

# Lancer l'application
python3 demo.py