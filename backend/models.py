from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from database import Base

class Poll(Base):
    """투표 테이블 모델"""
    __tablename__ = "polls"
    
    # 기본 키
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # 투표 질문
    question = Column(String(500), nullable=False, comment="투표 질문")
    
    # 선택지 목록 (JSON 형태로 저장)
    options = Column(JSON, nullable=False, comment="선택지 목록")
    
    # 투표 결과 (JSON 형태로 저장, 각 선택지별 득표수)
    votes = Column(JSON, nullable=False, default=list, comment="각 선택지별 득표수")
    
    # 생성 시간
    created_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(),
        nullable=False,
        comment="생성 시간"
    )
    
    # 수정 시간
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        comment="수정 시간"
    )
    
    def __repr__(self):
        return f"<Poll(id={self.id}, question='{self.question}')>"
    
    def to_dict(self):
        """모델을 딕셔너리로 변환"""
        return {
            "id": self.id,
            "question": self.question,
            "options": self.options,
            "votes": self.votes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }