#!/usr/bin/env python3
"""
Script de démonstration pour tester l'application Stable Diffusion
Sans nécessiter de GPU ou de modèle lourd - génère des images de test
"""

import os
import uuid
import base64
from flask import Flask, request, jsonify, render_template, send_file
from flask_cors import CORS
from PIL import Image, ImageDraw, ImageFont
import io
import random
import logging

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
GENERATED_IMAGES_DIR = "generated_images"

def generate_demo_image(prompt, width=512, height=512):
    """Génère une image de démonstration avec le prompt"""
    
    # Créer une image avec un fond coloré aléatoire
    colors = [
        (135, 206, 235),  # Sky blue
        (255, 182, 193),  # Light pink
        (152, 251, 152),  # Pale green
        (255, 218, 185),  # Peach
        (221, 160, 221),  # Plum
        (255, 228, 181),  # Moccasin
    ]
    
    bg_color = random.choice(colors)
    image = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(image)
    
    # Ajouter un gradient simple
    for y in range(height):
        alpha = y / height
        new_color = tuple(int(c * (1 - alpha * 0.3)) for c in bg_color)
        draw.line([(0, y), (width, y)], fill=new_color)
    
    # Ajouter des formes géométriques
    for _ in range(random.randint(3, 8)):
        shape_type = random.choice(['circle', 'rectangle'])
        x1, y1 = random.randint(0, width//2), random.randint(0, height//2)
        x2, y2 = x1 + random.randint(50, 150), y1 + random.randint(50, 150)
        
        color = tuple(random.randint(50, 255) for _ in range(3))
        
        if shape_type == 'circle':
            draw.ellipse([x1, y1, x2, y2], fill=color, outline=(0, 0, 0), width=2)
        else:
            draw.rectangle([x1, y1, x2, y2], fill=color, outline=(0, 0, 0), width=2)
    
    # Ajouter le texte du prompt
    try:
        # Essayer d'utiliser une police par défaut
        font_size = max(16, min(32, width // 20))
        font = ImageFont.load_default()
    except:
        font = None
    
    # Diviser le prompt en lignes
    words = prompt.split()
    lines = []
    current_line = []
    max_chars_per_line = width // 12
    
    for word in words:
        if len(' '.join(current_line + [word])) <= max_chars_per_line:
            current_line.append(word)
        else:
            if current_line:
                lines.append(' '.join(current_line))
            current_line = [word]
    
    if current_line:
        lines.append(' '.join(current_line))
    
    # Centrer le texte
    y_offset = height // 2 - (len(lines) * 20) // 2
    
    for i, line in enumerate(lines):
        # Calculer la position pour centrer le texte
        bbox = draw.textbbox((0, 0), line, font=font)
        text_width = bbox[2] - bbox[0]
        x = (width - text_width) // 2
        y = y_offset + i * 25
        
        # Ajouter une ombre au texte
        draw.text((x + 2, y + 2), line, fill=(0, 0, 0), font=font)
        draw.text((x, y), line, fill=(255, 255, 255), font=font)
    
    # Ajouter un watermark "DEMO"
    demo_font = font
    demo_text = "DEMO - AI Generated"
    bbox = draw.textbbox((0, 0), demo_text, font=demo_font)
    demo_width = bbox[2] - bbox[0]
    draw.text((width - demo_width - 10, height - 30), demo_text, 
              fill=(128, 128, 128), font=demo_font)
    
    return image

@app.route('/')
def index():
    """Page d'accueil"""
    return render_template('index.html')

@app.route('/api/generate', methods=['POST'])
def generate_image():
    """API endpoint pour générer une image de démonstration"""
    try:
        data = request.get_json()
        
        if not data or 'prompt' not in data:
            return jsonify({'error': 'Prompt requis'}), 400
        
        prompt = data['prompt'].strip()
        if not prompt:
            return jsonify({'error': 'Prompt ne peut pas être vide'}), 400
        
        # Paramètres
        width = data.get('width', 512)
        height = data.get('height', 512)
        
        logger.info(f"Génération d'image DEMO pour: '{prompt}'")
        
        # Simuler un délai de génération
        import time
        time.sleep(random.uniform(2, 5))
        
        # Générer l'image de démonstration
        image = generate_demo_image(prompt, width, height)
        
        # Sauvegarder l'image
        filename = f"demo_{uuid.uuid4().hex}.png"
        filepath = os.path.join(GENERATED_IMAGES_DIR, filename)
        image.save(filepath)
        
        # Conversion en base64
        img_buffer = io.BytesIO()
        image.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
        
        logger.info(f"Image DEMO générée: {filename}")
        
        return jsonify({
            'success': True,
            'filename': filename,
            'image_data': f"data:image/png;base64,{img_base64}",
            'prompt': prompt
        })
        
    except Exception as e:
        logger.error(f"Erreur lors de la génération DEMO: {str(e)}")
        return jsonify({'error': f'Erreur lors de la génération: {str(e)}'}), 500

@app.route('/api/download/<filename>')
def download_image(filename):
    """Télécharger une image générée"""
    try:
        filepath = os.path.join(GENERATED_IMAGES_DIR, filename)
        if os.path.exists(filepath):
            return send_file(filepath, as_attachment=True)
        else:
            return jsonify({'error': 'Image non trouvée'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/status')
def status():
    """Vérifier le statut de l'application"""
    return jsonify({
        'status': 'running',
        'model_loaded': True,
        'device': 'demo',
        'demo_mode': True
    })

if __name__ == '__main__':
    # Créer le dossier pour les images générées
    os.makedirs(GENERATED_IMAGES_DIR, exist_ok=True)
    
    logger.info("🎨 Démarrage du serveur DEMO Stable Diffusion...")
    logger.info("📝 Mode démonstration - génère des images de test")
    logger.info("🌐 Accès: http://localhost:5000")
    
    app.run(host='0.0.0.0', port=5000, debug=True)