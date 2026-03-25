from __future__ import annotations

import os
import unittest

os.environ.setdefault("SDL_VIDEODRIVER", "dummy")
os.environ.setdefault("SDL_AUDIODRIVER", "dummy")

import pygame

from gravity_birds.constants import SLING_ANCHOR
from gravity_birds.game import BirdEntity, GravityBirdsGame, PigEntity
from gravity_birds.levels import LEVELS


class GravityBirdsGameplayTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        pygame.init()

    def setUp(self) -> None:
        self.game = GravityBirdsGame()

    def tearDown(self) -> None:
        pygame.event.clear()
        pygame.display.quit()

    def test_level_creation_matches_catalog(self) -> None:
        for index, level in enumerate(LEVELS):
            self.game.create_level(index)
            pigs = [entity for entity in self.game.entities if isinstance(entity, PigEntity)]
            self.assertEqual(self.game.space.gravity[1], level["gravity"])
            self.assertEqual(len(self.game.birds_queue), len(level["birds"]))
            self.assertEqual(len(pigs), len(level["pigs"]))

    def test_short_drag_does_not_consume_bird(self) -> None:
        self.game.create_level(0)
        original_queue = list(self.game.birds_queue)
        self.game.aiming = True
        self.game.drag_position = pygame.Vector2(SLING_ANCHOR[0] - 4, SLING_ANCHOR[1] - 2)
        pygame.event.post(
            pygame.event.Event(
                pygame.MOUSEBUTTONUP,
                {"button": 1, "pos": (SLING_ANCHOR[0] - 4, SLING_ANCHOR[1] - 2)},
            )
        )
        self.game.handle_events()
        self.assertEqual(self.game.birds_queue, original_queue)
        self.assertEqual(self.game.count_alive_birds(), 0)

    def test_blue_bird_splits_into_three(self) -> None:
        self.game.create_level(0)
        self.game.birds_queue = []
        self.game.launch_bird("blue", pygame.Vector2(118, -62))
        self.game.simulate_seconds(0.35)
        self.assertGreaterEqual(self.game.count_alive_birds(), 3)

    def test_yellow_boost_increases_speed(self) -> None:
        self.game.create_level(0)
        self.game.birds_queue = []
        self.game.launch_bird("yellow", pygame.Vector2(110, -52))
        self.game.simulate_seconds(0.18)
        bird = self.game.active_bird
        self.assertIsNotNone(bird)
        speed_before = bird.body.velocity.length
        bird.trigger_special()
        self.game.simulate_seconds(0.05)
        speed_after = bird.body.velocity.length
        self.assertGreater(speed_after, speed_before)

    def test_black_explosion_destroys_nearby_blocks_but_not_pig_directly(self) -> None:
        self.game.create_level(0)
        pigs_before = len([entity for entity in self.game.entities if isinstance(entity, PigEntity)])
        blocks_before = [entity for entity in self.game.entities if entity.__class__.__name__ == "BlockEntity"]
        target_pig = next(entity for entity in self.game.entities if isinstance(entity, PigEntity))
        self.game.explode(target_pig.body.position, 140, 1600)
        self.game.simulate_seconds(0.05)
        blocks_after = [entity for entity in self.game.entities if entity.__class__.__name__ == "BlockEntity"]
        moved_blocks = [entity for entity in blocks_after if entity.body.velocity.length > 0]
        pigs_after = len([entity for entity in self.game.entities if isinstance(entity, PigEntity)])
        self.assertLessEqual(len(blocks_after), len(blocks_before))
        self.assertGreater(len(moved_blocks), 0)
        self.assertEqual(pigs_after, pigs_before)

    def test_pig_dies_only_after_long_top_pressure(self) -> None:
        self.game.create_level(0)
        pig = next(entity for entity in self.game.entities if isinstance(entity, PigEntity))
        self.assertFalse(pig.dead)
        pig.is_crushed_from_above = lambda: True
        self.game.simulate_seconds(1.4)
        self.assertFalse(pig.dead)
        self.game.simulate_seconds(0.2)
        self.assertTrue(pig.dead)

    def test_loss_waits_until_all_split_birds_are_gone(self) -> None:
        self.game.create_level(0)
        self.game.birds_queue = []
        self.game.launch_bird("blue", pygame.Vector2(118, -62))
        self.game.simulate_seconds(0.25)
        primary = self.game.active_bird
        self.assertIsNotNone(primary)
        primary.destroy()
        self.game.active_bird = None
        self.game.simulate_seconds(0.1)
        self.assertNotEqual(self.game.overlay_state, "lose")
        for entity in list(self.game.entities):
            if isinstance(entity, BirdEntity):
                entity.destroy()
        self.game.simulate_seconds(0.1)
        self.assertEqual(self.game.overlay_state, "lose")


if __name__ == "__main__":
    unittest.main()
