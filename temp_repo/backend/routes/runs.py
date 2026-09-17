"""Nguyễn Đăng Đạt: triển khai theo docs/API.md; hiện trả 501 rõ ràng."""
from flask import Blueprint, jsonify

runs_api = Blueprint("runs", __name__)


def not_implemented():
    return jsonify(error={
        "code": "not_implemented",
        "message": "V0.0 chưa triển khai lưu kết quả. Xem nhiệm vụ BE-01 trong docs/FIRST_TASKS.md.",
        "details": {},
    }), 501


@runs_api.route("/api/runs", methods=["GET", "POST"])
def runs():
    return not_implemented()


@runs_api.get("/api/runs/<run_id>")
def run_detail(run_id):
    return not_implemented()


@runs_api.get("/api/leaderboard")
def leaderboard():
    return not_implemented()
