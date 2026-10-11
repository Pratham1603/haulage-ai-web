"""Customer, consignee, and location directory resolution for Haulage AI Module 1."""
from dataclasses import dataclass, field
import difflib
import re
from typing import Any, Mapping


@dataclass
class ResolvedCustomer:
    customer_id: str
    canonical_name: str
    match_confidence: float
    matched_alias: str
    is_ambiguous: bool = False
    candidate_matches: list[str] = field(default_factory=list)
    default_pickup_location: str | None = None
    authorized_lanes: list[str] = field(default_factory=list)


@dataclass
class ResolvedLocation:
    hub_name: str
    city: str
    state: str
    pincode: str
    coordinates: tuple[float, float]
    match_confidence: float
    is_ambiguous: bool = False
    candidate_matches: list[str] = field(default_factory=list)


CUSTOMER_DIRECTORY = [
    {
        "id": "cust_aarav",
        "name": "Aarav Consumer Products",
        "aliases": ["aarav", "aarav consumer", "aarav products", "meera / aarav", "aarav consumer products ltd"],
        "default_pickup": "Bhiwandi WH-3",
        "authorized_lanes": ["Bhiwandi -> Narela", "Bhiwandi -> Jaipur", "Mumbai -> Delhi"],
    },
    {
        "id": "cust_kedia",
        "name": "Kedia Polymers",
        "aliases": ["kedia", "kedia poly", "kedia polymers pvt ltd"],
        "default_pickup": "Bhiwandi",
        "authorized_lanes": ["Bhiwandi -> Pune"],
    },
    {
        "id": "cust_shree",
        "name": "Shree Packaging",
        "aliases": ["shree", "shree pack", "shree packaging solutions"],
        "default_pickup": "Vashi",
        "authorized_lanes": ["Vashi -> Ahmedabad"],
    },
    {
        "id": "cust_gupta",
        "name": "Gupta Trading Co.",
        "aliases": ["gupta", "gupta trading", "gupta traders", "mr. gupta"],
        "default_pickup": "Narela",
        "authorized_lanes": ["Narela -> Ludhiana"],
    },
    {
        "id": "cust_gupta_enterprises",
        "name": "Gupta Enterprises Delhi",
        "aliases": ["gupta enterprises", "gupta ent"],
        "default_pickup": "Narela",
        "authorized_lanes": ["Delhi -> Kanpur"],
    },
]

LOCATION_DIRECTORY = [
    {
        "hub": "Bhiwandi WH-3",
        "city": "Bhiwandi (Mumbai)",
        "state": "Maharashtra",
        "pincode": "421302",
        "coords": (19.2967, 73.0631),
        "aliases": ["bhiwandi", "bhiwandi wh-3", "bhiwandi wh 3", "bhiwandi warehouse", "mumbai"],
    },
    {
        "hub": "Narela",
        "city": "Narela (Delhi)",
        "state": "Delhi",
        "pincode": "110040",
        "coords": (28.8527, 77.0934),
        "aliases": ["narela", "gupta trading co., narela", "delhi", "narela dc", "narela industrial area"],
    },
    {
        "hub": "Jaipur",
        "city": "Jaipur",
        "state": "Rajasthan",
        "pincode": "302001",
        "coords": (26.9124, 75.7873),
        "aliases": ["jaipur", "jaipur wh", "pink city"],
    },
    {
        "hub": "Pune",
        "city": "Pune",
        "state": "Maharashtra",
        "pincode": "411001",
        "coords": (18.5204, 73.8567),
        "aliases": ["pune", "pimpri", "chakan"],
    },
    {
        "hub": "Ahmedabad",
        "city": "Ahmedabad",
        "state": "Gujarat",
        "pincode": "380001",
        "coords": (23.0225, 72.5714),
        "aliases": ["ahmedabad", "sanand", "changodar"],
    },
    {
        "hub": "Vapi",
        "city": "Vapi",
        "state": "Gujarat",
        "pincode": "396191",
        "coords": (20.3712, 72.9048),
        "aliases": ["vapi", "vapi gidc"],
    },
    {
        "hub": "Ludhiana",
        "city": "Ludhiana",
        "state": "Punjab",
        "pincode": "141001",
        "coords": (30.9010, 75.8573),
        "aliases": ["ludhiana", "ludhiana dry port"],
    },
]


def _similarity(s1: str, s2: str) -> float:
    return difflib.SequenceMatcher(None, s1.strip().lower(), s2.strip().lower()).ratio()


