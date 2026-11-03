import pickledb
import os
import uuid
from werkzeug.security import check_password_hash, generate_password_hash

db_path = os.path.join(os.path.dirname(__file__), "liftlibrary.db")
global_db = None


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
    user["lifts"][lift_id] = lift
    db.set(username, user)
    db.save()
    return lift_id


def get_prs(username):
    user = get_db().get(username)
    return user["lifts"] if user else {}

