"""WSGI entrypoint for Gunicorn / uWSGI / Render / PythonAnywhere."""
from app import app

if __name__ == "__main__":
    app.run()
