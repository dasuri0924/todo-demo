// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import { getDatabase, ref, push, set, onValue, remove, update } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAJEgiKke0dXtSWf4Nu3mUsO4iW6bTd1PY",
    authDomain: "todo-backend-fa968.firebaseapp.com",
    projectId: "todo-backend-fa968",
    storageBucket: "todo-backend-fa968.firebasestorage.app",
    messagingSenderId: "183129247872",
    appId: "1:183129247872:web:95bee1812348a48e741665",
    measurementId: "G-YDXJ15EQFZ",
    databaseURL: "https://todo-backend-fa968-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);

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

// Firebase Realtime Database에서 할일 불러오기
function loadTodos() {
    try {
        console.log('Firebase에서 할일 목록을 가져오는 중...');
        const todosRef = ref(database, 'todos');
        
        // 실시간 업데이트를 위한 리스너 설정
        onValue(todosRef, (snapshot) => {
            todos = [];
            const data = snapshot.val();
            
            if (data) {
                // 객체를 배열로 변환하고 createdAt 기준으로 정렬
                Object.keys(data).forEach((key) => {
                    todos.push({
                        id: key,
                        ...data[key]
                    });
                });
                
                // createdAt 기준 내림차순 정렬 (최신순)
                todos.sort((a, b) => {
                    const dateA = new Date(a.createdAt || 0);
                    const dateB = new Date(b.createdAt || 0);
                    return dateB - dateA;
                });
                
                console.log(`Firebase에서 ${todos.length}개의 할일을 성공적으로 가져왔습니다.`, todos);
            } else {
                console.log('Firebase에 저장된 할일이 없습니다.');
            }
            
            renderTodos();
        }, (error) => {
            console.error('할일을 불러오는 중 오류 발생:', error);
            alert('할일을 불러오는 중 오류가 발생했습니다: ' + error.message);
        });
    } catch (error) {
        console.error('할일을 불러오는 중 오류 발생:', error);
        alert('할일을 불러오는 중 오류가 발생했습니다: ' + error.message);
    }
}


// 할일 추가
async function addTodo() {
    const text = todoInput.value.trim();
    if (text === '') {
        alert('할일을 입력해주세요!');
        return;
    }

    try {
        const newTodo = {
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        // Firebase Realtime Database에 할일 추가
        const todosRef = ref(database, 'todos');
        const newTodoRef = push(todosRef);
        await set(newTodoRef, newTodo);
        
        todoInput.value = '';
        console.log('할일이 Firebase 데이터베이스에 추가되었습니다:', newTodoRef.key);
    } catch (error) {
        console.error('할일 추가 중 오류 발생:', error);
        alert('할일을 추가하는 중 오류가 발생했습니다.');
    }
}

// 할일 삭제
async function deleteTodo(id) {
    // 삭제 확인
    const todo = todos.find(t => t.id === id);
    if (!todo) {
        console.error('삭제할 할일을 찾을 수 없습니다:', id);
        return;
    }

    if (!confirm(`"${todo.text}" 할일을 삭제하시겠습니까?`)) {
        return;
    }

    try {
        const todoRef = ref(database, `todos/${id}`);
        await remove(todoRef);
        console.log('할일이 Firebase 데이터베이스에서 삭제되었습니다:', id, todo);
    } catch (error) {
        console.error('할일 삭제 중 오류 발생:', error);
        alert('할일을 삭제하는 중 오류가 발생했습니다: ' + error.message);
    }
}

// 할일 완료 상태 토글
async function toggleTodo(id) {
    try {
        const todo = todos.find(t => t.id === id);
        if (!todo) {
            console.error('상태를 변경할 할일을 찾을 수 없습니다:', id);
            return;
        }

        const newCompletedState = !todo.completed;
        const todoRef = ref(database, `todos/${id}`);
        await update(todoRef, {
            completed: newCompletedState,
            updatedAt: new Date().toISOString() // 업데이트 시간 추가
        });
        console.log('할일 상태가 Firebase 데이터베이스에서 업데이트되었습니다:', {
            id: id,
            text: todo.text,
            completed: newCompletedState
        });
    } catch (error) {
        console.error('할일 상태 변경 중 오류 발생:', error);
        alert('할일 상태를 변경하는 중 오류가 발생했습니다: ' + error.message);
    }
}

// 할일 수정
async function editTodo(id, newText) {
    const trimmedText = newText.trim();
    
    if (trimmedText === '') {
        alert('할일 내용을 입력해주세요!');
        return false;
    }

    // 기존 할일 찾기
    const todo = todos.find(t => t.id === id);
    if (!todo) {
        console.error('수정할 할일을 찾을 수 없습니다:', id);
        alert('수정할 할일을 찾을 수 없습니다.');
        return false;
    }

    // 내용이 변경되지 않았으면 수정하지 않음
    if (todo.text === trimmedText) {
        console.log('할일 내용이 변경되지 않았습니다.');
        return true;
    }
    
    try {
        const todoRef = ref(database, `todos/${id}`);
        await update(todoRef, {
            text: trimmedText,
            updatedAt: new Date().toISOString() // 수정 시간 추가
        });
        console.log('할일이 Firebase 데이터베이스에서 수정되었습니다:', {
            id: id,
            oldText: todo.text,
            newText: trimmedText
        });
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
        todoList.innerHTML = filteredTodos.map(todo => `
            <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <input 
                    type="checkbox" 
                    class="todo-checkbox" 
                    ${todo.completed ? 'checked' : ''}
                    onchange="toggleTodo('${todo.id}')"
                >
                <input 
                    type="text" 
                    class="todo-text" 
                    value="${escapeHtml(todo.text)}"
                    data-id="${todo.id}"
                    readonly
                    onblur="handleTodoEdit('${todo.id}', this)"
                    onkeypress="handleTodoKeyPress(event, '${todo.id}', this)"
                >
                <div class="todo-actions">
                    <button class="edit-btn" onclick="startEdit('${todo.id}')">수정</button>
                    <button class="delete-btn" onclick="deleteTodo('${todo.id}')">삭제</button>
                </div>
            </li>
        `).join('');
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
    const todoText = todoItem.querySelector('.todo-text');
    
    todoText.readOnly = false;
    todoText.classList.add('editing');
    todoText.focus();
    todoText.select();
}

// 할일 수정 처리 (blur 이벤트)
async function handleTodoEdit(id, input) {
    const newText = input.value.trim();
    const todo = todos.find(t => t.id === id);
    
    if (newText === '') {
        // 빈 값이면 원래 값으로 복원
        input.value = todo ? todo.text : '';
        input.readOnly = true;
        input.classList.remove('editing');
        return;
    }

    // 내용이 변경되었는지 확인
    if (todo && todo.text === newText) {
        // 변경사항이 없으면 수정하지 않음
        input.readOnly = true;
        input.classList.remove('editing');
        return;
    }

    // Firebase에 수정 사항 저장
    const success = await editTodo(id, newText);
    
    if (!success) {
        // 실패 시 원래 값으로 복원
        input.value = todo ? todo.text : '';
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
                const todoRef = ref(database, `todos/${todo.id}`);
                return remove(todoRef);
            });
            await Promise.all(deletePromises);
            console.log('완료된 할일들이 Firebase 데이터베이스에서 삭제되었습니다.');
        } catch (error) {
            console.error('완료된 할일 삭제 중 오류 발생:', error);
            alert('완료된 할일을 삭제하는 중 오류가 발생했습니다.');
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
