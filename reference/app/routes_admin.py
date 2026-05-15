import csv
import io
from flask import Blueprint, render_template, request, redirect, url_for, flash, Response
from flask_login import login_required
from .models import db, Live, Comment, Lead
from .utils import slugify, extract_youtube_id

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/')
@login_required
def dashboard():
    total_leads = Lead.query.count()
    total_lives = Live.query.filter_by(is_active=True).count()
    recent_leads = Lead.query.order_by(Lead.created_at.desc()).limit(10).all()
    lives = Live.query.order_by(Live.sort_order, Live.created_at.desc()).all()
    return render_template('admin/dashboard.html',
                           total_leads=total_leads,
                           total_lives=total_lives,
                           recent_leads=recent_leads,
                           lives=lives)


@admin_bp.route('/lives/new', methods=['GET', 'POST'])
@login_required
def live_new():
    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        youtube_url = request.form.get('youtube_url', '').strip()
        description = request.form.get('description', '').strip()
        offer_min = int(request.form.get('offer_min', 45))
        offer_sec = int(request.form.get('offer_sec', 0))

        if not title or not youtube_url:
            flash('Titulo e URL do YouTube sao obrigatorios', 'error')
            return render_template('admin/live-form.html', live=None)

        yt_id = extract_youtube_id(youtube_url)
        slug = slugify(title)
        # Garantir slug unico
        base_slug = slug
        counter = 1
        while Live.query.filter_by(slug=slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1

        live = Live(
            title=title,
            slug=slug,
            description=description,
            youtube_id=yt_id,
            thumbnail_url=f"https://img.youtube.com/vi/{yt_id}/maxresdefault.jpg",
            offer_timestamp=offer_min * 60 + offer_sec
        )
        db.session.add(live)
        db.session.commit()
        flash(f'Live "{title}" criada com sucesso!', 'success')
        return redirect(url_for('admin.dashboard'))

    return render_template('admin/live-form.html', live=None)


@admin_bp.route('/lives/<int:live_id>/edit', methods=['GET', 'POST'])
@login_required
def live_edit(live_id):
    live = Live.query.get_or_404(live_id)
    if request.method == 'POST':
        live.title = request.form.get('title', '').strip()
        live.youtube_id = extract_youtube_id(request.form.get('youtube_url', '').strip())
        live.description = request.form.get('description', '').strip()
        offer_min = int(request.form.get('offer_min', 45))
        offer_sec = int(request.form.get('offer_sec', 0))
        live.offer_timestamp = offer_min * 60 + offer_sec
        live.thumbnail_url = f"https://img.youtube.com/vi/{live.youtube_id}/maxresdefault.jpg"
        live.is_active = 'is_active' in request.form
        db.session.commit()
        flash('Live atualizada!', 'success')
        return redirect(url_for('admin.dashboard'))

    return render_template('admin/live-form.html', live=live)


@admin_bp.route('/lives/<int:live_id>/delete', methods=['POST'])
@login_required
def live_delete(live_id):
    live = Live.query.get_or_404(live_id)
    db.session.delete(live)
    db.session.commit()
    flash('Live removida', 'success')
    return redirect(url_for('admin.dashboard'))


@admin_bp.route('/lives/<int:live_id>/toggle', methods=['POST'])
@login_required
def live_toggle(live_id):
    live = Live.query.get_or_404(live_id)
    live.is_active = not live.is_active
    db.session.commit()
    return redirect(url_for('admin.dashboard'))


# --- COMMENTS ---

@admin_bp.route('/lives/<int:live_id>/comments', methods=['GET', 'POST'])
@login_required
def comments(live_id):
    live = Live.query.get_or_404(live_id)
    if request.method == 'POST':
        author = request.form.get('author_name', '').strip()
        message = request.form.get('message', '').strip()
        ts_min = int(request.form.get('ts_min', 0))
        ts_sec = int(request.form.get('ts_sec', 0))
        if author and message:
            c = Comment(live_id=live.id, author_name=author, message=message,
                        timestamp=ts_min * 60 + ts_sec)
            db.session.add(c)
            db.session.commit()
            flash('Comentario adicionado', 'success')
        return redirect(url_for('admin.comments', live_id=live.id))

    all_comments = Comment.query.filter_by(live_id=live.id).order_by(Comment.timestamp).all()
    return render_template('admin/comments.html', live=live, comments=all_comments)


@admin_bp.route('/comments/<int:comment_id>/delete', methods=['POST'])
@login_required
def comment_delete(comment_id):
    c = Comment.query.get_or_404(comment_id)
    live_id = c.live_id
    db.session.delete(c)
    db.session.commit()
    return redirect(url_for('admin.comments', live_id=live_id))


@admin_bp.route('/lives/<int:live_id>/comments/import', methods=['POST'])
@login_required
def comments_import(live_id):
    """Importa comentarios de CSV (formato: timestamp_seg,autor,mensagem)."""
    live = Live.query.get_or_404(live_id)
    file = request.files.get('csv_file')
    if not file:
        flash('Nenhum arquivo enviado', 'error')
        return redirect(url_for('admin.comments', live_id=live.id))

    content = file.read().decode('utf-8-sig')
    reader = csv.reader(io.StringIO(content))
    count = 0
    for row in reader:
        if len(row) >= 3:
            try:
                ts = int(row[0])
                author = row[1].strip()
                msg = row[2].strip()
                if author and msg:
                    db.session.add(Comment(live_id=live.id, author_name=author,
                                          message=msg, timestamp=ts))
                    count += 1
            except (ValueError, IndexError):
                continue
    db.session.commit()
    flash(f'{count} comentarios importados', 'success')
    return redirect(url_for('admin.comments', live_id=live.id))


# --- LEADS ---

@admin_bp.route('/leads')
@login_required
def leads():
    live_filter = request.args.get('live_id', type=int)
    query = Lead.query.order_by(Lead.created_at.desc())
    if live_filter:
        query = query.filter_by(live_id=live_filter)
    all_leads = query.all()
    lives = Live.query.order_by(Live.title).all()
    return render_template('admin/leads.html', leads=all_leads, lives=lives,
                           current_filter=live_filter)


@admin_bp.route('/leads/export')
@login_required
def leads_export():
    live_filter = request.args.get('live_id', type=int)
    query = Lead.query.order_by(Lead.created_at.desc())
    if live_filter:
        query = query.filter_by(live_id=live_filter)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Nome', 'Email', 'Telefone', 'Live', 'Data'])
    for lead in query.all():
        writer.writerow([
            lead.name, lead.email, lead.phone,
            lead.live.title if lead.live else '',
            lead.created_at.strftime('%d/%m/%Y %H:%M')
        ])

    return Response(output.getvalue(),
                    mimetype='text/csv',
                    headers={'Content-Disposition': 'attachment; filename=leads.csv'})
