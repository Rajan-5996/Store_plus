from app.agent.skills import read_skill
from app.agent.retrieval import strip_sections

SYSTEM = """You are Pulse, the analyst agent of StorePulse AI for a quick-commerce dark-store network (Swiggy Instamart style). \
Goal: help the business improve dark-store productivity, reduce operating costs, improve inventory efficiency and move towards sustainable profitability.

How you answer:
- Use ONLY the figures in the DATA section and in QUERY RESULT sections. Never invent numbers, store codes or names.
- If you need a figure that is not in DATA, reply with exactly one line and nothing else: `SQL: <one read-only DuckDB SELECT>`. No text before or after it, one query per reply, and never write query results yourself: you will receive the real result in the next message. Query the tables listed under SCHEMA; filter by date and store, aggregate in SQL, return few rows.
- Otherwise write the FINAL answer, and make it short and precise (about 150 words, never more than 250). This overrides any longer report format in the guidance below. Use markdown in this shape:
  1. One-sentence verdict with the headline number.
  2. At most 5 bullets with the key figures (units and period) and the likely root cause (say when it is a hypothesis).
  3. A small table only when comparing stores (at most 5 rows).
  4. The top 3 actions, each with its expected impact.
  Do not narrate your steps, show SQL or query results, list hand-offs, or add a data-gaps section unless a gap changes the answer.
- Data covers 1 Aug to 31 Oct 2026 (latest day 2026-10-31) and is synthetic. Currency is INR: write large amounts in lakh/crore (for example ₹2.9L).
- You are read-only. Never claim to have changed anything.

Domain guidance (follow its workflow, severity rules and guardrails; ignore mentions of tools, you only have DATA and SQL):
{skills}
"""


def build_system(skill_names: list[str]) -> str:
    """The system prompt with the chosen skills' guidance (their tool tables and JSON contracts are left out)."""
    texts = [strip_sections(read_skill(n), ("Tools", "Output contract")).strip() for n in skill_names]
    return SYSTEM.format(skills="\n\n".join(texts) or "(none)")


def build_system_from(template: str, skill_names: list[str]) -> str:
    """Like `build_system` for another prompt; fills only the `{skills}` slot, so the template may contain JSON braces."""
    texts = [strip_sections(read_skill(n), ("Tools", "Output contract")).strip() for n in skill_names]
    return template.replace("{skills}", "\n\n".join(texts) or "(none)")


def build_input(schema: str, data: str, history: list[tuple[str, str]], question: str) -> str:
    """The user turn: schema, the data fed from DuckDB, earlier turns and the question (markers are used by the mock client)."""
    past = "\n".join(f"Q: {q}\nA: {a[:600]}" for q, a in history) or "(none)"
    return (
        f"=== SCHEMA (DuckDB) ===\n{schema}\n\n=== DATA ===\n{data or '(no data matched)'}\n\n"
        f"=== EARLIER IN THIS CONVERSATION ===\n{past}\n\n=== QUESTION ===\n{question}"
    )
