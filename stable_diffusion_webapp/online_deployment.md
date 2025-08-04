# 🌐 Guide de Déploiement en Ligne

Ce guide vous explique comment déployer votre application AI Image Generator sur différentes plateformes cloud.

## 🚀 Options de Déploiement

### 1. Heroku (Gratuit/Payant)

#### Préparation
```bash
# Installer Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Se connecter
heroku login
```

#### Créer l'application
```bash
# Créer une nouvelle app
heroku create votre-app-name

# Configurer les variables d'environnement
heroku config:set FLASK_ENV=production
heroku config:set PYTHONPATH=/app
```

#### Fichiers nécessaires

**Procfile**
```
web: gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120
```

**runtime.txt**
```
python-3.10.9
```

#### Déploiement
```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### 2. Railway (Recommandé - Simple)

#### Étapes
1. Aller sur [railway.app](https://railway.app)
2. Se connecter avec GitHub
3. Cliquer "New Project" → "Deploy from GitHub repo"
4. Sélectionner votre repository
5. Railway détecte automatiquement Flask

#### Configuration
```bash
# Variables d'environnement sur Railway
FLASK_ENV=production
PORT=5000
PYTHONPATH=/app
```

### 3. Render (Gratuit avec limitations)

#### Étapes
1. Aller sur [render.com](https://render.com)
2. Créer un compte et connecter GitHub
3. "New" → "Web Service"
4. Sélectionner votre repository

#### Configuration Render
```yaml
# render.yaml
services:
  - type: web
    name: stable-diffusion-app
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn app:app --bind 0.0.0.0:$PORT
    envVars:
      - key: FLASK_ENV
        value: production
      - key: PYTHONPATH
        value: /opt/render/project/src
```

### 4. Google Cloud Run

#### Préparation
```bash
# Installer gcloud CLI
curl https://sdk.cloud.google.com | bash

# Se connecter
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

#### Déploiement
```bash
# Construire et déployer
gcloud run deploy stable-diffusion-app \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 4Gi \
  --cpu 2 \
  --timeout 900
```

### 5. AWS Elastic Beanstalk

#### Fichiers nécessaires

**application.py** (renommer app.py)
```python
# Même contenu que app.py
from app import app as application

if __name__ == "__main__":
    application.run()
```

**.ebextensions/01_packages.config**
```yaml
packages:
  yum:
    git: []
    gcc: []
```

#### Déploiement
```bash
# Installer EB CLI
pip install awsebcli

# Initialiser
eb init -p python-3.8 stable-diffusion-app

# Créer environnement
eb create stable-diffusion-env

# Déployer
eb deploy
```

## 🔧 Optimisations pour le Cloud

### 1. Réduire la Taille Docker

**Dockerfile.cloud**
```dockerfile
FROM python:3.10-slim

# Optimisations pour le cloud
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Installer seulement les dépendances nécessaires
COPY requirements-cloud.txt .
RUN pip install --no-cache-dir -r requirements-cloud.txt

COPY . .

# Utiliser gunicorn pour la production
CMD gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120
```

**requirements-cloud.txt**
```
Flask==2.3.3
torch==2.0.1+cpu
diffusers==0.21.4
transformers==4.34.0
Pillow==10.0.1
gunicorn==21.2.0
flask-cors==4.0.0
```

### 2. Configuration pour CPU uniquement

**app-cloud.py**
```python
# Version optimisée pour le cloud (CPU only)
import torch

# Forcer l'utilisation du CPU
device = "cpu"
pipe = StableDiffusionPipeline.from_pretrained(
    model_id,
    torch_dtype=torch.float32,  # float32 pour CPU
    safety_checker=None,
    requires_safety_checker=False
)
```

## 🌍 Déploiement avec Tunneling (Test Local)

### 1. ngrok (Recommandé)

```bash
# Installer ngrok
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar -xzf ngrok-v3-stable-linux-amd64.tgz

# Créer un compte sur ngrok.com et récupérer le token
./ngrok config add-authtoken VOTRE_TOKEN

# Lancer l'application localement
python demo.py

# Dans un autre terminal, créer le tunnel
./ngrok http 5000
```

### 2. Cloudflare Tunnel

```bash
# Installer cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Créer un tunnel
cloudflared tunnel --url http://localhost:5000
```

### 3. serveo.net (Sans installation)

```bash
# Lancer l'application
python demo.py

# Dans un autre terminal
ssh -R 80:localhost:5000 serveo.net
```

## 📱 Version Mobile-Optimisée

### PWA (Progressive Web App)

**manifest.json**
```json
{
  "name": "AI Image Generator",
  "short_name": "AIImageGen",
  "description": "Generate images with AI",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#6366f1",
  "icons": [
    {
      "src": "/static/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

## 🔒 Sécurité pour la Production

### Variables d'Environnement
```bash
# Clés API (si nécessaire)
export HUGGINGFACE_TOKEN="your_token"
export SECRET_KEY="your_secret_key"

# Limitations
export MAX_REQUESTS_PER_HOUR=10
export MAX_IMAGE_SIZE=1024
```

### Rate Limiting
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["100 per hour"]
)

@app.route('/api/generate', methods=['POST'])
@limiter.limit("5 per minute")
def generate_image():
    # Votre code existant
```

## 📊 Monitoring

### Health Check Endpoint
```python
@app.route('/health')
def health_check():
    return {
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    }
```

### Logs Structurés
```python
import structlog

logger = structlog.get_logger()

@app.route('/api/generate', methods=['POST'])
def generate_image():
    logger.info("image_generation_started", 
                prompt=prompt, 
                user_ip=request.remote_addr)
```

## 🎯 Recommandations par Cas d'Usage

| Cas d'Usage | Plateforme | Coût | Complexité |
|-------------|------------|------|------------|
| **Démo/Test** | ngrok + local | Gratuit | Facile |
| **Prototype** | Railway/Render | Gratuit/Peu cher | Facile |
| **Production légère** | Heroku | Modéré | Moyen |
| **Production intensive** | Google Cloud Run | Variable | Avancé |
| **Entreprise** | AWS/Azure | Élevé | Expert |

## 🚀 Démarrage Rapide Cloud

### Option 1: Démo Instantanée
```bash
cd stable_diffusion_webapp
./launch_demo.sh
# Puis utiliser ngrok pour exposer en ligne
```

### Option 2: Railway (1-click deploy)
1. Fork le repository sur GitHub
2. Connecter à Railway
3. Déployer automatiquement

### Option 3: Heroku
```bash
git clone [votre-repo]
cd stable_diffusion_webapp
heroku create votre-app
git push heroku main
```

---

**💡 Conseil**: Commencez par la démonstration locale avec ngrok, puis migrez vers une solution cloud selon vos besoins.