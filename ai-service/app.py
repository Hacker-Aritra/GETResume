"""
app.py
------
Python (Flask) micro-service that powers the AI features of the resume builder.
The PHP backend (backend/api/ai_generate.php) calls this over HTTP.

Run it separately from XAMPP:
    cd ai-service
    pip install -r requirements.txt
    python app.py

It listens on http://127.0.0.1:5000
"""

from flask import Flask, request, jsonify
from flask_cors import CORS

import ai_engine

app = Flask(__name__)
CORS(app)  # allow the PHP backend / browser to call this service


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "resume-ai-engine"})


@app.route("/summary", methods=["POST"])
def summary():
    payload = request.get_json(force=True) or {}
    return jsonify(ai_engine.generate_summary(payload))


@app.route("/bullet", methods=["POST"])
def bullet():
    payload = request.get_json(force=True) or {}
    return jsonify(ai_engine.generate_bullet(payload))


@app.route("/skills", methods=["POST"])
def skills():
    payload = request.get_json(force=True) or {}
    return jsonify(ai_engine.generate_skills(payload))


@app.route("/cover_letter", methods=["POST"])
def cover_letter():
    payload = request.get_json(force=True) or {}
    return jsonify(ai_engine.generate_cover_letter(payload))


@app.route("/ats_score", methods=["POST"])
def ats_score():
    payload = request.get_json(force=True) or {}
    return jsonify(ai_engine.compute_ats_score(payload))


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
