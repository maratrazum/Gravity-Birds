from __future__ import annotations

BASE_WIDTH = 1920
BASE_HEIGHT = 1080
WIDTH = 1366
HEIGHT = 768
SCALE_X = WIDTH / BASE_WIDTH
SCALE_Y = HEIGHT / BASE_HEIGHT
UI_SCALE = min(SCALE_X, SCALE_Y)
FPS = 60
PHYSICS_STEP = 1 / 120
FLOOR_Y = round(930 * SCALE_Y)

SKY_TOP = (12, 24, 53)
SKY_BOTTOM = (94, 162, 213)
GROUND = (104, 78, 57)
TEXT = (244, 240, 227)
SUBTLE = (180, 198, 212)
PANEL = (10, 18, 36, 210)
ACCENT = (245, 186, 75)
SUCCESS = (143, 217, 104)
DANGER = (250, 115, 97)

SLING_ANCHOR = (round(250 * SCALE_X), round(770 * SCALE_Y))
MAX_PULL = round(155 * UI_SCALE)
BASE_LAUNCH_SPEED = 7.4 * UI_SCALE

BIRD_DATA = {
    "red": {
        "color": (220, 73, 65),
        "outline": (122, 24, 21),
        "radius": round(22 * UI_SCALE),
        "label": "Red",
        "description": "Базовая птица без спецспособностей.",
        "launch_scale": 1.0,
    },
    "black": {
        "color": (36, 36, 46),
        "outline": (214, 172, 92),
        "radius": round(25 * UI_SCALE),
        "label": "Black Bomb",
        "description": "Взрывается при первом сильном касании.",
        "launch_scale": 0.95,
    },
    "blue": {
        "color": (91, 175, 236),
        "outline": (24, 74, 126),
        "radius": round(18 * UI_SCALE),
        "label": "Blue Triplet",
        "description": "После запуска делится на три птицы.",
        "launch_scale": 1.05,
    },
    "yellow": {
        "color": (247, 204, 65),
        "outline": (125, 80, 0),
        "radius": round(20 * UI_SCALE),
        "label": "Yellow Boost",
        "description": "Летит быстрее и может ускориться в полете.",
        "launch_scale": 1.22,
    },
}

MATERIALS = {
    "wood": {"color": (165, 114, 70), "outline": (92, 58, 29), "density": 0.7, "hp": 240},
    "stone": {"color": (121, 130, 150), "outline": (67, 74, 86), "density": 1.25, "hp": 460},
    "glass": {"color": (152, 228, 235), "outline": (75, 146, 155), "density": 0.5, "hp": 125},
}
