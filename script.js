// 백엔드 API 기본 URL
const API_BASE_URL = 'http://localhost:5050';

// 할일 데이터 저장소
let todos = [];
let currentFilter = 'all';

// DOM 요소
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const todoCount = document.getElementById('todoCount');
const clearCompletedBtn = document.getElementById('clearCompleted');
const filterBtns = document.querySelectorAll('.filter-btn');

// 백엔드에서 할일 목록 가져오기
async function loadTodos() {
    try {
        console.log('백엔드에서 할일 목록을 가져오는 중...');
        const response = await fetch(`${API_BASE_URL}/todos`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        todos = data || [];
        
        console.log(`백엔드에서 ${todos.length}개의 할일을 성공적으로 가져왔습니다.`, todos);
        renderTodos();
    } catch (error) {
        console.error('할일을 불러오는 중 오류 발생:', error);
        alert('할일을 불러오는 중 오류가 발생했습니다: ' + error.message);
        // 오류 발생 시 빈 배열로 설정
        todos = [];
        renderTodos();
    }
}

// 할일 추가
async function addTodo() {
    const title = todoInput.value.trim();
    if (title === '') {
        alert('할일을 입력해주세요!');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/todos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: title,
                completed: false
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '할일 추가 실패');
        }

        const newTodo = await response.json();
        todoInput.value = '';
        console.log('할일이 백엔드에 추가되었습니다:', newTodo);
        
        // 목록 새로고침
        await loadTodos();
    } catch (error) {
        console.error('할일 추가 중 오류 발생:', error);
        alert('할일을 추가하는 중 오류가 발생했습니다: ' + error.message);
    }
}

