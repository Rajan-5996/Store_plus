import pytest

from app.core import store


@pytest.fixture(autouse=True)
def app_store():
    """Each test gets an empty in-memory store, so tests never touch storage/ or clash with a running server."""
    store.open_store(":memory:")
    yield
    store.close_store()
