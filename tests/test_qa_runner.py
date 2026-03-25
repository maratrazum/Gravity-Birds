from __future__ import annotations

import os
import unittest

os.environ.setdefault("SDL_VIDEODRIVER", "dummy")
os.environ.setdefault("SDL_AUDIODRIVER", "dummy")

import pygame

import qa_runner
from gravity_birds.game import GravityBirdsGame


class QARunnerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        pygame.init()

    def test_heuristic_pull_is_within_launch_limits(self) -> None:
        game = GravityBirdsGame()
        game.create_level(0)
        pull = qa_runner.heuristic_pull(game, "red")
        self.assertGreaterEqual(pull.x, 78)
        self.assertLessEqual(pull.x, 155)
        self.assertLessEqual(pull.y, -34)
        self.assertGreaterEqual(pull.y, -118)

    def test_run_scenario_returns_structured_result(self) -> None:
        result = qa_runner.run_scenario(0, 1, "autoplay")
        self.assertEqual(result.level, "Moon Training Grounds")
        self.assertIn(result.status, {"ok", "warning", "error"})
        self.assertIn(result.outcome, {"win", "lose", "unfinished"})
        self.assertGreaterEqual(result.shots_used, 0)
        self.assertGreaterEqual(result.avg_fps, 0)


if __name__ == "__main__":
    unittest.main()
