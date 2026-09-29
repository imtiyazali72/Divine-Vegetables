import os
import sys

# Set current backend folder to python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

try:
    import uvicorn
    from app.main import app
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("Installing requirements automatically...")
    os.system(f'"{sys.executable}" -m pip install fastapi uvicorn pydantic pydantic-settings sqlalchemy reportlab pyjwt python-multipart jinja2')
    import uvicorn
    from app.main import app

if __name__ == "__main__":
    print("🚀 Starting Divine Vegetables Backend Server...")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
