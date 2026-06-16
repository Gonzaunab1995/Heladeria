from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

def get_db():
    conn = sqlite3.connect("heladeria.db")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS sabores (
            id INTEGER PRIMARY KEY,
            nombre TEXT,
            precio INTEGER,
            color TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS pedidos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente TEXT,
            sabor TEXT,
            envase TEXT,
            total INTEGER
        )
    """)
    sabores = [
        (1, "Frutilla", 800, "#F5C4B3"),
        (2, "Menta granizada", 800, "#5DCAA5"),
        (3, "Dulce de leche", 900, "#FAC775"),
        (4, "Crema americana", 750, "#B5D4F4"),
        (5, "Moras", 850, "#CECBF6"),
        (6, "Chocolate", 900, "#D3D1C7"),
    ]
    for s in sabores:
        conn.execute("INSERT OR IGNORE INTO sabores VALUES (?,?,?,?)", s)
    conn.commit()
    conn.close()

@app.route("/sabores")
def listar_sabores():
    conn = get_db()
    sabores = conn.execute("SELECT * FROM sabores").fetchall()
    conn.close()
    return jsonify([dict(s) for s in sabores])

@app.route("/pedido", methods=["POST"])
def crear_pedido():
    data = request.json
    conn = get_db()
    conn.execute(
        "INSERT INTO pedidos (cliente, sabor, envase, total) VALUES (?,?,?,?)",
        (data["cliente"], data["sabor"], data["envase"], data["total"])
    )
    conn.commit()
    conn.close()
    return jsonify({"mensaje": "Pedido recibido!"})

@app.route("/pedidos")
def ver_pedidos():
    conn = get_db()
    pedidos = conn.execute("SELECT * FROM pedidos").fetchall()
    conn.close()
    return jsonify([dict(p) for p in pedidos])

if __name__ == "__main__":
    init_db()
    app.run(debug=True)
