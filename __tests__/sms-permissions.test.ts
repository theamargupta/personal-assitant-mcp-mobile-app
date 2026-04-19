const mockRequestMultiple = jest.fn()

const mockPermissions = {
  READ_SMS: 'android.permission.READ_SMS',
  RECEIVE_SMS: 'android.permission.RECEIVE_SMS',
}

const mockResults = {
  GRANTED: 'granted',
  DENIED: 'denied',
  NEVER_ASK_AGAIN: 'never_ask_again',
}

const mockPlatform = { OS: 'android' }

function loadSmsListener(os: 'android' | 'ios' = 'android') {
  jest.resetModules()
  mockRequestMultiple.mockReset()
  mockPlatform.OS = os

  jest.doMock('react-native', () => ({
    Platform: mockPlatform,
    PermissionsAndroid: {
      request: jest.fn(),
      requestMultiple: mockRequestMultiple,
      PERMISSIONS: mockPermissions,
      RESULTS: mockResults,
    },
  }))

  jest.doMock('@/lib/api', () => ({
    api: {
      createTransaction: jest.fn(),
    },
  }))

  return require('@/lib/sms-listener') as typeof import('@/lib/sms-listener')
}

describe('requestSmsPermissions', () => {
  it('requests READ_SMS and RECEIVE_SMS on Android and returns true when both are granted', async () => {
    const { requestSmsPermissions } = loadSmsListener()
    mockRequestMultiple.mockResolvedValueOnce({
      [mockPermissions.READ_SMS]: mockResults.GRANTED,
      [mockPermissions.RECEIVE_SMS]: mockResults.GRANTED,
    })

    await expect(requestSmsPermissions()).resolves.toBe(true)

    expect(mockRequestMultiple).toHaveBeenCalledWith([
      mockPermissions.READ_SMS,
      mockPermissions.RECEIVE_SMS,
    ])
  })

  it.each([
    ['denied', mockResults.DENIED],
    ['never_ask_again', mockResults.NEVER_ASK_AGAIN],
  ])('returns false if either SMS permission is %s', async (_label, result) => {
    const { requestSmsPermissions } = loadSmsListener()
    mockRequestMultiple.mockResolvedValueOnce({
      [mockPermissions.READ_SMS]: mockResults.GRANTED,
      [mockPermissions.RECEIVE_SMS]: result,
    })

    await expect(requestSmsPermissions()).resolves.toBe(false)
  })

  it('returns false without requesting SMS permissions on iOS', async () => {
    const { requestSmsPermissions } = loadSmsListener('ios')

    await expect(requestSmsPermissions()).resolves.toBe(false)

    expect(mockRequestMultiple).not.toHaveBeenCalled()
  })
})
