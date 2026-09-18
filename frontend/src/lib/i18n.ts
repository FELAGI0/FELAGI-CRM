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
  },
  notFound: {
    title: 'Страница не найдена',
    backToDashboard: 'Вернуться на дашборд',
  },
  deals: {
    empty: {
      title: 'Пока нет сделок',
    },
  },
  tasks: {
    empty: {
      title: 'Пока нет задач',
    },
  },
  errors: {
    generic: 'Что-то пошло не так. Попробуйте ещё раз.',
  },
} as const