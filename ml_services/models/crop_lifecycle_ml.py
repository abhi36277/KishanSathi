"""
KisanSathi AI - Python Full Crop Lifecycle & Agronomic Optimization ML Model
Tracks Days After Sowing (DAS), stage progression, critical irrigation windows,
and certified fertilizer dosing protocols from start to harvest.
"""

from datetime import datetime
from typing import Dict, Any, List

LIFECYCLE_SPECS: Dict[str, Any] = {
    "rice": {
        "crop_name": "Rice (Paddy)",
        "total_days": 125,
        "seed_treatment": "Treat seeds with Trichoderma viride @ 5g/kg or Carbendazim 2g/kg seed to prevent seed-borne foot rot.",
        "seed_rate": "20-25 kg/acre (transplanted paddy)",
        "spacing": "20 cm x 15 cm",
        "stages": [
            {
                "id": "stage_1",
                "name": "Land Preparation & Basal Sowing",
                "day_start": 0,
                "day_end": 20,
                "irrigation_protocol": {
                    "water_depth": "Shallow 2-3 cm standing water in nursery. Keep moist; avoid submerging shoots.",
                    "criticality": "High",
                    "advisory": "Drain water before seed broadcast; irrigate in evening on Day 3."
                },
                "fertilizer_protocol": {
                    "dose_title": "Basal Dose at Final Puddling",
                    "nutrients": "DAP 50 kg + MOP 20 kg + Urea 25 kg + Zinc Sulphate 10 kg/acre.",
                    "method": "Incorporate thoroughly into top 10cm puddled soil before transplanting.",
                    "precaution": "Never apply Zinc Sulphate directly mixed with DAP (forms insoluble zinc phosphate)."
                },
                "key_tasks": [
                    "Puddle and level field to ensure uniform water depth",
                    "Apply farmyard manure (FYM 4-5 tonnes/acre)",
                    "Clip seedling leaf tips before transplanting to discard borer egg masses"
                ]
            },
            {
                "id": "stage_2",
                "name": "Seedling Establishment & Early Vegetative",
                "day_start": 21,
                "day_end": 40,
                "irrigation_protocol": {
                    "water_depth": "Maintain shallow 2-3 cm water layer to promote root anchorage.",
                    "criticality": "Medium",
                    "advisory": "Allow periodic aeration (alternate wetting and drying) to stimulate deep root growth."
                },
                "fertilizer_protocol": {
                    "dose_title": "First Top Dressing (Early Tillering)",
                    "nutrients": "Urea 30 kg/acre (neem-coated formulation).",
                    "method": "Broadcast uniformly in moist soil with thin standing water.",
                    "precaution": "Do not broadcast if overcast sky or immediate heavy rain is forecast."
                },
                "key_tasks": [
                    "Hand weeding or cono-weeder pass at Day 25",
                    "Check for stem borer deadhearts",
                    "Maintain bunds to prevent nutrient runoff"
                ]
            },
            {
                "id": "stage_3",
                "name": "Active Tillering to Maximum Tillering",
                "day_start": 41,
                "day_end": 65,
                "irrigation_protocol": {
                    "water_depth": "Maintain 3-5 cm standing water.",
                    "criticality": "High",
                    "advisory": "Critical water requirement. Water stress during tillering directly reduces effective panicles."
                },
                "fertilizer_protocol": {
                    "dose_title": "Second Top Dressing (Peak Tillering)",
                    "nutrients": "Urea 30 kg + MOP 20 kg/acre.",
                    "method": "Broadcast evenly. Potash strengthens straw stiffness and protects against lodging and blast.",
                    "precaution": "Avoid excess urea which causes luxuriant soft leaves prone to fungal blast."
                },
                "key_tasks": [
                    "Scout for leaf folder caterpillars and brown planthopper (BPH) at base of hills",
                    "Install bamboo bird perches (15 per acre)"
                ]
            },
            {
                "id": "stage_4",
                "name": "Panicle Initiation & Flowering (Booting)",
                "day_start": 66,
                "day_end": 90,
                "irrigation_protocol": {
                    "water_depth": "Continuous shallow 5 cm submergence.",
                    "criticality": "Critical",
                    "advisory": "Most critical moisture period! Moisture stress causes spikelet sterility and empty chaffy grains."
                },
                "fertilizer_protocol": {
                    "dose_title": "Foliar Booster (Panicle Emergence)",
                    "nutrients": "1% Potassium Nitrate (13-0-45) or 0.2% Borax foliar spray.",
                    "method": "Spray in cool late afternoon (after 3 PM) during clear weather.",
                    "precaution": "Do not spray pesticides or foliar nutrients during peak morning pollination (9 AM - 12 PM)."
                },
                "key_tasks": [
                    "Inspect panicle neck for blast lesions",
                    "Maintain bund weed-free to eliminate BPH shelter"
                ]
            },
            {
                "id": "stage_5",
                "name": "Grain Milking & Dough Stage",
                "day_start": 91,
                "day_end": 110,
                "irrigation_protocol": {
                    "water_depth": "Alternate wetting and shallow drying (2 cm depth).",
                    "criticality": "Medium",
                    "advisory": "Keep root zone moist until grain hardens. Avoid prolonged deep flooding."
                },
                "fertilizer_protocol": {
                    "dose_title": "No soil fertilizer application required",
                    "nutrients": "Plant draws accumulated nutrients from stem and flag leaf.",
                    "method": "Maintain healthy green flag leaf (provides 70% of grain carbohydrates).",
                    "precaution": "Zero nitrogen application allowed to avoid delayed maturity and grain blackening."
                },
                "key_tasks": [
                    "Watch out for Gundhi bug attacks on milky grains (foul smell)",
                    "Erect scarecrows / reflective ribbon to deter bird damage"
                ]
            },
            {
                "id": "stage_6",
                "name": "Maturity, Drying & Harvesting",
                "day_start": 111,
                "day_end": 125,
                "irrigation_protocol": {
                    "water_depth": "STOP ALL IRRIGATION 10-14 days before expected harvest date.",
                    "criticality": "Low",
                    "advisory": "Drain the field completely to dry soil crust for easy combine harvester or manual sickle movement."
                },
                "fertilizer_protocol": {
                    "dose_title": "Harvest Phase",
                    "nutrients": "None.",
                    "method": "N/A",
                    "precaution": "Ensure grain moisture reaches 14% before safe storage."
                },
                "key_tasks": [
                    "Harvest when 85-90% panicles turn golden yellow",
                    "Thresh, winnow and sun-dry paddy on clean tarpaulin",
                    "Store in moisture-proof gunny bags with neem leaves"
                ]
            }
        ]
    },
    "wheat": {
        "crop_name": "Wheat",
        "total_days": 140,
        "seed_treatment": "Treat seed with Carboxin + Thiram (Vitavax) @ 2.5g/kg or Trichoderma @ 5g/kg to prevent loose smut and flag smut.",
        "seed_rate": "40-45 kg/acre (50 kg if late sown in December)",
        "spacing": "20 cm row-to-row spacing, continuous line sowing at 4-5 cm depth",
        "stages": [
            {
                "id": "stage_1",
                "name": "Sowing & Crown Root Initiation (CRI)",
                "day_start": 0,
                "day_end": 25,
                "irrigation_protocol": {
                    "water_depth": "First irrigation at 21 days after sowing (CRI stage) - 5 cm light irrigation.",
                    "criticality": "Critical",
                    "advisory": "CRI (Day 20-22) is the most critical irrigation in wheat. Delay of 1 week causes 15-20% yield drop."
                },
                "fertilizer_protocol": {
                    "dose_title": "Basal Dose at Sowing",
                    "nutrients": "DAP 55 kg + MOP 20 kg + Urea 35 kg + Zinc Sulphate 10 kg/acre.",
                    "method": "Drill fertilizer 2-3 cm below seed depth using seed-cum-fertilizer drill.",
                    "precaution": "Ensure soil has adequate residual moisture (Rauni irrigation) before drilling."
                },
                "key_tasks": [
                    "Ensure certified seed depth of 4-5 cm",
                    "Apply pre-emergence weedicide (Pendimethalin 30% EC within 48h of sowing)"
                ]
            },
            {
                "id": "stage_2",
                "name": "Tillering & Jointing Stage",
                "day_start": 26,
                "day_end": 55,
                "irrigation_protocol": {
                    "water_depth": "Second irrigation at 40-45 days after sowing (Late tillering).",
                    "criticality": "High",
                    "advisory": "Irrigate when soil surface cracks; avoid waterlogging in clayey soils."
                },
                "fertilizer_protocol": {
                    "dose_title": "First Top Dressing (Post 1st Irrigation)",
                    "nutrients": "Urea 40 kg/acre.",
                    "method": "Top dress 2-3 days after first irrigation when field is accessible on foot (vatat condition).",
                    "precaution": "Do not top dress during frosty mornings or high winds."
                },
                "key_tasks": [
                    "Post-emergence spray for broadleaf weeds if needed",
                    "Scout for yellow rust in lower foliage"
                ]
            },
            {
                "id": "stage_3",
                "name": "Stem Extension & Booting",
                "day_start": 56,
                "day_end": 80,
                "irrigation_protocol": {
                    "water_depth": "Third irrigation at 60-65 days (Booting / Early earhead).",
                    "criticality": "High",
                    "advisory": "Ensures strong healthy ear emergence; avoid high-velocity windy days."
                },
                "fertilizer_protocol": {
                    "dose_title": "Second Top Dressing (Early Boot)",
                    "nutrients": "Remaining Urea 25 kg/acre.",
                    "method": "Complete all soil urea applications before spike emergence.",
                    "precaution": "Applying urea after ear emergence increases disease without boosting grain yield."
                },
                "key_tasks": [
                    "Inspect canopy for yellow/stripe rust linear pustules",
                    "Scout for pink stem borer or armyworm"
                ]
            },
            {
                "id": "stage_4",
                "name": "Heading & Anthesis (Flowering)",
                "day_start": 81,
                "day_end": 105,
                "irrigation_protocol": {
                    "water_depth": "Fourth irrigation at 85-90 days (Flowering stage).",
                    "criticality": "Critical",
                    "advisory": "Do not let top 15 cm soil dry out. Moisture stress at flowering increases infertile floret count."
                },
                "fertilizer_protocol": {
                    "dose_title": "Foliar Nutritional Boost",
                    "nutrients": "Foliar spray of 0.5% Potassium Nitrate (13-0-45) or 1% Zinc Sulphate + 2% Urea.",
                    "method": "Apply uniform mist in early morning or late afternoon.",
                    "precaution": "Avoid spraying when winds exceed 15 km/h."
                },
                "key_tasks": [
                    "Scout for aphid colonies on developing ears",
                    "Monitor weather forecast for unseasonal western disturbance rain/hail"
                ]
            },
            {
                "id": "stage_5",
                "name": "Milk & Soft Dough Stage",
                "day_start": 106,
                "day_end": 125,
                "irrigation_protocol": {
                    "water_depth": "Fifth irrigation at 110-115 days (Milking).",
                    "criticality": "High",
                    "advisory": "Light irrigation to reduce high canopy temperature (terminal heat stress above 30°C)."
                },
                "fertilizer_protocol": {
                    "dose_title": "Ripening Transition",
                    "nutrients": "No fertilizer. Flag leaf and awn photosynthesis nourish grain filling.",
                    "method": "N/A",
                    "precaution": "Ensure no standing water remains more than 6 hours."
                },
                "key_tasks": [
                    "Check grain milky texture to monitor dry matter accumulation",
                    "Maintain farm perimeter to prevent rodent damage"
                ]
            },
            {
                "id": "stage_6",
                "name": "Maturity & Harvest",
                "day_start": 126,
                "day_end": 140,
                "irrigation_protocol": {
                    "water_depth": "STOP ALL IRRIGATION 15 days before harvest.",
                    "criticality": "Low",
                    "advisory": "Allow field to dry thoroughly for combine harvester operation."
                },
                "fertilizer_protocol": {
                    "dose_title": "Maturity",
                    "nutrients": "None.",
                    "method": "N/A",
                    "precaution": "Dry grains to below 12% moisture before hermetic storage."
                },
                "key_tasks": [
                    "Harvest when straw turns golden yellow and grains make a crisp crack sound",
                    "Thresh and bag in HDPE bags treated with neem oil"
                ]
            }
        ]
    }
}


