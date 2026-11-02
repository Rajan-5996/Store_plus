"""Domo AI text generation over REST (https://<instance>.domo.com/api/ai/v1/text/generation).

`POST` with header `X-DOMO-Developer-Token` and body `{"input": "...", "system": "...", "model": "..."}`;
the reply is `{"output": "...", "modelId": "..."}`.
"""
import json
import re
import time

import httpx

from app.agent.settings import AgentSettings, get_settings


class DomoError(RuntimeError):
    """The Domo AI request failed (bad token, network, server error)."""


class DomoClient:
    def __init__(self, settings: AgentSettings | None = None) -> None:
        self.s = settings or get_settings()

    def generate(self, prompt: str, system: str | None = None) -> str:
        body: dict[str, str] = {"input": prompt}
        if system:
            body["system"] = system
        if self.s.domo_model:
            body["model"] = self.s.domo_model
        headers = {"X-DOMO-Developer-Token": self.s.domo_developer_token, "Content-Type": "application/json"}
        last = "unknown error"
        for attempt in range(3):
            try:
                r = httpx.post(self.s.endpoint, json=body, headers=headers, timeout=self.s.timeout_s)
            except httpx.HTTPError as e:
                last = f"network error: {e.__class__.__name__}"
            else:
                if r.status_code == 200:
                    return str(r.json().get("output", ""))
                if r.status_code in (401, 403):
                    raise DomoError("Domo rejected the developer token (HTTP %d). Check DOMO_DEVELOPER_TOKEN and DOMO_INSTANCE." % r.status_code)
                last = f"HTTP {r.status_code}: {r.text[:200]}"
                if r.status_code not in (429, 500, 502, 503, 504):
                    break
            time.sleep(2 * (attempt + 1))
        raise DomoError(f"Domo AI request failed: {last}")


class MockClient:
    """Offline stand-in for Domo AI: no network, no token, no limits. Replies follow the same protocol as the real model.

    It never calls an LLM: it summarises the DATA block that was fed in, so the whole flow (retrieval, SQL rounds,
    streaming, UI) can be developed and tested without quota.
    """

    def generate(self, prompt: str, system: str | None = None) -> str:
        if "=== FORMAT: JSON ===" in prompt:  # the recommended-actions panels ask for strict JSON
            demo = {"actions": [{"title": "Connect Domo AI for real recommendations", "priority": "low", "stores": [],
                                 "why": "Demo mode: no Domo token is set, so no AI-written actions are available.",
                                 "impact": "to be sized"}]}
            return json.dumps(demo)
        data = prompt.split("=== DATA ===", 1)[-1].split("=== QUESTION ===", 1)[0]
        question = prompt.rsplit("=== QUESTION ===", 1)[-1].strip().splitlines()[0] if "=== QUESTION ===" in prompt else ""
        if "QUERY RESULT" not in prompt and question.lower().startswith("sql:"):
            return "SQL: " + question[4:].strip()  # lets tests exercise the SQL round
        facts = re.findall(r'"(\w+)":\s*(-?\d+(?:\.\d+)?)', data)[:12]
        lines = [f"- **{k}**: {v}" for k, v in facts] or ["- (no figures were fed in for this question)"]
        result = re.search(r"=== QUERY RESULT \d+ ===\n(.*?)\n=== END RESULT", prompt, re.S)
        if result:
            lines.append(f"- query result: `{result.group(1).splitlines()[-1][:200]}`")
        note = "**Demo mode** (no Domo token set, so this is a canned summary of the data, not an AI answer)."
        return note + "\n\n" + "\n".join(lines)


def make_client() -> DomoClient | MockClient:
    return MockClient() if get_settings().use_mock else DomoClient()
