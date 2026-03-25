from __future__ import annotations

import json
import math
import os
import random
import sys
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path

os.environ.setdefault("SDL_VIDEODRIVER", "dummy")
os.environ.setdefault("SDL_AUDIODRIVER", "dummy")

import pygame

from gravity_birds.game import BirdEntity, GravityBirdsGame, PigEntity
from gravity_birds.levels import LEVELS


REPORT_PATH = Path(__file__).with_name("qa_report.json")


@dataclass
class ScenarioResult:
    mode: str
    level: str
    attempt: int
    status: str
    outcome: str
    shots_used: int
    pigs_left: int
    max_speed: float
    sim_seconds: float
    wall_seconds: float
    avg_fps: float
    stuck_events: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)


def count_pigs(game: GravityBirdsGame) -> int:
    return sum(1 for entity in game.entities if isinstance(entity, PigEntity) and not entity.dead)


def count_birds(game: GravityBirdsGame) -> int:
    return sum(1 for entity in game.entities if isinstance(entity, BirdEntity) and not entity.dead)


def validate_world(game: GravityBirdsGame, label: str) -> float:
    max_speed = 0.0
    for entity in game.entities:
        x, y = entity.body.position
        vx, vy = entity.body.velocity
        values = [x, y, vx, vy, entity.body.angle]
        if any(math.isnan(value) or math.isinf(value) for value in values):
            raise AssertionError(f"{label}: invalid physics state detected")
        speed = math.hypot(vx, vy)
        max_speed = max(max_speed, speed)
    return max_speed


def random_pull() -> pygame.Vector2:
    return pygame.Vector2(random.randint(80, 155), random.randint(-105, -38))


def choose_target_pig(game: GravityBirdsGame) -> PigEntity | None:
    pigs = [entity for entity in game.entities if isinstance(entity, PigEntity) and not entity.dead]
    if not pigs:
        return None
    return sorted(pigs, key=lambda pig: (pig.body.position.x, pig.body.position.y))[0]


def heuristic_pull(game: GravityBirdsGame, bird_type: str) -> pygame.Vector2:
    target = choose_target_pig(game)
    if target is None:
        return random_pull()
    anchor_x, anchor_y = game.drag_position.xy
    gravity = game.space.gravity[1]
    dx = target.body.position.x - anchor_x
    dy = target.body.position.y - anchor_y
    launch_scale = 7.4
    horizontal_pull = max(78, min(155, dx / launch_scale * 0.78))
    vertical_comp = -dy * 0.42 - gravity * 0.045
    vertical_pull = max(-118, min(-34, -abs(vertical_comp)))
    if bird_type == "yellow":
        horizontal_pull = min(155, horizontal_pull + 18)
    elif bird_type == "black":
        horizontal_pull = max(82, horizontal_pull - 10)
        vertical_pull = max(-100, vertical_pull + 8)
    elif bird_type == "blue":
        vertical_pull = max(-112, vertical_pull - 12)
    return pygame.Vector2(horizontal_pull, vertical_pull)


def detect_stuck_entities(game: GravityBirdsGame, stagnant_ticks: int) -> list[str]:
    if stagnant_ticks < 210:
        return []
    stuck = []
    for entity in game.entities:
        if isinstance(entity, BirdEntity) and entity.body.velocity.length < 8 and entity.body.position.y < 925:
            stuck.append(f"bird:{entity.bird_type}@({entity.body.position.x:.1f},{entity.body.position.y:.1f})")
        if isinstance(entity, PigEntity) and entity.body.velocity.length < 4 and entity.body.position.y < 925:
            stuck.append(f"pig@({entity.body.position.x:.1f},{entity.body.position.y:.1f})")
    return stuck


def step_world(game: GravityBirdsGame, label: str, ticks: int = 180, use_autoplay: bool = False) -> tuple[float, list[str]]:
    max_speed = 0.0
    stagnant_ticks = 0
    stuck_events: list[str] = []
    previous_pigs = count_pigs(game)
    for tick in range(ticks):
        game.update_game(1 / 60)
        if use_autoplay and game.active_bird and game.active_bird.bird_type == "yellow" and not game.active_bird.ability_used and tick == 18:
            game.active_bird.trigger_special()
        max_speed = max(max_speed, validate_world(game, label))
        current_pigs = count_pigs(game)
        moving = any(entity.body.velocity.length > 12 for entity in game.entities if not entity.dead)
        if current_pigs < previous_pigs or moving:
            stagnant_ticks = 0
        else:
            stagnant_ticks += 1
        previous_pigs = current_pigs
        if game.overlay_state in {"win", "lose"}:
            break
    stuck_events.extend(detect_stuck_entities(game, stagnant_ticks))
    return max_speed, stuck_events