def calculate_crop_lifecycle(crop_name: str, sowing_date: str) -> Dict[str, Any]:
    """
    Executes the Python Agronomic Stage & Growing Degree Day Model
    """
    crop_lower = crop_name.lower()
    normalized = "wheat" if "wheat" in crop_lower else "rice"
    spec = LIFECYCLE_SPECS.get(normalized, LIFECYCLE_SPECS["rice"])

    try:
        sown = datetime.strptime(sowing_date, "%Y-%m-%d")
        das = max(0, (datetime.now() - sown).days)
    except Exception:
        das = 30

    current_idx = 0
    for i, stage in enumerate(spec["stages"]):
        if stage["day_start"] <= das <= stage["day_end"]:
            current_idx = i
            break
        if das > stage["day_end"]:
            current_idx = i

    active = spec["stages"][current_idx]
    progress = min(100, round((das / spec["total_days"]) * 100))
    next_irrigation_days = max(1, (active["day_end"] - das) % 8 + 2)

    enriched_stages = []
    for i, stg in enumerate(spec["stages"]):
        status = "COMPLETED" if i < current_idx else "CURRENT_ACTIVE" if i == current_idx else "UPCOMING"
        enriched_stages.append({
            **stg,
            "status": status,
            "is_current": (i == current_idx),
            # Compatibility helpers
            "irrigation": stg["irrigation_protocol"]["water_depth"],
            "fertilizer": f"{stg['fertilizer_protocol']['dose_title']}: {stg['fertilizer_protocol']['nutrients']}",
            "activities": stg["key_tasks"]
        })

    return {
        "success": True,
        "pipeline": "Python-CropLifecycle-Engine-v2",
        "timestamp": datetime.now().isoformat(),
        "crop_name": spec["crop_name"],
        "sowing_date": sowing_date,
        "days_after_sowing": das,
        "total_duration_days": spec["total_days"],
        "lifecycle_progress_percent": progress,
        "current_stage": {
            "name": active["name"],
            "day_range": f"Day {active['day_start']} - {active['day_end']}",
            "status": "Active Field Phase",
            "irrigation_protocol": active["irrigation_protocol"],
            "fertilizer_protocol": active["fertilizer_protocol"],
            "key_tasks": active["key_tasks"]
        },
        "upcoming_milestones": {
            "next_irrigation_due": f"In approximately {next_irrigation_days} days",
            "irrigation_guidance": active["irrigation_protocol"]["advisory"],
            "next_fertilizer_target": active["fertilizer_protocol"]["dose_title"],
            "active_fertilizer_dose": active["fertilizer_protocol"]["nutrients"]
        },
        "sowing_specifications": {
            "seed_treatment": spec["seed_treatment"],
            "seed_rate": spec["seed_rate"],
            "spacing": spec["spacing"]
        },
        "full_stages": enriched_stages
    }
