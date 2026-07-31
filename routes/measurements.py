from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from database import SessionLocal
from models import Measurement

RANGES = {
    "1H": timedelta(hours=1),
    "6H": timedelta(hours=6),
    "1D": timedelta(hours=24),
    "1W": timedelta(days=7),
    "1M": timedelta(days=30),
    "3M": timedelta(days=90),
    "6M": timedelta(days=180),
    "1Y": timedelta(days=365),
    "5Y": timedelta(days=365 * 5),
}

bp = Blueprint("measurements", __name__)

@bp.post("/api/measurements")
def create_measurement():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "JSON body required"
        }), 400

    required_fields = [
        "device",
        "timestamp",
        "temperature",
        "humidity",
        "pressure"
    ]

    missing_fields = [
        field for field in required_fields
        if field not in data
    ]

    if missing_fields:
        return jsonify({
            "status": "error",
            "message": "Missing required fields",
            "fields": missing_fields
        }), 400

    try:
        timestamp = datetime.fromisoformat(
            data["timestamp"].replace("Z", "+00:00")
        )

        measurement = Measurement(
            device=str(data["device"]),
            timestamp=timestamp,
            temperature=float(data["temperature"]),
            humidity=float(data["humidity"]),
            pressure=float(data["pressure"]),
            rssi=(
                int(data["rssi"])
                if data.get("rssi") is not None
                else None
            )
        )

        with SessionLocal() as session:
            session.add(measurement)
            session.commit()
            session.refresh(measurement)
            measurement_id = measurement.id

        return jsonify({
            "status": "ok",
            "id": measurement_id
        }), 201

    except (TypeError, ValueError):
        return jsonify({
            "status": "error",
            "message": "Invalid measurement values"
        }), 400

    except SQLAlchemyError:
        return jsonify({
            "status": "error",
            "message": "Database error"
        }), 500


@bp.get("/api/measurements")
def get_measurements():
    try:
        selected_range = request.args.get(
            "range",
            default="1D",
            type=str
        ).upper()

        allowed_ranges = [*RANGES.keys(), "ALL"]

        if selected_range not in allowed_ranges:
            return jsonify({
                "status": "error",
                "message": "Invalid range",
                "allowed_ranges": allowed_ranges
            }), 400

        with SessionLocal() as session:
            statement = select(Measurement)

            if selected_range != "ALL":
                cutoff = (
                    datetime.now(timezone.utc)
                    - RANGES[selected_range]
                )

                statement = statement.where(
                    Measurement.timestamp >= cutoff
                )

            statement = statement.order_by(
                Measurement.timestamp.asc()
            )

            measurements = session.scalars(statement).all()

            result = [
                {
                    "id": measurement.id,
                    "device": measurement.device,
                    "timestamp": measurement.timestamp.isoformat(),
                    "temperature": measurement.temperature,
                    "humidity": measurement.humidity,
                    "pressure": measurement.pressure,
                    "rssi": measurement.rssi
                }
                for measurement in measurements
            ]

        return jsonify(result), 200

    except SQLAlchemyError:
        return jsonify({
            "status": "error",
            "message": "Database error"
        }), 500
