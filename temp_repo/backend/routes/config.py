from flask import Blueprint, jsonify

config_api = Blueprint("config", __name__)


@config_api.get("/api/health")
def health():
    return jsonify(status="ok", service="doodle-jump-flask", version="0.0.1")


@config_api.get("/api/config")
def config():
    return jsonify(
        rules_version="v1",
        finish_height=3000,
        max_duration_ms=180000,
        skins=[{"id": "doodle", "name": "Doodle mặc định"}],
        bots=[
            {"id": "teacher-1", "name": "Ghost 1", "base_speed": 44},
            {"id": "teacher-2", "name": "Ghost 2", "base_speed": 48},
            {"id": "teacher-3", "name": "Ghost 3", "base_speed": 41},
            {"id": "teacher-4", "name": "Ghost 4", "base_speed": 46},
        ],
    )
