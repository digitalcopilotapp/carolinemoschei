import os
from flask import Flask, send_from_directory
from flask_login import LoginManager
from .config import Config, BASE_DIR
from .models import db, AdminUser


login_manager = LoginManager()
login_manager.login_view = 'auth.login'


@login_manager.user_loader
def load_user(user_id):
    return AdminUser.query.get(int(user_id))


def create_app():
    app = Flask(__name__,
                static_folder=os.path.join(BASE_DIR, 'static'),
                template_folder=os.path.join(BASE_DIR, 'templates'))
    app.config.from_object(Config)

    db.init_app(app)
    login_manager.init_app(app)

    # Criar tabelas e seed admin
    with app.app_context():
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        db.create_all()
        _seed_admin(app)

    # Blueprints
    from .auth import auth_bp
    from .routes_admin import admin_bp
    from .routes_public import public_bp
    from .routes_api import api_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(public_bp)
    app.register_blueprint(api_bp, url_prefix='/api')

    # Servir site estatico existente (so se o arquivo existir no disco)
    site_dir = os.path.join(BASE_DIR, 'site')

    @app.route('/')
    def index():
        return send_from_directory(site_dir, 'index.html')

    @app.route('/<path:filename>')
    def static_site(filename):
        filepath = os.path.join(site_dir, filename)
        if os.path.isfile(filepath):
            return send_from_directory(site_dir, filename)
        from flask import abort
        abort(404)

    return app


def _seed_admin(app):
    """Cria usuario admin se nao existir."""
    import bcrypt
    if AdminUser.query.first() is None:
        pw = app.config['ADMIN_PASSWORD'].encode('utf-8')
        hashed = bcrypt.hashpw(pw, bcrypt.gensalt()).decode('utf-8')
        admin = AdminUser(
            username=app.config['ADMIN_USERNAME'],
            password_hash=hashed
        )
        db.session.add(admin)
        db.session.commit()
