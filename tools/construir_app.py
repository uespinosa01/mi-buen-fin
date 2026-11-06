"""Inyecta src/logica.js en src/app.html y escribe docs/index.html, el sitio instalable."""
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
plantilla = (RAIZ / "src/app.html").read_text(encoding="utf-8")
logica = (RAIZ / "src/logica.js").read_text(encoding="utf-8")
if "/*__LOGICA__*/" not in plantilla:
    raise SystemExit("falta el marcador /*__LOGICA__*/ en src/app.html")
(RAIZ / "docs").mkdir(exist_ok=True)
(RAIZ / "docs/index.html").write_text(plantilla.replace("/*__LOGICA__*/", logica), encoding="utf-8")
print("docs/index.html", (RAIZ / "docs/index.html").stat().st_size, "bytes")