def run_scenario(level_index: int, attempt: int, mode: str) -> ScenarioResult:
    game = GravityBirdsGame()
    game.create_level(level_index)
    level_name = LEVELS[level_index]["name"]
    wall_started = time.perf_counter()
    shots_used = 0
    max_speed = 0.0
    sim_seconds = 0.0
    errors: list[str] = []
    stuck_events: list[str] = []
    try:
        while game.birds_queue and not game.overlay_state:
            bird_type = game.consume_next_bird()
            if not bird_type:
                break
            pull = random_pull() if mode == "fuzz" else heuristic_pull(game, bird_type)
            shots_used += 1
            game.launch_bird(bird_type, pull)
            peak, stuck = step_world(game, f"{mode} level={level_index} attempt={attempt}", use_autoplay=(mode == "autoplay"))
            max_speed = max(max_speed, peak)
            stuck_events.extend(stuck)
            sim_seconds += 180 / 60
            if count_birds(game) == 0:
                game.update_game(1 / 60)
        peak, stuck = step_world(game, f"{mode} level={level_index} attempt={attempt} final", ticks=30)
        max_speed = max(max_speed, peak)
        sim_seconds += 30 / 60
        stuck_events.extend(stuck)
    except Exception as exc:  # pragma: no cover
        errors.append(str(exc))

    wall_seconds = time.perf_counter() - wall_started
    avg_fps = sim_seconds / wall_seconds if wall_seconds > 0 else 0.0
    outcome = game.overlay_state or "unfinished"
    status = "ok"
    if errors:
        status = "error"
    elif stuck_events:
        status = "warning"
    return ScenarioResult(
        mode=mode,
        level=level_name,
        attempt=attempt,
        status=status,
        outcome=outcome,
        shots_used=shots_used,
        pigs_left=count_pigs(game),
        max_speed=round(max_speed, 2),
        sim_seconds=round(sim_seconds, 2),
        wall_seconds=round(wall_seconds, 4),
        avg_fps=round(avg_fps, 2),
        stuck_events=stuck_events,
        errors=errors,
    )


def summarize_results(results: list[ScenarioResult]) -> dict[str, object]:
    return {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "total_scenarios": len(results),
        "errors": sum(1 for result in results if result.status == "error"),
        "warnings": sum(1 for result in results if result.status == "warning"),
        "wins": sum(1 for result in results if result.outcome == "win"),
        "losses": sum(1 for result in results if result.outcome == "lose"),
        "unfinished": sum(1 for result in results if result.outcome == "unfinished"),
        "slowest_avg_fps": min((result.avg_fps for result in results), default=0.0),
        "fastest_entity_speed": max((result.max_speed for result in results), default=0.0),
    }


def main() -> int:
    pygame.init()
    random.seed(42)
    results: list[ScenarioResult] = []
    for level_index, level in enumerate(LEVELS):
        for attempt in range(1, 9):
            results.append(run_scenario(level_index, attempt, "fuzz"))
        for attempt in range(1, 4):
            results.append(run_scenario(level_index, attempt, "autoplay"))
        level_results = [result for result in results if result.level == level["name"]]
        errors = sum(1 for result in level_results if result.status == "error")
        warnings = sum(1 for result in level_results if result.status == "warning")
        wins = sum(1 for result in level_results if result.outcome == "win")
        print(f"[{level['name']}] wins={wins}/{len(level_results)} warnings={warnings} errors={errors}")

    payload = {
        "summary": summarize_results(results),
        "results": [asdict(result) for result in results],
    }
    REPORT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    pygame.quit()

    summary = payload["summary"]
    print(f"QA report written to {REPORT_PATH}")
    print(
        "summary:",
        f"errors={summary['errors']}",
        f"warnings={summary['warnings']}",
        f"wins={summary['wins']}",
        f"unfinished={summary['unfinished']}",
        f"slowest_avg_fps={summary['slowest_avg_fps']}",
    )
    return 1 if summary["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
