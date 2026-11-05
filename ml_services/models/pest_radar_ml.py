"""
KisanSathi AI - Python Geospatial Pest Radar & Micro-Climate Risk ML Model
Computes proximity threat vectors using the Haversine equation and correlates
atmospheric telemetry (humidity and temperature) with pest incubation probabilities.
"""

from datetime import datetime
import math
from typing import Dict, Any, List

BASELINE_OUTBREAKS = [
    {
        "id": "outbreak-01",
        "pest_or_disease": "Rice Leaf Blast (Magnaporthe)",
        "crop_affected": "Rice (Paddy)",
        "severity": "High",
        "latitude": 12.5838,
        "longitude": 76.9567,
        "location_name": "Gejjalagere, Mandya",
        "reported_date": "2026-11-04",
        "protective_action": "Check lower leaves for diamond lesions. Withhold nitrogen; apply Pseudomonas fluorescens."
    },
    {
        "id": "outbreak-02",
        "pest_or_disease": "Yellow Stem Borer",
        "crop_affected": "Rice (Paddy)",
        "severity": "Critical",
        "latitude": 12.4538,
        "longitude": 76.8167,
        "location_name": "Srirangapatna Taluk",
        "reported_date": "2026-11-03",
        "protective_action": "Install 5 pheromone traps per acre immediately. Check for deadhearts in early vegetative tillers."
    },
    {
        "id": "outbreak-03",
        "pest_or_disease": "Fall Armyworm (Spodoptera)",
        "crop_affected": "Maize",
        "severity": "Moderate",
        "latitude": 12.6538,
        "longitude": 77.0267,
        "location_name": "Maddur Boundary",
        "reported_date": "2026-11-02",
        "protective_action": "Scout central leaf whorls for sawdust-like frass. Apply neem cake into soil."
    },
    {
        "id": "outbreak-04",
        "pest_or_disease": "Yellow / Stripe Rust Alert",
        "crop_affected": "Wheat",
        "severity": "High",
        "latitude": 30.9810,
        "longitude": 75.9273,
        "location_name": "Samrala, Ludhiana",
        "reported_date": "2026-11-04",
        "protective_action": "Inspect shaded borders on cool morning fog. Spray Propiconazole @ label rate upon notice."
    }
]


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates spherical distance in kilometers between two GPS points"""
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(r * c, 1)


def calculate_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> int:
    """Calculates geographic bearing angle in degrees (0 to 360)"""
    y = math.sin(math.radians(lon2 - lon1)) * math.cos(math.radians(lat2))
    x = (math.cos(math.radians(lat1)) * math.sin(math.radians(lat2)) -
         math.sin(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.cos(math.radians(lon2 - lon1)))
    brng = math.degrees(math.atan2(y, x))
    return int((brng + 360) % 360)


def scan_pest_radar(
    user_lat: float = 12.5238,
    user_lon: float = 76.8967,
    humidity: float = 78.0,
    temperature: float = 26.5
) -> Dict[str, Any]:
    """
    Executes the Python Geospatial Pest Radar & Micro-Climate Threat Model
    """
    max_radius_km = 60.0
    nodes = []

    for item in BASELINE_OUTBREAKS:
        dist = haversine_distance(user_lat, user_lon, item["latitude"], item["longitude"])
        bearing = calculate_bearing(user_lat, user_lon, item["latitude"], item["longitude"])

        if dist <= max_radius_km:
            # Polar to Cartesian conversion for 100x100 radar canvas
            norm_dist = min(1.0, dist / max_radius_km)
            angle_rad = math.radians(bearing - 90)
            pos_x = round(50 + (norm_dist * 42 * math.cos(angle_rad)))
            pos_y = round(50 + (norm_dist * 42 * math.sin(angle_rad)))

            threat_level = "Critical" if dist <= 15 else "High" if dist <= 35 else "Moderate"

            nodes.append({
                **item,
                "distance_km": dist,
                "bearing_degrees": bearing,
                "radar_position": {"x": pos_x, "y": pos_y},
                "threat_level": threat_level
            })

    nodes.sort(key=lambda x: x["distance_km"])

    # Micro-climate incubation risk scoring
    if humidity > 85 and 20 <= temperature <= 28:
        climate_index = "High Fungal Blast / Blight Risk"
        advisory = f"High humidity ({humidity}%) and warm temperature ({temperature}°C) accelerate spore germination."
    elif temperature > 32 and humidity < 50:
        climate_index = "High Sucking Pest / Thrips Risk"
        advisory = f"High ambient heat ({temperature}°C) accelerates multiplication of thrips and whiteflies."
    else:
        climate_index = "Moderate Environmental Risk"
        advisory = "Normal atmospheric conditions. Maintain routine morning scouting."

    return {
        "success": True,
        "pipeline": "Python-GeoPestRadar-ML",
        "timestamp": datetime.now().isoformat(),
        "user_coordinates": {"latitude": user_lat, "longitude": user_lon},
        "radar_coverage_km": max_radius_km,
        "climate_threat_index": climate_index,
        "climate_threat_advisory": advisory,
        "active_threats_count": len(nodes),
        "closest_threat": nodes[0] if nodes else None,
        "outbreak_nodes": nodes
    }
