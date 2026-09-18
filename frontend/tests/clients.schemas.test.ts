import {
  clientFormSchema,
  clientToFormValues,
  emptyClientForm,
  toClientCreate,
  toClientUpdate,
} from '@/features/clients/clients.schemas'

describe('clientFormSchema', () => {
  test('accepts a name-only payload', () => {
    const result = clientFormSchema.safeParse({ ...emptyClientForm, name: 'Acme Corp' })
    expect(result.success).toBe(true)
  })

  test('requires a non-empty name', () => {
    const result = clientFormSchema.safeParse({ ...emptyClientForm, name: '' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['name'])
  })

  test('treats a whitespace-only name as empty', () => {
    expect(clientFormSchema.safeParse({ ...emptyClientForm, name: '   ' }).success).toBe(false)
  })

  test('rejects a name longer than 255 characters', () => {
    const result = clientFormSchema.safeParse({ ...emptyClientForm, name: 'a'.repeat(256) })
    expect(result.success).toBe(false)
  })

  test('accepts an empty email (meaning "not provided")', () => {
    expect(clientFormSchema.safeParse({ ...emptyClientForm, name: 'A', email: '' }).success).toBe(true)
  })

  test('rejects a malformed email', () => {
    const result = clientFormSchema.safeParse({ ...emptyClientForm, name: 'A', email: 'not-an-email' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['email'])
  })

  test('rejects a phone longer than 32 characters', () => {
    expect(clientFormSchema.safeParse({ ...emptyClientForm, name: 'A', phone: '1'.repeat(33) }).success).toBe(false)
  })

  test('rejects a company longer than 255 characters', () => {
    expect(clientFormSchema.safeParse({ ...emptyClientForm, name: 'A', company: 'c'.repeat(256) }).success).toBe(false)
  })
})

describe('toClientCreate', () => {
  test('omits blank optional fields so the column stays NULL', () => {
    const payload = toClientCreate({ ...emptyClientForm, name: 'Acme Corp' })
    expect(payload).toEqual({ name: 'Acme Corp' })
    expect('email' in payload).toBe(false)
    expect('phone' in payload).toBe(false)
  })

  test('trims values and keeps the ones that are filled in', () => {
    const payload = toClientCreate({
      name: '  Acme Corp  ',
      email: '  hello@acme.example  ',
      phone: ' +1 555 0100 ',
      company: 'Acme',
      notes: 'note',
    })
    expect(payload).toEqual({
      name: 'Acme Corp',
      email: 'hello@acme.example',
      phone: '+1 555 0100',
      company: 'Acme',
      notes: 'note',
    })
  })

  test('drops a blank email rather than sending an empty string', () => {
    const payload = toClientCreate({ ...emptyClientForm, name: 'A', email: '   ' })
    expect('email' in payload).toBe(false)
  })
})

describe('toClientUpdate', () => {
  test('sends emptied text fields as "" so the backend clears them', () => {
    // The API applies exclude_none=True, so null would be dropped silently.
    const payload = toClientUpdate({ ...emptyClientForm, name: 'Acme' })
    expect(payload.phone).toBe('')
    expect(payload.company).toBe('')
    expect(payload.notes).toBe('')
  })

  test('never sends an empty email, because the API rejects it as invalid', () => {
    const payload = toClientUpdate({ ...emptyClientForm, name: 'Acme', email: '' })
    expect('email' in payload).toBe(false)
  })

  test('includes a real email', () => {
    const payload = toClientUpdate({ ...emptyClientForm, name: 'Acme', email: 'a@b.example' })
    expect(payload.email).toBe('a@b.example')
  })
})

describe('clientToFormValues', () => {
  test('maps nulls to empty strings for the form', () => {
    expect(
      clientToFormValues({
        name: 'Acme',
        email: null,
        phone: null,
        company: null,
        notes: null,
      }),
    ).toEqual({ name: 'Acme', email: '', phone: '', company: '', notes: '' })
  })

  test('round-trips a fully populated client', () => {
    const client = {
      name: 'Acme',
      email: 'a@b.example',
      phone: '+1 555 0100',
      company: 'Acme',
      notes: 'hello',
    }
    expect(clientToFormValues(client)).toEqual(client)
  })
})