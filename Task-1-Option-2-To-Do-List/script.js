(() => {
  'use strict';

  const STORAGE_KEY = 'taskflow-tahir-tasks-v1';
  const taskForm = document.getElementById('taskForm');
  const taskInput = document.getElementById('taskInput');
  const taskList = document.getElementById('taskList');
  const emptyState = document.getElementById('emptyState');
  const emptyTitle = document.getElementById('emptyTitle');
  const emptyCopy = document.getElementById('emptyCopy');
  const totalCount = document.getElementById('totalCount');
  const activeCount = document.getElementById('activeCount');
  const completedCount = document.getElementById('completedCount');
  const allFilterCount = document.getElementById('allFilterCount');
  const remainingLabel = document.getElementById('remainingLabel');
  const clearCompletedButton = document.getElementById('clearCompleted');
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const toast = document.getElementById('toast');
  const formHint = document.getElementById('formHint');

  let tasks = loadTasks();
  let currentFilter = 'all';
  let toastTimer = null;

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(item => item && typeof item.id === 'string' && typeof item.text === 'string')
        .map(item => ({
          id: item.id,
          text: item.text.slice(0, 140),
          completed: Boolean(item.completed),
          createdAt: Number.isFinite(item.createdAt) ? item.createdAt : Date.now()
        }));
    } catch (error) {
      console.error('Could not read saved tasks:', error);
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return true;
    } catch (error) {
      console.error('Could not save tasks:', error);
      showToast('Could not save changes. Check your browser storage settings.');
      return false;
    }
  }

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function formatDate(timestamp) {
    try {
      return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(timestamp));
    } catch {
      return 'Added recently';
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2400);
  }

  function icon(name) {
    const paths = {
      check: '<path d="m4 8 3 3 7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      edit: '<path d="M12 20h9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="m16.5 3.5 4 4L8 20l-5 1 1-5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
      trash: '<path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || ''}</svg>`;
  }

  function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item${task.completed ? ' is-complete' : ''}`;
    li.dataset.id = task.id;

    const check = document.createElement('button');
    check.type = 'button';
    check.className = 'task-check';
    check.setAttribute('aria-label', task.completed ? `Mark ${task.text} as active` : `Mark ${task.text} as completed`);
    check.setAttribute('aria-pressed', String(task.completed));
    check.innerHTML = icon('check');
    check.addEventListener('click', () => toggleTask(task.id));

    const content = document.createElement('div');
    content.className = 'task-content';
    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;
    const meta = document.createElement('span');
    meta.className = 'task-meta';
    meta.textContent = `${task.completed ? 'Completed' : 'Added'} · ${formatDate(task.createdAt)}`;
    content.append(text, meta);

    const actions = document.createElement('div');
    actions.className = 'task-actions';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'icon-button';
    edit.setAttribute('aria-label', `Edit ${task.text}`);
    edit.title = 'Edit task';
    edit.innerHTML = icon('edit');
    edit.addEventListener('click', () => editTask(task.id));

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'icon-button delete-button';
    remove.setAttribute('aria-label', `Delete ${task.text}`);
    remove.title = 'Delete task';
    remove.innerHTML = icon('trash');
    remove.addEventListener('click', () => deleteTask(task.id));

    actions.append(edit, remove);
    li.append(check, content, actions);
    return li;
  }

  function getVisibleTasks() {
    if (currentFilter === 'active') return tasks.filter(task => !task.completed);
    if (currentFilter === 'completed') return tasks.filter(task => task.completed);
    return tasks;
  }

  function render() {
    const completed = tasks.filter(task => task.completed).length;
    const active = tasks.length - completed;
    totalCount.textContent = String(tasks.length);
    activeCount.textContent = String(active);
    completedCount.textContent = String(completed);
    allFilterCount.textContent = String(tasks.length);
    remainingLabel.textContent = `${active} ${active === 1 ? 'task' : 'tasks'} remaining`;
    clearCompletedButton.disabled = completed === 0;

    filterButtons.forEach(button => {
      const selected = button.dataset.filter === currentFilter;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });

    const visibleTasks = getVisibleTasks();
    taskList.replaceChildren(...visibleTasks.map(createTaskElement));
    const shouldShowEmpty = visibleTasks.length === 0;
    emptyState.classList.toggle('is-visible', shouldShowEmpty);

    if (shouldShowEmpty) {
      if (tasks.length === 0) {
        emptyTitle.textContent = 'A fresh start.';
        emptyCopy.textContent = 'Your list is clear. Add your first task above and build some momentum.';
      } else if (currentFilter === 'active') {
        emptyTitle.textContent = 'All caught up.';
        emptyCopy.textContent = 'You have completed every task. Nice work!';
      } else if (currentFilter === 'completed') {
        emptyTitle.textContent = 'Nothing completed yet.';
        emptyCopy.textContent = 'Finish a task and it will appear here.';
      }
    }
  }

  function addTask(text) {
    const cleanText = text.trim();
    if (!cleanText) {
      taskInput.focus();
      return;
    }
    if (cleanText.length > 140) {
      showToast('Please keep tasks under 140 characters.');
      return;
    }
    tasks.unshift({ id: makeId(), text: cleanText, completed: false, createdAt: Date.now() });
    saveTasks();
    currentFilter = 'all';
    taskInput.value = '';
    formHint.textContent = 'Task added. Keep your momentum going.';
    render();
    taskInput.focus();
    showToast('Task added to your list.');
  }

  function toggleTask(id) {
    const task = tasks.find(item => item.id === id);
    if (!task) return;
    task.completed = !task.completed;
    saveTasks();
    render();
    showToast(task.completed ? 'Nice work — task completed!' : 'Task moved back to active.');
  }

  function editTask(id) {
    const task = tasks.find(item => item.id === id);
    if (!task) return;
    const updated = window.prompt('Edit your task:', task.text);
    if (updated === null) return;
    const cleanText = updated.trim();
    if (!cleanText) {
      showToast('A task cannot be empty. Delete it instead.');
      return;
    }
    if (cleanText.length > 140) {
      showToast('Please keep tasks under 140 characters.');
      return;
    }
    task.text = cleanText;
    saveTasks();
    render();
    showToast('Task updated.');
  }

  function deleteTask(id) {
    const task = tasks.find(item => item.id === id);
    if (!task) return;
    tasks = tasks.filter(item => item.id !== id);
    saveTasks();
    render();
    showToast('Task deleted.');
  }

  taskForm.addEventListener('submit', event => {
    event.preventDefault();
    addTask(taskInput.value);
  });

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      currentFilter = button.dataset.filter;
      render();
    });
  });

  clearCompletedButton.addEventListener('click', () => {
    const completed = tasks.filter(task => task.completed).length;
    if (completed === 0) return;
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    render();
    showToast(`${completed} completed ${completed === 1 ? 'task' : 'tasks'} cleared.`);
  });

  const today = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());
  document.getElementById('todayLabel').textContent = today.toUpperCase();

  render();
})();
