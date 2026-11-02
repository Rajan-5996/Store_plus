"""Loads the skill files in `agent/skills/<skill>/SKILL.md` (plus their `references/`)."""
import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

SKILLS_DIR = Path(__file__).resolve().parent / "skills"
_FRONT = re.compile(r"\A---\s*\n(.*?)\n---\s*\n", re.S)


@dataclass(frozen=True)
class Skill:
    name: str
    description: str
    body: str
    references: tuple[str, ...]


def _meta(block: str) -> dict[str, str]:
    """Reads the simple `key: value` front matter used by the skill files."""
    out: dict[str, str] = {}
    for line in block.splitlines():
        key, sep, value = line.partition(":")
        if sep and key.strip():
            out[key.strip()] = value.strip()
    return out


@lru_cache(maxsize=1)
def load_skills() -> dict[str, Skill]:
    """Every skill folder that contains a SKILL.md, keyed by its `name`."""
    skills: dict[str, Skill] = {}
    for path in sorted(SKILLS_DIR.glob("*/SKILL.md")):
        text = path.read_text(encoding="utf-8")
        m = _FRONT.match(text)
        meta = _meta(m.group(1)) if m else {}
        refs = sorted(p.name for p in (path.parent / "references").glob("*.md"))
        name = meta.get("name", path.parent.name)
        skills[name] = Skill(name, " ".join(meta.get("description", "").split()), text[m.end():] if m else text, tuple(refs))
    return skills


def read_skill(name: str) -> str:
    skills = load_skills()
    if name not in skills:
        return f"Unknown skill '{name}'. Available: {', '.join(skills)}"
    return skills[name].body


def read_reference(skill: str, file: str) -> str:
    skills = load_skills()
    if skill not in skills:
        return f"Unknown skill '{skill}'. Available: {', '.join(skills)}"
    if file not in skills[skill].references:
        return f"Unknown reference '{file}' for {skill}. Available: {', '.join(skills[skill].references) or 'none'}"
    return (SKILLS_DIR / skill / "references" / file).read_text(encoding="utf-8")
