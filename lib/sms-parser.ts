export interface ParsedTransaction {
  amount: number
  merchant: string
  sourceApp: 'phonepe' | 'gpay' | 'paytm' | 'bank' | 'other'
  rawSms: string
}

interface SmsPattern {
  senderPattern: RegExp
  bodyPattern: RegExp
  sourceApp: ParsedTransaction['sourceApp']
}

const SMS_PATTERNS: SmsPattern[] = [
  // PhonePe
  {
    senderPattern: /PhonePe/i,
    bodyPattern: /(?:Paid|Sent)\s*₹?\s*(\d+(?:,\d+)*(?:\.\d{1,2})?)\s*(?:to|for)\s+(.+?)(?:\s+on|\s*\.|$)/i,
    sourceApp: 'phonepe',
  },
  // Google Pay
  {
    senderPattern: /GPay|Google\s*Pay/i,
    bodyPattern: /(?:Sent|Paid)\s*₹?\s*(\d+(?:,\d+)*(?:\.\d{1,2})?)\s*(?:to)\s+(.+?)(?:\s+on|\s*\.|$)/i,
    sourceApp: 'gpay',
  },
  // Paytm
  {
    senderPattern: /Paytm/i,
    bodyPattern: /₹?\s*(\d+(?:,\d+)*(?:\.\d{1,2})?)\s*(?:paid|sent)\s*(?:to)\s+(.+?)(?:\s+on|\s*\.|$)/i,
    sourceApp: 'paytm',
  },
  // Bank debit SMS (generic)
  {
    senderPattern: /^[A-Z]{2}-[A-Z]+/,
    bodyPattern: /(?:debited|withdrawn).*?(?:Rs\.?|INR|₹)\s*(\d+(?:,\d+)*(?:\.\d{1,2})?).*?(?:to|at|for)\s+(.+?)(?:\s+on|\s+Ref|\s*\.|$)/i,
    sourceApp: 'bank',
  },
  // UPI generic
  {
    senderPattern: /UPI|NPCI/i,
    bodyPattern: /(?:Rs\.?|INR|₹)\s*(\d+(?:,\d+)*(?:\.\d{1,2})?).*?(?:to|paid|debited).*?([A-Za-z][\w\s]+?)(?:\s+on|\s+UPI|\s*\.|$)/i,
    sourceApp: 'other',
  },
]

export function parseSms(sender: string, body: string): ParsedTransaction | null {
  for (const pattern of SMS_PATTERNS) {
    if (!pattern.senderPattern.test(sender) && !pattern.senderPattern.test(body)) {
      continue
    }

    const match = body.match(pattern.bodyPattern)
    if (!match) continue

    const amountStr = match[1].replace(/,/g, '')
    const amount = parseFloat(amountStr)
    const merchant = match[2].trim()

    if (isNaN(amount) || amount <= 0) continue
    if (!merchant) continue

    return {
      amount,
      merchant,
      sourceApp: pattern.sourceApp,
      rawSms: body,
    }
  }

  return null
}

export function isPaymentSms(sender: string, body: string): boolean {
  const paymentKeywords = /(?:debited|paid|sent|withdrawn|payment|UPI)/i
  return paymentKeywords.test(body)
}
