from flask import Flask, render_template

from database import test_connection
from routes.measurements import bp


app = Flask(__name__)

test_connection()
app.register_blueprint(bp)


@app.get("/")
def home():
    return render_template("index.html")


@app.get("/instrument")
def instrument():
    return render_template("instrument.html")


@app.get("/record")
def record():
    return render_template("record.html")


@app.get("/registrar")
def registrar():
    return render_template("registrar.html")


@app.get("/health")
def health():
    return {
        "status": "ok"
    }


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000
    )
