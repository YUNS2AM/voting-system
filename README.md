# 🗳️ VoteHub - 실시간 투표 시스템

> 간편하고 빠른 온라인 투표 플랫폼

MBC 아카데미 웹 개발 실습 프로젝트로, 사용자가 쉽게 투표를 생성하고 참여할 수 있는 실시간 투표 시스템입니다.

[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?style=flat&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![AWS](https://img.shields.io/badge/AWS-EC2%20%2B%20RDS-232F3E?style=flat&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)

---

## ✨ 주요 기능

- 📝 **투표 생성**: 질문과 선택지를 설정하여 새로운 투표 만들기
- 🗳️ **투표 참여**: 간편한 클릭으로 투표 참여
- 📊 **실시간 결과**: 투표 즉시 결과를 시각적 그래프로 확인
- 🗑️ **투표 관리**: 생성한 투표 삭제 기능
- 📱 **반응형 디자인**: 모바일, 태블릿, 데스크톱 모두 지원
- ⚡ **실시간 업데이트**: WebSocket을 통한 실시간 투표 결과 반영

---

## 🛠️ 기술 스택

### Frontend
- **HTML5** - 구조적인 마크업
- **CSS3** - 현대적인 반응형 디자인
- **JavaScript (ES6+)** - 동적 UI 및 API 통신

### Backend
- **FastAPI** - 고성능 Python 웹 프레임워크
- **SQLAlchemy** - ORM (Object-Relational Mapping)
- **Pydantic** - 데이터 유효성 검증
- **Uvicorn** - ASGI 서버

### Database
- **MySQL 8.0** - 관계형 데이터베이스
- **AWS RDS** - 클라우드 데이터베이스 서비스

### Deployment
- **AWS EC2** - 애플리케이션 서버
- **AWS RDS** - 데이터베이스 서버
- **Nginx** - 웹 서버 및 리버스 프록시

---

## 📁 프로젝트 구조

```
voting-system/
│
├── backend/                      # 백엔드 디렉토리
│   ├── main.py                   # FastAPI 애플리케이션
│   ├── database.py               # 데이터베이스 연결
│   ├── models.py                 # SQLAlchemy 모델
│   ├── schemas.py                # Pydantic 스키마
│   ├── requirements.txt          # Python 패키지
│   ├── .env                      # 환경 변수 (git 제외)
│   └── reset_db.py              # DB 초기화 스크립트
│
├── frontend/                     # 프론트엔드 디렉토리
│   ├── index.html               # 메인 HTML
│   ├── style.css                # 스타일시트
│   └── script.js                # JavaScript 로직
│
├── screenshots/                  # 스크린샷 디렉토리
│   ├── list.png
│   ├── create.png
│   └── vote.png
│
├── docs/                        # 문서 디렉토리
│   ├── ec2-deploy-guide.md     # EC2 배포 가이드
│   ├── mysql-setup-guide.md    # MySQL 설정 가이드
│   └── security-checklist.md   # 보안 체크리스트
│
├── .gitignore                   # Git 제외 파일
├── README.md                    # 프로젝트 문서
└── LICENSE                      # 라이센스
```

---

## 🚀 시작하기

### 사전 요구사항

- Python 3.8 이상
- MySQL 8.0 이상
- pip (Python 패키지 관리자)

### 로컬 환경 설치

#### 1. 저장소 클론
```bash
git clone https://github.com/your-username/voting-system.git
cd voting-system
```

#### 2. MySQL 데이터베이스 생성
```bash
mysql -u root -p

# MySQL 콘솔에서
CREATE DATABASE voting_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit
```

#### 3. 백엔드 설정
```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 패키지 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
nano .env  # DB 정보 입력
```

#### 4. 환경 변수 설정 (.env)
```env
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=voting_db
```

#### 5. 서버 실행
```bash
# 백엔드 서버 (터미널 1)
cd backend
python main.py

# 프론트엔드 서버 (터미널 2)
cd frontend
python -m http.server 3000
```

#### 6. 브라우저에서 접속
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API 문서: http://localhost:8000/docs

---

## 🌐 AWS 배포

자세한 배포 가이드는 [EC2 배포 가이드](./docs/ec2-deploy-guide.md)를 참조하세요.

### 배포 요약

1. **EC2 인스턴스 생성** (Ubuntu 22.04 LTS 권장)
2. **RDS MySQL 인스턴스 생성**
3. **보안 그룹 설정** (포트 80, 8000, 3306)
4. **파일 업로드 및 설정**
5. **서버 실행**

---

## 📡 API 엔드포인트

### 투표 관리
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/` | 서버 상태 확인 |
| GET | `/polls` | 전체 투표 목록 조회 |
| GET | `/polls/{poll_id}` | 특정 투표 조회 |
| POST | `/polls` | 새 투표 생성 |
| POST | `/polls/{poll_id}/vote` | 투표하기 |
| GET | `/polls/{poll_id}/stats` | 투표 통계 조회 |
| DELETE | `/polls/{poll_id}` | 투표 삭제 |
| POST | `/init-data` | 샘플 데이터 생성 |

### API 문서
- Swagger UI: `http://your-domain:8000/docs`
- ReDoc: `http://your-domain:8000/redoc`

---

## 🗄️ 데이터베이스 스키마

### polls 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT | 투표 ID (Primary Key) |
| question | VARCHAR(500) | 투표 질문 |
| options | JSON | 선택지 목록 |
| votes | JSON | 각 선택지별 득표수 |
| created_at | TIMESTAMP | 생성 시간 |
| updated_at | TIMESTAMP | 수정 시간 |

---

## 🧪 테스트

### API 테스트 (curl)
```bash
# 서버 상태 확인
curl http://localhost:8000

# 투표 목록 조회
curl http://localhost:8000/polls

# 투표 생성
curl -X POST http://localhost:8000/polls \
  -H "Content-Type: application/json" \
  -d '{"question": "좋아하는 색은?", "options": ["빨강", "파랑", "초록"]}'

# 투표하기
curl -X POST http://localhost:8000/polls/1/vote \
  -H "Content-Type: application/json" \
  -d '{"option_index": 0}'
```

---

## 🔒 보안

- ✅ CORS 미들웨어 설정
- ✅ SQL Injection 방지 (ORM 사용)
- ✅ XSS 방지 (HTML 이스케이프)
- ✅ 환경 변수로 민감 정보 관리
- ✅ AWS 보안 그룹으로 접근 제어

자세한 보안 가이드는 [보안 체크리스트](./docs/security-checklist.md)를 참조하세요.

---

## 🐛 트러블슈팅

### 데이터베이스 연결 실패
```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# .env 파일 확인
cat backend/.env
```

### 포트 충돌
```bash
# 사용 중인 포트 확인
netstat -an | grep 8000

# 프로세스 종료
kill -9 <PID>
```

### CORS 오류
- `main.py`의 CORS 설정 확인
- 프론트엔드 URL이 허용 목록에 있는지 확인

---

## 📝 개발 로드맵

### v1.0 (현재)
- [x] 기본 투표 생성/참여 기능
- [x] 실시간 결과 표시
- [x] AWS 배포

### v2.0 (계획)
- [ ] 사용자 인증 시스템
- [ ] 투표 종료 시간 설정
- [ ] 중복 투표 방지 (IP 기반)
- [ ] 투표 공유 기능
- [ ] 댓글 기능
- [ ] 다크 모드

---

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 라이센스

이 프로젝트는 MIT 라이센스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

## 👤 제작자

**MBC 아카데미 수강생**

- 📧 Email: your.email@example.com
- 🔗 GitHub: [@your-username](https://github.com/your-username)
- 💼 LinkedIn: [Your Name](https://linkedin.com/in/your-profile)

---

## 🙏 감사의 말

- MBC 아카데미 - 웹 개발 실습 과정
- FastAPI 커뮤니티
- AWS Free Tier

---

## 📚 참고 자료

- [FastAPI 공식 문서](https://fastapi.tiangolo.com/)
- [SQLAlchemy 문서](https://www.sqlalchemy.org/)
- [AWS EC2 사용자 가이드](https://docs.aws.amazon.com/ec2/)
- [MySQL 공식 문서](https://dev.mysql.com/doc/)

---

<div align="center">

**⭐ 이 프로젝트가 도움이 되었다면 Star를 눌러주세요! ⭐**

Made with ❤️ by MBC Academy Student

</div>
