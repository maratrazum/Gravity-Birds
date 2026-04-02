from __future__ import annotations

import math
from dataclasses import dataclass

import pygame
import pymunk

from .constants import (
    ACCENT,
    BASE_LAUNCH_SPEED,
    BIRD_DATA,
    DANGER,
    FPS,
    FLOOR_Y,
    GROUND,
    HEIGHT,
    MATERIALS,
    MAX_PULL,
    PANEL,
    PHYSICS_STEP,
    SKY_BOTTOM,
    SKY_TOP,
    SLING_ANCHOR,
    SUBTLE,
    SUCCESS,
    TEXT,
    UI_SCALE,
    WIDTH,
)
from .levels import LEVELS


COLLISION_BIRD = 1
COLLISION_BLOCK = 2
COLLISION_PIG = 3
COLLISION_FLOOR = 4


@dataclass
class Particle:
    # Eenvoudig deeltje voor stof, explosies en vogelsporen.
    x: float
    y: float
    vx: float
    vy: float
    radius: float
    color: tuple[int, int, int]
    life: float


class PhysicsEntity:
    # Basisklasse voor alles wat in de physics-space leeft.
    def __init__(self, game: "GravityBirdsGame", body: pymunk.Body, shape: pymunk.Shape):
        self.game = game
        self.body = body
        self.shape = shape
        self.dead = False
        body.entity = self
        shape.entity = self

    def update(self, dt: float) -> None:
        # Ruimt objecten op die ver buiten het speelveld raken.
        if self.body.position.y > HEIGHT + 300 or self.body.position.x > WIDTH + 300:
            self.destroy()

    def draw(self, surface: pygame.Surface) -> None:
        raise NotImplementedError

    def damage(self, amount: float) -> None:
        return

    def destroy(self) -> None:
        if self.dead:
            return
        self.dead = True
        if self.shape in self.game.space.shapes:
            self.game.space.remove(self.shape, self.body)


class BlockEntity(PhysicsEntity):
    # Fysiek bouwdeel dat schade kan oplopen.
    def __init__(
        self,
        game: "GravityBirdsGame",
        body: pymunk.Body,
        shape: pymunk.Shape,
        width: float,
        height: float,
        material: str,
    ):
        super().__init__(game, body, shape)
        self.width = width
        self.height = height
        self.material = material
        self.hp = MATERIALS[material]["hp"]

    def damage(self, amount: float) -> None:
        # Blokken verliezen hp en vallen uiteen in puin bij nul.
        self.hp -= amount
        if self.hp <= 0:
            self.game.spawn_debris(self.body.position, MATERIALS[self.material]["color"], 8, 70)
            self.destroy()

    def draw(self, surface: pygame.Surface) -> None:
        # Tekent het blok in lokale ruimte en roteert het daarna mee.
        color = MATERIALS[self.material]["color"]
        outline = MATERIALS[self.material]["outline"]
        cx, cy = self.body.position
        rect_surface = pygame.Surface((int(self.width) + 8, int(self.height) + 8), pygame.SRCALPHA)
        rect = pygame.Rect(4, 4, int(self.width), int(self.height))
        pygame.draw.rect(rect_surface, color, rect, border_radius=6)
        pygame.draw.rect(rect_surface, outline, rect, width=3, border_radius=6)
        if self.material == "wood":
            pygame.draw.line(rect_surface, outline, (12, rect.centery - 6), (rect.width - 12, rect.centery - 4), 2)
            pygame.draw.line(rect_surface, outline, (16, rect.centery + 8), (rect.width - 16, rect.centery + 12), 2)
        elif self.material == "stone":
            pygame.draw.line(rect_surface, outline, (14, 18), (rect.width - 12, 20), 2)
            pygame.draw.line(rect_surface, outline, (14, rect.height - 18), (rect.width - 18, rect.height - 16), 2)
        else:
            pygame.draw.line(rect_surface, (235, 250, 255), (10, 10), (rect.width - 10, rect.height - 10), 2)

        rotated = pygame.transform.rotozoom(rect_surface, -math.degrees(self.body.angle), 1.0)
        draw_rect = rotated.get_rect(center=(int(cx), int(cy)))
        surface.blit(rotated, draw_rect)


class PigEntity(PhysicsEntity):
    # Doelwit dat alleen verdwijnt bij impact of langdurige druk.
    def __init__(self, game: "GravityBirdsGame", body: pymunk.Body, shape: pymunk.Shape):
        super().__init__(game, body, shape)
        self.crush_time = 0.0

    def damage(self, amount: float) -> None:
        return

    def update(self, dt: float) -> None:
        super().update(dt)
        if self.dead:
            return
        # Aanhoudende druk van boven schakelt het varken uit.
        if self.is_crushed_from_above():
            self.crush_time += dt
            if self.crush_time >= 1.5:
                self.game.spawn_debris(self.body.position, (118, 211, 84), 12, 85)
                self.destroy()
        else:
            self.crush_time = 0.0

    def is_crushed_from_above(self) -> bool:
        # Controleert of een blok stabiel op het varken drukt.
        pig_x, pig_y = self.body.position
        pig_top = pig_y - 22
        for entity in self.game.entities:
            if entity.dead or not isinstance(entity, BlockEntity):
                continue
            block_x, block_y = entity.body.position
            half_w = entity.width / 2
            half_h = entity.height / 2
            block_bottom = block_y + half_h
            horizontal_overlap = abs(block_x - pig_x) <= half_w + 16
            vertically_pressing = pig_top - 18 <= block_bottom <= pig_top + 20
            stable_weight = entity.body.position.y < pig_y and entity.body.velocity.length < 55
            if horizontal_overlap and vertically_pressing and stable_weight:
                return True
        return False

    def draw(self, surface: pygame.Surface) -> None:
        # Houdt het silhouet bewust simpel en direct leesbaar.
        x, y = map(int, self.body.position)
        pygame.draw.circle(surface, (118, 211, 84), (x, y), 22)
        pygame.draw.circle(surface, (69, 123, 44), (x, y), 22, 3)
        pygame.draw.circle(surface, (102, 194, 74), (x - 12, y - 16), 8)
        pygame.draw.circle(surface, (102, 194, 74), (x + 12, y - 16), 8)
        pygame.draw.circle(surface, (255, 255, 255), (x - 7, y - 3), 5)
        pygame.draw.circle(surface, (255, 255, 255), (x + 7, y - 3), 5)
        pygame.draw.circle(surface, (20, 20, 20), (x - 7, y - 2), 2)
        pygame.draw.circle(surface, (20, 20, 20), (x + 7, y - 2), 2)
        pygame.draw.ellipse(surface, (90, 150, 55), (x - 9, y + 6, 18, 12))
        pygame.draw.circle(surface, (74, 110, 47), (x - 4, y + 12), 2)
        pygame.draw.circle(surface, (74, 110, 47), (x + 4, y + 12), 2)


