"""Deterministic and schema-backed document extraction for Haulage AI Module 1."""
from dataclasses import dataclass, field
from io import BytesIO
import re
from typing import Any, Mapping, Sequence
import pandas as pd


@dataclass
class ExtractedField:
    name: str
    value: Any
    confidence: float
    source_evidence: str
    extraction_method: str
    is_conflict: bool = False
    conflict_details: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "value": self.value,
            "confidence": round(self.confidence * 100, 1),
            "source_evidence": self.source_evidence,
            "extraction_method": self.extraction_method,
            "is_conflict": self.is_conflict,
            "conflict_details": self.conflict_details,
        }


@dataclass
class ExtractedOrderRecord:
    record_id: str
    fields: dict[str, ExtractedField] = field(default_factory=dict)
    raw_source: str = ""
    conflicts: list[str] = field(default_factory=list)
    missing_required: list[str] = field(default_factory=list)

    @property
    def overall_confidence(self) -> float:
        if not self.fields:
            return 0.0
        scores = [f.confidence for f in self.fields.values()]
        return round((sum(scores) / len(scores)) * 100, 1)

    def get_value(self, field_name: str, default: Any = None) -> Any:
        f = self.fields.get(field_name)
        return f.value if f is not None else default

    def to_dict(self) -> dict[str, Any]:
        return {
            "record_id": self.record_id,
            "fields": {k: v.to_dict() for k, v in self.fields.items()},
            "overall_confidence": self.overall_confidence,
            "conflicts": self.conflicts,
            "missing_required": self.missing_required,
        }


