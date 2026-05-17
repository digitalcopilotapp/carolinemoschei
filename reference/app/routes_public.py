from flask import Blueprint, render_template, redirect, url_for, request, abort
from .models import Live, Comment
from .utils import verify_token

public_bp = Blueprint('public', __name__)


@public_bp.route('/lives')
def lives_list():
    lives = Live.query.filter_by(is_active=True).order_by(Live.sort_order, Live.created_at.desc()).all()
    return render_template('public/lives.html', lives=lives)


@public_bp.route('/watch/<slug>')
def watch(slug):
    token = request.args.get('token')
    if not token:
        return redirect(url_for('public.lives_list'))

    payload = verify_token(token)
    if not payload:
        return redirect(url_for('public.lives_list'))

    live = Live.query.filter_by(slug=slug, is_active=True).first_or_404()
    comments = Comment.query.filter_by(live_id=live.id, is_visible=True)\
        .order_by(Comment.timestamp).all()

    comments_data = [{'author': c.author_name, 'message': c.message, 'timestamp': c.timestamp}
                     for c in comments]

    return render_template('public/watch.html', live=live, comments=comments_data)
