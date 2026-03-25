from __future__ import annotations

from .constants import SCALE_X, SCALE_Y, UI_SCALE


def sx(value: float) -> int:
    return round(value * SCALE_X)


def sy(value: float) -> int:
    return round(value * SCALE_Y)


def ss(value: float) -> int:
    return round(value * UI_SCALE)


BASE_LEVELS = [
    {
        "name": "Moon Training Grounds",
        "planet": "Moon",
        "gravity": 280,
        "description": "Слабая гравитация, удобный вводный уровень.",
        "birds": ["red", "red", "blue", "yellow"],
        "palette": {"top": (16, 20, 46), "bottom": (86, 113, 165), "dust": (234, 214, 180)},
        "structures": [
            {"x": 1380, "y": 870, "w": 340, "h": 24, "material": "stone"},
            {"x": 1290, "y": 795, "w": 28, "h": 146, "material": "wood"},
            {"x": 1470, "y": 795, "w": 28, "h": 146, "material": "wood"},
            {"x": 1380, "y": 705, "w": 226, "h": 24, "material": "glass"},
            {"x": 1380, "y": 638, "w": 24, "h": 110, "material": "wood"},
            {"x": 1298, "y": 620, "w": 180, "h": 22, "material": "glass"},
            {"x": 1462, "y": 620, "w": 180, "h": 22, "material": "glass"},
        ],
        "pigs": [(1380, 840), (1380, 585)],
    },
    {
        "name": "Mars Windbreak",
        "planet": "Mars",
        "gravity": 420,
        "description": "Средняя гравитация и несколько хрупких слабых мест.",
        "birds": ["red", "blue", "yellow", "black"],
        "palette": {"top": (68, 29, 20), "bottom": (212, 117, 69), "dust": (244, 189, 131)},
        "structures": [
            {"x": 1340, "y": 875, "w": 420, "h": 26, "material": "stone"},
            {"x": 1200, "y": 790, "w": 32, "h": 166, "material": "wood"},
            {"x": 1320, "y": 790, "w": 32, "h": 166, "material": "wood"},
            {"x": 1450, "y": 790, "w": 32, "h": 166, "material": "wood"},
            {"x": 1540, "y": 790, "w": 32, "h": 166, "material": "wood"},
            {"x": 1260, "y": 694, "w": 210, "h": 24, "material": "glass"},
            {"x": 1496, "y": 694, "w": 210, "h": 24, "material": "glass"},
            {"x": 1380, "y": 614, "w": 310, "h": 28, "material": "stone"},
            {"x": 1380, "y": 525, "w": 34, "h": 150, "material": "glass"},
            {"x": 1270, "y": 512, "w": 190, "h": 22, "material": "wood"},
            {"x": 1490, "y": 512, "w": 190, "h": 22, "material": "wood"},
        ],
        "pigs": [(1260, 658), (1498, 658), (1380, 478)],
    },
    {
        "name": "Earth Citadel",
        "planet": "Earth",
        "gravity": 560,
        "description": "Классическая тяжесть и высокий замок с центральной башней.",
        "birds": ["red", "yellow", "blue", "black", "red"],
        "palette": {"top": (34, 91, 152), "bottom": (152, 208, 245), "dust": (235, 219, 158)},
        "structures": [
            {"x": 1380, "y": 888, "w": 500, "h": 24, "material": "stone"},
            {"x": 1180, "y": 810, "w": 34, "h": 168, "material": "stone"},
            {"x": 1290, "y": 810, "w": 30, "h": 168, "material": "wood"},
            {"x": 1470, "y": 810, "w": 30, "h": 168, "material": "wood"},
            {"x": 1580, "y": 810, "w": 34, "h": 168, "material": "stone"},
            {"x": 1235, "y": 720, "w": 160, "h": 24, "material": "glass"},
            {"x": 1380, "y": 724, "w": 190, "h": 30, "material": "stone"},
            {"x": 1525, "y": 720, "w": 160, "h": 24, "material": "glass"},
            {"x": 1380, "y": 610, "w": 40, "h": 190, "material": "stone"},
            {"x": 1268, "y": 540, "w": 186, "h": 24, "material": "wood"},
            {"x": 1492, "y": 540, "w": 186, "h": 24, "material": "wood"},
            {"x": 1380, "y": 454, "w": 290, "h": 26, "material": "glass"},
        ],
        "pigs": [(1238, 680), (1520, 680), (1380, 576), (1380, 418)],
    },
    {
        "name": "Mercury Forge",
        "planet": "Mercury",
        "gravity": 690,
        "description": "Плотные каменные стены и тяжелые пролеты.",
        "birds": ["yellow", "blue", "black", "yellow", "red"],
        "palette": {"top": (71, 42, 31), "bottom": (233, 176, 92), "dust": (248, 210, 139)},
        "structures": [
            {"x": 1380, "y": 892, "w": 560, "h": 26, "material": "stone"},
            {"x": 1150, "y": 806, "w": 36, "h": 176, "material": "stone"},
            {"x": 1260, "y": 806, "w": 30, "h": 176, "material": "glass"},
            {"x": 1380, "y": 806, "w": 36, "h": 176, "material": "stone"},
            {"x": 1500, "y": 806, "w": 30, "h": 176, "material": "glass"},
            {"x": 1610, "y": 806, "w": 36, "h": 176, "material": "stone"},
            {"x": 1204, "y": 712, "w": 190, "h": 26, "material": "wood"},
            {"x": 1380, "y": 708, "w": 210, "h": 34, "material": "stone"},
            {"x": 1556, "y": 712, "w": 190, "h": 26, "material": "wood"},
            {"x": 1300, "y": 596, "w": 30, "h": 164, "material": "wood"},
            {"x": 1460, "y": 596, "w": 30, "h": 164, "material": "wood"},
            {"x": 1380, "y": 496, "w": 270, "h": 24, "material": "glass"},
            {"x": 1380, "y": 410, "w": 42, "h": 148, "material": "stone"},
        ],
        "pigs": [(1204, 674), (1556, 674), (1380, 670), (1380, 374)],
    },
    {
        "name": "Jupiter Sky Bastion",
        "planet": "Jupiter",
        "gravity": 860,
        "description": "Самая сложная арена: очень тяжелая физика и огромная крепость.",
        "birds": ["yellow", "blue", "black", "red", "yellow", "black"],
        "palette": {"top": (47, 26, 33), "bottom": (186, 121, 103), "dust": (245, 205, 170)},
        "structures": [
            {"x": 1380, "y": 898, "w": 620, "h": 28, "material": "stone"},
            {"x": 1120, "y": 806, "w": 38, "h": 180, "material": "stone"},
            {"x": 1230, "y": 806, "w": 30, "h": 180, "material": "wood"},
            {"x": 1340, "y": 806, "w": 38, "h": 180, "material": "stone"},
            {"x": 1460, "y": 806, "w": 38, "h": 180, "material": "stone"},
            {"x": 1570, "y": 806, "w": 30, "h": 180, "material": "wood"},
            {"x": 1680, "y": 806, "w": 38, "h": 180, "material": "stone"},
            {"x": 1176, "y": 712, "w": 170, "h": 24, "material": "glass"},
            {"x": 1290, "y": 712, "w": 160, "h": 28, "material": "stone"},
            {"x": 1460, "y": 712, "w": 160, "h": 28, "material": "stone"},
            {"x": 1584, "y": 712, "w": 170, "h": 24, "material": "glass"},
            {"x": 1380, "y": 618, "w": 420, "h": 30, "material": "stone"},
            {"x": 1240, "y": 530, "w": 30, "h": 152, "material": "wood"},
            {"x": 1380, "y": 530, "w": 42, "h": 152, "material": "stone"},
            {"x": 1520, "y": 530, "w": 30, "h": 152, "material": "wood"},
            {"x": 1380, "y": 434, "w": 260, "h": 24, "material": "glass"},
            {"x": 1294, "y": 350, "w": 30, "h": 144, "material": "wood"},
            {"x": 1466, "y": 350, "w": 30, "h": 144, "material": "wood"},
            {"x": 1380, "y": 266, "w": 230, "h": 26, "material": "stone"},
        ],
        "pigs": [(1176, 676), (1582, 676), (1380, 582), (1380, 398), (1380, 230)],
    },
]


def scale_level(level: dict) -> dict:
    return {
        **level,
        "gravity": ss(level["gravity"]),
        "structures": [
            {
                **structure,
                "x": sx(structure["x"]),
                "y": sy(structure["y"]),
                "w": max(12, sx(structure["w"])),
                "h": max(12, sy(structure["h"])),
            }
            for structure in level["structures"]
        ],
        "pigs": [(sx(x), sy(y)) for x, y in level["pigs"]],
    }


LEVELS = [scale_level(level) for level in BASE_LEVELS]
