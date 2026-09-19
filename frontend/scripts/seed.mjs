#!/usr/bin/env node
/**
 * Idempotent production seed for FELAGI CRM.
 *
 * Talks to the public API only — no database access, no ORM.
 *
 *   API_URL=https://api.example.com/api/v1 node scripts/seed.mjs
 *
 * Running it twice is safe: users are matched by email, and clients, deals and
 * tasks are matched by their natural key (a title, or a title plus its parent)
 * before anything is created.
 *
 * The API rate limits registration and login to 5 requests per minute per IP, so
 * the script backs off and retries instead of failing when it trips the limit.
 *
 * ---------------------------------------------------------------------------
 * IMPORTANT: the API cannot create an administrator.
 *
 * `POST /auth/register` accepts only email and password, and the `users` table
 * defaults `role` to 'user' (app/modules/users/model.py). Every registrar is
 * therefore a plain user, and plain users get 403 on client and deal writes.
 *
 * So this script registers the accounts, then checks the role of the admin
 * account after logging in. If it is not admin or manager, the script stops and
 * prints the single SQL statement needed to promote it. Escalating privileges
 * silently is not something a seed script should do.
 * ---------------------------------------------------------------------------
 */

const API_URL = (process.env.API_URL ?? 'http://localhost:8000/api/v1').replace(/\/+$/, '')

const PASSWORD = process.env.SEED_PASSWORD ?? 'StrongPassword123'
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com'
const MANAGER_EMAIL = process.env.SEED_MANAGER_EMAIL ?? 'manager@example.com'
const USER_EMAIL = process.env.SEED_USER_EMAIL ?? 'user@example.com'

const USERS = [ADMIN_EMAIL, MANAGER_EMAIL, USER_EMAIL]

/** Clients, matching the shape of the existing dataset. */
const CLIENTS = [
  {
    name: 'Wayne Enterprises',
    email: 'bids@wayne.example',
    phone: '+1 555 0101',
    company: 'Wayne',
    notes: 'Ключевой заказчик, счета через тендерный отдел.',
  },
  {
    name: 'Stark Industries',
    email: 'procurement@stark.example',
    phone: '+1 555 0102',
    company: 'Stark',
    notes: 'Долгий цикл согласования, нужен технический пресейл.',
  },
  {
    name: 'Soylent Foods',
    email: 'sales@soylent.example',
    phone: '+1 555 0103',
    company: 'Soylent',
    notes: 'Интерес к интеграциям с логистикой.',
  },
  {
    name: 'Umbrella Health',
    email: 'info@umbrella.example',
    phone: '+1 555 0104',
    company: 'Umbrella',
    notes: 'Повышенные требования к защите данных.',
  },
  {
    name: 'Initech LLC',
    email: 'contact@initech.example',
    phone: '+1 555 0105',
    company: 'Initech',
    notes: 'Бюджет согласован на квартал вперёд.',
  },
  {
    name: 'Globex Corporation',
    email: 'hello@globex.example',
    phone: '+1 555 0106',
    company: 'Globex',
    notes: 'Несколько подразделений, возможен рост сделки.',
  },
  {
    name: 'Northwind Traders',
    email: 'ops@northwind.example',
    phone: '+1 555 0107',
    company: 'Northwind',
    notes: 'Действующий контракт на поддержку.',
  },
]

/** 18 deals: 5 new, 5 in_progress, 4 won, 4 lost. */
const DEALS = [
  { title: 'Партнёрская интеграция', amount: '16937.50', status: 'in_progress', client: 'Umbrella Health' },
  { title: 'Перезапуск интернет-магазина', amount: '16000.00', status: 'new', client: 'Initech LLC' },
  { title: 'Программа обучения', amount: '15062.50', status: 'lost', client: 'Globex Corporation' },
  { title: 'Автоматизация тикетов', amount: '14125.00', status: 'won', client: 'Northwind Traders' },
  { title: 'Оптимизация облачных затрат', amount: '13187.50', status: 'in_progress', client: 'Wayne Enterprises' },
  { title: 'Ребрендинг', amount: '12250.00', status: 'new', client: 'Stark Industries' },
  { title: 'Аудит безопасности', amount: '11312.50', status: 'lost', client: 'Soylent Foods' },
  { title: 'Разработка API', amount: '10375.00', status: 'won', client: 'Umbrella Health' },
  { title: 'Аналитический дашборд', amount: '9437.50', status: 'in_progress', client: 'Initech LLC' },
  { title: 'Планирование выездов', amount: '8500.00', status: 'new', client: 'Globex Corporation' },
  { title: 'Портал онбординга', amount: '7562.50', status: 'lost', client: 'Northwind Traders' },
  { title: 'Интеграция платежей', amount: '6625.00', status: 'won', client: 'Wayne Enterprises' },
  { title: 'SEO-поддержка', amount: '5687.50', status: 'in_progress', client: 'Stark Industries' },
  { title: 'Настройка хранилища данных', amount: '4750.00', status: 'new', client: 'Soylent Foods' },
  { title: 'Мобильное приложение, фаза 2', amount: '3812.50', status: 'lost', client: 'Umbrella Health' },
  { title: 'Продление годовой поддержки', amount: '2875.00', status: 'won', client: 'Initech LLC' },
  { title: 'Миграция CRM', amount: '1937.50', status: 'in_progress', client: 'Globex Corporation' },
  { title: 'Редизайн сайта', amount: '1000.00', status: 'new', client: 'Northwind Traders' },
]

