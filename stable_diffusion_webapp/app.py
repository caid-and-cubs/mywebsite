import os
import uuid
import torch
from flask import Flask, request, jsonify, render_template, send_file
from flask_cors import CORS
from diffusers import StableDiffusionPipeline
import logging
from PIL import Image
import io
import base64

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
GENERATED_IMAGES_DIR = "generated_images"

# Variables globales pour le modèle
pipe = None
device = None

def initialize_model():
    """Initialise le modèle Stable Diffusion"""
    global pipe, device
    try:
        # Détection du device
        if torch.cuda.is_available():
            device = "cuda"
            logger.info("GPU CUDA détecté")
        else:
            device = "cpu"
            logger.info("Utilisation du CPU")
        
        # Chargement du modèle
        model_id = "CompVis/stable-diffusion-v1-4"
        logger.info(f"Chargement du modèle {model_id}...")
        
        if device == "cuda":
            pipe = StableDiffusionPipeline.from_pretrained(
                model_id, 
                torch_dtype=torch.float16,
                safety_checker=None,
                requires_safety_checker=False
            )
        else:
            pipe = StableDiffusionPipeline.from_pretrained(
                model_id,
                safety_checker=None,
                requires_safety_checker=False
            )
        
        pipe = pipe.to(device)
        pipe.enable_attention_slicing()  # Optimisation mémoire
        
        logger.info("Modèle chargé avec succès!")
        return True
        
    except Exception as e:
        logger.error(f"Erreur lors du chargement du modèle: {str(e)}")
        return False

@app.route('/')
def index():
    """Page d'accueil"""
    return render_template('index.html')

@app.route('/api/generate', methods=['POST'])
def generate_image():
    """API endpoint pour générer une image"""
    try:
        data = request.get_json()
        
        if not data or 'prompt' not in data:
            return jsonify({'error': 'Prompt requis'}), 400
        
        prompt = data['prompt'].strip()
        if not prompt:
            return jsonify({'error': 'Prompt ne peut pas être vide'}), 400
        
        # Paramètres optionnels
        num_inference_steps = data.get('steps', 20)
        guidance_scale = data.get('guidance_scale', 7.5)
        width = data.get('width', 512)
        height = data.get('height', 512)
        
        logger.info(f"Génération d'image pour: '{prompt}'")
        
        # Génération de l'image
        if pipe is None:
            return jsonify({'error': 'Modèle non initialisé'}), 500
        
        with torch.autocast(device):
            image = pipe(
                prompt,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                width=width,
                height=height
            ).images[0]
        
        # Sauvegarde de l'image
        filename = f"{uuid.uuid4().hex}.png"
        filepath = os.path.join(GENERATED_IMAGES_DIR, filename)
        image.save(filepath)
        
        # Conversion en base64 pour l'affichage
        img_buffer = io.BytesIO()
        image.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
        
        logger.info(f"Image générée: {filename}")
        
        return jsonify({
            'success': True,
            'filename': filename,
            'image_data': f"data:image/png;base64,{img_base64}",
            'prompt': prompt
        })
        
    except Exception as e:
        logger.error(f"Erreur lors de la génération: {str(e)}")
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
        'model_loaded': pipe is not None,
        'device': device
    })

if __name__ == '__main__':
    # Créer le dossier pour les images générées
    os.makedirs(GENERATED_IMAGES_DIR, exist_ok=True)
    
    # Initialiser le modèle
    if initialize_model():
        logger.info("Démarrage du serveur Flask...")
        app.run(host='0.0.0.0', port=5000, debug=False)
    else:
        logger.error("Impossible de démarrer l'application - échec du chargement du modèle")