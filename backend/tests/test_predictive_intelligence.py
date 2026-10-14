from backend.intelligence import (
    build_analytics_summary,
    estimate_trip_cost,
    generate_synthetic_history,
    optimize_allocation,
    score_delay_predictions,
    train_delay_model,
)


def test_generate_synthetic_history_produces_labeled_records():
    history = generate_synthetic_history(n=120, seed=7)
    assert len(history) == 120
    assert set(["is_late", "synthetic", "route_key", "carrier_id"]).issubset(history[0].keys())


def test_delay_pipeline_returns_metrics_and_risk_category():
    history = generate_synthetic_history(n=220, seed=11)
    model = train_delay_model(history)
    metrics = score_delay_predictions(model, history)
    assert metrics["precision"] >= 0.0
    assert metrics["recall"] >= 0.0
    assert metrics["f1"] >= 0.0
    assert metrics["roc_auc"] >= 0.0
    prediction = model.predict_one({
        "route_key": "BHIWANDI->NARELA",
        "vehicle_type": "32ft",
        "weight_kg": 12000,
        "pallets": 18,
        "pickup_hour": 8,
        "day_of_week": 2,
        "carrier_historical_on_time_rate": 0.92,
        "trip_distance_km": 340,
    })
    assert prediction["risk_category"] in {"low", "medium", "high"}


def test_trip_cost_estimation_has_profit_metrics():
    estimate = estimate_trip_cost({
        "route_key": "BHIWANDI->NARELA",
        "vehicle_type": "32ft",
        "weight_kg": 12000,
        "pallets": 18,
        "trip_distance_km": 340,
        "fuel_cost": 14000,
        "toll_cost": 2200,
        "expected_revenue": 88000,
    })
    assert estimate["predicted_trip_cost"] > 0
    assert estimate["expected_profit"] > -estimate["predicted_trip_cost"]
    assert estimate["margin_percent"] >= -100


def test_optimizer_finds_feasible_assignments():
    loads = [
        {"id": "LD-201", "weight_kg": 12000, "pallets": 18, "vehicle_type": "32ft", "pickup_start": "2025-01-02T08:00:00+00:00"},
        {"id": "LD-202", "weight_kg": 7000, "pallets": 12, "vehicle_type": "24ft", "pickup_start": "2025-01-02T09:00:00+00:00"},
    ]
    vehicles = [
        {"vehicle_id": "V1", "vehicle_type": "32ft", "available_payload_kg": 16000, "available_pallets": 22, "available": True, "available_at": "2025-01-02T07:00:00+00:00", "quoted_rate": 72000},
        {"vehicle_id": "V2", "vehicle_type": "24ft", "available_payload_kg": 9000, "available_pallets": 16, "available": True, "available_at": "2025-01-02T08:30:00+00:00", "quoted_rate": 50000},
    ]
    result = optimize_allocation(loads, vehicles)
    assert result["assigned_orders"] >= 1
    assert result["feasible_assignments"]
    assert result["estimated_total_cost"] >= 0


def test_analytics_summary_has_kpis_and_alerts():
    history = generate_synthetic_history(n=160, seed=5)
    summary = build_analytics_summary(history)
    assert summary["total_shipments"] > 0
    assert "on_time_rate" in summary["kpis"]
    assert "high_risk_shipments" in summary


def test_cost_regression_pipeline_trains_and_evaluates():
    from backend.intelligence import train_cost_model
    history = generate_synthetic_history(n=180, seed=19)
    cost_model = train_cost_model(history)
    assert "linear_regression" in cost_model.benchmarks
    assert "random_forest" in cost_model.benchmarks
    assert cost_model.benchmarks["linear_regression"]["r2"] > 0.80
    assert cost_model.benchmarks["random_forest"]["r2"] > 0.80
    preds = cost_model.predict({
        "route_key": "BHIWANDI->NARELA",
        "vehicle_type": "32ft",
        "weight_kg": 12000,
        "pallets": 18,
        "trip_distance_km": 360,
    })
    assert len(preds) == 1
    assert preds[0] > 5000.0


def test_optimizer_enforces_hard_constraints_and_logs_rejections():
    from backend.intelligence import optimize_allocation
    loads = [
        {"id": "LD-HEAVY", "weight_kg": 16000, "pallets": 20, "vehicle_type": "32ft", "risk_score": 0.3},
    ]
    # Truck V-SMALL has only 9000 kg capacity (< 16000 kg)
    vehicles = [
        {"vehicle_id": "V-SMALL", "vehicle_type": "32ft", "available_payload_kg": 9000, "available_pallets": 20, "available": True, "quoted_rate": 45000},
    ]
    res = optimize_allocation(loads, vehicles)
    assert res["assigned_orders"] == 0
    assert "LD-HEAVY" in res["unassigned_orders"]
    assert len(res["rejected_candidates"]) > 0
    assert "Payload limit exceeded" in res["rejected_candidates"][0]["reason"]


def test_benchmark_report_contains_model_comparisons():
    from backend.intelligence import get_model_benchmark_report
    report = get_model_benchmark_report()
    assert "delay_classification_benchmark" in report
    assert "cost_regression_benchmark" in report
    assert "optimization_benchmark" in report
    assert report["dataset_validation"]["samples"] >= 100


def test_evaluate_negotiation_copilot():
    from backend.intelligence import evaluate_negotiation_copilot
    payload = {
        "load_id": "LD-TEST-1",
        "origin": "Bhiwandi",
        "destination": "Delhi",
        "trip_distance_km": 1420,
        "weight_kg": 12000,
        "customer_revenue": 95000,
    }
    copilot = evaluate_negotiation_copilot(payload, carrier_ask_rate=80000)
    assert copilot["ml_fair_cost"] > 0
    assert copilot["recommended_counter_offer"] > 0
    assert copilot["decision_verdict"] in {"APPROVE_RATE", "COUNTER_OFFER", "ESCALATE_OR_REJECT"}
    assert "scripts" in copilot
    assert "gu" in copilot["scripts"] and "hi" in copilot["scripts"]