/**
 * 12 tasks: 4 todo, 4 in_progress, 4 done, spread across the deals.
 * `due` is a day offset from today, so the dataset keeps a realistic mix of
 * overdue, due-today, due-tomorrow and future deadlines whenever it is seeded.
 */
const TASKS = [
  { title: 'Подготовить смету', status: 'done', deal: 'Аудит безопасности', due: -30 },
  { title: 'Отправить коммерческое предложение', status: 'todo', deal: 'Редизайн сайта', due: -5 },
  { title: 'Позвонить клиенту', status: 'in_progress', deal: 'Миграция CRM', due: 0 },
  { title: 'Подготовить договор', status: 'done', deal: 'Продление годовой поддержки', due: -20 },
  { title: 'Уточнить требования', status: 'todo', deal: 'Мобильное приложение, фаза 2', due: 1 },
  { title: 'Провести демонстрацию', status: 'in_progress', deal: 'Настройка хранилища данных', due: 3 },
  { title: 'Обновить прайс-лист', status: 'done', deal: 'SEO-поддержка', due: -14 },
  { title: 'Собрать подписи', status: 'todo', deal: 'Интеграция платежей', due: 7 },
  { title: 'Провести кик-офф', status: 'in_progress', deal: 'Портал онбординга', due: 1 },
  { title: 'Написать техническое задание', status: 'done', deal: 'Планирование выездов', due: -10 },
  { title: 'Согласовать бюджет', status: 'todo', deal: 'Аналитический дашборд', due: 14 },
  { title: 'Организовать выезд', status: 'in_progress', deal: 'Разработка API', due: 21 },
]

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

let token = null

const request = async (method, path, body, { auth = true } = {}) => {
  const headers = { 'Content-Type': 'application/json' }
  if (auth && token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const text = await response.text()
  let payload = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }

  return { status: response.status, ok: response.ok, payload }
}

