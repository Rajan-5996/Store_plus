"""Try the agent from a terminal: `uv run python -m app.agent.cli "Why is store #412 losing money?"`"""
import sys

from app.agent.engine import ask_stream
from app.core.db import init_db


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")  # answers contain characters the Windows console codepage lacks
    question = " ".join(sys.argv[1:]).strip()
    if not question:
        sys.exit('Usage: uv run python -m app.agent.cli "your question"')
    init_db()
    for e in ask_stream(question):
        if e["type"] == "step":
            print(f"  . {e['text']}")
        elif e["type"] == "answer":
            print("\n" + e["answer"])
        else:
            sys.exit(e["message"])


if __name__ == "__main__":
    main()
