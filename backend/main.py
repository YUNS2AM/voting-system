# main.py

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import uvicorn
from fastapi import WebSocket, WebSocketDisconnect
from typing import List
import asyncio
from fastapi.encoders import jsonable_encoder

from database import engine, Base, get_db
from models import Poll
from schemas import (
    PollCreate, PollResponse, PollListResponse,
    VoteRequest, MessageResponse, PollStats
)

# 연결된 클라이언트 목록
clients: List[WebSocket] = []


# 테이블 자동 생성
Base.metadata.create_all(bind=engine)

# FastAPI 앱 생성
app = FastAPI(
    title="투표 시스템 API",
    description="MySQL 연동 투표 시스템",
    version="2.0.0"
)

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    try:
        while True:
            # 연결 유지를 위해 클라이언트로부터 메시지를 기다릴 수 있습니다.
            # 현재 구현에서는 서버 -> 클라이언트 단방향 통신이므로 비워둡니다.
            await websocket.receive_text()
    except WebSocketDisconnect:
        clients.remove(websocket)


async def broadcast_vote_update_direct(poll_data, total_votes: int):
    """세션 없이 브로드캐스트 (수정 없음)"""
    message = {
        "type": "vote_update",
        "poll": poll_data,
        "total_votes": total_votes
    }
    disconnected = []
    # 모든 연결된 클라이언트에게 메시지 전송
    for ws in clients:
        try:
            await ws.send_json(message)
        except:
            disconnected.append(ws)
    # 연결이 끊긴 클라이언트 정리
    for ws in disconnected:
        clients.remove(ws)



# ==================== API 엔드포인트 ====================

@app.get("/", response_model=MessageResponse)
async def root(db: Session = Depends(get_db)):
    """서버 상태 확인"""
    total_polls = db.query(Poll).count()
    return MessageResponse(
        status="ok",
        message="투표 시스템 API 서버가 정상 작동 중입니다.",
        data={"total_polls": total_polls}
    )


@app.get("/polls", response_model=List[PollResponse])
async def get_polls(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """전체 투표 목록 조회"""
    polls = db.query(Poll).offset(skip).limit(limit).all()
    return polls


@app.get("/polls/{poll_id}", response_model=PollResponse)
async def get_poll(poll_id: int, db: Session = Depends(get_db)):
    """특정 투표 조회"""
    poll = db.query(Poll).filter(Poll.id == poll_id).first()
    
    if not poll:
        raise HTTPException(status_code=404, detail="투표를 찾을 수 없습니다.")
    
    return poll


@app.post("/polls", response_model=PollResponse, status_code=201)
async def create_poll(request: PollCreate, db: Session = Depends(get_db)):
    """새 투표 생성"""
    new_poll = Poll(
        question=request.question,
        options=request.options,
        votes=[0] * len(request.options)
    )
    
    db.add(new_poll)
    db.commit()
    db.refresh(new_poll)
    
    return new_poll


@app.post("/polls/{poll_id}/vote", response_model=PollResponse)
async def vote(
    poll_id: int,
    request: VoteRequest,
    db: Session = Depends(get_db)
):
    """투표하기"""
    poll = db.query(Poll).filter(Poll.id == poll_id).first()
    
    if not poll:
        raise HTTPException(status_code=404, detail="투표를 찾을 수 없습니다.")
    
    if request.option_index < 0 or request.option_index >= len(poll.options):
        raise HTTPException(status_code=400, detail="유효하지 않은 선택지입니다.")
    
    # ===== [수정된 부분 START] =====
    # SQLAlchemy가 list 내부의 변경을 감지하지 못하는 문제를 해결하기 위해
    # 새로운 list를 만들어 할당합니다.
    new_votes = list(poll.votes)  # 기존 votes 리스트를 복사하여 새 리스트 생성
    new_votes[request.option_index] += 1
    poll.votes = new_votes
    # ===== [수정된 부분 END] =====
    
    db.commit()
    db.refresh(poll)
    
    poll_data = jsonable_encoder(poll)
    total_votes = sum(poll.votes)

    # WebSocket으로 모든 클라이언트에게 실시간 업데이트 전송
    asyncio.create_task(broadcast_vote_update_direct(poll_data, total_votes))
    
    return poll


@app.get("/polls/{poll_id}/stats", response_model=PollStats)
async def get_poll_stats(poll_id: int, db: Session = Depends(get_db)):
    """투표 결과 통계 조회"""
    poll = db.query(Poll).filter(Poll.id == poll_id).first()
    
    if not poll:
        raise HTTPException(status_code=404, detail="투표를 찾을 수 없습니다.")
    
    total_votes = sum(poll.votes)
    
    results = []
    for i, (option, votes) in enumerate(zip(poll.options, poll.votes)):
        percentage = (votes / total_votes * 100) if total_votes > 0 else 0
        results.append({
            "option": option,
            "votes": votes,
            "percentage": round(percentage, 2)
        })
    
    return PollStats(
        poll_id=poll.id,
        question=poll.question,
        total_votes=total_votes,
        results=results
    )


@app.delete("/polls/{poll_id}", response_model=MessageResponse)
async def delete_poll(poll_id: int, db: Session = Depends(get_db)):
    """투표 삭제"""
    poll = db.query(Poll).filter(Poll.id == poll_id).first()
    
    if not poll:
        raise HTTPException(status_code=404, detail="투표를 찾을 수 없습니다.")
    
    question = poll.question
    db.delete(poll)
    db.commit()
    
    return MessageResponse(
        status="success",
        message=f"투표 '{question}'가 삭제되었습니다.",
        data={"deleted_poll_id": poll_id}
    )


@app.post("/init-data", response_model=MessageResponse)
async def init_data(db: Session = Depends(get_db)):
    """초기 샘플 데이터 생성"""
    if db.query(Poll).count() > 0:
        return MessageResponse(
            status="info",
            message="이미 데이터가 존재합니다.",
        )
    
    sample_polls = [
        Poll(
            question="가장 좋아하는 프로그래밍 언어는?",
            options=["Python", "JavaScript", "Java", "C++"],
            votes=[0, 0, 0, 0]
        ),
        Poll(
            question="점심 메뉴 추천",
            options=["한식", "중식", "일식", "양식"],
            votes=[0, 0, 0, 0]
        ),
        Poll(
            question="선호하는 개발 환경은?",
            options=["VS Code", "IntelliJ", "PyCharm", "Vim"],
            votes=[0, 0, 0, 0]
        )
    ]
    
    db.add_all(sample_polls)
    db.commit()
    
    return MessageResponse(
        status="success",
        message="초기 데이터가 생성되었습니다.",
        data={"created_polls": len(sample_polls)}
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)