class DocumentExtractor:
    """Parses text, spreadsheets (Excel/CSV), and invoices with provenance tracking."""

    CUSTOMER_PATTERNS = [
        (re.compile(r"Regards,?\s+([A-Za-z\s]+)—\s*([A-Za-z\s]+)", re.IGNORECASE), "email_signature"),
        (re.compile(r"Customer:\s*([A-Za-z0-9\s.,]+)", re.IGNORECASE), "labeled_header"),
        (re.compile(r"From:\s*([A-Za-z0-9\s.,]+)", re.IGNORECASE), "from_header"),
        (re.compile(r"\b(Aarav Consumer Products|Kedia Polymers|Shree Packaging|Gupta Trading Co)\b", re.IGNORECASE), "entity_catalog"),
    ]

    PINCODE_PATTERN = re.compile(r"\b([1-9][0-9]{5})\b")

    WEIGHT_PATTERNS = [
        re.compile(r"(\d+(?:\.\d+)?)\s*(?:t|tons?|tonnes?|MT)\b", re.IGNORECASE),
        re.compile(r"(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilograms?)\b", re.IGNORECASE),
        re.compile(r"weight[:\s]+(\d+(?:\.\d+)?)", re.IGNORECASE),
    ]

    PALLET_PATTERNS = [
        re.compile(r"(\d+)\s*pallets?\b", re.IGNORECASE),
        re.compile(r"pallets?[:\s]+(\d+)", re.IGNORECASE),
        re.compile(r"pallet count[:\s]+(\d+)", re.IGNORECASE),
    ]

    VEHICLE_PATTERNS = [
        re.compile(r"\b(32\s*ft(?:\s*MXL|\s*SXL)?)\b", re.IGNORECASE),
        re.compile(r"\b(24\s*ft|20\s*ft|17\s*ft|14\s*ft)\b", re.IGNORECASE),
        re.compile(r"\b(tauros|trailer|container)\b", re.IGNORECASE),
    ]

    PO_PATTERNS = [
        re.compile(r"\b(PO[-#:\s]*\d{3,8})\b", re.IGNORECASE),
        re.compile(r"\b(Purchase Order[:\s]*#?\s*([A-Za-z0-9-_]+))\b", re.IGNORECASE),
    ]

    INV_PATTERNS = [
        re.compile(r"\b(INV[-#:\s]*\d{3,8})\b", re.IGNORECASE),
        re.compile(r"\b(Invoice[:\s]*#?\s*([A-Za-z0-9-_]+))\b", re.IGNORECASE),
    ]

    LOCATION_PATTERNS = [
        re.compile(r"from\s+([A-Za-z0-9\s-]+?)\s+to\s+([A-Za-z0-9\s.,-]+?)(?:\.|$|Pickup|Vehicle)", re.IGNORECASE),
        re.compile(r"origin[:\s]+([A-Za-z0-9\s-]+?)[,\n]destination[:\s]+([A-Za-z0-9\s-]+)", re.IGNORECASE),
    ]

    WINDOW_PATTERNS = [
        re.compile(r"Pickup window\s+([A-Za-z0-9:\s-]+?)(?:\.|$|Vehicle)", re.IGNORECASE),
        re.compile(r"pickup[:\s]+([A-Za-z0-9:\s-]+?)(?:\.|$|,)", re.IGNORECASE),
    ]

    @classmethod
    def extract_from_text(cls, text: str, source_tag: str = "text") -> dict[str, ExtractedField]:
        fields: dict[str, ExtractedField] = {}

        # 1. Customer
        cust_match = None
        for pattern, method in cls.CUSTOMER_PATTERNS:
            m = pattern.search(text)
            if m:
                val = m.group(2) if len(m.groups()) >= 2 and m.group(2) else m.group(1)
                cust_match = ExtractedField(
                    name="customer",
                    value=val.strip(),
                    confidence=0.98 if method == "entity_catalog" else 0.92,
                    source_evidence=m.group(0),
                    extraction_method=f"{source_tag}:{method}",
                )
                break
        if cust_match:
            fields["customer"] = cust_match

        # 2. Origin & Destination
        for pattern in cls.LOCATION_PATTERNS:
            m = pattern.search(text)
            if m:
                fields["pickup_location"] = ExtractedField(
                    name="pickup_location",
                    value=m.group(1).strip(),
                    confidence=0.96,
                    source_evidence=m.group(0),
                    extraction_method=f"{source_tag}:route_pattern",
                )
                fields["drop_location"] = ExtractedField(
                    name="drop_location",
                    value=m.group(2).strip(),
                    confidence=0.95,
                    source_evidence=m.group(0),
                    extraction_method=f"{source_tag}:route_pattern",
                )
                break

        # Check for destination consignee mention
        if "drop_location" in fields:
            drop_val = fields["drop_location"].value
            if "," in drop_val:
                parts = [p.strip() for p in drop_val.split(",", 1)]
                fields["consignee"] = ExtractedField(
                    name="consignee",
                    value=parts[0],
                    confidence=0.94,
                    source_evidence=drop_val,
                    extraction_method=f"{source_tag}:drop_split",
                )

        # 3. Weight
        for pattern in cls.WEIGHT_PATTERNS:
            m = pattern.search(text)
            if m:
                raw_num = float(m.group(1))
                # convert tons to kg if 't' or 'ton' is in unit
                snippet = m.group(0).lower()
                weight_kg = raw_num * 1000.0 if any(u in snippet for u in ["t", "ton", "mt"]) else raw_num
                fields["weight_kg"] = ExtractedField(
                    name="weight_kg",
                    value=round(weight_kg, 1),
                    confidence=0.95,
                    source_evidence=m.group(0),
                    extraction_method=f"{source_tag}:weight_regex",
                )
                break

        # 4. Pallets
        for pattern in cls.PALLET_PATTERNS:
            m = pattern.search(text)
            if m:
                fields["pallets"] = ExtractedField(
                    name="pallets",
                    value=int(m.group(1)),
                    confidence=0.98,
                    source_evidence=m.group(0),
                    extraction_method=f"{source_tag}:pallet_regex",
                )
                break

        # 5. Vehicle Requirement
        for pattern in cls.VEHICLE_PATTERNS:
            m = pattern.search(text)
            if m:
                fields["vehicle_requirement"] = ExtractedField(
                    name="vehicle_requirement",
                    value=m.group(0).strip(),
                    confidence=0.95,
                    source_evidence=m.group(0),
                    extraction_method=f"{source_tag}:vehicle_regex",
                )
                break

        # 6. Pickup Window
        for pattern in cls.WINDOW_PATTERNS:
            m = pattern.search(text)
            if m:
                fields["pickup_window"] = ExtractedField(
                    name="pickup_window",
                    value=m.group(1).strip(),
                    confidence=0.91,
                    source_evidence=m.group(0),
                    extraction_method=f"{source_tag}:pickup_window_regex",
                )
                break

        # 7. PO & Invoice references
        pos = [m.group(1).strip() for m in cls.PO_PATTERNS[0].finditer(text)]
        if pos:
            fields["po_number"] = ExtractedField(
                name="po_number",
                value=pos[0],
                confidence=0.97,
                source_evidence=", ".join(pos),
                extraction_method=f"{source_tag}:po_regex",
            )

        invs = [m.group(1).strip() for m in cls.INV_PATTERNS[0].finditer(text)]
        if invs:
            fields["invoice_numbers"] = ExtractedField(
                name="invoice_numbers",
                value=invs,
                confidence=0.95,
                source_evidence=", ".join(invs),
                extraction_method=f"{source_tag}:inv_regex",
            )

        # 8. Cargo description
        cargo_match = re.search(r"(\d+\s*pallets?\s+of\s+([A-Za-z0-9\s]+?))\s+from", text, re.IGNORECASE)
        if cargo_match:
            fields["cargo"] = ExtractedField(
                name="cargo",
                value=cargo_match.group(2).strip(),
                confidence=0.94,
                source_evidence=cargo_match.group(0),
                extraction_method=f"{source_tag}:cargo_regex",
            )

        return fields

    @classmethod
    def extract_from_spreadsheet(cls, content_bytes: bytes, filename: str) -> list[dict[str, ExtractedField]]:
        """Parses CSV or Excel (.xlsx/.xls) manifests using pandas."""
        records = []
        try:
            if filename.lower().endswith(".csv"):
                df = pd.read_csv(BytesIO(content_bytes))
            else:
                df = pd.read_excel(BytesIO(content_bytes))
        except Exception:
            return records

        col_map = {}
        for c in df.columns:
            clow = str(c).lower().strip()
            if "customer" in clow or "shipper" in clow:
                col_map["customer"] = c
            elif "consignee" in clow or "receiver" in clow:
                col_map["consignee"] = c
            elif "origin" in clow or "from" in clow or "pickup" in clow:
                col_map["pickup_location"] = c
            elif "destination" in clow or "to" in clow or "drop" in clow:
                col_map["drop_location"] = c
            elif "weight" in clow:
                col_map["weight"] = c
            elif "pallet" in clow:
                col_map["pallets"] = c
            elif "vehicle" in clow or "truck" in clow:
                col_map["vehicle_requirement"] = c
            elif "po" in clow or "order" in clow:
                col_map["po_number"] = c
            elif "invoice" in clow or "inv" in clow:
                col_map["invoice_numbers"] = c
            elif "cargo" in clow or "material" in clow or "commodity" in clow:
                col_map["cargo"] = c

        for idx, row in df.iterrows():
            row_fields = {}
            for target_field, src_col in col_map.items():
                val = row[src_col]
                if pd.isna(val):
                    continue

                if target_field == "weight":
                    try:
                        w_val = float(val)
                        if w_val < 100:  # likely in tons
                            w_val = w_val * 1000.0
                        row_fields["weight_kg"] = ExtractedField(
                            name="weight_kg",
                            value=round(w_val, 1),
                            confidence=0.98,
                            source_evidence=f"{filename} row {idx + 2}, col {src_col}: {val}",
                            extraction_method="excel_cell_numeric",
                        )
                    except ValueError:
                        pass
                elif target_field == "pallets":
                    try:
                        row_fields["pallets"] = ExtractedField(
                            name="pallets",
                            value=int(float(val)),
                            confidence=0.99,
                            source_evidence=f"{filename} row {idx + 2}, col {src_col}: {val}",
                            extraction_method="excel_cell_numeric",
                        )
                    except ValueError:
                        pass
                else:
                    row_fields[target_field] = ExtractedField(
                        name=target_field,
                        value=str(val).strip(),
                        confidence=0.96,
                        source_evidence=f"{filename} row {idx + 2}, col {src_col}: {val}",
                        extraction_method="excel_cell_string",
                    )
            if row_fields:
                records.append(row_fields)
        return records

    @classmethod
    def reconcile_sources(
        cls,
        text_fields: dict[str, ExtractedField],
        sheet_fields: dict[str, ExtractedField] | None = None,
        record_id: str = "REC-1",
    ) -> ExtractedOrderRecord:
        """Merges text and spreadsheet extractions, explicitly detecting and flagging discrepancies."""
        reconciled: dict[str, ExtractedField] = {}
        conflicts: list[str] = []

        # Start with text fields
        for k, tf in text_fields.items():
            reconciled[k] = tf

        if sheet_fields:
            for k, sf in sheet_fields.items():
                if k not in reconciled:
                    reconciled[k] = sf
                else:
                    tf = reconciled[k]
                    # Check for value mismatch
                    if k == "weight_kg":
                        t_val = float(tf.value)
                        s_val = float(sf.value)
                        # More than 2% variance is a conflict
                        if abs(t_val - s_val) / max(t_val, s_val, 1) > 0.02:
                            conflict_msg = f"conflict: invoice/text {round(t_val/1000, 1)} t vs Excel {round(s_val/1000, 1)} t"
                            conflicts.append(conflict_msg)
                            reconciled[k] = ExtractedField(
                                name="weight_kg",
                                value=tf.value,
                                confidence=0.58,  # degraded confidence for human review
                                source_evidence=f"{tf.source_evidence} vs {sf.source_evidence}",
                                extraction_method="multi_source_conflict",
                                is_conflict=True,
                                conflict_details=conflict_msg,
                            )
                        else:
                            reconciled[k] = sf  # structured sheet preferred if concordant
                    elif str(tf.value).strip().lower() != str(sf.value).strip().lower():
                        conflict_msg = f"conflict on {k}: '{tf.value}' vs '{sf.value}'"
                        conflicts.append(conflict_msg)
                        reconciled[k] = ExtractedField(
                            name=k,
                            value=tf.value,
                            confidence=0.65,
                            source_evidence=f"{tf.source_evidence} vs {sf.source_evidence}",
                            extraction_method="multi_source_conflict",
                            is_conflict=True,
                            conflict_details=conflict_msg,
                        )
                    else:
                        # Values concordant, boost confidence
                        reconciled[k] = ExtractedField(
                            name=k,
                            value=sf.value,
                            confidence=min(1.0, tf.confidence + 0.03),
                            source_evidence=f"{sf.source_evidence} (confirmed by text)",
                            extraction_method="concordant_sources",
                        )

        # Check required fields
        required = ["customer", "pickup_location", "drop_location", "weight_kg", "pallets", "vehicle_requirement"]
        missing = [req for req in required if req not in reconciled or reconciled[req].value is None]

        return ExtractedOrderRecord(
            record_id=record_id,
            fields=reconciled,
            raw_source=text_fields.get("customer", ExtractedField("raw", "", 0, "", "")).source_evidence,
            conflicts=conflicts,
            missing_required=missing,
        )
