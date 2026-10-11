"""Deterministic load-to-truck matching rules used by the API and tests."""
from datetime import datetime
from typing import Any, Mapping, Sequence

DEFAULT_WEIGHTS = {"route": 0.30, "cost": 0.25, "capacity": 0.20, "timing": 0.15, "reliability": 0.10}


def _number(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _time(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        return value
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def _normalise(value: float, low: float, high: float) -> float:
    if high == low:
        return 1.0
    return max(0.0, min(1.0, (value - low) / (high - low)))


def _hard_failures(load: Mapping[str, Any], vehicle: Mapping[str, Any]) -> list[str]:
    failures = []
    if load.get("vehicle_type") and vehicle.get("vehicle_type") != load["vehicle_type"]:
        failures.append("vehicle_type")
    if _number(vehicle.get("available_payload_kg")) < _number(load.get("weight_kg")):
        failures.append("payload")
    if _number(vehicle.get("available_pallets"), _number(vehicle.get("pallets"))) < _number(load.get("pallets")):
        failures.append("pallet_capacity")
    if vehicle.get("available") is False:
        failures.append("availability")
    if vehicle.get("cargo_compatible") is False:
        failures.append("cargo_compatibility")
    pickup_start = _time(load.get("pickup_start"))
    available_at = _time(vehicle.get("available_at"))
    if pickup_start and available_at and available_at > pickup_start:
        failures.append("pickup_window")
    return failures


def rank_candidates(load: Mapping[str, Any], vehicles: Sequence[Mapping[str, Any]], weights: Mapping[str, float] | None = None) -> list[dict[str, Any]]:
    """Return feasible vehicles ranked by configurable, explainable components."""
    chosen = {**DEFAULT_WEIGHTS, **(weights or {})}
    feasible = [v for v in vehicles if not _hard_failures(load, v)]
    costs = [_number(v.get("quoted_rate"), _number(v.get("operating_cost"))) for v in feasible]
    low_cost, high_cost = (min(costs), max(costs)) if costs else (0.0, 0.0)
    results = []
    for vehicle in feasible:
        cost = _number(vehicle.get("quoted_rate"), _number(vehicle.get("operating_cost")))
        route_default = 1 / (1 + _number(vehicle.get("pickup_distance_km")))
        route_score = _number(vehicle.get("route_score"), route_default)
        components = {
            "route": max(0.0, min(1.0, route_score)),
            "cost": 1 - _normalise(cost, low_cost, high_cost),
            "capacity": min(1.0, _number(load.get("weight_kg")) / max(_number(vehicle.get("available_payload_kg")), 1)),
            "timing": max(0.0, min(1.0, _number(vehicle.get("timing_score"), 1.0))),
            "reliability": max(0.0, min(1.0, _number(vehicle.get("reliability_score"), 1.0))),
        }
        score = sum(components[key] * chosen[key] for key in DEFAULT_WEIGHTS)
        results.append({
            "vehicle_id": vehicle.get("vehicle_id"),
            "score": round(score * 100, 2),
            "components": {key: round(value, 4) for key, value in components.items()},
            "explanation": "Feasible on capacity, timing, compatibility and availability; ranked by configured weights.",
            "quoted_rate": cost,
        })
    return sorted(results, key=lambda item: item["score"], reverse=True)


def propose_spare_capacity(primary_load: Mapping[str, Any], additional_loads: Sequence[Mapping[str, Any]], vehicle: Mapping[str, Any]) -> list[dict[str, Any]]:
    """Find sequential compatible loads that fit remaining truck capacity."""
    remaining_weight = _number(vehicle.get("available_payload_kg")) - _number(primary_load.get("weight_kg"))
    remaining_pallets = _number(vehicle.get("available_pallets"), _number(vehicle.get("pallets"))) - _number(primary_load.get("pallets"))
    proposals = []
    for load in additional_loads:
        warnings = []
        if _number(load.get("weight_kg")) > remaining_weight:
            warnings.append("payload")
        if _number(load.get("pallets")) > remaining_pallets:
            warnings.append("pallet_capacity")
        if load.get("cargo_compatible") is False:
            warnings.append("cargo_compatibility")
        if load.get("route_compatible") is False:
            warnings.append("route_detour")
        if load.get("time_window_compatible") is False:
            warnings.append("delivery_window")
        if warnings:
            continue
        revenue = _number(load.get("revenue"))
        operating_cost = _number(load.get("incremental_operating_cost"))
        proposals.append({
            "load_id": load.get("load_id"),
            "remaining_payload_kg": round(remaining_weight - _number(load.get("weight_kg")), 2),
            "remaining_pallets": round(remaining_pallets - _number(load.get("pallets")), 2),
            "incremental_revenue": revenue,
            "incremental_operating_cost": operating_cost,
            "incremental_contribution": revenue - operating_cost,
            "warnings": [],
        })
    return proposals