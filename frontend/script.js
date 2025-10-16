// script.js

// API 기본 URL (환경에 맞게 수정)
const API_BASE_URL = 'http://3.25.161.6:8000';

// 전역 상태
let currentView = 'list';
let selectedPollId = null;
let selectedOptionIndex = null;
let socket;

// DOM 요소
const listView = document.getElementById('list-view');
const createView = document.getElementById('create-view');
const detailView = document.getElementById('detail-view');
const pollsContainer = document.getElementById('polls-container');
const loading = document.getElementById('loading');
const emptyState = document.getElementById('empty-state');
const createPollBtn = document.getElementById('create-poll-btn');
const backToListBtn = document.getElementById('back-to-list-btn');
const backFromDetailBtn = document.getElementById('back-from-detail-btn');
const createPollForm = document.getElementById('create-poll-form');
const addOptionBtn = document.getElementById('add-option-btn');
const optionsContainer = document.getElementById('options-container');
const pollDetailContainer = document.getElementById('poll-detail-container');
const toast = document.getElementById('toast');

// 초기화
function init() {
    setupEventListeners();
    loadPolls();
}

// 이벤트 리스너 설정
function setupEventListeners() {
    createPollBtn.addEventListener('click', showCreateForm);
    backToListBtn.addEventListener('click', showListView);
    backFromDetailBtn.addEventListener('click', showListView);
    createPollForm.addEventListener('submit', handleCreatePoll);
    addOptionBtn.addEventListener('click', addOptionInput);
    
    // 초기 옵션 삭제 버튼 이벤트
    setupOptionRemoveButtons();
}

// 투표 목록 불러오기
async function loadPolls() {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/polls`);
        
        if (!response.ok) {
            throw new Error('투표 목록을 불러올 수 없습니다.');
        }
        
        const polls = await response.json();
        renderPollsList(polls);
        
    } catch (error) {
        console.error('Error loading polls:', error);
        showToast('투표 목록을 불러오는데 실패했습니다.', 'error');
        showEmptyState();
    } finally {
        showLoading(false);
    }
}

// 투표 목록 렌더링
function renderPollsList(polls) {
    pollsContainer.innerHTML = '';
    
    if (polls.length === 0) {
        showEmptyState();
        return;
    }
    
    emptyState.style.display = 'none';
    
    polls.forEach(poll => {
        const totalVotes = poll.votes.reduce((sum, vote) => sum + vote, 0);
        const pollCard = document.createElement('div');
        pollCard.className = 'poll-card';
        pollCard.innerHTML = `
            <h3>${escapeHtml(poll.question)}</h3>
            <div class="poll-meta">
                <div class="poll-stats">
                    <span>📝 ${poll.options.length}개 선택지</span>
                    <span>🗳️ ${totalVotes}표</span>
                </div>
                <div class="poll-actions">
                    <button class="icon-btn delete-btn" onclick="deletePoll(${poll.id}, event)" title="삭제">
                        🗑️
                    </button>
                </div>
            </div>
        `;
        
        pollCard.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-btn')) {
                showPollDetail(poll.id);
            }
        });
        
        pollsContainer.appendChild(pollCard);
    });
}

// 투표 생성 폼 표시
function showCreateForm() {
    currentView = 'create';
    listView.style.display = 'none';
    createView.style.display = 'block';
    detailView.style.display = 'none';
    
    createPollForm.reset();
    optionsContainer.innerHTML = `
        <div class="option-input">
            <input type="text" class="poll-option" placeholder="선택지 1" required>
            <button type="button" class="btn-remove" disabled>❌</button>
        </div>
        <div class="option-input">
            <input type="text" class="poll-option" placeholder="선택지 2" required>
            <button type="button" class="btn-remove" disabled>❌</button>
        </div>
    `;
    setupOptionRemoveButtons();
}

// 선택지 입력 필드 추가
function addOptionInput() {
    const optionInputs = document.querySelectorAll('.option-input');
    
    if (optionInputs.length >= 10) {
        showToast('선택지는 최대 10개까지 추가할 수 있습니다.', 'error');
        return;
    }
    
    const newOptionDiv = document.createElement('div');
    newOptionDiv.className = 'option-input';
    newOptionDiv.innerHTML = `
        <input type="text" class="poll-option" placeholder="선택지 ${optionInputs.length + 1}" required>
        <button type="button" class="btn-remove">❌</button>
    `;
    
    optionsContainer.appendChild(newOptionDiv);
    setupOptionRemoveButtons();
    
    newOptionDiv.querySelector('input').focus();
}

// 선택지 삭제 버튼 설정
function setupOptionRemoveButtons() {
    const removeButtons = document.querySelectorAll('.btn-remove');
    const optionInputs = document.querySelectorAll('.option-input');
    
    removeButtons.forEach((btn, index) => {
        btn.disabled = optionInputs.length <= 2;
        
        btn.onclick = function() {
            if (optionInputs.length > 2) {
                optionInputs[index].remove();
                setupOptionRemoveButtons();
                updateOptionPlaceholders();
            }
        };
    });
}

// 선택지 플레이스홀더 업데이트
function updateOptionPlaceholders() {
    const optionInputs = document.querySelectorAll('.poll-option');
    optionInputs.forEach((input, index) => {
        input.placeholder = `선택지 ${index + 1}`;
    });
}

// 투표 생성 처리
async function handleCreatePoll(e) {
    e.preventDefault();
    
    const question = document.getElementById('poll-question').value.trim();
    const optionInputs = document.querySelectorAll('.poll-option');
    const options = Array.from(optionInputs)
        .map(input => input.value.trim())
        .filter(option => option !== '');
    
    if (options.length < 2) {
        showToast('선택지는 최소 2개 이상이어야 합니다.', 'error');
        return;
    }
    
    if (new Set(options).size !== options.length) {
        showToast('중복된 선택지가 있습니다.', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/polls`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question, options }),
        });
        
        if (!response.ok) {
            throw new Error('투표 생성에 실패했습니다.');
        }
        
        showToast('투표가 생성되었습니다!', 'success');
        showListView();
        loadPolls();
        
    } catch (error) {
        console.error('Error creating poll:', error);
        showToast('투표 생성에 실패했습니다.', 'error');
    }
}

