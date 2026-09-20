/**
 * Central dictionary for user-facing text. Identifiers, comments, types and
 * API field values remain in English.
 */
export const t = {
  nav: {
    dashboard: 'Дашборд',
    clients: 'Клиенты',
    deals: 'Сделки',
    tasks: 'Задачи',
    users: 'Пользователи',
    settings: 'Настройки',
    mainNavigation: 'Основная навигация',
  },
  common: {
    search: 'Поиск',
    cancel: 'Отмена',
    save: 'Сохранить',
    edit: 'Изменить',
    delete: 'Удалить',
    actions: 'Действия',
    loading: 'Загрузка…',
    notFound: 'Не найдено',
    required: 'Обязательное поле',
    close: 'Закрыть',
  },
  auth: {
    signIn: 'Войти',
    signInTitle: 'Вход',
    signInSubtitle: 'Добро пожаловать в FELAGI CRM',
    email: 'Email',
    password: 'Пароль',
    signUp: 'Регистрация',
    signUpTitle: 'Регистрация',
    signUpSubtitle: 'Создайте аккаунт FELAGI CRM',
    noAccount: 'Нет аккаунта?',
    haveAccount: 'Уже есть аккаунт?',
    signingIn: 'Вход…',
    signingUp: 'Регистрация…',
    logout: 'Выйти',
    passwordHint: '12–128 символов, строчная и заглавная буквы, цифра',
    unableToSignIn: 'Не удалось войти',
    unableToRegister: 'Не удалось создать аккаунт',
    fixHighlightedFields: 'Исправьте выделенные поля',
    restoringSession: 'Восстанавливаем сессию…',
  },
  dashboard: {
    title: 'Дашборд',
    welcome: (email: string) => `С возвращением, ${email}`,
    totalClients: 'Всего клиентов',
    totalDeals: 'Всего сделок',
    activeTasks: 'Активных задач',
    wonDeals: 'Выигранных сделок',
    active: (n: number) => `${n} активных`,
    total: (n: number) => `${n} всего`,
    winRate: (p: number) => `${p}% успешных`,
    dealsTimeline: 'Динамика сделок',
    dealsTimelineSubtitle: 'Создано сделок по месяцам (последние 6 месяцев)',
    pipeline: 'Воронка',
    pipelineSubtitle: 'Распределение сделок и процент успеха',
    winRateLabel: 'Процент успеха',
    won: 'Выиграно',
    inProgress: 'В работе',
    new: 'Новые',
    lost: 'Проиграно',
    recentClients: 'Последние клиенты',
    recentDeals: 'Последние сделки',
    recentTasks: 'Последние задачи',
    noDealsInPeriod: 'Нет сделок за последние 6 месяцев',
    loadFailed: 'Не удалось загрузить данные дашборда',
    loadFailedHint: 'Часть данных не загрузилась. Проверьте, что API запущен, и попробуйте снова.',
    noClosedDeals: 'закрытых сделок пока нет',
    wonAndLost: (won: number, lost: number) => `${won} выиграно · ${lost} проиграно`,
    dealsCount: (n: number) => {
      const mod10 = n % 10
      const mod100 = n % 100
      if (mod10 === 1 && mod100 !== 11) return `${n} сделка`
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} сделки`
      return `${n} сделок`
    },
  },
  clients: {
    title: 'Клиенты',
    total: (n: number) => {
      const mod10 = n % 10
      const mod100 = n % 100
      if (mod10 === 1 && mod100 !== 11) return `${n} клиент`
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} клиента`
      return `${n} клиентов`
    },
    totalLabel: (n: number) => {
      const mod10 = n % 10
      const mod100 = n % 100
      if (mod10 === 1 && mod100 !== 11) return `${n} клиент всего`
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} клиента всего`
      return `${n} клиентов всего`
    },
    addClient: 'Добавить клиента',
    editClient: 'Редактирование клиента',
    createClient: 'Новый клиент',
    editSubtitle: 'Обновите данные клиента ниже.',
    createSubtitle: 'Создайте новую карточку клиента.',
    columns: {
      name: 'Имя',
      email: 'Email',
      company: 'Компания',
      phone: 'Телефон',
      created: 'Создан',
    },
    form: {
      name: 'Имя',
      email: 'Email',
      phone: 'Телефон',
      company: 'Компания',
      notes: 'Заметки',
      namePlaceholder: 'ООО «Ромашка»',
      emailPlaceholder: 'hello@example.com',
      phonePlaceholder: '+7 900 000-00-00',
      companyPlaceholder: 'Ромашка',
      notesPlaceholder: 'Дополнительная информация о клиенте',
      saving: 'Сохранение…',
      saveChanges: 'Сохранить',
    },
    empty: {
      title: 'Пока нет клиентов',
      description: 'Начните с добавления первого клиента',
    },
    deleteConfirm: {
      title: 'Удалить клиента?',
      description: (name: string) => `Вы уверены, что хотите удалить «${name}»? Это действие нельзя отменить.`,
      confirm: 'Удалить',
      cancel: 'Отмена',
    },
    created: 'Клиент создан',
    updated: 'Клиент обновлён',
    deleted: 'Клиент удалён',
    createFailed: 'Не удалось создать клиента',
    updateFailed: 'Не удалось обновить клиента',
    deleteFailed: 'Не удалось удалить клиента',
    loadFailed: 'Не удалось загрузить клиентов',
    loadFailedHint: 'Не удалось загрузить список клиентов. Проверьте, что API запущен, и попробуйте снова.',
    deleting: 'Удаление…',
  },
  pagination: {
    showing: (from: number, to: number, total: number) => `Показано ${from}–${to} из ${total}`,
    perPage: 'На странице',
    page: (current: number, total: number) => `Страница ${current} из ${total}`,
    rowsPerPage: 'Строк на странице',
    previousPage: 'Предыдущая страница',
    nextPage: 'Следующая страница',
  },
  validation: {
    required: 'Обязательное поле',
    email: 'Введите корректный email',
    minLength: (n: number) => `Минимум ${n} символов`,
    maxLength: (n: number) => `Максимум ${n} символов`,
    passwordRequired: 'Введите пароль',
    passwordMin: 'Минимум 12 символов',
    passwordMax: 'Максимум 128 символов',
    passwordLower: 'Нужна строчная буква',
    passwordUpper: 'Нужна заглавная буква',
    passwordDigit: 'Нужна цифра',
    amountFormat: 'Введите число (макс. 2 знака после запятой)',
    dateFormat: 'Введите корректную дату',
    uuid: 'Некорректный идентификатор',
  },
  notifications: {
    empty: 'Уведомлений нет',
    label: 'Уведомления',
  },
  status: {
    deal: {
      new: 'Новый',
      in_progress: 'В работе',
      won: 'Выиграно',
      lost: 'Проиграно',
    },
    task: {
      todo: 'К выполнению',
      in_progress: 'В работе',
      done: 'Готово',
    },
  },
  header: {
    openNavigation: 'Открыть меню',
    closeNavigation: 'Закрыть меню',
    toggleTheme: 'Переключить тему',
    userMenu: 'Меню пользователя',
    openSearch: 'Открыть поиск',
  },
  settings: {
    title: 'Настройки',
    profile: 'Профиль',
    notSignedIn: 'Не авторизован',
    comingSoon: 'Скоро',
    logout: 'Выйти',
    currency: 'Валюта',
    currencyRUB: '₽ Рубль',
    currencyUSD: '$ Доллар',
    currencyEUR: '€ Евро',
    currencyHint: 'Используется для отображения сумм в сделках.',
    selectCurrency: 'Выберите валюту',
  },
  search: {
    title: 'Поиск',
    placeholder: 'Поиск по клиентам, сделкам и задачам…',
    hint: 'Введите минимум 2 символа',
    noResults: 'Ничего не найдено',
    error: 'Не удалось выполнить поиск. Попробуйте ещё раз.',
    groups: {
      clients: 'Клиенты',
      deals: 'Сделки',
      tasks: 'Задачи',
    },
    openHint: 'Открыть поиск',
    shortcut: 'Ctrl K',
    navigateHint: '↑↓ — выбор, Enter — открыть, Esc — закрыть',
    goToClients: 'Все клиенты',
    goToDeals: 'Все сделки',
    goToTasks: 'Все задачи',
  },
  notFound: {
    title: 'Страница не найдена',
    backToDashboard: 'Вернуться на дашборд',
  },
  users: {
    title: 'Пользователи',
    total: (n: number) => {
      const mod10 = n % 10
      const mod100 = n % 100
      if (mod10 === 1 && mod100 !== 11) return `${n} пользователь`
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} пользователя`
      return `${n} пользователей`
    },
    totalLabel: (n: number) => {
      const mod10 = n % 10
      const mod100 = n % 100
      if (mod10 === 1 && mod100 !== 11) return `${n} пользователь всего`
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} пользователя всего`
      return `${n} пользователей всего`
    },
    addUser: 'Добавить пользователя',
    editUser: 'Редактирование пользователя',
    createUser: 'Новый пользователь',
    createSubtitle: 'Создайте учётную запись и выберите роль.',
    editSubtitle: 'Измените роль или заблокируйте доступ.',
    columns: {
      email: 'Email',
      role: 'Роль',
      status: 'Статус',
      created: 'Создан',
      actions: 'Действия',
    },
    form: {
      email: 'Email',
      emailPlaceholder: 'user@example.com',
      password: 'Пароль',
      passwordPlaceholder: 'Минимум 12 символов',
      passwordHint: 'Строчная и заглавная буквы и хотя бы одна цифра.',
      role: 'Роль',
      isActive: 'Активен',
      isActiveHint: 'Заблокированный пользователь не сможет войти.',
      selectRole: 'Выберите роль',
      saving: 'Сохранение…',
      saveChanges: 'Сохранить',
    },
    roles: {
      admin: 'Администратор',
      manager: 'Менеджер',
      user: 'Пользователь',
    },
    status: {
      active: 'Активен',
      inactive: 'Заблокирован',
      you: 'Это вы',
    },
    empty: 'Пользователей нет',
    emptyDescription: 'Добавьте первого пользователя, чтобы дать коллеге доступ.',
    noMatches: 'Ничего не найдено',
    created: 'Пользователь создан',
    updated: 'Пользователь обновлён',
    deleted: 'Пользователь удалён',
    createdFailed: 'Не удалось создать пользователя',
    updateFailed: 'Не удалось обновить пользователя',
    deleteFailed: 'Не удалось удалить пользователя',
    loadFailed: 'Не удалось загрузить пользователей',
    loadFailedHint: 'Проверьте соединение и обновите страницу.',
    deleting: 'Удаление…',
    deleteConfirm: {
      title: 'Удалить пользователя?',
      description: (email: string) =>
        `Вы уверены, что хотите удалить «${email}»? Это действие нельзя отменить.`,
      cancel: 'Отмена',
      confirm: 'Удалить',
    },
    selfDeleteBlocked: 'Нельзя удалить собственную учётную запись.',
    selfEditBlocked: 'Нельзя менять свою роль или блокировать себя.',
    relatedRecordsBlocked: 'У пользователя есть связанные записи, поэтому удалить его нельзя.',
    hint: 'Управлять пользователями может только администратор.',
  },
  deals: {
    title: 'Сделки',
    total: (n: number) => {
      const mod10 = n % 10
      const mod100 = n % 100
      if (mod10 === 1 && mod100 !== 11) return `${n} сделка`
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} сделки`
      return `${n} сделок`
    },
    totalLabel: (n: number) => {
      const mod10 = n % 10
      const mod100 = n % 100
      if (mod10 === 1 && mod100 !== 11) return `${n} сделка всего`
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} сделки всего`
      return `${n} сделок всего`
    },
    addDeal: 'Добавить сделку',
    editDeal: 'Редактирование сделки',
    createDeal: 'Новая сделка',
    editSubtitle: 'Обновите данные сделки ниже.',
    createSubtitle: 'Создайте новую сделку.',
    columns: {
      title: 'Название',
      client: 'Клиент',
      amount: 'Сумма',
      status: 'Статус',
      created: 'Создан',
    },
    form: {
      title: 'Название',
      titlePlaceholder: 'Внедрение CRM',
      amount: 'Сумма',
      amountPlaceholder: '0.00',
      status: 'Статус',
      client: 'Клиент',
      selectClient: 'Выберите клиента',
      selectStatus: 'Выберите статус',
      saving: 'Сохранение…',
      saveChanges: 'Сохранить',
    },
    empty: {
      title: 'Пока нет сделок',
      description: 'Начните с добавления первой сделки',
    },
    /** Shown when filters are active but match nothing. */
    noMatches: {
      title: 'Ничего не найдено',
      description: 'Попробуйте изменить или сбросить фильтры',
    },
    deleteConfirm: {
      title: 'Удалить сделку?',
      description: (name: string) =>
        `Вы уверены, что хотите удалить «${name}»? Связанные задачи тоже будут удалены. Это действие нельзя отменить.`,
      confirm: 'Удалить',
      cancel: 'Отмена',
    },
    created: 'Сделка создана',
    updated: 'Сделка обновлена',
    deleted: 'Сделка удалена',
    createFailed: 'Не удалось создать сделку',
    updateFailed: 'Не удалось обновить сделку',
    deleteFailed: 'Не удалось удалить сделку',
    loadFailed: 'Не удалось загрузить сделки',
    loadFailedHint: 'Не удалось загрузить список сделок. Проверьте, что API запущен, и попробуйте снова.',
    deleting: 'Удаление…',
    unknownClient: 'Клиент удалён',
  },
  filters: {
    status: 'Статус',
    client: 'Клиент',
    all: 'Все',
    allClients: 'Все клиенты',
    resetFilters: 'Сбросить фильтры',
    filterByStatus: 'Фильтр по статусу',
    filterByClient: 'Фильтр по клиенту',
  },
  tasks: {
    title: 'Задачи',
    total: (n: number) => {
      const mod10 = n % 10
      const mod100 = n % 100
      if (mod10 === 1 && mod100 !== 11) return `${n} задача`
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} задачи`
      return `${n} задач`
    },
    totalLabel: (n: number) => {
      const mod10 = n % 10
      const mod100 = n % 100
      if (mod10 === 1 && mod100 !== 11) return `${n} задача всего`
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} задачи всего`
      return `${n} задач всего`
    },
    addTask: 'Добавить задачу',
    editTask: 'Редактирование задачи',
    createTask: 'Новая задача',
    editSubtitle: 'Обновите данные задачи ниже.',
    createSubtitle: 'Создайте новую задачу.',
    columns: {
      title: 'Название',
      status: 'Статус',
      dueDate: 'Срок',
      assignee: 'Исполнитель',
      deal: 'Сделка',
      created: 'Создан',
    },
    form: {
      title: 'Название',
      titlePlaceholder: 'Подготовить коммерческое предложение',
      description: 'Описание',
      descriptionPlaceholder: 'Дополнительная информация о задаче',
      status: 'Статус',
      dueDate: 'Срок',
      deal: 'Сделка',
      assignee: 'Исполнитель',
      selectDeal: 'Выберите сделку',
      selectAssignee: 'Выберите исполнителя',
      selectStatus: 'Выберите статус',
      noDeal: 'Без сделки',
      unassigned: 'Не назначен',
      /** Shown when a task is assigned to somebody other than the current user. */
      otherAssignee: 'Другой исполнитель',
      saving: 'Сохранение…',
      saveChanges: 'Сохранить',
    },
    view: {
      kanban: 'Канбан',
      list: 'Список',
      label: 'Вид',
    },
    filters: {
      status: 'Статус',
      assignee: 'Исполнитель',
      deal: 'Сделка',
      allAssignees: 'Все исполнители',
      allDeals: 'Все сделки',
      unassigned: 'Не назначены',
      mine: 'Мои задачи',
      all: 'Все',
      filterByStatus: 'Фильтр по статусу',
      filterByAssignee: 'Фильтр по исполнителю',
      filterByDeal: 'Фильтр по сделке',
    },
    empty: {
      title: 'Пока нет задач',
      description: 'Начните с добавления первой задачи',
    },
    /** Shown to a regular user with nothing assigned to them. */
    noOwnTasks: {
      title: 'У вас нет задач',
      description: 'Задачи, назначенные на вас, появятся здесь',
    },
    noMatches: {
      title: 'Ничего не найдено',
      description: 'Попробуйте изменить или сбросить фильтры',
    },
    deleteConfirm: {
      title: 'Удалить задачу?',
      description: (name: string) => `Вы уверены, что хотите удалить «${name}»? Это действие нельзя отменить.`,
      confirm: 'Удалить',
      cancel: 'Отмена',
    },
    created: 'Задача создана',
    updated: 'Задача обновлена',
    deleted: 'Задача удалена',
    statusUpdated: 'Статус обновлён',
    statusUpdateFailed: 'Не удалось изменить статус',
    createFailed: 'Не удалось создать задачу',
    updateFailed: 'Не удалось обновить задачу',
    deleteFailed: 'Не удалось удалить задачу',
    loadFailed: 'Не удалось загрузить задачи',
    loadFailedHint: 'Не удалось загрузить список задач. Проверьте, что API запущен, и попробуйте снова.',
    deleting: 'Удаление…',
    columnEmpty: 'Нет задач',
    overdue: 'Просрочено',
    dueToday: 'Сегодня',
    dueTomorrow: 'Завтра',
    dragHandle: 'Перетащите, чтобы изменить статус',
    unknownDeal: 'Сделка удалена',
    /** Explains the MVP limitation: there is no user directory endpoint yet. */
    assigneeSelfOnly: 'Доступно только назначение на себя',
  },
  errors: {
    generic: 'Что-то пошло не так. Попробуйте ещё раз.',
  },
} as const