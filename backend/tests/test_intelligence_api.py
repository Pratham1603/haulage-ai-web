"""Integration tests for intelligence API endpoints in FastAPI server."""

import pytest
from fastapi.testclient import TestClient

try:
    from backend import server
    from backend.server import _create_access_token, app
except ImportError:
    import server
    from server import _create_access_token, app



@pytest.fixture
def auth_headers():
    token = _create_access_token({"id": "test-user-1", "email": "dispatcher@example.com", "role": "dispatcher"})
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


@pytest.fixture
def client():
    return TestClient(app)


def test_delay_prediction_endpoint(client, auth_headers):
    payload = {
        "shipment": {
            "origin": "BHIWANDI",
            "destination": "NARELA",
            "route_key": "BHIWANDI->NARELA",
            "vehicle_type": "32ft",
            "weight_kg": 12500,
            "pallets": 18,
            "trip_distance_km": 360,
            "carrier_historical_on_time_rate": 0.92,
        }
    }
    res = client.post("/api/intelligence/delay-prediction", json=payload, headers=auth_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert "prediction" in data
    assert "predicted_probability" in data["prediction"]
    assert data["prediction"]["risk_category"] in {"low", "medium", "high"}
    assert "live_weather" in data["prediction"]
    assert "temperature_c" in data["prediction"]["live_weather"]
    assert "feature_attributions" in data["prediction"]
    assert len(data["prediction"]["feature_attributions"]) >= 4
    assert "evaluation" in data
    assert "f1" in data["evaluation"]



def test_cost_estimate_endpoint(client, auth_headers):
    payload = {
        "shipment": {
            "route_key": "BHIWANDI->NARELA",
            "vehicle_type": "32ft",
            "weight_kg": 13000,
            "pallets": 18,
            "trip_distance_km": 360,
        },
        "quote": {"rate": 74500},
    }
    res = client.post("/api/intelligence/cost-estimate", json=payload, headers=auth_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["predicted_trip_cost"] > 0
    assert "expected_revenue" in data
    assert "expected_profit" in data
    assert "margin_percent" in data


def test_optimization_endpoint(client, auth_headers):
    payload = {
        "loads": [
            {"id": "LD-A", "weight_kg": 12000, "pallets": 18, "vehicle_type": "32ft", "risk_score": 0.35},
            {"id": "LD-B", "weight_kg": 7500, "pallets": 12, "vehicle_type": "24ft", "risk_score": 0.20},
        ],
        "vehicles": [
            {"vehicle_id": "V-1", "vehicle_type": "32ft", "available_payload_kg": 14000, "available_pallets": 20, "quoted_rate": 72000, "available": True},
            {"vehicle_id": "V-2", "vehicle_type": "24ft", "available_payload_kg": 8500, "available_pallets": 14, "quoted_rate": 48000, "available": True},
        ],
    }
    res = client.post("/api/intelligence/optimization", json=payload, headers=auth_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["assigned_orders"] == 2
    assert len(data["feasible_assignments"]) == 2
    assert data["estimated_total_cost"] == 120000.0
    assert data["solver"] in {"ortools_cp_sat", "greedy_fallback"}


def test_analytics_endpoint(client, auth_headers):
    res = client.get("/api/intelligence/analytics", headers=auth_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert "kpis" in data
    assert "total_shipments" in data
    assert "carrier_performance" in data
    assert "high_risk_shipments" in data
    assert "green_logistics" in data
    assert data["green_logistics"]["co2_saved_kg"] > 0
    assert data["green_logistics"]["diesel_saved_litres"] > 0
    assert "esg_score" in data["green_logistics"]


def test_models_evaluation_endpoint(client, auth_headers):
    res = client.get("/api/intelligence/models/evaluation", headers=auth_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert "delay_classification_benchmark" in data
    assert "cost_regression_benchmark" in data
    assert "optimization_benchmark" in data


def test_voice_negotiation_copilot_endpoint(client, auth_headers):
    payload = {
        "load_id": "LD-TEST-COPILOT",
        "origin": "Mumbai",
        "destination": "Delhi",
        "trip_distance_km": 1420.0,
        "weight_kg": 14000.0,
        "customer_revenue": 95000.0,
        "carrier_ask_rate": 81000.0,
    }
    res = client.post("/api/voice/negotiation-copilot", json=payload, headers=auth_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["ml_fair_cost"] > 0
    assert data["decision_verdict"] in {"APPROVE_RATE", "COUNTER_OFFER", "ESCALATE_OR_REJECT"}
    assert "scripts" in data
    assert "en" in data["scripts"]


def test_optimization_with_sensitivity_weights(client, auth_headers):
    payload = {
        "loads": [
            {"id": "LD-1", "weight_kg": 12000, "pallets": 18, "vehicle_type": "32ft", "risk_score": 0.50},
        ],
        "vehicles": [
            {"vehicle_id": "V-CHEAP", "vehicle_type": "32ft", "available_payload_kg": 14000, "available_pallets": 20, "quoted_rate": 65000, "carrier_historical_on_time_rate": 0.70, "available": True},
            {"vehicle_id": "V-RELIABLE", "vehicle_type": "32ft", "available_payload_kg": 14000, "available_pallets": 20, "quoted_rate": 70000, "carrier_historical_on_time_rate": 0.98, "available": True},
        ],
        "weights": {
            "cost_weight": 0.5,
            "risk_weight": 2.0,
            "reliability_weight": 2.0,
            "utilization_weight": 1.0,
        },
    }
    res = client.post("/api/intelligence/optimization", json=payload, headers=auth_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["assigned_orders"] == 1
    assert "sensitivity_weights" in data
    assert data["sensitivity_weights"]["reliability_weight"] == 2.0


def test_ltl_consolidation_endpoint(client, auth_headers):
    payload = {
        "loads": [
            {"id": "LD-A", "origin": "Bhiwandi", "destination": "Delhi", "weight_kg": 5000, "pallets": 8, "route_distance_km": 400},
            {"id": "LD-B", "origin": "Mumbai", "destination": "Narela", "weight_kg": 6000, "pallets": 10, "route_distance_km": 420},
        ],
        "vehicles": [
            {"vehicle_id": "V-32MXL", "vehicle_type": "32ft Multi-Axle", "available_payload_kg": 16000, "available_pallets": 24, "quoted_rate": 70000, "available": True},
        ],
    }
    res = client.post("/api/intelligence/ltl-consolidation", json=payload, headers=auth_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert "proposals" in data
    assert len(data["proposals"]) >= 1
    proposal = data["proposals"][0]
    assert proposal["capacity_utilization_pct"] > 0
    assert proposal["net_savings"] > 0
    assert proposal["co2_saved_kg"] > 0
    assert "deck_breakdown" in proposal


def test_exception_mitigation_playbooks(client, auth_headers):
    # Test voice check-in
    res1 = client.post(
        "/api/operations/exceptions/mitigate",
        json={"order_id": "ORD-1042", "playbook": "voice_checkin"},
        headers=auth_headers,
    )
    assert res1.status_code == 200, res1.text
    assert res1.json()["mitigation"]["playbook"] == "voice_checkin"
    assert res1.json()["mitigation"]["status"] == "executed"

    # Test reassign priority
    res2 = client.post(
        "/api/operations/exceptions/mitigate",
        json={"order_id": "ORD-1042", "playbook": "reassign_priority"},
        headers=auth_headers,
    )
    assert res2.status_code == 200, res2.text
    assert res2.json()["mitigation"]["playbook"] == "reassign_priority"

    # Test customer advisory
    res3 = client.post(
        "/api/operations/exceptions/mitigate",
        json={"order_id": "ORD-1042", "playbook": "customer_advisory"},
        headers=auth_headers,
    )
    assert res3.status_code == 200, res3.text
    assert res3.json()["mitigation"]["playbook"] == "customer_advisory"


