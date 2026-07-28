from flask import Flask
from routes.measurements import bp
app=Flask(__name__)
app.register_blueprint(bp)
@app.get("/")
def home(): return {"service":"Climate Server","status":"running"}
@app.get("/health")
def health(): return {"status":"ok"}
if __name__=="__main__": app.run(host="0.0.0.0",port=5000)
