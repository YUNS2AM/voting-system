from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime

# 기본 투표 스키마
class PollBase(BaseModel):
    """투표 기본 스키마"""
    question: str = Field(..., min_length=1, max_length=500, description="투표 질문")
    options: List[str] = Field(..., min_items=2, description="선택지 목록 (최소 2개)")
    
    @validator('options')
    def validate_options(cls, v):
        """선택지 유효성 검증"""
        if len(v) < 2:
            raise ValueError('선택지는 최소 2개 이상이어야 합니다.')
        if len(v) > 10:
            raise ValueError('선택지는 최대 10개까지 가능합니다.')
        # 빈 문자열 체크
        for option in v:
            if not option.strip():
                raise ValueError('빈 선택지는 허용되지 않습니다.')
        # 중복 체크
        if len(v) != len(set(v)):
            raise ValueError('중복된 선택지가 있습니다.')
        return v


# 투표 생성 요청 스키마
class PollCreate(PollBase):
    """투표 생성 요청 스키마"""
    pass


# 투표 업데이트 요청 스키마
class PollUpdate(BaseModel):
    """투표 업데이트 요청 스키마"""
    question: Optional[str] = Field(None, min_length=1, max_length=500)
    options: Optional[List[str]] = Field(None, min_items=2)


# 투표하기 요청 스키마
class VoteRequest(BaseModel):
    """투표 요청 스키마"""
    option_index: int = Field(..., ge=0, description="선택한 옵션의 인덱스 (0부터 시작)")
    
    @validator('option_index')
    def validate_option_index(cls, v):
        """옵션 인덱스 유효성 검증"""
        if v < 0:
            raise ValueError('옵션 인덱스는 0 이상이어야 합니다.')
        return v


# 투표 응답 스키마 (DB에서 조회한 결과)
class PollResponse(PollBase):
    """투표 응답 스키마"""
    id: int
    votes: List[int] = Field(default_factory=list, description="각 선택지별 득표수")
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True  # ORM 모델을 Pydantic 모델로 변환 허용
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


# 투표 목록 응답 스키마
class PollListResponse(BaseModel):
    """투표 목록 응답 스키마"""
    total: int = Field(..., description="전체 투표 개수")
    polls: List[PollResponse] = Field(..., description="투표 목록")


# 투표 결과 통계 스키마
class PollStats(BaseModel):
    """투표 결과 통계 스키마"""
    poll_id: int
    question: str
    total_votes: int = Field(..., description="총 투표수")
    results: List[dict] = Field(..., description="선택지별 결과")
    
    class Config:
        json_schema_extra = {
            "example": {
                "poll_id": 1,
                "question": "가장 좋아하는 프로그래밍 언어는?",
                "total_votes": 58,
                "results": [
                    {"option": "Python", "votes": 15, "percentage": 25.86},
                    {"option": "JavaScript", "votes": 23, "percentage": 39.66},
                    {"option": "Java", "votes": 8, "percentage": 13.79},
                    {"option": "C++", "votes": 12, "percentage": 20.69}
                ]
            }
        }


# 일반 응답 스키마
class MessageResponse(BaseModel):
    """일반 메시지 응답 스키마"""
    status: str = Field(..., description="응답 상태")
    message: str = Field(..., description="응답 메시지")
    data: Optional[dict] = Field(None, description="추가 데이터")