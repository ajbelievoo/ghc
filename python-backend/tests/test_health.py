from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_marketplace_gpu_unauthenticated():
    response = client.get("/marketplace/gpu")
    assert response.status_code == 401
