# Utiliser une image Python officielle avec CUDA support
FROM python:3.10-slim

# Définir les variables d'environnement
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

# Créer un utilisateur non-root
RUN useradd --create-home --shell /bin/bash app

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libglib2.0-0 \
    wget \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de requirements
COPY requirements.txt .

# Mettre à jour pip et installer les dépendances Python
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code de l'application
COPY . .

# Créer les dossiers nécessaires
RUN mkdir -p generated_images templates static/css static/js

# Changer la propriété des fichiers à l'utilisateur app
RUN chown -R app:app /app

# Basculer vers l'utilisateur non-root
USER app

# Exposer le port
EXPOSE 5000

# Définir les variables d'environnement pour Flask
ENV FLASK_APP=app.py
ENV FLASK_ENV=production

# Commande de santé
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5000/api/status || exit 1

# Commande par défaut
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "1", "--threads", "2", "--timeout", "120", "app:app"]