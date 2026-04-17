# SMS Permission Check

Use this when validating Android SMS ingestion.

## Runtime Flow
1. Confirm Android manifest permissions include SMS read access required by `react-native-get-sms-android`.
2. Request `READ_SMS` at runtime before reading messages.
3. Handle denied and permanently denied states with a user-facing path to Android settings.
4. Never log raw SMS bodies in production. Use `__DEV__` guards for parser debugging.
5. Keep parsing in `lib/sms-parser.ts`; keep subscription and permissions in `lib/sms-listener.ts`.

## Manifest Entries To Check
- `android.permission.READ_SMS`
- Any receive/listen permissions required by the native SMS package, if listener mode is enabled

## Test SMS Strings
Use synthetic examples only:

```text
HDFC Bank: Rs.245.00 spent on your Credit Card XX1234 at SWIGGY on 17-Apr-26. Avl limit Rs.10000.
ICICI Bank Acct XX4321 debited with INR 1,250.00 on 17-Apr-26; UPI/PAYTM. Bal INR 22,450.10.
SBI Card ending 9876: Transaction of Rs 599.00 at AMAZON successful on 17/04/2026.
Axis Bank: INR 2,000.00 credited to A/c XX1111 via NEFT on 17-Apr-2026. Clear bal INR 12,000.
UPI transaction of INR 75.50 to METRO from Ac XX2222 is successful. Ref 123456789.
```

## Verification
- Add parser unit tests for every new pattern.
- Verify permission denial paths on a real Android device or emulator.
- Verify no production log contains raw SMS content.
