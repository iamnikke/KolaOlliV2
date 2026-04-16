from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

import mysql.connector

def queryDb(query):
    mysql_connection = mysql.connector.connect(
        host="127.0.0.1",
        port="3306",
        user="admin",
        password="admin",
        database="kolaolligame",
        autocommit=True
    )
    cursor = mysql_connection.cursor()
    cursor.execute(query)

    result = cursor.fetchall()
    mysql_connection.close()
    return result









@app.route("/api/get_user_location", methods=["GET"])
def get_user_location():
    user_id = request.args.get("user_id")
    result = queryDb(f"SELECT location FROM user_info where id = {user_id}")
    return jsonify({"location": result[0][0]})









@app.route("/api/moi")
def tervehdi():
    testi = "moi mikko"
    return jsonify({"message": testi})









if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5050)