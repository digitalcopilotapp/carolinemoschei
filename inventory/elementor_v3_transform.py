#!/usr/bin/env python3
"""
Elementor JSON transformer — applies v3 design system tokens to Elementor page data.
Usage: python3 elementor_v3_transform.py <input.json> [output.json]
"""

import json
import sys
import copy

# ── Design System v3 Tokens ───────────────────────────────────────────────────

COLOR_MAP = {
    # v2 rose/terracota palette → v3
    "#7D4E49": "#b8967a",   # primary rose → terracota accent
    "#7d4e49": "#b8967a",
    "#F5ECE4": "#faf8f5",   # secondary cream → bg
    "#f5ece4": "#faf8f5",
    "#8C6562": "rgba(30,25,23,0.80)",  # text rose → body text
    "#8c6562": "rgba(30,25,23,0.80)",
    "#B16E67": "#b8967a",   # accent coral → terracota
    "#b16e67": "#b8967a",
    "#030303": "#1e1917",   # near-black → hero dark
    "#0A0A0A": "#1e1917",   # base text dark → hero dark
    "#0a0a0a": "#1e1917",
    "#FFBC7D": "#b8967a",   # transition peach → terracota
    "#ffbc7d": "#b8967a",
    "#80514D": "#b8967a",   # links rose → terracota
    "#80514d": "#b8967a",
    "#7D4E4954": "rgba(184,150,122,0.33)",  # opacity primary → opacity terracota
    "#7d4e4954": "rgba(184,150,122,0.33)",
    # Common dark/near-black neutrals used in sections
    "#000000": "#1e1917",
    "#111111": "#1e1917",
    "#1A1A1A": "#1e1917",
    "#1a1a1a": "#1e1917",
    "#222222": "#1e1917",
    "#FFFFFF": "#faf8f5",
    "#ffffff": "#faf8f5",
    "#F0F0F0": "#faf8f5",
    "#f0f0f0": "#faf8f5",
    "#FAFAFA": "#faf8f5",
    "#fafafa": "#faf8f5",
}

FONT_MAP = {
    "Monik Font": "Times New Roman",
    "Monik": "Times New Roman",
    "sweet-sans-pro": "Outfit",
    "Sora": "Outfit",
    "Inter": "Outfit",
    "Poppins": "Outfit",
    "Roboto": "Outfit",
    "Open Sans": "Outfit",
    "Lato": "Outfit",
}

# Heading widget types that should get Times New Roman
HEADING_WIDGET_TYPES = {"heading", "ha-heading", "ha-fancy-heading"}

# ── Transformation Functions ──────────────────────────────────────────────────

def transform_color(val: str) -> str:
    if not isinstance(val, str):
        return val
    stripped = val.strip()
    return COLOR_MAP.get(stripped, COLOR_MAP.get(stripped.upper(), val))


def transform_font(val: str) -> str:
    if not isinstance(val, str):
        return val
    return FONT_MAP.get(val.strip(), val)


def is_heading_element(el) -> bool:
    """True if this element is a heading widget."""
    if not isinstance(el, dict):
        return False
    settings = el.get("settings", {})
    wt = ""
    if isinstance(settings, dict):
        wt = settings.get("widgetType", el.get("widgetType", ""))
    return wt in HEADING_WIDGET_TYPES or (el.get("elType", "") == "widget" and "heading" in wt.lower())


def transform_settings(settings, is_heading: bool = False):
    if not isinstance(settings, dict):
        return settings
    """Apply v3 color and font tokens to a settings dict."""
    result = copy.deepcopy(settings)

    # Color fields to transform
    color_keys = [
        "background_color", "color", "heading_color", "text_color",
        "button_background_color", "button_text_color", "border_color",
        "icon_color", "overlay_color", "tab_background_color",
        "background_color_b", "shape_fill", "hover_color",
        "_background_color", "typography_color",
    ]

    for key in color_keys:
        if key in result:
            result[key] = transform_color(result[key])

    # Background gradient colors
    if "background_color_stop" in result:
        stop = result["background_color_stop"]
        if isinstance(stop, dict) and "color" in stop:
            stop["color"] = transform_color(stop["color"])

    # Typography font family
    font_keys = ["typography_font_family", "font_family"]
    for key in font_keys:
        if key in result:
            current_font = result[key]
            if is_heading:
                result[key] = "Times New Roman"
            else:
                result[key] = transform_font(current_font)

    # Ensure heading typography is set to custom when we override
    if is_heading and "typography_font_family" in result:
        result["typography_typography"] = "custom"
        result["typography_font_style"] = "normal"
        result["typography_font_weight"] = "400"

    # Button-specific overrides
    if result.get("widgetType") == "button" or "button_text" in result:
        if "button_background_color" in result:
            result["button_background_color"] = "#b8967a"
        elif "background_color" in result and result.get("_css_class", "").find("btn") >= 0:
            result["background_color"] = "#b8967a"

    return result


def transform_element(el) -> dict:
    """Recursively transform a single Elementor element."""
    if not isinstance(el, dict):
        return el
    result = copy.deepcopy(el)
    is_heading = is_heading_element(el)

    if "settings" in result:
        result["settings"] = transform_settings(result["settings"], is_heading)

    if "elements" in result:
        result["elements"] = [transform_element(child) for child in result["elements"]]

    return result


def transform_page(data: list) -> list:
    """Transform a full Elementor page JSON (list of top-level sections)."""
    return [transform_element(section) for section in data]


# ── CLI ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 elementor_v3_transform.py <input.json> [output.json]")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else input_path.replace(".json", "-v3.json")

    with open(input_path, "r") as f:
        data = json.load(f)

    transformed = transform_page(data)

    with open(output_path, "w") as f:
        json.dump(transformed, f, ensure_ascii=False, separators=(",", ":"))

    print(f"Transformed: {input_path} → {output_path}")
    print(f"Elements processed: {len(transformed)} top-level sections")
