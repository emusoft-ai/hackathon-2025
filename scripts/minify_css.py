import re
from pathlib import Path


def minify_css(css: str) -> str:
    """Very small CSS minifier: strips comments & unnecessary whitespace."""
    # Remove /* ... */ comments
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    # Collapse whitespace
    css = re.sub(r"\s+", " ", css)
    # Remove space around some punctuation
    css = re.sub(r"\s*([{}:;,])\s*", r"\1", css)
    # Remove trailing semicolons before }
    css = re.sub(r";}", "}", css)
    return css.strip()


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    css_dir = root / "css"

    bundle_file = css_dir / "app.bundle.css"
    out_file = css_dir / "app.bundle.min.css"

    if not bundle_file.exists():
        raise SystemExit(f"Bundle file not found: {bundle_file}")

    # Read imports from app.bundle.css and inline their contents
    combined_css_parts = []
    for line in bundle_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or not line.startswith("@import"):
            continue

        # Extract path inside url('...') or url("...")
        try:
            url_part = line.split("url(")[1].split(")")[0].strip().strip("'\"")
        except Exception:
            continue

        css_path = css_dir / url_part
        if css_path.exists():
            combined_css_parts.append(css_path.read_text(encoding="utf-8"))

    combined_css = "\n".join(combined_css_parts)
    minified = minify_css(combined_css)
    out_file.write_text(minified, encoding="utf-8")
    print(f"Wrote minified bundle to {out_file} ({len(minified)} bytes)")


if __name__ == "__main__":
    main()


