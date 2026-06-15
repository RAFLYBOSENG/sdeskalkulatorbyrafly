from __future__ import annotations

from flask import Flask, render_template, request
from sdes import Trace, decrypt_bits, encrypt_bits

app = Flask(
    __name__,
    static_folder="static",
    static_url_path="/static",
    template_folder="templates",
)


def get_dec_hex(binary_str: str) -> tuple[int, str]:
    if not binary_str:
        return 0, "00"
    try:
        val = int(binary_str, 2)
        if len(binary_str) <= 8:
            return val, f"{val:02X}"
        else:
            return val, f"{val:03X}"
    except ValueError:
        return 0, "00"


def _make_context() -> dict[str, object]:
    return {
        "plaintext": "",
        "key": "",
        "mode": "encrypt",
        "error_message": None,
        "show_output": False,
        "result_bits": [],
        "trace": Trace(),
        "input_dec": 0,
        "input_hex": "00",
        "key_dec": 0,
        "key_hex": "000",
        "k1_str": "",
        "k1_dec": 0,
        "k1_hex": "00",
        "k2_str": "",
        "k2_dec": 0,
        "k2_hex": "00",
        "result_str": "",
        "result_dec": 0,
        "result_hex": "00",
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
                "Kalkulasi tidak dapat dilakukan. Silakan cek format input Anda (8-bit binary dan 10-bit key)."
            )
        else:
            context["show_output"] = True
            context["result_bits"] = list(result)
            context["trace"] = trace

            # Formatted values for display
            context["input_dec"], context["input_hex"] = get_dec_hex(plaintext)
            context["key_dec"], context["key_hex"] = get_dec_hex(key)

            k1_str = "".join(str(b) for b in trace.sub_key_k1)
            k2_str = "".join(str(b) for b in trace.sub_key_k2)
            result_str = "".join(result)

            context["k1_str"] = k1_str
            context["k1_dec"], context["k1_hex"] = get_dec_hex(k1_str)

            context["k2_str"] = k2_str
            context["k2_dec"], context["k2_hex"] = get_dec_hex(k2_str)

            context["result_str"] = result_str
            context["result_dec"], context["result_hex"] = get_dec_hex(result_str)

    return render_template("index.html", **context)


@app.route("/materi")
def materi():
    return render_template("materi.html")


@app.route("/rumus")
def rumus():
    return render_template("rumus.html")


@app.route("/tentang")
def tentang():
    return render_template("tentang.html")


if __name__ == "__main__":
    app.run(debug=True)