// 할일 삭제
async function deleteTodo(id) {
    // 삭제 확인
    const todo = todos.find(t => t._id === id || t.id === id);
    if (!todo) {
        console.error('삭제할 할일을 찾을 수 없습니다:', id);
        return;
    }

    if (!confirm(`"${todo.title}" 할일을 삭제하시겠습니까?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('할일을 찾을 수 없습니다.');
            }
            const errorData = await response.json();
            throw new Error(errorData.error || '할일 삭제 실패');
        }

        console.log('할일이 백엔드에서 삭제되었습니다:', id, todo);
        
        // 목록 새로고침
        await loadTodos();
    } catch (error) {
        console.error('할일 삭제 중 오류 발생:', error);
        alert('할일을 삭제하는 중 오류가 발생했습니다: ' + error.message);
    }
}

// 할일 완료 상태 토글
async function toggleTodo(id) {
    try {
        const todo = todos.find(t => t._id === id || t.id === id);
        if (!todo) {
            console.error('상태를 변경할 할일을 찾을 수 없습니다:', id);
            return;
        }

        const newCompletedState = !todo.completed;
        
        const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                completed: newCompletedState
            })
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('할일을 찾을 수 없습니다.');
            }
            const errorData = await response.json();
            throw new Error(errorData.error || '할일 상태 변경 실패');
        }

        const updatedTodo = await response.json();
        console.log('할일 상태가 백엔드에서 업데이트되었습니다:', {
            id: id,
            title: todo.title,
            completed: newCompletedState
        });
        
        // 목록 새로고침
        await loadTodos();
    } catch (error) {
        console.error('할일 상태 변경 중 오류 발생:', error);
        alert('할일 상태를 변경하는 중 오류가 발생했습니다: ' + error.message);
    }
}

// 할일 수정
async function editTodo(id, newTitle) {
    const trimmedTitle = newTitle.trim();
    
    if (trimmedTitle === '') {
        alert('할일 내용을 입력해주세요!');
        return false;
    }

    // 기존 할일 찾기
    const todo = todos.find(t => t._id === id || t.id === id);
    if (!todo) {
        console.error('수정할 할일을 찾을 수 없습니다:', id);
        alert('수정할 할일을 찾을 수 없습니다.');
        return false;
    }

    // 내용이 변경되지 않았으면 수정하지 않음
    if (todo.title === trimmedTitle) {
        console.log('할일 내용이 변경되지 않았습니다.');
        return true;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: trimmedTitle
            })
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('할일을 찾을 수 없습니다.');
            }
            const errorData = await response.json();
            throw new Error(errorData.error || '할일 수정 실패');
        }

        const updatedTodo = await response.json();
        console.log('할일이 백엔드에서 수정되었습니다:', {
            id: id,
            oldTitle: todo.title,
            newTitle: trimmedTitle
        });
        
        // 목록 새로고침
        await loadTodos();
        return true;
    } catch (error) {
        console.error('할일 수정 중 오류 발생:', error);
        alert('할일을 수정하는 중 오류가 발생했습니다: ' + error.message);
        return false;
    }
}

// 필터링된 할일 목록 가져오기
function getFilteredTodos() {
    switch (currentFilter) {
        case 'active':
            return todos.filter(todo => !todo.completed);
        case 'completed':
            return todos.filter(todo => todo.completed);
        default:
            return todos;
    }
}

// 할일 목록 렌더링
function renderTodos() {
    const filteredTodos = getFilteredTodos();
    
    if (filteredTodos.length === 0) {
        todoList.innerHTML = '<li class="empty-state">할일이 없습니다. 새로운 할일을 추가해보세요! ✨</li>';
    } else {
        todoList.innerHTML = filteredTodos.map(todo => {
            const todoId = todo._id || todo.id;
            const todoTitle = escapeHtml(todo.title || '');
            return `
            <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todoId}">
                <input 
                    type="checkbox" 
                    class="todo-checkbox" 
                    ${todo.completed ? 'checked' : ''}
                    onchange="toggleTodo('${todoId}')"
                >
                <input 
                    type="text" 
                    class="todo-text" 
                    value="${todoTitle}"
                    data-id="${todoId}"
                    readonly
                    onblur="handleTodoEdit('${todoId}', this)"
                    onkeypress="handleTodoKeyPress(event, '${todoId}', this)"
                >
                <div class="todo-actions">
                    <button class="edit-btn" onclick="startEdit('${todoId}')">수정</button>
                    <button class="delete-btn" onclick="deleteTodo('${todoId}')">삭제</button>
                </div>
            </li>
        `;
        }).join('');
    }

    updateTodoCount();
}

// HTML 이스케이프 함수
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 할일 수정 시작
function startEdit(id) {
    const todoItem = document.querySelector(`.todo-item[data-id="${id}"]`);
    if (!todoItem) return;
    
    const todoText = todoItem.querySelector('.todo-text');
    
    todoText.readOnly = false;
    todoText.classList.add('editing');
    todoText.focus();
    todoText.select();
}

// 할일 수정 처리 (blur 이벤트)
async function handleTodoEdit(id, input) {
    const newTitle = input.value.trim();
    const todo = todos.find(t => (t._id === id || t.id === id));
    
    if (newTitle === '') {
        // 빈 값이면 원래 값으로 복원
        input.value = todo ? (todo.title || '') : '';
        input.readOnly = true;
        input.classList.remove('editing');
        return;
    }

    // 내용이 변경되었는지 확인
    if (todo && todo.title === newTitle) {
        // 변경사항이 없으면 수정하지 않음
        input.readOnly = true;
        input.classList.remove('editing');
        return;
    }

    // 백엔드에 수정 사항 저장
    const success = await editTodo(id, newTitle);
    
    if (!success) {
        // 실패 시 원래 값으로 복원
        input.value = todo ? (todo.title || '') : '';
    }
    
    input.readOnly = true;
    input.classList.remove('editing');
}

// 할일 수정 처리 (Enter 키)
function handleTodoKeyPress(event, id, input) {
    if (event.key === 'Enter') {
        input.blur();
    }
}

// 할일 개수 업데이트
function updateTodoCount() {
    const activeCount = todos.filter(todo => !todo.completed).length;
    const totalCount = todos.length;
    todoCount.textContent = `${totalCount}개의 할일 (${activeCount}개 진행중)`;
}

// 필터 변경
function setFilter(filter) {
    currentFilter = filter;
    
    // 필터 버튼 활성화 상태 업데이트
    filterBtns.forEach(btn => {
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    renderTodos();
}

// 완료된 항목 모두 삭제
async function clearCompleted() {
    const completedTodos = todos.filter(todo => todo.completed);
    const completedCount = completedTodos.length;
    
    if (completedCount === 0) {
        alert('완료된 할일이 없습니다.');
        return;
    }
    
    if (confirm(`완료된 ${completedCount}개의 할일을 삭제하시겠습니까?`)) {
        try {
            const deletePromises = completedTodos.map(todo => {
                const todoId = todo._id || todo.id;
                return fetch(`${API_BASE_URL}/todos/${todoId}`, {
                    method: 'DELETE'
                });
            });
            
            const results = await Promise.all(deletePromises);
            
            // 실패한 요청 확인
            const failed = results.filter(r => !r.ok);
            if (failed.length > 0) {
                throw new Error(`${failed.length}개의 할일 삭제에 실패했습니다.`);
            }
            
            console.log('완료된 할일들이 백엔드에서 삭제되었습니다.');
            
            // 목록 새로고침
            await loadTodos();
        } catch (error) {
            console.error('완료된 할일 삭제 중 오류 발생:', error);
            alert('완료된 할일을 삭제하는 중 오류가 발생했습니다: ' + error.message);
        }
    }
}

// 이벤트 리스너
addBtn.addEventListener('click', addTodo);

todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTodo();
    }
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        setFilter(btn.dataset.filter);
    });
});

clearCompletedBtn.addEventListener('click', clearCompleted);

// 전역 함수로 노출 (인라인 이벤트 핸들러용)
window.toggleTodo = toggleTodo;
window.deleteTodo = deleteTodo;
window.startEdit = startEdit;
window.handleTodoEdit = handleTodoEdit;
window.handleTodoKeyPress = handleTodoKeyPress;

// 페이지 로드 시 할일 불러오기
loadTodos();
