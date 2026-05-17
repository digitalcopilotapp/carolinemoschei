from flask import Blueprint, request, jsonify
from .models import db, Live, Lead
from .utils import generate_token

api_bp = Blueprint('api', __name__)


@api_bp.route('/leads', methods=['POST'])
def submit_lead():
    data = request.get_json(silent=True) or request.form
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip()
    phone = (data.get('phone') or '').strip()
    try:
        live_id = int(data.get('live_id', 0))
    except (TypeError, ValueError):
        live_id = 0

    if not name or not email:
        return jsonify({'error': 'Nome e email sao obrigatorios'}), 400

    live = Live.query.get(live_id)
    if not live:
        return jsonify({'error': 'Live nao encontrada'}), 404

    # Verificar se ja existe
    existing = Lead.query.filter_by(email=email, live_id=live_id).first()
    if existing:
        # Ja cadastrado, gera token direto
        token = generate_token(email, live_id)
        return jsonify({'token': token, 'redirect': f'/watch/{live.slug}?token={token}'})

    lead = Lead(
        name=name,
        email=email,
        phone=phone,
        live_id=live_id,
        ip_address=request.remote_addr
    )
    db.session.add(lead)
    db.session.commit()

    token = generate_token(email, live_id)
    return jsonify({'token': token, 'redirect': f'/watch/{live.slug}?token={token}'})
