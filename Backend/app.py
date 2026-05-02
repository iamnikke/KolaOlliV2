from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
import random
from geopy.distance import geodesic
from geopy import distance

app = Flask(__name__)

# headers: salli liikenne localhostista

# CORS(app, origins=["http://localhost:3000"])
CORS(app, resources={r"/api/*": {"origins": "*"}})

# db asetukset
DB_CONFIG = {
    "host": "127.0.0.1",
    "port": 3306,
    "user": "root",
    "password": "Aaro22",
    "database": "cola_game",
    "autocommit": True
}

# default arvot uudelle pelaajalle
DEFAULT_USER = {
    "username": "Matti Oletus",
    "money": 1000,
    "coca_cola": 100,
    "xp": 0,
    "total_travel_km": 0,
    "total_co2_consumed": 0,
    "location": "EFHK",
    "clock": "16:00:00",
    "bribes": 0,
    "bribes_succeeded": 0,
    "caught": 0,
    "sales": 0,
    "home_port": "EFHK"
}


# kollektiivinen query funktio v1:sestä tuttu
def query_db(query, params=None):
    # yhdistä
    connection = mysql.connector.connect(**DB_CONFIG)
    cursor = connection.cursor(dictionary=True)  # palauttaa datan {key: value}

    # query
    cursor.execute(query, params or ())

    # jos query on SELECT -> hae tulokset
    if cursor.with_rows:
        result = cursor.fetchall()
    else:
        result = None

    # Sulje yhteys
    cursor.close()
    connection.close()

    return result


# Muuta db tietueet -> JSON että selain ymmärtää sitä
def clean_user(user):
    return {
        "id": user["id"],
        "username": user["username"],
        "money": float(user["money"]),  # muunnos Decimal -> float
        "coca_cola": user["coca_cola"],
        "xp": user["xp"],
        "total_travel_km": float(user["total_travel_km"]),
        "total_co2_consumed": float(user["total_co2_consumed"]),
        "location": user["location"],
        "clock": str(user["clock"]),  # muuttos time -> string
        "bribes": user["bribes"],
        "bribes_succeeded": bool(user["bribes_succeeded"]),
        "caught": bool(user["caught"]),
        "sales": user["sales"],
        "home_port": user["home_port"]
    }


# Etsii pelaajan db
def get_user_by_username(username):
    result = query_db(
        "SELECT * FROM user_info WHERE username = %s",
        (username,)
    )

    if result:
        return result[0]  # palauta ensimmäinen rivi

    return None


# Luo uusi pelaaja
def create_user(username):
    query_db("""
             INSERT INTO user_info (username,
                                    money,
                                    coca_cola,
                                    xp,
                                    total_travel_km,
                                    total_co2_consumed,
                                    location,
                                    clock,
                                    bribes,
                                    bribes_succeeded,
                                    caught,
                                    sales,
                                    home_port)
             VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
             """, (
                 username,
                 DEFAULT_USER["money"],
                 DEFAULT_USER["coca_cola"],
                 DEFAULT_USER["xp"],
                 DEFAULT_USER["total_travel_km"],
                 DEFAULT_USER["total_co2_consumed"],
                 DEFAULT_USER["location"],
                 DEFAULT_USER["clock"],
                 DEFAULT_USER["bribes"],
                 DEFAULT_USER["bribes_succeeded"],
                 DEFAULT_USER["caught"],
                 DEFAULT_USER["sales"],
                 DEFAULT_USER["home_port"]
             ))


@app.route("/api/get_flight_info", methods=["GET"])
def get_flight_info():
    try:
        currentLocation = "EFHK"
        targetCountry = request.args.get("icao", "").strip()

        currentLocationXY = query_db(
            "SELECT latitude_deg, longitude_deg FROM airport WHERE ident = %s",
            (currentLocation,)
        )

        targetCountryXY = query_db(
            "SELECT latitude_deg, longitude_deg FROM airport WHERE ident = %s",
            (targetCountry,)
        )

        if not currentLocationXY or not targetCountryXY:
            return jsonify({"error": "Airport not found"}), 404

        current = currentLocationXY[0]
        target = targetCountryXY[0]

        current_coords = (
            float(current["latitude_deg"]),
            float(current["longitude_deg"])
        )

        target_coords = (
            float(target["latitude_deg"]),
            float(target["longitude_deg"])
        )

        dist = geodesic(current_coords, target_coords).km

        return jsonify({
            "distance": round(dist, 2),
            "from": currentLocation,
            "to": targetCountry
        })

    except Exception as error:
        print("FLIGHT ERROR:", error)
        return jsonify({"error": "VIRHE"}), 500


@app.route("/api/calculate_cost", methods=["GET"])
def get_cost():
    dist = float(request.args.get("dist"))
    plane_idx = int(request.args.get("plane_idx"))

    # Python laskee hinnan (sama logiikka kuin v1:ssä)
    multipliers = [1.0, 1.2, 1.5]
    price = (dist * 0.2) * multipliers[plane_idx]

    return jsonify({"price": round(price, 2)})


# Testipätkä, saa poistaa
@app.route("/api/moi", methods=["GET"])
def hello():
    return jsonify({"message": "moi mikko"})


# Tunnistautumis flow eli hae pelaaja / luo käyttäjä
@app.route("/api/authenticate", methods=["GET"])
def authenticate():
    try:
        username = request.args.get("username", "").strip()

        # Jos input on tyhjä, käytä default nimeä
        if username == "":
            username = DEFAULT_USER["username"]

        # Yritä etsiä olemassa oleva pelaaja
        user = get_user_by_username(username)

        # Jos pelaajaa ei löyty entuudeltaan niin luo uusi
        if not user:
            create_user(username)
            user = get_user_by_username(username)

        # Palauta data puhtaana (json muodossa) selaimelle
        return jsonify(clean_user(user))

    except Exception as error:
        # Jos joku menee rikki, niin palauta virhe
        print("AUTH ERROR:", error)
        return jsonify({"error": "VIRHE: "}), 500


