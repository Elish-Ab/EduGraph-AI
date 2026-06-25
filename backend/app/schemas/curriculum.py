from pydantic import BaseModel


class CLOSchema(BaseModel):
    id: str
    code: str
    description: str
    bloom_level: str | None

    model_config = {"from_attributes": True}


class TopicSchema(BaseModel):
    id: str
    title: str
    order: int
    clos: list[CLOSchema]

    model_config = {"from_attributes": True}


class UnitSchema(BaseModel):
    id: str
    code: str
    title: str
    order: int
    topics: list[TopicSchema]

    model_config = {"from_attributes": True}


class SubjectSchema(BaseModel):
    id: str
    code: str
    name: str
    grade: int
    units: list[UnitSchema]

    model_config = {"from_attributes": True}


class SubjectSummary(BaseModel):
    id: str
    code: str
    name: str
    grade: int
    unit_count: int
    clo_count: int

    model_config = {"from_attributes": True}
