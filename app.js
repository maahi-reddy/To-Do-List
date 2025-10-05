// Removed Firebase imports and auth-related logic.
// New simple localStorage-backed todo app:

// --- DOM ELEMENTS ---
const todoForm = document.getElementById('add-todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const authStatus = document.getElementById('auth-status');
const loader = document.getElementById('loader');
const emptyState = document.getElementById('empty-state');

let todos = [];

// --- Storage helpers ---
const STORAGE_KEY = 'simple_todo_items';

function loadTodos() {
	loader.style.display = 'block';
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		todos = raw ? JSON.parse(raw) : [];
	} catch (e) {
		console.error('Failed to load todos:', e);
		todos = [];
	}
	renderTodos(todos);
	loader.style.display = 'none';
	// optional small status
	if (authStatus) authStatus.textContent = 'Local todo (no auth)';
}

function saveTodos() {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
	} catch (e) {
		console.error('Failed to save todos:', e);
	}
}

// --- CRUD operations ---
function addTodo(text) {
	const item = {
		id: Date.now().toString(36) + Math.random().toString(36).slice(2),
		text,
		completed: false,
		createdAt: Date.now()
	};
	todos.push(item);
	saveTodos();
	renderTodos(todos);
}

function toggleTodoComplete(id, completed) {
	const t = todos.find(x => x.id === id);
	if (!t) return;
	t.completed = !!completed;
	saveTodos();
	renderTodos(todos);
}

function updateTodoText(id, newText) {
	const t = todos.find(x => x.id === id);
	if (!t) return;
	t.text = newText;
	saveTodos();
	renderTodos(todos);
}

function deleteTodo(id) {
	todos = todos.filter(x => x.id !== id);
	saveTodos();
	renderTodos(todos);
}

// --- Additional DOM elements for new features ---
const taskCountEl = document.getElementById('task-count');
const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
const clearCompletedBtn = document.getElementById('clear-completed');

let currentFilter = 'all';

// --- UI RENDERING ---
function renderTodos(items) {
	todoList.innerHTML = '';

	const total = items.length;
	const remaining = items.filter(t => !t.completed).length;
	if (taskCountEl) taskCountEl.textContent = `${remaining} / ${total} tasks`;

	// apply filter
	let filtered = items;
	if (currentFilter === 'active') filtered = items.filter(t => !t.completed);
	if (currentFilter === 'completed') filtered = items.filter(t => t.completed);

	if (!filtered || filtered.length === 0) {
		if (emptyState) emptyState.classList.remove('hidden');
		return;
	}
	if (emptyState) emptyState.classList.add('hidden');

	// sort by createdAt desc
	const sorted = filtered.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

	sorted.forEach(todo => {
		const li = document.createElement('li');
		li.className = `todo-item flex items-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm transition-all duration-300 ${todo.completed ? 'completed' : ''}`;
		li.dataset.id = todo.id;

		li.innerHTML = `
			<input type="checkbox" class="h-6 w-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" ${todo.completed ? 'checked' : ''}>
			<span class="flex-grow mx-4 text-gray-800 dark:text-gray-200">${escapeHTML(todo.text)}</span>
			<div class="actions space-x-2">
				<button class="edit-btn text-gray-400 hover:text-green-500 transition"><i class="fas fa-pencil-alt"></i></button>
				<button class="delete-btn text-gray-400 hover:text-red-500 transition"><i class="fas fa-trash-alt"></i></button>
			</div>
		`;
		todoList.appendChild(li);
	});
}

// --- Filter controls ---
function setFilter(filter) {
	currentFilter = filter;
	filterButtons.forEach(btn => {
		if (btn.dataset.filter === filter) btn.classList.add('active');
		else btn.classList.remove('active');
	});
	renderTodos(todos);
}

filterButtons.forEach(btn => {
	btn.addEventListener('click', () => setFilter(btn.dataset.filter));
});

// --- Clear completed ---
function clearCompleted() {
	const before = todos.length;
	todos = todos.filter(t => !t.completed);
	if (todos.length !== before) {
		saveTodos();
		renderTodos(todos);
	}
}
if (clearCompletedBtn) clearCompletedBtn.addEventListener('click', clearCompleted);

// --- Keyboard shortcut: "/" to focus input ---
document.addEventListener('keydown', (e) => {
	if (e.key === '/' && document.activeElement !== todoInput) {
		e.preventDefault();
		todoInput.focus();
	}
});

// --- EVENT LISTENERS ---
if (todoForm) {
	todoForm.addEventListener('submit', (e) => {
		e.preventDefault();
		const text = todoInput.value.trim();
		if (text) addTodo(text);
		todoInput.value = '';
	});
}

if (todoList) {
	todoList.addEventListener('click', (e) => {
		const target = e.target;
		const li = target.closest('.todo-item');
		if (!li) return;
		const id = li.dataset.id;

		if (target.type === 'checkbox') toggleTodoComplete(id, target.checked);
		if (target.closest('.delete-btn')) deleteTodo(id);

		if (target.closest('.edit-btn')) {
			const span = li.querySelector('span');
			const currentText = span.textContent || '';

			const input = document.createElement('input');
			input.type = 'text';
			input.value = currentText;
			input.className = 'flex-grow mx-4 bg-white dark:bg-gray-600 border border-blue-500 rounded px-2 py-1';

			span.replaceWith(input);
			input.focus();

			const saveChanges = () => {
				const newText = input.value.trim();
				if (newText && newText !== currentText) {
					updateTodoText(id, newText);
				} else {
					input.replaceWith(span);
				}
			};

			input.addEventListener('blur', saveChanges);
			input.addEventListener('keydown', (ev) => {
				if (ev.key === 'Enter') input.blur();
				if (ev.key === 'Escape') input.replaceWith(span);
			});
		}
	});
}

// --- Utility ---
function escapeHTML(str) {
	const div = document.createElement('div');
	div.appendChild(document.createTextNode(str));
	return div.innerHTML;
}

// Initial load
loadTodos();
