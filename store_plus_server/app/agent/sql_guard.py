"""Read-only guard for SQL written by the model."""
import re

import duckdb

_BLOCKED = re.compile(
    r"\b(read_\w+|glob|copy|attach|detach|install|load|export|import|pragma|set|create|drop|alter|insert|update|delete|call)\b"
    r"|https?://|[a-zA-Z]:[\\/]|\.\./",
    re.I,
)


def check_sql(sql: str) -> str | None:
    """Return an error message if the SQL is not a single read-only SELECT, else None."""
    try:
        statements = duckdb.extract_statements(sql)
    except duckdb.Error as e:
        return f"SQL syntax error: {e}"
    if len(statements) != 1:
        return "Send exactly one SQL statement."
    if statements[0].type != duckdb.StatementType.SELECT:
        return "Only SELECT queries are allowed."
    # strip string literals before keyword checks so values like 'Set Wet' do not trip the filter
    bare = re.sub(r"'(?:[^']|'')*'", "''", sql)
    hit = _BLOCKED.search(bare)
    if hit:
        return f"Not allowed in a query: '{hit.group(0)}'. Query the registered tables and marts instead."
    return None
