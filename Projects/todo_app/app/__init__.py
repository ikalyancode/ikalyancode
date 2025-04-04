import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def create_app():
    # Force a specific absolute path for templates
    templates_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../templates')
    print("Explicit templates path:", templates_path)  # Debugging output
    app = Flask(__name__, template_folder=templates_path)

    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///todo.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    # Import and register blueprints
    from app.routes import main
    app.register_blueprint(main)

    # Ensure database tables are created
    with app.app_context():
        db.create_all()

    return app
