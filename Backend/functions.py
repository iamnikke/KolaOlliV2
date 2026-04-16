from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

@app.route("/api/moi")
def tervehdi():

    testi = "moi mikko"
    return jsonify({"message": testi})

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5050)