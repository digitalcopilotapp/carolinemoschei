import jwt
import re
from datetime import datetime, timedelta
from flask import current_app


def generate_token(email, live_id):
    """Gera JWT para acesso ao player (48h)."""
    payload = {
        'email': email,
        'live_id': live_id,
        'exp': datetime.utcnow() + timedelta(hours=48)
    }
    return jwt.encode(payload, current_app.config['JWT_SECRET'], algorithm='HS256')


def verify_token(token):
    """Verifica JWT. Retorna payload ou None."""
    try:
        return jwt.decode(token, current_app.config['JWT_SECRET'], algorithms=['HS256'])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def slugify(text):
    """Converte texto para slug URL-safe."""
    text = text.lower().strip()
    text = re.sub(r'[àáâãäå]', 'a', text)
    text = re.sub(r'[èéêë]', 'e', text)
    text = re.sub(r'[ìíîï]', 'i', text)
    text = re.sub(r'[òóôõö]', 'o', text)
    text = re.sub(r'[ùúûü]', 'u', text)
    text = re.sub(r'[ç]', 'c', text)
    text = re.sub(r'[^a-z0-9]+', '-', text)
    text = text.strip('-')
    return text


def extract_youtube_id(url):
    """Extrai o ID do video de uma URL do YouTube."""
    patterns = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})',
        r'^([a-zA-Z0-9_-]{11})$'  # ID direto
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return url  # retorna como esta se nao encontrar padrao
