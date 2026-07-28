"""SQLAlchemy models — mirrors the schema in CLAUDE.md §4 exactly.

Two groups of tables:
  * Course / Unit / Skill / Lesson / Exercise -> static, seeded content.
  * User / UserSkillProgress                  -> mutable, persisted user state.
"""

import enum

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import relationship

from app.database import Base
from app.time_utils import utcnow


class ExerciseType(str, enum.Enum):
    multiple_choice = "multiple_choice"
    translate = "translate"
    match_pairs = "match_pairs"
    fill_blank = "fill_blank"
    type_answer = "type_answer"


class SkillStatus(str, enum.Enum):
    locked = "locked"
    available = "available"
    completed = "completed"


class SkillKind(str, enum.Enum):
    """What a path node looks like.

    Duolingo varies the artwork along a unit — lesson, story, chest, practice,
    then the unit's trophy. This is the only field driving that, and every kind
    is still a playable skill: story content and reward mechanics are out of
    scope (§10), so those nodes hold ordinary lessons behind their icon.
    """

    lesson = "lesson"
    story = "story"
    chest = "chest"
    practice = "practice"
    review = "review"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    xp_total = Column(Integer, nullable=False, default=0)
    streak_count = Column(Integer, nullable=False, default=0)
    last_activity_date = Column(Date, nullable=True)
    hearts = Column(Integer, nullable=False, default=5)
    hearts_last_refill_at = Column(DateTime, nullable=False, default=utcnow)
    gems = Column(Integer, nullable=False, default=0)

    skill_progress = relationship(
        "UserSkillProgress", back_populates="user", cascade="all, delete-orphan"
    )


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)

    units = relationship(
        "Unit",
        back_populates="course",
        cascade="all, delete-orphan",
        order_by="Unit.order_index",
    )


class Unit(Base):
    __tablename__ = "units"

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String, nullable=False)
    order_index = Column(Integer, nullable=False)

    course = relationship("Course", back_populates="units")
    skills = relationship(
        "Skill",
        back_populates="unit",
        cascade="all, delete-orphan",
        order_by="Skill.order_index",
    )


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    title = Column(String, nullable=False)
    order_index = Column(Integer, nullable=False)
    # Presentational: picks the node's icon on the path (see SkillKind).
    kind = Column(
        SAEnum(SkillKind), nullable=False, default=SkillKind.lesson
    )

    unit = relationship("Unit", back_populates="skills")
    lessons = relationship(
        "Lesson",
        back_populates="skill",
        cascade="all, delete-orphan",
        order_by="Lesson.order_index",
    )


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    order_index = Column(Integer, nullable=False)

    skill = relationship("Skill", back_populates="lessons")
    exercises = relationship(
        "Exercise",
        back_populates="lesson",
        cascade="all, delete-orphan",
        order_by="Exercise.order_index",
    )


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    order_index = Column(Integer, nullable=False)
    type = Column(SAEnum(ExerciseType), nullable=False)
    # Shape depends on `type` — see CLAUDE.md §5. One JSON column instead of
    # five near-identical tables.
    payload = Column(JSON, nullable=False)

    lesson = relationship("Lesson", back_populates="exercises")


class UserSkillProgress(Base):
    __tablename__ = "user_skill_progress"
    __table_args__ = (UniqueConstraint("user_id", "skill_id", name="uq_user_skill"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    status = Column(SAEnum(SkillStatus), nullable=False, default=SkillStatus.locked)
    times_completed = Column(Integer, nullable=False, default=0)
    # Whether the Legendary challenge on this skill has been beaten.
    #
    # The one field beyond CLAUDE.md §4's schema. Legendary can't work without
    # it: the challenge is only offered on a completed skill and its outcome has
    # to survive a reload, and neither `status` nor `times_completed` can carry
    # that (a legendary run deliberately doesn't count as a lesson). Kept to a
    # single boolean rather than the levels/crowns §4 rules out.
    is_legendary = Column(Boolean, nullable=False, default=False)

    user = relationship("User", back_populates="skill_progress")
    skill = relationship("Skill")