// 투표 상세 화면 표시
async function showPollDetail(pollId) {
    try {
        selectedPollId = pollId;
        selectedOptionIndex = null;
        
        const response = await fetch(`${API_BASE_URL}/polls/${pollId}`);
        
        if (!response.ok) {
            throw new Error('투표를 불러올 수 없습니다.');
        }
        
        const poll = await response.json();
        renderPollDetail(poll);
        
        currentView = 'detail';
        listView.style.display = 'none';
        createView.style.display = 'none';
        detailView.style.display = 'block';
        
    } catch (error) {
        console.error('Error loading poll detail:', error);
        showToast('투표를 불러오는데 실패했습니다.', 'error');
    }
}

// 투표 상세 렌더링
function renderPollDetail(poll) {
    const totalVotes = poll.votes.reduce((sum, vote) => sum + vote, 0);
    
    pollDetailContainer.innerHTML = `
        <div class="poll-detail">
            <h2>${escapeHtml(poll.question)}</h2>
            
            <div class="voting-section">
                <h3>투표하기</h3>
                <div class="voting-options" id="voting-options">
                    ${poll.options.map((option, index) => `
                        <div class="vote-option" data-index="${index}">
                            <span>${escapeHtml(option)}</span>
                            <span>→</span>
                        </div>
                    `).join('')}
                </div>
                <button id="submit-vote-btn" class="btn btn-primary btn-large" style="margin-top: 20px;" disabled>
                    투표하기
                </button>
            </div>
            
            <div class="results-container">
                <h3>투표 결과</h3>
                ${renderResults(poll)}
                <div class="total-votes">
                    총 <strong>${totalVotes}</strong>명이 투표했습니다.
                </div>
            </div>
        </div>
    `;
    
    const voteOptions = pollDetailContainer.querySelectorAll('.vote-option');
    const submitVoteBtn = document.getElementById('submit-vote-btn');
    
    voteOptions.forEach(option => {
        option.addEventListener('click', () => {
            voteOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedOptionIndex = parseInt(option.dataset.index);
            submitVoteBtn.disabled = false;
        });
    });
    
    submitVoteBtn.addEventListener('click', submitVote);
}

