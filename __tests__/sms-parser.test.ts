import { isPaymentSms, parseSms } from '@/lib/sms-parser'

describe('sms-parser', () => {
  it('parses a PhonePe payment SMS into a transaction', () => {
    const body = 'Paid ₹1,250.50 to Grocery Mart on 19 Apr.'

    expect(parseSms('VM-PhonePe', body)).toEqual({
      amount: 1250.5,
      merchant: 'Grocery Mart',
      sourceApp: 'phonepe',
      rawSms: body,
    })
  })

  it('returns null when the SMS does not match a payment pattern', () => {
    expect(parseSms('VM-STORE', 'Your OTP is 123456')).toBeNull()
  })

  it('detects likely payment SMS bodies by keyword', () => {
    expect(isPaymentSms('VM-BANK', 'Your account was debited for INR 500')).toBe(true)
    expect(isPaymentSms('VM-STORE', 'Your OTP is 123456')).toBe(false)
  })
})
