
import pickledb
import os

db_path = os.path.join(os.path.dirname(__file__), "liftlibrary.db")
global_db = None

def load_db():
    global global_db
    db_file_already_exists = os.path.exists(db_path)
    global_db = pickledb.PickleDB(db_path)

    if hasattr(global_db, "load"):
        global_db.load()

    if not db_file_already_exists:
        global_db.set("pr_1", {
            "userId": "test_user",
            "liftName": "Bench Press",
            "liftDate": "2026-10-30",
            "unit": "lb",
            "barType": "Olympic",
            "platesPerSide": [45],
            "collarType": "None",
            "totalWeight": 135
        })
        global_db.save()


def get_db():
    global global_db
    if global_db is None:
        load_db()
    return global_db


def get_prs():
    db = get_db()
    all_prs = db.all()
    prs = {}

    for pr in all_prs:
        prs[pr] = db.get(pr)

    return prs
