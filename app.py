from flask import Flask, request, jsonify

app = Flask(__name__)


@app.route("/")
def home():
    return {
        "service": "Climate Server",
        "status": "running"
    }


@app.route("/health")
def health():
    return {
        "status": "ok"
    }


@app.route("/api/measurements", methods=["POST"])
def measurements():

    data = request.get_json()

    print("Neue Messung:")
    print(data)

    return jsonify({
        "status": "ok"
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
