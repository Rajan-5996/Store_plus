from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

SERVER_ROOT = Path(__file__).resolve().parents[2]


class AgentSettings(BaseSettings):
    """Agent configuration, read from environment variables or `store_plus_server/.env`.

    Domo AI: set DOMO_INSTANCE (the `acme` in https://acme.domo.com) and DOMO_DEVELOPER_TOKEN.
    Without them the agent runs in mock mode (no network calls); DOMO_MOCK=1 forces mock mode.
    """

    model_config = SettingsConfigDict(env_file=SERVER_ROOT / ".env", extra="ignore", populate_by_name=True)

    domo_instance: str = Field(default="", alias="DOMO_INSTANCE")
    domo_developer_token: str = Field(default="", alias="DOMO_DEVELOPER_TOKEN")
    domo_base_url: str = Field(default="", alias="DOMO_BASE_URL")  # optional override of https://<instance>.domo.com
    domo_model: str = Field(default="", alias="DOMO_MODEL")  # optional Domo model id; empty = Domo default
    domo_mock: bool = Field(default=False, alias="DOMO_MOCK")

    timeout_s: float = 180.0  # per Domo request
    max_rounds: int = 3  # data-fetch rounds (SQL requests) the model may ask for per question
    max_context_chars: int = 24000  # data fed to the model per question
    max_rows: int = 60  # rows returned for one SQL request
    history_turns: int = 4  # earlier question/answer pairs kept per conversation

    @property
    def use_mock(self) -> bool:
        return self.domo_mock or not (self.domo_developer_token and (self.domo_instance or self.domo_base_url))

    @property
    def endpoint(self) -> str:
        base = self.domo_base_url.rstrip("/") or f"https://{self._instance_name()}.domo.com"
        return f"{base}/api/ai/v1/text/generation"

    def _instance_name(self) -> str:
        """Accepts `gwcteq-partner`, `gwcteq-partner.domo.com` or a full URL and returns just the instance name."""
        name = self.domo_instance.strip().removeprefix("https://").removeprefix("http://")
        name = name.split("/", 1)[0].split("?", 1)[0]
        return name.removesuffix(".domo.com")


def get_settings() -> AgentSettings:
    return AgentSettings()
