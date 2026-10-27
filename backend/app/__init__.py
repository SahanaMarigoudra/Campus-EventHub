# Flask application package initializer
import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()


def create_app(config_object=None):
    app = Flask(__name__)

    # Load configuration
    if config_object is None:
        from config import get_config
        app.config.from_object(get_config())
    else:
        app.config.from_object(config_object)

    # Ensure instance directory exists
    try:
        os.makedirs(app.instance_path, exist_ok=True)
    except OSError:
        pass

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    CORS(
        app,
        resources={r"/api/*": {"origins": "*"}},
        supports_credentials=False,
    )

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.departments import departments_bp
    from app.routes.categories import categories_bp
    from app.routes.events import events_bp
    from app.routes.registrations import registrations_bp
    from app.routes.attendance import attendance_bp
    from app.routes.certificates import certificates_bp
    from app.routes.notifications import notifications_bp
    from app.routes.calendar import calendar_bp
    from app.routes.feedback_results import feedback_results_bp
    from app.routes.bookmarks import bookmarks_bp
    from app.routes.dashboard import dashboard_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(departments_bp, url_prefix="/api/departments")
    app.register_blueprint(categories_bp, url_prefix="/api/categories")
    app.register_blueprint(events_bp, url_prefix="/api/events")
    app.register_blueprint(registrations_bp, url_prefix="/api")
    app.register_blueprint(attendance_bp, url_prefix="/api")
    app.register_blueprint(certificates_bp, url_prefix="/api")
    app.register_blueprint(notifications_bp, url_prefix="/api")
    app.register_blueprint(calendar_bp, url_prefix="/api/calendar")
    app.register_blueprint(feedback_results_bp, url_prefix="/api")
    app.register_blueprint(bookmarks_bp, url_prefix="/api")
    app.register_blueprint(dashboard_bp, url_prefix="/api")

    # Health check
    @app.route("/api/health")
    def health():
        return {
            "status": "ok",
            "message": "Institution-Wide College Event Management API is running",
            "institution": "Apex Institute of Science & Technology",
        }, 200

    # Security Headers for production hardening
    @app.after_request
    def set_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

    # Standard JSON error responses
    @app.errorhandler(404)
    def handle_not_found(e):
        return {"success": False, "error": "Not Found", "message": "The requested endpoint was not found"}, 404

    @app.errorhandler(500)
    def handle_internal_error(e):
        return {"success": False, "error": "Internal Server Error", "message": "An unexpected error occurred"}, 500

    # Ensure instance folder exists
    os.makedirs(os.path.join(app.root_path, "..", "instance"), exist_ok=True)

    return app


# Default application instance for WSGI servers running 'gunicorn app:app'
app = create_app()