class EntityResolver:
    """Resolves extracted customer and location names, flagging ambiguous matches for clarification."""

    @staticmethod
    def resolve_customer(name: str) -> ResolvedCustomer:
        if not name or not name.strip():
            return ResolvedCustomer("unknown", "Unknown Customer", 0.0, "", True, [])

        query = name.strip().lower()
        query_tokens = set(re.findall(r"\w+", query))
        scored: list[tuple[float, Mapping[str, Any], str]] = []

        for cust in CUSTOMER_DIRECTORY:
            best_score = _similarity(query, cust["name"].lower())
            best_alias = cust["name"]
            for alias in cust["aliases"]:
                alias_tokens = set(re.findall(r"\w+", alias.lower()))
                token_overlap = len(query_tokens & alias_tokens) / max(len(query_tokens), 1)
                score = max(_similarity(query, alias), token_overlap * 0.92)
                if score > best_score:
                    best_score = score
                    best_alias = alias
            name_tokens = set(re.findall(r"\w+", cust["name"].lower()))
            overlap = len(query_tokens & name_tokens) / max(len(query_tokens), 1)
            if overlap * 0.92 > best_score:
                best_score = overlap * 0.92
                best_alias = cust["name"]
            scored.append((best_score, cust, best_alias))

        scored.sort(key=lambda item: item[0], reverse=True)
        top_score, top_cust, top_alias = scored[0]

        # Check for ambiguity: if top two matches are within 0.12 of each other and above 0.70
        if len(scored) > 1 and scored[0][0] >= 0.70 and scored[1][0] >= 0.70:
            if abs(scored[0][0] - scored[1][0]) <= 0.12:
                return ResolvedCustomer(
                    customer_id="ambiguous",
                    canonical_name=top_cust["name"],
                    match_confidence=round(top_score, 2),
                    matched_alias=top_alias,
                    is_ambiguous=True,
                    candidate_matches=[s[1]["name"] for s in scored[:2]],
                    default_pickup_location=top_cust.get("default_pickup"),
                    authorized_lanes=top_cust.get("authorized_lanes", []),
                )

        if top_score < 0.65:
            return ResolvedCustomer(
                customer_id=f"unresolved_{re.sub(r'[^a-z0-9]', '_', query)[:15]}",
                canonical_name=name.strip(),
                match_confidence=round(top_score, 2),
                matched_alias=top_alias,
                is_ambiguous=True,
                candidate_matches=[s[1]["name"] for s in scored if s[0] >= 0.50],
            )

        return ResolvedCustomer(
            customer_id=top_cust["id"],
            canonical_name=top_cust["name"],
            match_confidence=round(min(1.0, top_score), 2),
            matched_alias=top_alias,
            is_ambiguous=False,
            candidate_matches=[],
            default_pickup_location=top_cust.get("default_pickup"),
            authorized_lanes=top_cust.get("authorized_lanes", []),
        )

    @staticmethod
    def resolve_location(raw_text: str) -> ResolvedLocation:
        if not raw_text or not raw_text.strip():
            return ResolvedLocation("Unknown", "Unknown", "Unknown", "000000", (0.0, 0.0), 0.0, True, [])

        query = raw_text.strip().lower()
        scored: list[tuple[float, Mapping[str, Any]]] = []

        for loc in LOCATION_DIRECTORY:
            best_score = _similarity(query, loc["hub"].lower())
            for alias in loc["aliases"]:
                score = _similarity(query, alias)
                if alias in query:
                    score = max(score, 0.92)
                if score > best_score:
                    best_score = score
            scored.append((best_score, loc))

        scored.sort(key=lambda item: item[0], reverse=True)
        top_score, top_loc = scored[0]

        # Extract explicit pincode if present in raw text
        pin_match = re.search(r"\b([1-9][0-9]{5})\b", raw_text)
        pincode = pin_match.group(1) if pin_match else top_loc["pincode"]

        if top_score < 0.60:
            return ResolvedLocation(
                hub_name=raw_text.strip(),
                city=raw_text.strip(),
                state="Unknown",
                pincode=pincode,
                coordinates=top_loc["coords"],
                match_confidence=round(top_score, 2),
                is_ambiguous=True,
                candidate_matches=[s[1]["hub"] for s in scored if s[0] >= 0.45],
            )

        return ResolvedLocation(
            hub_name=top_loc["hub"],
            city=top_loc["city"],
            state=top_loc["state"],
            pincode=pincode,
            coordinates=top_loc["coords"],
            match_confidence=round(min(1.0, top_score), 2),
            is_ambiguous=False,
            candidate_matches=[],
        )
