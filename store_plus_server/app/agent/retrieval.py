"""Decides what data a question needs and gathers it from DuckDB, so the model is fed real numbers up front."""
import json
import re
from dataclasses import dataclass, field
from typing import Any

from app.agent.settings import get_settings
from app.agent.store_data import find_stores, store_profile
from app.agent.summaries import SCREENS, dashboard_summary

# keywords that point at a dashboard screen (the page the user is on always counts too)
KEYWORDS: dict[str, tuple[str, ...]] = {
    "utilisation": ("utilis", "capacity", "busy", "peak", "throughput", "idle", "spare"),
    "inventory": ("stock", "inventory", "wastage", "waste", "expiry", "spoil", "replenish", "forecast", "supplier", "vendor"),
    "operations": ("pick", "pack", "deliver", "rider", "staff", "shift", "late", "eta", "queue", "cancel", "complaint", "on-time"),
    "profitability": ("profit", "loss", "losing", "margin", "cost", "break-even", "breakeven", "p&l", "contribution", "rent", "money"),
    "network": ("overlap", "catchment", "coverage", "location", "expansion", "cannibal", "unserved", "pocket", "map"),
    "productmix": ("sku", "product", "categor", "basket", "assortment", "brand", "search", "price"),
}
SCREEN_SKILL = {
    "overview": "store-profitability",
    "utilisation": "store-utilisation",
    "inventory": "inventory-intelligence",
    "operations": "operational-efficiency",
    "profitability": "store-profitability",
    "network": "network-optimisation",
    "productmix": "product-mix",
}
STEP_LABEL = {
    "overview": "Checking the network overview",
    "utilisation": "Checking store utilisation",
    "inventory": "Checking inventory",
    "operations": "Checking operations",
    "profitability": "Checking profitability",
    "network": "Checking the network and coverage",
    "productmix": "Checking the product mix",
}


@dataclass
class Context:
    sections: list[tuple[str, Any]] = field(default_factory=list)
    steps: list[str] = field(default_factory=list)
    tools: list[str] = field(default_factory=list)
    skills: list[str] = field(default_factory=list)

    def render(self) -> str:
        """The sections as compact JSON, cut to the configured size (later sections are dropped first)."""
        limit, out, used = get_settings().max_context_chars, [], 0
        for title, data in self.sections:
            block = f"## {title}\n{json.dumps(data, default=str, separators=(',', ':'))}"
            if used + len(block) > limit:
                break
            out.append(block)
            used += len(block)
        return "\n\n".join(out)


def pick_screens(question: str, screen: str | None) -> list[str]:
    """Screens whose data answers the question: keyword matches first, then the current page, else the overview."""
    low = question.lower()
    hits = [s for s, words in KEYWORDS.items() if any(w in low for w in words)]
    if screen in SCREENS and screen not in hits:
        hits.append(screen)
    if "overview" not in hits and (not hits or "overall" in low or "network" in low):
        hits.insert(0, "overview")
    return hits[:3]


def build_context(question: str, screen: str | None) -> Context:
    ctx = Context()
    for store in find_stores(question):
        ctx.steps.append(f"Pulling the data for store {store['store_code']}")
        ctx.sections.append((f"Store {store['store_code']} {store['locality']}", store_profile(store)))
        ctx.tools.append("store_profile")
    for name in pick_screens(question, screen):
        ctx.steps.append(STEP_LABEL[name])
        ctx.sections.append((f"Dashboard summary: {name} (30 days to 2026-10-31, all cities)", dashboard_summary(name)))
        ctx.tools.append("dashboard_summary")
        skill = SCREEN_SKILL[name]
        if skill not in ctx.skills and len(ctx.skills) < 2:
            ctx.skills.append(skill)
    return ctx


def strip_sections(body: str, headers: tuple[str, ...]) -> str:
    """Remove `## <header>` sections (for example the tool table and JSON output contract) from a skill text."""
    for h in headers:
        body = re.sub(rf"(?ms)^## {re.escape(h)}\b.*?(?=^## |\Z)", "", body)
    return body