class BirdEntity(PhysicsEntity):
    # Vogel met vluchtlogica, trail en optionele speciale vaardigheid.
    def __init__(self, game: "GravityBirdsGame", body: pymunk.Body, shape: pymunk.Shape, bird_type: str, primary: bool):
        super().__init__(game, body, shape)
        self.bird_type = bird_type
        self.radius = BIRD_DATA[bird_type]["radius"]
        self.primary = primary
        self.launched = False
        self.ability_used = False
        self.impacted = False
        self.impact_cooldown = 0.0
        self.age = 0.0
        self.trail_timer = 0.0

    def update(self, dt: float) -> None:
        super().update(dt)
        if self.dead:
            return
        # Leeftijd en cooldowns sturen abilities en automatisch opruimen.
        self.age += dt
        self.impact_cooldown = max(0.0, self.impact_cooldown - dt)
        self.trail_timer += dt
        if self.trail_timer >= 0.045 and self.launched:
            self.trail_timer = 0.0
            self.game.spawn_trail(self.body.position, BIRD_DATA[self.bird_type]["color"])
        # Alleen de primaire blauwe vogel splitst automatisch.
        if self.primary and self.bird_type == "blue" and self.launched and not self.ability_used and self.age > 0.16:
            self.ability_used = True
            self.game.split_blue_bird(self)
        if self.impacted and self.bird_type != "black":
            self.body.velocity = self.body.velocity * 0.985
            if self.body.velocity.length < 70 and self.age > 0.22:
                self.destroy()

    def trigger_special(self) -> None:
        # De gele vogel krijgt een extra impuls in zijn huidige richting.
        if self.dead or self.ability_used:
            return
        if self.bird_type == "yellow" and self.launched:
            velocity = self.body.velocity
            if velocity.length > 1:
                self.ability_used = True
                boost = velocity.normalized() * 800
                self.body.apply_impulse_at_local_point(boost)
                self.game.spawn_debris(self.body.position, (255, 227, 109), 8, 120)

    def draw(self, surface: pygame.Surface) -> None:
        # Elke vogel deelt dezelfde basisvorm met kleine type-accenten.
        x, y = map(int, self.body.position)
        base = BIRD_DATA[self.bird_type]["color"]
        outline = BIRD_DATA[self.bird_type]["outline"]
        pygame.draw.circle(surface, base, (x, y), self.radius)
        pygame.draw.circle(surface, outline, (x, y), self.radius, 3)
        pygame.draw.circle(surface, (255, 255, 255), (x - 5, y - 5), 6)
        pygame.draw.circle(surface, (255, 255, 255), (x + 7, y - 5), 6)
        pygame.draw.circle(surface, (20, 20, 20), (x - 4, y - 4), 3)
        pygame.draw.circle(surface, (20, 20, 20), (x + 6, y - 4), 3)
        pygame.draw.polygon(surface, (248, 172, 47), [(x + self.radius - 2, y), (x + self.radius + 13, y - 5), (x + self.radius + 13, y + 5)])
        eyebrow_y = y - self.radius // 2
        pygame.draw.line(surface, outline, (x - 11, eyebrow_y), (x + 1, eyebrow_y - 2), 3)
        pygame.draw.line(surface, outline, (x + 2, eyebrow_y - 2), (x + 14, eyebrow_y), 3)
        if self.bird_type == "black":
            pygame.draw.circle(surface, (255, 200, 96), (x + 2, y - self.radius + 6), 5)
        if self.bird_type == "yellow":
            pygame.draw.polygon(surface, (255, 236, 126), [(x - 18, y + 6), (x - 4, y - 17), (x + 11, y + 6)])
        if self.bird_type == "blue":
            pygame.draw.circle(surface, (230, 247, 255), (x - 11, y - 15), 4)
            pygame.draw.circle(surface, (230, 247, 255), (x + 13, y - 12), 4)


