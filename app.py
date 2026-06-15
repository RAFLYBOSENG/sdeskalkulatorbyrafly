"""
Flask backend untuk aplikasi simulasi DES.
Seluruh logika kriptografi DES berada di sisi klien (JavaScript).
Backend hanya melayani halaman web statis.
"""
from flask import Flask, render_template

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
