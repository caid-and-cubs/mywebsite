# 🎨 AI Image Generator - Stable Diffusion Web App

Une application web professionnelle et moderne pour générer des images à partir de descriptions textuelles en utilisant Stable Diffusion.

## ✨ Fonctionnalités

- **Interface moderne et responsive** avec design sombre professionnel
- **Génération d'images IA** avec Stable Diffusion v1.4
- **Paramètres avancés** : étapes d'inférence, guidance scale, dimensions
- **Galerie locale** avec sauvegarde des images générées
- **Téléchargement et partage** des images
- **API REST** pour intégration avec d'autres applications
- **Support GPU/CPU** automatique
- **Déploiement Docker** prêt pour la production

## 🚀 Démarrage rapide

### Prérequis

- Python 3.10+
- Docker et Docker Compose (pour le déploiement)
- GPU NVIDIA avec CUDA (optionnel, mais recommandé)
- Au moins 8GB de RAM
- 10GB d'espace disque libre

### Installation locale

1. **Cloner et accéder au projet**
```bash
cd stable_diffusion_webapp
```

2. **Créer un environnement virtuel**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
.\venv\Scripts\activate  # Windows
```

3. **Installer les dépendances**
```bash
pip install -r requirements.txt
```

4. **Lancer l'application**
```bash
python app.py
```

L'application sera accessible sur `http://localhost:5000`

### Déploiement avec Docker

#### Déploiement simple

```bash
# Construire et lancer l'application
docker-compose up --build

# Ou en arrière-plan
docker-compose up -d --build
```

#### Déploiement avec Nginx (production)

```bash
# Lancer avec le profil production (inclut nginx)
docker-compose --profile production up -d --build
```

## 🖥️ Interface utilisateur

### Page principale

- **Zone de saisie** : Entrez votre description d'image
- **Paramètres avancés** : Ajustez les paramètres de génération
  - Étapes d'inférence (10-50)
  - Guidance Scale (1-20)
  - Dimensions (512px, 768px, 1024px)
- **Suggestions** : Prompts pré-définis pour vous inspirer
- **Galerie** : Historique de vos créations

### Fonctionnalités

- **Raccourcis clavier** : Ctrl+Enter pour générer
- **Responsive design** : Compatible mobile et desktop
- **Indicateur de progression** : Suivi en temps réel
- **Gestion d'erreurs** : Messages d'erreur clairs
- **Sauvegarde locale** : Vos images sont conservées

## 🔧 API Documentation

### Endpoints

#### `GET /`
Page d'accueil de l'application

#### `POST /api/generate`
Génère une image à partir d'un prompt

**Body (JSON):**
```json
{
  "prompt": "un astronaute chevauchant un cheval sur Mars",
  "steps": 20,
  "guidance_scale": 7.5,
  "width": 512,
  "height": 512
}
```

**Réponse:**
```json
{
  "success": true,
  "filename": "abc123.png",
  "image_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "prompt": "un astronaute chevauchant un cheval sur Mars"
}
```

#### `GET /api/download/<filename>`
Télécharge une image générée

#### `GET /api/status`
Vérifie le statut de l'application

**Réponse:**
```json
{
  "status": "running",
  "model_loaded": true,
  "device": "cuda"
}
```

### Exemple d'utilisation avec curl

```bash
# Générer une image
curl -X POST http://localhost:5000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "un chat dans l'espace",
    "steps": 20,
    "guidance_scale": 7.5,
    "width": 512,
    "height": 512
  }'

# Télécharger une image
curl -O http://localhost:5000/api/download/abc123.png
```

## ⚙️ Configuration

### Variables d'environnement

- `FLASK_ENV` : Mode de l'application (development/production)
- `FLASK_APP` : Point d'entrée de l'application
- `PYTHONPATH` : Chemin Python

### Configuration Docker

Le fichier `docker-compose.yml` inclut :
- **Limites mémoire** : 8GB max, 4GB réservé
- **Volumes persistants** : Cache des modèles et images générées
- **Health checks** : Surveillance automatique
- **Restart policy** : Redémarrage automatique

### Configuration Nginx

- **Reverse proxy** : Gestion du trafic HTTP/HTTPS
- **Compression gzip** : Optimisation des performances
- **Cache statique** : Mise en cache des ressources
- **Timeouts adaptés** : Pour les longues générations

## 🔧 Personnalisation

### Modifier les modèles

Dans `app.py`, changez la variable `model_id` :
```python
model_id = "runwayml/stable-diffusion-v1-5"  # Exemple
```

### Ajouter des suggestions de prompts

Dans `static/js/script.js`, modifiez le tableau `promptSuggestions` :
```javascript
const promptSuggestions = [
    "votre nouveau prompt ici",
    // ...
];
```

### Personnaliser le style

Modifiez les variables CSS dans `static/css/style.css` :
```css
:root {
    --primary-color: #your-color;
    --background-color: #your-bg;
    /* ... */
}
```

## 📊 Monitoring et logs

### Logs de l'application

```bash
# Voir les logs en temps réel
docker-compose logs -f stable-diffusion-webapp

# Logs nginx
docker-compose logs -f nginx
```

### Health checks

- **Application** : `http://localhost:5000/api/status`
- **Nginx** : `http://localhost/health`

### Métriques

L'application log automatiquement :
- Temps de génération des images
- Erreurs et exceptions
- Utilisation des ressources

## 🚨 Dépannage

### Problèmes courants

#### Erreur de mémoire GPU
```
RuntimeError: CUDA out of memory
```
**Solution** : Réduisez les dimensions d'image ou utilisez le CPU

#### Modèle non chargé
```
Le modèle n'est pas encore chargé
```
**Solution** : Attendez le chargement initial (peut prendre 5-10 minutes)

#### Port déjà utilisé
```
Port 5000 is already in use
```
**Solution** : Changez le port dans `docker-compose.yml`

### Optimisations performances

1. **GPU** : Assurez-vous d'avoir les drivers NVIDIA à jour
2. **Mémoire** : Augmentez la swap si nécessaire
3. **Stockage** : Utilisez un SSD pour de meilleures performances

## 🔒 Sécurité

### Recommandations production

1. **Reverse proxy** : Utilisez nginx avec SSL/TLS
2. **Firewall** : Limitez l'accès aux ports nécessaires
3. **Updates** : Maintenez les dépendances à jour
4. **Monitoring** : Surveillez les ressources et logs

### Configuration SSL

Décommentez la section HTTPS dans `nginx.conf` et ajoutez vos certificats dans le dossier `ssl/`.

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Ouvrir des issues pour signaler des bugs
- Proposer des améliorations
- Soumettre des pull requests

## 📞 Support

Pour toute question ou problème :
- Consultez la documentation
- Vérifiez les issues existantes
- Créez une nouvelle issue si nécessaire

---

**Développé avec ❤️ en utilisant Stable Diffusion et Flask**