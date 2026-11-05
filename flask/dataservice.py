import pickledb
import os
import uuid
from datetime import date
from werkzeug.security import check_password_hash, generate_password_hash

db_path = os.path.join(os.path.dirname(__file__), "liftlibrary.db")
global_db = None

UNITS = ("lb", "kg")
BAR_OPTIONS = (
    {"name": "Olympic", "weights": {"lb": 45, "kg": 20}},
    {"name": "Women's", "weights": {"lb": 35, "kg": 15}},
    {"name": "Training", "weights": {"lb": 15, "kg": 10}},
)
PLATES = {
    "lb": (45, 35, 25, 10, 5, 2.5),
    "kg": (25, 20, 15, 10, 5, 2.5, 1.25),
}
CUFF_OPTIONS = (
    {"name": "None", "weights": {"lb": 0, "kg": 0}},
    {"name": "Standard collars", "weights": {"lb": 5, "kg": 2.5}},
)


def get_options():
    return {
        "units": list(UNITS),
        "bars": list(BAR_OPTIONS),
        "plates": {unit: list(weights) for unit, weights in PLATES.items()},
        "cuffs": list(CUFF_OPTIONS),
    }


def validate_lift(lift):
    if not isinstance(lift, dict):
        raise ValueError("Lift details are required.")

    lift_name = lift.get("liftName")
    lift_date = lift.get("liftDate")
    unit = lift.get("unit")
    bar_type = lift.get("barType")
    plates_per_side = lift.get("platesPerSide")
    cuff_type = lift.get("cuffType")

    if not isinstance(lift_name, str) or not lift_name.strip() or len(lift_name.strip()) > 40:
        raise ValueError("Lift name must be between 1 and 40 characters.")
    if not isinstance(lift_date, str):
        raise ValueError("A valid lift date is required.")
    try:
        date.fromisoformat(lift_date)
    except ValueError:
        raise ValueError("A valid lift date is required.")
    if unit not in UNITS:
        raise ValueError("Choose lb or kg.")
    if not isinstance(plates_per_side, list) or len(plates_per_side) > 20:
        raise ValueError("Plate selection is invalid.")
    if any(
        isinstance(weight, bool)
        or not isinstance(weight, (int, float))
        or weight not in PLATES[unit]
        for weight in plates_per_side
    ):
        raise ValueError("One or more plate weights are invalid for the selected unit.")

    bar = next((item for item in BAR_OPTIONS if item["name"] == bar_type), None)
    cuffs = next((item for item in CUFF_OPTIONS if item["name"] == cuff_type), None)
    if bar is None or cuffs is None:
        raise ValueError("Choose a valid bar and collar option.")

    total_weight = bar["weights"][unit] + cuffs["weights"][unit] + sum(plates_per_side) * 2
    return {
        "liftName": lift_name.strip(),
        "liftDate": lift_date,
        "unit": unit,
        "barType": bar_type,
        "platesPerSide": list(plates_per_side),
        "cuffType": cuff_type,
        "totalWeight": round(total_weight, 2),
    }


def load_db():
    global global_db
    db_file_already_exists = os.path.exists(db_path)
    global_db = pickledb.PickleDB(db_path)

    if hasattr(global_db, "load"):
        global_db.load()

    if not db_file_already_exists:
        global_db.set("test_user", {
            "password_hash": None,
            "lifts": {
                "pr_1": {
                    "liftName": "Bench Press",
                    "liftDate": "2026-10-30",
                    "unit": "lb",
                    "barType": "Olympic",
                    "platesPerSide": [45],
                    "cuffType": "None",
                    "totalWeight": 135
                }
            }
        })
        global_db.save()
        return

    keys = global_db.all()
    users = {}
    has_legacy_lifts = False

    for key in keys:
        record = global_db.get(key)
        if isinstance(record, dict) and "password_hash" in record and "lifts" in record:
            users[key] = record
        elif isinstance(record, dict) and "userId" in record:
            username = record.get("userId") or "legacy_user"
            user = users.setdefault(username, {"password_hash": None, "lifts": {}})
            user["lifts"][key] = {
                field: value for field, value in record.items() if field != "userId"
            }
            has_legacy_lifts = True

    if has_legacy_lifts:
        global_db.purge()
        for username, user in users.items():
            global_db.set(username, user)
        global_db.save()


def get_db():
    global global_db
    if global_db is None:
        load_db()
    return global_db


def create_user(username, password):
    username = username.strip()
    if not username or not password:
        raise ValueError("Username and password are required.")
    if len(username) > 20:
        raise ValueError("Username must be 20 characters or fewer.")

    db = get_db()
    if db.get(username) is not None:
        raise ValueError("Username already exists.")

    db.set(username, {
        "password_hash": generate_password_hash(password),
        "lifts": {}
    })
    db.save()


def authenticate_user(username, password):
    user = get_db().get(username)
    return bool(
        user
        and user.get("password_hash")
        and check_password_hash(user["password_hash"], password)
    )


def add_lift(username, lift):
    db = get_db()
    user = db.get(username)
    if user is None:
        raise ValueError("User does not exist.")

    lift_id = uuid.uuid4().hex
    user.setdefault("lifts", {})[lift_id] = validate_lift(lift)
    db.set(username, user)
    db.save()
    return lift_id


def get_prs(username):
    user = get_db().get(username)
    return user.get("lifts", {}) if user else {}


def update_lift(username, lift_id, lift):
    db = get_db()
    user = db.get(username)
    if not user or lift_id not in user.get("lifts", {}):
        return False

    user["lifts"][lift_id] = validate_lift(lift)
    db.set(username, user)
    db.save()
    return True


def delete_lift(username, lift_id):
    db = get_db()
    user = db.get(username)
    if not user or lift_id not in user.get("lifts", {}):
        return False

    del user["lifts"][lift_id]
    db.set(username, user)
    db.save()
    return True