// 투표 결과 렌더링
function renderResults(poll) {
    const totalVotes = poll.votes.reduce((sum, vote) => sum + vote, 0);
    
    return poll.options.map((option, index) => {
        const votes = poll.votes[index];
        const percentage = totalVotes > 0 ? (votes / totalVotes * 100).toFixed(1) : 0;
        
        return `
            <div class="result-item">
                <div class="result-header">
                    <span>${escapeHtml(option)}</span>
                    <span>${votes}표 (${percentage}%)</span>
                </div>
                <div class="result-bar-container">
                    <div class="result-bar" style="width: ${percentage}%">
                        ${percentage > 10 ? percentage + '%' : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 투표 제출
async function submitVote() {
    if (selectedOptionIndex === null) {
        showToast('선택지를 선택해주세요.', 'error');
        return;
    }
    
    try {
        const submitBtn = document.getElementById('submit-vote-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = '투표 중...';
        
        const response = await fetch(`${API_BASE_URL}/polls/${selectedPollId}/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ option_index: selectedOptionIndex }),
        });
        
        if (!response.ok) {
            throw new Error('투표에 실패했습니다.');
        }
        
        showToast('투표가 완료되었습니다!', 'success');
        
        // ===== [수정된 부분] =====
        // WebSocket이 실시간 업데이트를 처리하므로,
        // 투표 직후 수동으로 화면을 새로고침하는 코드를 제거합니다.
        // setTimeout(() => {
        //     showPollDetail(selectedPollId);
        // }, 500);
        
    } catch (error) {
        console.error('Error submitting vote:', error);
        showToast('투표에 실패했습니다.', 'error');
        
        const submitBtn = document.getElementById('submit-vote-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '투표하기';
        }
    }
}

// 투표 삭제
async function deletePoll(pollId, event) {
    event.stopPropagation();
    
    if (!confirm('정말로 이 투표를 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/polls/${pollId}`, {
            method: 'DELETE',
        });
        
        if (!response.ok) {
            throw new Error('투표 삭제에 실패했습니다.');
        }
        
        showToast('투표가 삭제되었습니다.', 'success');
        loadPolls();
        
    } catch (error) {
        console.error('Error deleting poll:', error);
        showToast('투표 삭제에 실패했습니다.', 'error');
    }
}

// 목록으로 돌아가기
function showListView() {
    currentView = 'list';
    listView.style.display = 'block';
    createView.style.display = 'none';
    detailView.style.display = 'none';
    loadPolls();
}

// 로딩 표시
function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
    pollsContainer.style.display = show ? 'none' : 'grid';
}

// 빈 상태 표시
function showEmptyState() {
    pollsContainer.innerHTML = '';
    emptyState.style.display = 'block';
}

// Toast 알림 표시
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// HTML 이스케이프 (XSS 방지)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function connectWebSocket() {
    socket = new WebSocket('ws://http://3.25.161.6/ws');

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'vote_update') {
            console.log('🔄 실시간 투표 업데이트 수신:', data);
            
            // 현재 상세 페이지를 보고 있을 때, 해당 투표의 업데이트라면 화면을 다시 그림
            if (currentView === 'detail' && data.poll.id === selectedPollId) {
                renderPollDetail(data.poll);
            }
            // 목록 페이지를 보고 있을 때, 투표 수 갱신을 위해 목록을 다시 불러옴
            if (currentView === 'list') {
                loadPolls();
            }
        }
    };

    socket.onclose = () => {
        console.warn('WebSocket 연결 종료, 2초 후 재연결 시도...');
        setTimeout(connectWebSocket, 2000);
    };

    socket.onerror = (error) => {
        console.error('WebSocket 오류:', error);
    };
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    init();
    connectWebSocket();
});