class GravityBirdsGame:
    # Centrale spelklasse voor scenes, physics, input en rendering.
    def __init__(self) -> None:
        pygame.init()
        pygame.display.set_caption("Gravity Birds")
        self.window = self._create_window()
        self.screen = pygame.Surface((WIDTH, HEIGHT))
        self.clock = pygame.time.Clock()
        self.font_large = pygame.font.SysFont("Avenir Next", round(66 * UI_SCALE), bold=True)
        self.font_title = pygame.font.SysFont("Avenir Next", round(40 * UI_SCALE), bold=True)
        self.font_body = pygame.font.SysFont("Avenir Next", round(28 * UI_SCALE))
        self.font_small = pygame.font.SysFont("Avenir Next", round(22 * UI_SCALE))
        self.running = True
        self.scene = "menu"
        self.level_index = 0
        self.space: pymunk.Space | None = None
        self.entities: list[PhysicsEntity] = []
        self.particles: list[Particle] = []
        self.aiming = False
        self.drag_position = pygame.Vector2(SLING_ANCHOR)
        self.birds_queue: list[str] = []
        self.active_bird: BirdEntity | None = None
        self.awaiting_next_bird = False
        self.next_bird_delay = 0.0
        self.message = ""
        self.overlay_state = ""
        self.palette = {"top": SKY_TOP, "bottom": SKY_BOTTOM, "dust": (232, 204, 146)}
        self.accumulator = 0.0
        self.viewport = pygame.Rect(0, 0, WIDTH, HEIGHT)
        self.present_scaled = True
        self._configure_render_target()
        self._load_menu_background()

    def _create_window(self) -> pygame.Surface:
        # Fullscreen voor normaal gebruik, vaste grootte voor tests.
        driver = pygame.display.get_driver()
        if driver == "dummy":
            return pygame.display.set_mode((WIDTH, HEIGHT))
        return pygame.display.set_mode((0, 0), pygame.FULLSCREEN)

    def _configure_render_target(self) -> None:
        # Tekent native of schaalt naar het huidige venster.
        window_w, window_h = self.window.get_size()
        if window_w >= WIDTH and window_h >= HEIGHT:
            left = (window_w - WIDTH) // 2
            top = (window_h - HEIGHT) // 2
            self.viewport = pygame.Rect(left, top, WIDTH, HEIGHT)
            self.screen = self.window.subsurface(self.viewport)
            self.present_scaled = False
        else:
            scale = min(window_w / WIDTH, window_h / HEIGHT)
            scaled_w = int(WIDTH * scale)
            scaled_h = int(HEIGHT * scale)
            left = (window_w - scaled_w) // 2
            top = (window_h - scaled_h) // 2
            self.viewport = pygame.Rect(left, top, scaled_w, scaled_h)
            self.screen = pygame.Surface((WIDTH, HEIGHT))
            self.present_scaled = True

    def window_to_virtual(self, pos: tuple[int, int]) -> tuple[int, int]:
        # Zet muisposities uit het venster om naar spelcoordinaten.
        if not self.viewport.collidepoint(pos):
            return (-1, -1)
        if not self.present_scaled:
            return (pos[0] - self.viewport.left, pos[1] - self.viewport.top)
        rel_x = (pos[0] - self.viewport.left) / max(1, self.viewport.width)
        rel_y = (pos[1] - self.viewport.top) / max(1, self.viewport.height)
        return (int(rel_x * WIDTH), int(rel_y * HEIGHT))

    def get_virtual_mouse_pos(self) -> tuple[int, int]:
        # Leest de muis altijd in virtuele spelcoordinaten uit.
        return self.window_to_virtual(pygame.mouse.get_pos())

    def _load_menu_background(self) -> None:
        # Bouwt een vaste sterrenhemel op zonder random verschillen.
        self.stars = []
        for index in range(60):
            x = 50 + (index * 97) % (WIDTH - 100)
            y = 40 + (index * 71) % 420
            radius = 1 + index % 3
            self.stars.append((x, y, radius))

    def create_level(self, index: int) -> None:
        # Bouwt een nieuwe pymunk-space en vult die met leveldata.
        level = LEVELS[index]
        self.space = pymunk.Space()
        self.space.gravity = (0, level["gravity"])
        self.space.damping = 0.92
        self.space.iterations = 30
        self.space.sleep_time_threshold = 0.25
        self.entities = []
        self.particles = []
        self.palette = level["palette"]
        self.overlay_state = ""
        self.message = f"{level['planet']} gravity: {level['gravity']} px/s²"
        self.birds_queue = list(level["birds"])
        self.active_bird = None
        self.awaiting_next_bird = False
        self.next_bird_delay = 0.0
        self.accumulator = 0.0

        # Vloer en zijwanden houden de simulatie binnen veilige grenzen.
        floor = pymunk.Segment(self.space.static_body, (-200, FLOOR_Y), (WIDTH + 200, FLOOR_Y), 16)
        floor.friction = 1.0
        floor.elasticity = 0.0
        floor.collision_type = COLLISION_FLOOR
        self.space.add(floor)
        left_wall = pymunk.Segment(self.space.static_body, (-20, -200), (-20, HEIGHT + 200), 10)
        right_wall = pymunk.Segment(self.space.static_body, (WIDTH + 20, -200), (WIDTH + 20, HEIGHT + 200), 10)
        left_wall.friction = right_wall.friction = 1.0
        self.space.add(left_wall, right_wall)

        # Eerst de constructie, daarna de doelwitten.
        for block in level["structures"]:
            self.add_block(block["x"], block["y"], block["w"], block["h"], block["material"])
        for pig_position in level["pigs"]:
            self.add_pig(*pig_position)

        # Het level start in rust tot de eerste vogel impact maakt.
        for entity in self.entities:
            entity.body.sleep()

        self.register_collisions()
        self.scene = "game"

    def register_collisions(self) -> None:
        # Verbindt collision-types met hun handlers.
        if not self.space:
            return
        self.space.on_collision(COLLISION_BIRD, COLLISION_BLOCK, post_solve=self.on_bird_collision)
        self.space.on_collision(COLLISION_BIRD, COLLISION_PIG, post_solve=self.on_bird_collision)
        self.space.on_collision(COLLISION_BIRD, COLLISION_FLOOR, post_solve=self.on_bird_collision)
        self.space.on_collision(COLLISION_BLOCK, COLLISION_PIG, post_solve=self.on_generic_collision)
        self.space.on_collision(COLLISION_BLOCK, COLLISION_BLOCK, post_solve=self.on_generic_collision)

    def on_generic_collision(self, arbiter: pymunk.Arbiter, _space: pymunk.Space, _data: object) -> None:
        # Zware botsingen tussen constructiedelen geven blokschade.
        impulse = arbiter.total_impulse.length
        if impulse < 150:
            return
        for shape in arbiter.shapes:
            entity = getattr(shape, "entity", None)
            if entity and not entity.dead and isinstance(entity, BlockEntity):
                entity.damage(impulse * 0.05)

    def on_bird_collision(self, arbiter: pymunk.Arbiter, _space: pymunk.Space, _data: object) -> None:
        # Vogels delen schade uit en activeren hier hun impactgedrag.
        impulse = arbiter.total_impulse.length
        bird = None
        other = None
        for shape in arbiter.shapes:
            entity = getattr(shape, "entity", None)
            if isinstance(entity, BirdEntity):
                bird = entity
            elif entity is not None:
                other = entity
        if bird is None or bird.dead:
            return
        if impulse > 105 and isinstance(other, BlockEntity):
            other.damage(impulse * 0.065)
        if impulse > 85 and isinstance(other, PigEntity):
            self.spawn_debris(other.body.position, (118, 211, 84), 16, 110)
            other.destroy()
        if bird.bird_type != "black" and impulse > 120 and bird.impact_cooldown <= 0:
            bird.impacted = True
            bird.impact_cooldown = 0.12
            slowed = pygame.Vector2(bird.body.velocity) * 0.34
            bird.body.velocity = (slowed.x, slowed.y)
        if bird.bird_type == "black" and not bird.impacted and impulse > 110:
            bird.impacted = True
            self.explode(bird.body.position, 130, 1450)
            bird.destroy()

    def add_block(self, x: float, y: float, width: float, height: float, material: str) -> None:
        # Massa volgt uit formaat en materiaal, zodat steen zwaarder voelt.
        props = MATERIALS[material]
        mass = max(1, width * height * 0.0014 * props["density"])
        moment = pymunk.moment_for_box(mass, (width, height))
        body = pymunk.Body(mass, moment)
        body.position = x, y
        shape = pymunk.Poly.create_box(body, (width, height), radius=5)
        shape.friction = 0.92
        shape.elasticity = 0.0
        shape.collision_type = COLLISION_BLOCK
        self.space.add(body, shape)
        self.entities.append(BlockEntity(self, body, shape, width, height, material))

    def add_pig(self, x: float, y: float) -> None:
        # Varkens blijven klein en compact zodat de torens leidend zijn.
        mass = 3.4
        radius = 22
        body = pymunk.Body(mass, pymunk.moment_for_circle(mass, 0, radius))
        body.position = x, y
        shape = pymunk.Circle(body, radius)
        shape.friction = 0.9
        shape.elasticity = 0.0
        shape.collision_type = COLLISION_PIG
        self.space.add(body, shape)
        self.entities.append(PigEntity(self, body, shape))

    def launch_bird(self, bird_type: str, pull_vector: pygame.Vector2) -> None:
        # Zet de trekkracht van de katapult om naar startsnelheid.
        radius = BIRD_DATA[bird_type]["radius"]
        mass = 4.2 if bird_type != "black" else 5.6
        body = pymunk.Body(mass, pymunk.moment_for_circle(mass, 0, radius))
        body.position = SLING_ANCHOR
        shape = pymunk.Circle(body, radius)
        shape.friction = 0.87
        shape.elasticity = 0.0
        shape.collision_type = COLLISION_BIRD
        self.space.add(body, shape)
        bird = BirdEntity(self, body, shape, bird_type, primary=True)
        bird.launched = True
        self.entities.append(bird)
        launch = pull_vector * BASE_LAUNCH_SPEED * BIRD_DATA[bird_type]["launch_scale"]
        body.velocity = (launch.x, launch.y)
        self.active_bird = bird
        self.awaiting_next_bird = False
        self.next_bird_delay = 0.0

    def split_blue_bird(self, bird: BirdEntity) -> None:
        # Maakt twee extra blauwe vogels met een kleine hoekafwijking.
        if bird.dead:
            return
        base_velocity = pygame.Vector2(bird.body.velocity)
        if base_velocity.length() < 2:
            return
        origin = pygame.Vector2(bird.body.position)
        angle_delta = 0.23
        for delta in (-angle_delta, angle_delta):
            velocity = base_velocity.rotate_rad(delta) * 0.98
            self.spawn_clone_bird("blue", origin, velocity)
        boosted = base_velocity * 1.02
        bird.body.velocity = (boosted.x, boosted.y)
        self.spawn_debris(origin, (182, 235, 255), 10, 70)

    def spawn_clone_bird(self, bird_type: str, position: pygame.Vector2, velocity: pygame.Vector2) -> None:
        # Klonen zijn lichter en mogen hun vaardigheid niet opnieuw gebruiken.
        radius = 15
        mass = 2.1
        body = pymunk.Body(mass, pymunk.moment_for_circle(mass, 0, radius))
        body.position = (position.x, position.y)
        shape = pymunk.Circle(body, radius)
        shape.friction = 0.85
        shape.elasticity = 0.0
        shape.collision_type = COLLISION_BIRD
        self.space.add(body, shape)
        clone = BirdEntity(self, body, shape, bird_type, primary=False)
        clone.radius = radius
        clone.launched = True
        clone.ability_used = True
        body.velocity = (velocity.x, velocity.y)
        self.entities.append(clone)

    def explode(self, position: pymunk.Vec2d, radius: float, force: float) -> None:
        # Explosies duwen nabije objecten weg en beschadigen blokken.
        pos = pygame.Vector2(position)
        self.spawn_debris(pos, (255, 184, 110), 20, 180)
        for entity in list(self.entities):
            if entity.dead:
                continue
            offset = pygame.Vector2(entity.body.position) - pos
            distance = max(12, offset.length())
            if distance > radius:
                continue
            direction = pygame.Vector2(1, 0) if offset.length() == 0 else offset.normalize()
            strength = (1 - distance / radius) * force
            entity.body.apply_impulse_at_local_point((direction.x * strength, direction.y * strength))
            if isinstance(entity, BlockEntity):
                entity.damage(strength * 0.28)

    def spawn_debris(self, position: pymunk.Vec2d | pygame.Vector2, color: tuple[int, int, int], count: int, speed: float) -> None:
        # Gebruikt een vaste spreiding zodat effecten beheerst blijven.
        for index in range(count):
            angle = (math.tau * index / max(1, count)) + (index % 3) * 0.09
            magnitude = speed * (0.35 + (index % 5) * 0.14)
            self.particles.append(
                Particle(
                    x=float(position[0]),
                    y=float(position[1]),
                    vx=math.cos(angle) * magnitude,
                    vy=math.sin(angle) * magnitude - 50,
                    radius=3 + (index % 3),
                    color=color,
                    life=0.55 + (index % 4) * 0.08,
                )
            )

    def spawn_trail(self, position: pymunk.Vec2d, color: tuple[int, int, int]) -> None:
        # Traildeeltjes bewegen niet zelf; ze vervagen alleen achter de vogel.
        self.particles.append(Particle(float(position.x), float(position.y), 0, 0, 5, color, 0.28))

    def cleanup_entities(self) -> None:
        # Verwijdert objecten die al uit de physics-space zijn gehaald.
        self.entities = [entity for entity in self.entities if not entity.dead]

    def next_bird_type(self) -> str | None:
        # Laat de UI zien welke vogel als volgende klaarstaat.
        return self.birds_queue[0] if self.birds_queue else None

    def consume_next_bird(self) -> str | None:
        # Haalt exact één vogel uit de wachtrij bij een echte lancering.
        return self.birds_queue.pop(0) if self.birds_queue else None

    def count_alive_birds(self) -> int:
        # Telt alleen vogels die nog fysiek actief zijn in de wereld.
        return sum(1 for entity in self.entities if isinstance(entity, BirdEntity) and not entity.dead)

    def simulate_seconds(self, seconds: float, dt: float = 1 / 60) -> None:
        # Hulpfunctie voor tests en snelle simulaties zonder input.
        elapsed = 0.0
        while elapsed < seconds and self.running:
            self.update_game(dt)
            elapsed += dt

    def handle_game_click(self, pos: tuple[int, int]) -> None:
        # Klikken verwerken eerst overlays, dan abilities, dan sling input.
        if self.overlay_state:
            if self.overlay_state == "win":
                if self.level_index < len(LEVELS) - 1:
                    self.level_index += 1
                    self.create_level(self.level_index)
                else:
                    self.scene = "level_select"
            else:
                self.create_level(self.level_index)
            return
        if self.active_bird and self.active_bird.bird_type == "yellow" and not self.active_bird.ability_used:
            self.active_bird.trigger_special()
            return
        if self.count_alive_birds() > 0:
            return
        next_bird = self.next_bird_type()
        if not next_bird:
            return
        dx = pos[0] - SLING_ANCHOR[0]
        dy = pos[1] - SLING_ANCHOR[1]
        if dx * dx + dy * dy <= 120 * 120:
            self.aiming = True
            self.drag_position = pygame.Vector2(pos)

    def handle_events(self) -> None:
        # Centrale invoerroute voor menu, levelselectie en gameplay.
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    if self.scene == "game":
                        self.scene = "level_select"
                    else:
                        self.running = False
                elif event.key == pygame.K_SPACE and self.scene == "game" and self.active_bird:
                    self.active_bird.trigger_special()
                elif event.key == pygame.K_r and self.scene == "game":
                    self.create_level(self.level_index)
            elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                virtual_pos = self.window_to_virtual(event.pos)
                if self.scene == "menu":
                    if virtual_pos != (-1, -1):
                        self.scene = "level_select"
                elif self.scene == "level_select":
                    self.handle_level_select_click(virtual_pos)
                elif self.scene == "game":
                    self.handle_game_click(virtual_pos)
            elif event.type == pygame.MOUSEMOTION and self.scene == "game" and self.aiming:
                virtual_pos = self.window_to_virtual(event.pos)
                if virtual_pos != (-1, -1):
                    self.drag_position = pygame.Vector2(virtual_pos)
            elif event.type == pygame.MOUSEBUTTONUP and event.button == 1 and self.scene == "game" and self.aiming:
                pull = pygame.Vector2(SLING_ANCHOR) - self.drag_position
                if pull.length() > MAX_PULL:
                    pull.scale_to_length(MAX_PULL)
                if pull.length() > 8:
                    bird_type = self.consume_next_bird()
                else:
                    bird_type = None
                if bird_type:
                    self.launch_bird(bird_type, pull)
                self.aiming = False

    def handle_level_select_click(self, pos: tuple[int, int]) -> None:
        # Elke kaart opent direct het gekoppelde level.
        start_x = 170
        card_w = 300
        card_h = 260
        gap = 48
        y = 310
        for index, level in enumerate(LEVELS):
            x = start_x + index * (card_w + gap)
            rect = pygame.Rect(x, y, card_w, card_h)
            if rect.collidepoint(pos):
                self.level_index = index
                self.create_level(index)
                break

    def update_game(self, dt: float) -> None:
        if not self.space:
            return
        self.accumulator += dt
        # Houdt de physics-step vast voor stabiel gedrag.
        while self.accumulator >= PHYSICS_STEP:
            self.space.step(PHYSICS_STEP)
            self.accumulator -= PHYSICS_STEP

        if self.active_bird and self.active_bird.dead:
            self.active_bird = None

        # Alle entities werken hun eigen gedrag na de physics-step bij.
        for entity in list(self.entities):
            entity.update(dt)
        self.cleanup_entities()

        # Een stilgevallen actieve vogel maakt plaats voor de volgende beurt.
        if self.active_bird and self.active_bird.body.velocity.length < 30 and self.active_bird.age > 1.5:
            self.next_bird_delay += dt
            if self.next_bird_delay > 1.2:
                self.active_bird.destroy()
                self.active_bird = None
                self.next_bird_delay = 0.0

        # De overlay verschijnt pas als de toestand echt vaststaat.
        pigs_left = any(isinstance(entity, PigEntity) for entity in self.entities)
        if not pigs_left and not self.overlay_state:
            self.overlay_state = "win"
            self.message = "Уровень пройден."
        elif not self.birds_queue and self.count_alive_birds() == 0 and not self.overlay_state and not self.aiming:
            self.overlay_state = "lose"
            self.message = "Птицы закончились. Нажми для рестарта."

        self.update_particles(dt)

    def update_particles(self, dt: float) -> None:
        # Deeltjes volgen een lichte zwaartekracht en vervagen op tijd.
        alive = []
        gravity = self.space.gravity[1] * 0.15 if self.space else 90
        for particle in self.particles:
            particle.life -= dt
            if particle.life <= 0:
                continue
            particle.vy += gravity * dt
            particle.x += particle.vx * dt
            particle.y += particle.vy * dt
            alive.append(particle)
        self.particles = alive

    def draw_gradient_background(self, top_color: tuple[int, int, int], bottom_color: tuple[int, int, int]) -> None:
        # Lineaire kleurverloopachtergrond voor menu en levels.
        for y in range(HEIGHT):
            t = y / HEIGHT
            color = (
                int(top_color[0] * (1 - t) + bottom_color[0] * t),
                int(top_color[1] * (1 - t) + bottom_color[1] * t),
                int(top_color[2] * (1 - t) + bottom_color[2] * t),
            )
            pygame.draw.line(self.screen, color, (0, y), (WIDTH, y))

    def draw_menu(self) -> None:
        # Startscherm met projectuitleg, vogels en duidelijke call-to-action.
        self.draw_gradient_background((9, 14, 32), (43, 84, 132))
        for x, y, radius in self.stars:
            pygame.draw.circle(self.screen, (230, 240, 255), (x, y), radius)
        pygame.draw.circle(self.screen, (248, 218, 145), (1600, 170), 92)
        pygame.draw.circle(self.screen, (248, 232, 196), (1600, 170), 92, 6)

        title = self.font_large.render("Gravity Birds", True, TEXT)
        subtitle = self.font_body.render("Птицы, рогатка, орбиты планет и разрушение крепостей.", True, TEXT)
        self.screen.blit(title, (120, 86))
        self.screen.blit(subtitle, (124, 164))

        hero = pygame.Surface((760, 300), pygame.SRCALPHA)
        pygame.draw.rect(hero, (10, 18, 36, 228), (0, 0, 760, 290), border_radius=36)
        pygame.draw.rect(hero, (255, 255, 255, 38), (0, 0, 760, 290), width=2, border_radius=36)
        self.screen.blit(hero, (120, 240))

        hero_lines = [
            "4 вида птиц со своими способностями",
            "5 уровней с разной гравитацией планет",
            "Большие башни, стекло, дерево и камень",
            "Траектория, натяг рогатки и физика удара",
        ]
        accent = self.font_small.render("Physics Project Build", True, ACCENT)
        self.screen.blit(accent, (168, 278))
        for index, text in enumerate(hero_lines):
            label = self.font_body.render(text, True, TEXT if index == 0 else SUBTLE)
            self.screen.blit(label, (168, 330 + index * 46))

        preview_panel = pygame.Surface((900, 300), pygame.SRCALPHA)
        pygame.draw.rect(preview_panel, (13, 25, 46, 224), (0, 0, 900, 290), border_radius=36)
        pygame.draw.rect(preview_panel, (255, 255, 255, 38), (0, 0, 900, 290), width=2, border_radius=36)
        self.screen.blit(preview_panel, (900, 240))
        self.draw_menu_preview()

        bird_types = ["red", "black", "blue", "yellow"]
        for index, bird_type in enumerate(bird_types):
            card_x = 120 + index * 420
            card_rect = pygame.Rect(card_x, 585, 380, 220)
            pygame.draw.rect(self.screen, (14, 24, 42), card_rect, border_radius=28)
            pygame.draw.rect(self.screen, (255, 255, 255, 40), card_rect, width=2, border_radius=28)
            self.draw_bird_icon(bird_type, (card_x + 72, 695), 1.0)
            title_surface = self.font_body.render(BIRD_DATA[bird_type]["label"], True, TEXT)
            desc_surface = self.font_small.render(BIRD_DATA[bird_type]["description"], True, SUBTLE)
            self.screen.blit(title_surface, (card_x + 130, 640))
            self.screen.blit(desc_surface, (card_x + 130, 686))

        start_rect = pygame.Rect(650, 880, 620, 92)
        pygame.draw.rect(self.screen, ACCENT, start_rect, border_radius=22)
        pygame.draw.rect(self.screen, (255, 247, 220), start_rect, width=3, border_radius=22)
        start_text = self.font_title.render("Нажми, чтобы открыть выбор уровней", True, (48, 33, 13))
        self.screen.blit(start_text, start_text.get_rect(center=start_rect.center))

    def draw_menu_preview(self) -> None:
        # Kleine still uit de gameplay om het thema meteen te tonen.
        pygame.draw.circle(self.screen, (235, 208, 140), (1655, 335), 56)
        pygame.draw.rect(self.screen, (126, 90, 60), (1120, 455, 540, 18), border_radius=10)
        pygame.draw.rect(self.screen, (96, 66, 40), (1110, 386, 24, 82), border_radius=8)
        pygame.draw.rect(self.screen, (96, 66, 40), (1270, 386, 24, 82), border_radius=8)
        pygame.draw.rect(self.screen, (160, 220, 230), (1160, 332, 180, 16), border_radius=8)
        pygame.draw.rect(self.screen, (166, 114, 70), (1412, 380, 26, 90), border_radius=8)
        self.draw_bird_icon("red", (1020, 410), 0.95)
        self.draw_bird_icon("yellow", (1088, 364), 0.78)
        self.draw_bird_icon("blue", (1128, 344), 0.66)

    def draw_level_select(self) -> None:
        # Laat alle missies tegelijk zien met planeet en zwaartekracht.
        self.draw_gradient_background((18, 20, 38), (76, 58, 78))
        title = self.font_large.render("Select Mission", True, TEXT)
        desc = self.font_body.render("5 симметричных арен. Только гравитация и структура влияют на сложность.", True, SUBTLE)
        self.screen.blit(title, (120, 90))
        self.screen.blit(desc, (124, 170))

        start_x = 95
        card_w = 330
        card_h = 260
        gap = 28
        y = 300
        for index, level in enumerate(LEVELS):
            x = start_x + index * (card_w + gap)
            rect = pygame.Rect(x, y, card_w, card_h)
            hovered = rect.collidepoint(self.get_virtual_mouse_pos())
            bg = (20, 30, 48) if not hovered else (43, 55, 82)
            pygame.draw.rect(self.screen, bg, rect, border_radius=26)
            pygame.draw.rect(self.screen, ACCENT if hovered else (255, 255, 255), rect, width=2, border_radius=26)
            pygame.draw.circle(self.screen, level["palette"]["dust"], (x + 64, y + 60), 26)
            pygame.draw.rect(self.screen, (255, 255, 255, 18), (x + 22, y + 108, card_w - 44, 60), border_radius=18)
            pygame.draw.rect(self.screen, (255, 255, 255, 12), (x + 22, y + 182, card_w - 44, 54), border_radius=18)
            planet = self.font_title.render(level["planet"], True, TEXT)
            mission = self.font_small.render(f"Level {index + 1}", True, SUBTLE)
            gravity = self.font_body.render(f"{level['gravity']} px/s²", True, ACCENT)
            birds = self.font_small.render("birds: " + " ".join(b[0].upper() for b in level["birds"]), True, SUBTLE)
            self.screen.blit(planet, (x + 104, y + 34))
            self.screen.blit(mission, (x + 28, y + 122))
            self.screen.blit(gravity, (x + 28, y + 142))
            self.screen.blit(birds, (x + 28, y + 196))

        hint = self.font_small.render("Esc: назад в меню или выход. R: рестарт уровня во время игры.", True, SUBTLE)
        self.screen.blit(hint, (120, 940))

    def draw_game(self) -> None:
        # Tekent achtergrond, spelwereld, HUD en overlay in vaste volgorde.
        level = LEVELS[self.level_index]
        self.draw_gradient_background(self.palette["top"], self.palette["bottom"])
        pygame.draw.circle(self.screen, self.palette["dust"], (1550, 140), 110)
        pygame.draw.circle(self.screen, self.palette["dust"], (1550, 140), 110, 6)
        pygame.draw.ellipse(self.screen, (255, 255, 255, 30), (1200, 160, 300, 70))
        pygame.draw.ellipse(self.screen, (255, 255, 255, 18), (920, 230, 220, 50))

        pygame.draw.rect(self.screen, GROUND, (0, FLOOR_Y, WIDTH, HEIGHT - FLOOR_Y))
        pygame.draw.rect(self.screen, (130, 97, 66), (0, FLOOR_Y, WIDTH, 22))
        for ridge_x in range(0, WIDTH, 100):
            pygame.draw.circle(self.screen, self.palette["dust"], (ridge_x, 940), 20)

        self.draw_slingshot()
        self.draw_trajectory()

        for entity in self.entities:
            entity.draw(self.screen)
        self.draw_preview_bird()
        self.draw_particles()
        self.draw_hud(level)
        if self.overlay_state:
            self.draw_overlay()

    def draw_slingshot(self) -> None:
        # Tekent frame, elastieken en pouch op basis van de trekpositie.
        anchor = pygame.Vector2(SLING_ANCHOR)
        pull_pos = self.drag_position if self.aiming else anchor
        wood_dark = (77, 41, 20)
        wood_mid = (122, 78, 42)
        wood_light = (189, 137, 82)

        pygame.draw.line(self.screen, wood_dark, (anchor.x - 62, anchor.y + 30), (anchor.x - 4, anchor.y + 4), 16)
        pygame.draw.line(self.screen, wood_mid, (anchor.x - 56, anchor.y + 28), (anchor.x - 8, anchor.y + 8), 10)

        pygame.draw.line(self.screen, wood_dark, (anchor.x + 4, anchor.y + 210), (anchor.x + 4, anchor.y - 40), 26)
        pygame.draw.line(self.screen, wood_light, (anchor.x + 10, anchor.y + 204), (anchor.x + 10, anchor.y - 46), 8)

        pygame.draw.line(self.screen, wood_dark, (anchor.x + 2, anchor.y + 18), (anchor.x + 40, anchor.y - 155), 22)
        pygame.draw.line(self.screen, wood_dark, (anchor.x + 8, anchor.y + 26), (anchor.x + 124, anchor.y - 148), 22)
        pygame.draw.line(self.screen, wood_light, (anchor.x + 10, anchor.y + 22), (anchor.x + 42, anchor.y - 145), 7)
        pygame.draw.line(self.screen, wood_light, (anchor.x + 16, anchor.y + 30), (anchor.x + 118, anchor.y - 138), 7)

        left_band_anchor = pygame.Vector2(anchor.x + 42, anchor.y - 145)
        right_band_anchor = pygame.Vector2(anchor.x + 118, anchor.y - 138)
        pouch = pull_pos + pygame.Vector2(0, -2)
        pygame.draw.line(self.screen, (56, 28, 17), left_band_anchor, pouch, 8)
        pygame.draw.line(self.screen, (56, 28, 17), right_band_anchor, pouch, 8)
        pygame.draw.line(self.screen, (105, 62, 34), left_band_anchor + (3, 2), pouch + (3, 2), 3)
        pygame.draw.line(self.screen, (105, 62, 34), right_band_anchor + (3, 2), pouch + (3, 2), 3)
        pygame.draw.ellipse(self.screen, (96, 56, 31), (pouch.x - 18, pouch.y - 10, 36, 20))

    def draw_preview_bird(self) -> None:
        # Toont de volgende vogel zolang er nog niets actief vliegt.
        bird_type = self.next_bird_type()
        if not bird_type or self.active_bird or self.overlay_state:
            return
        pos = self.drag_position if self.aiming else pygame.Vector2(SLING_ANCHOR)
        self.draw_bird_icon(bird_type, pos, 1.0)

    def draw_bird_icon(self, bird_type: str, pos: tuple[float, float] | pygame.Vector2, scale: float) -> None:
        # Herbruikbare vogelweergave voor HUD, menu en slingshot-preview.
        base = BIRD_DATA[bird_type]["color"]
        outline = BIRD_DATA[bird_type]["outline"]
        radius = int(BIRD_DATA[bird_type]["radius"] * scale)
        x, y = int(pos[0]), int(pos[1])
        pygame.draw.circle(self.screen, base, (x, y), radius)
        pygame.draw.circle(self.screen, outline, (x, y), radius, max(2, int(3 * scale)))
        pygame.draw.circle(self.screen, (255, 255, 255), (x - int(6 * scale), y - int(5 * scale)), max(3, int(6 * scale)))
        pygame.draw.circle(self.screen, (255, 255, 255), (x + int(6 * scale), y - int(5 * scale)), max(3, int(6 * scale)))
        pygame.draw.circle(self.screen, (20, 20, 20), (x - int(5 * scale), y - int(4 * scale)), max(2, int(3 * scale)))
        pygame.draw.circle(self.screen, (20, 20, 20), (x + int(5 * scale), y - int(4 * scale)), max(2, int(3 * scale)))
        pygame.draw.polygon(
            self.screen,
            (248, 172, 47),
            [(x + radius - 1, y), (x + radius + int(12 * scale), y - int(5 * scale)), (x + radius + int(12 * scale), y + int(5 * scale))],
        )

    def draw_trajectory(self) -> None:
        # Toont een voorspelling van de baan voordat er gelanceerd wordt.
        if not self.aiming:
            return
        bird_type = self.next_bird_type()
        if not bird_type:
            return
        pull = pygame.Vector2(SLING_ANCHOR) - self.drag_position
        if pull.length() > MAX_PULL:
            pull.scale_to_length(MAX_PULL)
        base_velocity = pull * BASE_LAUNCH_SPEED * BIRD_DATA[bird_type]["launch_scale"]
        gravity = self.space.gravity[1] if self.space else LEVELS[self.level_index]["gravity"]
        damping = self.space.damping if self.space else 1.0
        variants = [base_velocity]
        if bird_type == "blue":
            variants = [base_velocity.rotate_rad(-0.19), base_velocity, base_velocity.rotate_rad(0.19)]
        for index, velocity in enumerate(variants):
            points = []
            pos = pygame.Vector2(SLING_ANCHOR)
            vel = pygame.Vector2(velocity)
            dt = 1 / 18
            for _ in range(23):
                vel.y += gravity * dt
                vel *= damping
                pos += vel * dt
                points.append((int(pos.x), int(pos.y)))
            color = (255, 255, 255) if len(variants) == 1 else [(160, 230, 255), (255, 255, 255), (160, 230, 255)][index]
            for point_index, point in enumerate(points):
                radius = max(3, 7 - point_index // 5)
                pygame.draw.circle(self.screen, color, point, radius)

    def draw_particles(self) -> None:
        # Deeltjes krijgen alpha op basis van resterende levensduur.
        for particle in self.particles:
            alpha = max(0, min(255, int(255 * min(1.0, particle.life * 1.7))))
            surf = pygame.Surface((int(particle.radius * 4), int(particle.radius * 4)), pygame.SRCALPHA)
            pygame.draw.circle(surf, (*particle.color, alpha), (int(particle.radius * 2), int(particle.radius * 2)), int(particle.radius))
            self.screen.blit(surf, (particle.x - particle.radius * 2, particle.y - particle.radius * 2))

    def draw_hud(self, level: dict) -> None:
        # HUD toont planeetdata, tips en de resterende vogelvolgorde.
        panel = pygame.Surface((520, 142), pygame.SRCALPHA)
        pygame.draw.rect(panel, PANEL, (0, 0, 520, 142), border_radius=24)
        pygame.draw.rect(panel, (255, 255, 255, 55), (0, 0, 520, 142), width=2, border_radius=24)
        self.screen.blit(panel, (40, 34))
        title = self.font_title.render(level["planet"], True, TEXT)
        meta = self.font_small.render(f"g = {level['gravity']} px/s²", True, SUBTLE)
        tip = self.font_small.render("Space/Click: активировать yellow boost. Esc: к выбору уровней.", True, SUBTLE)
        self.screen.blit(title, (62, 52))
        self.screen.blit(meta, (62, 102))
        self.screen.blit(tip, (62, 134))

        birds_panel = pygame.Surface((360, 142), pygame.SRCALPHA)
        pygame.draw.rect(birds_panel, PANEL, (0, 0, 360, 142), border_radius=24)
        self.screen.blit(birds_panel, (1510, 34))
        birds_text = self.font_body.render("Bird Queue", True, TEXT)
        self.screen.blit(birds_text, (1540, 50))
        for index, bird_type in enumerate(self.birds_queue[:6]):
            self.draw_bird_icon(bird_type, (1560 + index * 48, 112), 0.75)
        status_color = SUCCESS if self.overlay_state == "win" else DANGER if self.overlay_state == "lose" else ACCENT
        status = self.font_small.render(self.message, True, status_color)
        self.screen.blit(status, (1540, 134))

    def draw_overlay(self) -> None:
        # Overlay blokkeert input niet volledig; een klik handelt de volgende stap af.
        overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        overlay.fill((7, 9, 16, 170))
        self.screen.blit(overlay, (0, 0))
        panel_rect = pygame.Rect(630, 330, 660, 320)
        pygame.draw.rect(self.screen, (18, 25, 42), panel_rect, border_radius=32)
        pygame.draw.rect(self.screen, (255, 255, 255), panel_rect, width=2, border_radius=32)
        title = "Victory" if self.overlay_state == "win" else "Retry"
        body = "Нажми, чтобы перейти дальше." if self.overlay_state == "win" else "Нажми, чтобы перезапустить уровень."
        title_color = SUCCESS if self.overlay_state == "win" else DANGER
        self.screen.blit(self.font_large.render(title, True, title_color), (810, 385))
        self.screen.blit(self.font_body.render(self.message, True, TEXT), (770, 480))
        self.screen.blit(self.font_body.render(body, True, SUBTLE), (744, 538))

    def draw(self) -> None:
        # Rendert het actieve scherm en schaalt alleen als dat nodig is.
        self.window.fill((6, 10, 18))
        if self.scene == "menu":
            self.draw_menu()
        elif self.scene == "level_select":
            self.draw_level_select()
        else:
            self.draw_game()
        if self.present_scaled:
            self.window.fill((6, 10, 18))
            scaled = pygame.transform.smoothscale(self.screen, self.viewport.size)
            self.window.blit(scaled, self.viewport.topleft)
        pygame.display.flip()

    def run(self) -> None:
        # Hoofdlus: input, update en draw in die vaste volgorde.
        while self.running:
            dt = min(0.033, self.clock.tick(FPS) / 1000)
            self.handle_events()
            if self.scene == "game":
                self.update_game(dt)
            self.draw()
        pygame.quit()
