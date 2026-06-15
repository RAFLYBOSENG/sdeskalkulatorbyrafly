from __future__ import annotations

from pathlib import Path

from flask import Flask, render_template, request

from sdes import Trace, decrypt_bits, encrypt_bits


BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

app = Flask(
    __name__,
    static_folder=str(PROJECT_ROOT),
    static_url_path="/static",
    template_folder=str(BASE_DIR / "templates"),
)


def _make_context() -> dict[str, object]:
    return {
        "plaintext": "",
        "key": "",
        "mode": "encrypt",
        "error_message": None,
        "show_output": False,
        "result_bits": [],
        "trace": Trace(),
    }


@app.route("/", methods=["GET", "POST"])
def index():
    context = _make_context()

    if request.method == "POST":
        plaintext = request.form.get("inputText", "").strip()
        key = request.form.get("inputKey", "").strip()
        mode = request.form.get("encryptFlag", "encrypt")

        context["plaintext"] = plaintext
        context["key"] = key
        context["mode"] = mode if mode in {"encrypt", "decrypt"} else "encrypt"

        trace = Trace()
        try:
            if context["mode"] == "encrypt":
                result = encrypt_bits(plaintext, key, trace)
            else:
                result = decrypt_bits(plaintext, key, trace)
        except ValueError:
            context["error_message"] = (
                "Kalkulasi tidak dapat dilakukan, Silahkan cek inputan anda."
            )
        else:
            context["show_output"] = True
            context["result_bits"] = list(result)
            context["trace"] = trace

    return render_template("index.html", **context)


if __name__ == "__main__":
    app.run(debug=True)