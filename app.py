from flask import Flask, jsonify, render_template, request
from sqlalchemy import select
from routes.measurements import bp
from database import test_connection
app=Flask(__name__)
test_connection()
app.register_blueprint(bp)
@app.get("/")
def home():
    return render_template("index.html")
@app.get("/health")
def health(): return {"status":"ok"}
if __name__=="__main__": app.run(host="0.0.0.0",port=5000)