/** Treats 404 as "absent" and returns the full first page of a collection. */
const fetchAll = async (path) => {
  const { ok, status, payload } = await request('GET', path)
  if (!ok) throw new Error(`GET ${path} failed with ${status}`)
  return payload.items ?? []
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

/**
 * Registration and login are capped at 5 requests per minute per IP, and the
 * seed makes 3 registrations plus 1 login. That fits in a single window, but a
 * second run started soon after can trip the limit. Rather than fail, wait out
 * the window and continue — the retry is safe because registration is idempotent
 * from our side (an existing account answers 409).
 */
const RATE_LIMIT_WAIT_MS = 61_000
const MAX_RATE_LIMIT_RETRIES = 3

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const registerUsers = async () => {
  const results = []

  for (const email of USERS) {
    let response = await request('POST', '/auth/register', { email, password: PASSWORD }, { auth: false })

    for (let attempt = 1; !response.ok && response.status === 429 && attempt <= MAX_RATE_LIMIT_RETRIES; attempt += 1) {
      console.log(`  rate limited, waiting 60s before retrying ${email} (attempt ${attempt})`)
      await sleep(RATE_LIMIT_WAIT_MS)
      response = await request('POST', '/auth/register', { email, password: PASSWORD }, { auth: false })
    }

    const { status, ok } = response
    if (ok) {
      results.push(`created  ${email}`)
    } else if (status === 409) {
      results.push(`exists   ${email}`)
    } else {
      throw new Error(`Registration for ${email} failed with ${status}`)
    }
  }

  return results
}

const login = async (email) => {
  let response = await request('POST', '/auth/login', { email, password: PASSWORD }, { auth: false })

  for (let attempt = 1; !response.ok && response.status === 429 && attempt <= MAX_RATE_LIMIT_RETRIES; attempt += 1) {
    console.log(`  rate limited on login, waiting 60s (attempt ${attempt})`)
    await sleep(RATE_LIMIT_WAIT_MS)
    response = await request('POST', '/auth/login', { email, password: PASSWORD }, { auth: false })
  }

  if (!response.ok) {
    throw new Error(
      `Login as ${email} failed with ${response.status}. If the account predates this seed, ` +
        'its password differs — set SEED_PASSWORD or remove the account and re-run.',
    )
  }

  token = response.payload.access_token
  return response.payload
}

const assertCanSeed = async () => {
  const { ok, payload } = await request('GET', '/users/me')
  if (!ok) throw new Error('Could not read the current user')
  if (payload.role !== 'admin' && payload.role !== 'manager') {
    throw new Error(
      `Account ${payload.email} has role "${payload.role}", but seeding clients and deals ` +
        'requires admin or manager.\n\n' +
        'The API cannot grant roles: POST /auth/register always creates a plain user. ' +
        'Promote the account in the database, then re-run the seed:\n\n' +
        `  UPDATE users SET role = 'admin' WHERE email = '${payload.email}';\n\n` +
        'With Docker Compose that is:\n\n' +
        `  docker compose exec db psql -U felagi_crm -d felagi_crm \\\n` +
        `    -c "UPDATE users SET role = 'admin' WHERE email = '${payload.email}';"`,
    )
  }
  return payload
}

const seedClients = async () => {
  const existing = await fetchAll('/clients/?limit=100')
  const byName = new Map(existing.map((client) => [client.name, client]))
  const created = []

  for (const client of CLIENTS) {
    if (byName.has(client.name)) continue
    const { ok, status, payload } = await request('POST', '/clients/', client)
    if (!ok) throw new Error(`Creating client "${client.name}" failed with ${status}`)
    byName.set(client.name, payload)
    created.push(client.name)
  }

  return { total: byName.size, created }
}

const seedDeals = async (clientsByName) => {
  const existing = await fetchAll('/deals/?limit=100')
  const known = new Set(existing.map((deal) => deal.title))
  const created = []

  for (const deal of DEALS) {
    if (known.has(deal.title)) continue
    const client = clientsByName.get(deal.client)
    if (!client) throw new Error(`Deal "${deal.title}" references missing client "${deal.client}"`)
    // An empty amount is not sent at all: the API rejects both "" and null, and
    // omitting the field stores a clean NULL.
    const { ok, status } = await request('POST', '/deals/', {
      title: deal.title,
      amount: deal.amount,
      status: deal.status,
      client_id: client.id,
    })
    if (!ok) throw new Error(`Creating deal "${deal.title}" failed with ${status}`)
    known.add(deal.title)
    created.push(deal.title)
  }

  return { total: known.size, created }
}

/** Resolves a day offset into the timezone-aware ISO datetime the API requires. */
const dueDateFrom = (offsetDays) => {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString()
}

const seedTasks = async (dealsByTitle, assignee) => {
  // Tasks are matched on title alone, which is enough for this dataset and keeps
  // the check independent of the parent deal.
  const existing = await fetchAll('/tasks/?limit=100')
  const known = new Set(existing.map((task) => task.title))
  const created = []

  for (const task of TASKS) {
    if (known.has(task.title)) continue
    const deal = dealsByTitle.get(task.deal)
    if (!deal) throw new Error(`Task "${task.title}" references missing deal "${task.deal}"`)
    const { ok, status } = await request('POST', '/tasks/', {
      title: task.title,
      status: task.status,
      deal_id: deal.id,
      due_date: dueDateFrom(task.due),
      assigned_to: assignee.id,
    })
    if (!ok) throw new Error(`Creating task "${task.title}" failed with ${status}`)
    known.add(task.title)
    created.push(task.title)
  }

  return { total: known.size, created }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const main = async () => {
  console.log(`Seeding ${API_URL}\n`)

  console.log('Users')
  for (const line of await registerUsers()) console.log(`  ${line}`)

  await login(ADMIN_EMAIL)
  const admin = await assertCanSeed()
  console.log(`  signed in as ${admin.email} (${admin.role})\n`)

  console.log('Clients')
  const clientResult = await seedClients()
  console.log(`  ${clientResult.created.length} created, ${clientResult.total} total\n`)

  // Deals and tasks need the client and deal ids, so refetch after creating.
  const clientsByName = new Map((await fetchAll('/clients/?limit=100')).map((c) => [c.name, c]))
  console.log('Deals')
  const dealResult = await seedDeals(clientsByName)
  console.log(`  ${dealResult.created.length} created, ${dealResult.total} total\n`)

  const dealsByTitle = new Map((await fetchAll('/deals/?limit=100')).map((d) => [d.title, d]))
  console.log('Tasks')
  const taskResult = await seedTasks(dealsByTitle, admin)
  console.log(`  ${taskResult.created.length} created, ${taskResult.total} total\n`)

  console.log('Done. Re-running the seed will skip everything that already exists.')
}

main().catch((error) => {
  console.error(`\nSeed failed: ${error.message}`)
  process.exitCode = 1
})