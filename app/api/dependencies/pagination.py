from typing import Annotated

from fastapi import Query

Limit = Annotated[int, Query(ge=1, le=100)]
Offset = Annotated[int, Query(ge=0)]


def pagination(
    limit: Limit = 20,
    offset: Offset = 0,
) -> tuple[int, int]:
    return limit, offset