def calculate_fines(capacity, load):
    overload = load - capacity
    if overload > capacity:
        return (load - capacity) * 10  # overload
    return (load - capacity) * 5  # perus sakko


def get_caught():
    # 90% chanssi jäädä kiinni jos yli capacityn
    return random.randint(0, 100) > 10


@app.route("/api/move_player", methods=["POST"])
def move_player():
    try:
        data = request.json
        username = data.get("username")
        target_icao = data.get("icao")
        dist = data.get("distance", 0)
        load = int(data.get("load", 0))
        plane_capacity = int(data.get("capacity", 50))

        user = get_user_by_username(username)
        if not user:
            return jsonify({"error": "Pelaajaa ei löytynyt"}), 404

        cost = float(dist) * 0.2

        if float(user["money"]) < cost:
            return jsonify({"success": False, "message": "Ei tarpeeksi rahaa!"}), 400

        if user["coca_cola"] < load:
            return jsonify({"success": False, "message": "Ei tarpeeksi colaa varastossa!"}), 400

        caught = False
        fines = 0
        if load > plane_capacity:
            if get_caught():
                caught = True
                fines = calculate_fines(plane_capacity, load)

        multiplier = (float(dist) / 1000) + 1
        load_value = load * multiplier * 3

        new_money = float(user["money"]) - cost + load_value
        new_total_dist = float(user["total_travel_km"]) + float(dist)
        new_cola = user["coca_cola"] - load

        query_db("""
                 UPDATE user_info
                 SET location        = %s,
                     total_travel_km = %s,
                     money           = %s,
                     coca_cola       = %s
                 WHERE username = %s
                 """, (target_icao, new_total_dist, new_money, new_cola, username))

        updated_user = get_user_by_username(username)

        return jsonify({
            "success": True,
            "caught": caught,
            "fines": fines,
            "sales_profit": load_value,
            "user": clean_user(updated_user)
        })

    except Exception as error:
        print("MOVE ERROR:", error)
        return jsonify({"error": str(error)}), 500


@app.route("/api/handle_bribe", methods=["POST"])
def handle_bribe():
    data = request.json
    username = data.get("username")
    fines = float(data.get("fines"))
    choice = data.get("choice")

    user = get_user_by_username(username)
    bribe_price = fines * 0.2
    final_penalty = 0
    msg = ""

    if choice == "yes":
        if float(user["money"]) < bribe_price:
            return jsonify({"success": False, "message": "Ei rahaa edes lahjukseen!"})

        if random.random() > 0.5:
            final_penalty = fines * 2
            msg = f"Lahjonta epäonnistui! Jouduit maksamaan tuplasakot ({final_penalty}€)."
        else:
            final_penalty = 0
            msg = "Lahjonta onnistui! Selvisit pelkällä lahjuksen hinnalla."

        total_deduction = bribe_price + final_penalty
    else:
        total_deduction = fines
        msg = f"Maksoit normaalit sakot ({fines}€)."

    new_money = float(user["money"]) - total_deduction

    # Päivitetään rahat ja lahjontayritysten määrä
    query_db("UPDATE user_info SET money = %s, bribes = bribes + 1 WHERE username = %s",
             (new_money, username))

    updated_user = get_user_by_username(username)

    # Tarkistetaan menikö pelaaja konkurssiin
    game_over = False
    if new_money < 0:
        game_over = True
        msg += " Rahasi loppuivat – peli ohi!"

    return jsonify({
        "success": True,
        "message": msg,
        "gameover": game_over,
        "user": clean_user(updated_user)
    })


@app.route("/api/return_home", methods=["POST"])
def return_home():
    try:
        data = request.json
        username = data.get("username")
        user = get_user_by_username(username)

        if not user:
            return jsonify({"error": "Pelaajaa ei löytynyt"}), 404

        home_port = user.get("home_port", "EFHK")

        if user["location"] == home_port:
            return jsonify({"success": False, "message": "Olet jo kotona!"}), 400

        # Haetaan koordinaatit etäisyyden laskemiseksi takaisin kotiin
        current_loc = query_db("SELECT latitude_deg, longitude_deg FROM airport WHERE ident = %s", (user["location"],))[
            0]
        home_loc = query_db("SELECT latitude_deg, longitude_deg FROM airport WHERE ident = %s", (home_port,))[0]

        dist = geodesic(
            (float(current_loc["latitude_deg"]), float(current_loc["longitude_deg"])),
            (float(home_loc["latitude_deg"]), float(home_loc["longitude_deg"]))
        ).km

        cost = dist * 0.2

        if float(user["money"]) < cost:
            return jsonify({"success": False, "message": "Ei tarpeeksi rahaa paluulentoon! Peli ohi."}), 400

        # Faija tuo uutta colaa 200-500 kpl
        added_cola = random.randint(200, 500)

        new_money = float(user["money"]) - cost
        new_total_dist = float(user["total_travel_km"]) + dist
        new_cola = user["coca_cola"] + added_cola

        query_db("""
                 UPDATE user_info
                 SET location        = %s,
                     total_travel_km = %s,
                     money           = %s,
                     coca_cola       = %s
                 WHERE username = %s
                 """, (home_port, new_total_dist, new_money, new_cola, username))

        updated_user = get_user_by_username(username)

        return jsonify({
            "success": True,
            "cost": round(cost, 2),
            "added_cola": added_cola,
            "user": clean_user(updated_user)
        })

    except Exception as error:
        print("RETURN ERROR:", error)
        return jsonify({"error": str(error)}), 500


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5050)
