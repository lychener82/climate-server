from flask import Blueprint,request,jsonify
bp=Blueprint("m",__name__)
@bp.post("/api/measurements")
def m():
 data=request.get_json(); print(data,flush=True); return jsonify({"status":"ok"})
