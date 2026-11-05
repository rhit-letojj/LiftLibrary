import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import dataservice
import httpserver


class LiftLibraryApiTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.original_db_path = dataservice.db_path
        self.original_db = dataservice.global_db
        dataservice.db_path = str(Path(self.temp_dir.name) / "test.db")
        dataservice.global_db = None
        self.client = httpserver.app.test_client()

    def tearDown(self):
        dataservice.db_path = self.original_db_path
        dataservice.global_db = self.original_db
        self.temp_dir.cleanup()

    def create_account_and_login(self):
        response = self.client.post(
            "/api/register",
            json={"username": "testuser", "password": "test-password"},
        )
        self.assertEqual(response.status_code, 201)
        response = self.client.post(
            "/api/login",
            json={"username": "testuser", "password": "test-password"},
        )
        self.assertEqual(response.status_code, 200)

    def test_authentication_and_lift_crud(self):
        self.assertEqual(self.client.get("/api/lifts").status_code, 401)
        self.create_account_and_login()

        lift = {
            "liftName": "Bench Press",
            "liftDate": "2026-11-05",
            "unit": "lb",
            "barType": "Olympic",
            "platesPerSide": [45],
            "cuffType": "Standard collars",
        }
        response = self.client.post("/api/lifts", json=lift)
        self.assertEqual(response.status_code, 201)
        lift_id = response.json["id"]

        response = self.client.get("/api/lifts")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json[0]["totalWeight"], 140)

        lift["liftName"] = "Paused Bench"
        response = self.client.patch(f"/api/lifts/{lift_id}", json=lift)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.get("/api/lifts").json[0]["liftName"], "Paused Bench")

        self.assertEqual(self.client.delete(f"/api/lifts/{lift_id}").status_code, 200)
        self.assertEqual(self.client.get("/api/lifts").json, [])
        self.assertEqual(self.client.post("/api/logout").status_code, 200)
        self.assertEqual(self.client.get("/api/lifts").status_code, 401)

    def test_lift_validation_rejects_invalid_plate_weights(self):
        self.create_account_and_login()
        response = self.client.post(
            "/api/lifts",
            json={
                "liftName": "Bench Press",
                "liftDate": "2026-11-05",
                "unit": "lb",
                "barType": "Olympic",
                "platesPerSide": [999],
                "cuffType": "None",
            },
        )
        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()
