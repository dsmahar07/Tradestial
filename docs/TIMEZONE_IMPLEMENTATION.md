# Timezone Implementation Guide

## Overview

The Tradestial trading journal now implements a comprehensive timezone-aware system that:

1. **Stores all trades in UTC** - Universal time for consistency
2. **Displays in user's local timezone** - Automatic conversion for viewing
3. **Handles CSV imports from any timezone** - User selects source timezone during import
4. **Provides broker-specific defaults** - Smart defaults based on broker location

## How It Works

### Storage (UTC)
All trade timestamps are stored in UTC format:
- **Dates**: `YYYY-MM-DD` format (e.g., `2025-08-30`)
- **Times**: `HH:mm:ss` format in UTC (e.g., `14:04:00`)
- **Full timestamps**: ISO format (e.g., `2025-08-30T14:04:00.000Z`)

### Display (Local Timezone)
When displaying trades, timestamps are automatically converted to the user's local timezone or their preferred display timezone.

### Import Process
1. User uploads CSV file
2. System detects broker (if possible)
3. Import settings modal appears with:
   - Date format selection
   - Timezone selection (pre-filled with broker default)
4. All timestamps converted from source timezone → UTC during parsing
5. Trades stored in UTC format

## Example Workflow

**Your Scenario:**
- Trade executed at `19:34 IST` (UTC+5:30)
- During import: `19:34 IST` → `14:04 UTC`
- Storage: `2025-08-30T14:04:00.000Z`
- Display for you (IST): `19:34`
- Display for US user (EDT): `10:04 AM`

## Broker Timezone Defaults

| Broker | Default Timezone | Offset | Reasoning |
|--------|------------------|---------|-----------|
| Tradovate | IST (UTC+5:30) | +330 min | Common for Indian users |
| NinjaTrader | CST (UTC-6) | -360 min | Chicago-based |
| Interactive Brokers | UTC | 0 min | Supports UTC export |
| ThinkorSwim | EST (UTC-5) | -300 min | US Eastern |
| Generic/Unknown | User's current | Auto-detect | Browser timezone |

## API Reference

### Core Functions

#### `convertToUTC(datetimeString, sourceTimezoneOffsetMinutes)`
Converts datetime from source timezone to UTC.

```typescript
// Convert IST to UTC
convertToUTC('2025-08-30 19:34:00', 330)
// Returns: '2025-08-30T14:04:00.000Z'

// Convert EST to UTC  
convertToUTC('2025-08-30 10:30:00', -300)
// Returns: '2025-08-30T15:30:00.000Z'
```

#### `convertFromUTC(utcDatetimeString, targetTimezoneOffsetMinutes)`
Converts UTC datetime to target timezone for display.

```typescript
// Convert UTC to IST for display
convertFromUTC('2025-08-30T14:04:00.000Z', 330)
// Returns: '2025-08-30 19:34:00'

// Convert UTC to EST for display
convertFromUTC('2025-08-30T14:04:00.000Z', -300)  
// Returns: '2025-08-30 10:04:00'
```

#### `getBrokerTimezoneDefault(brokerId)`
Gets default timezone offset for a broker.

```typescript
getBrokerTimezoneDefault('tradovate')    // Returns: 330 (IST)
getBrokerTimezoneDefault('ninjatrader')  // Returns: -360 (CST)
getBrokerTimezoneDefault('unknown')      // Returns: user's current timezone
```

### Display Functions

#### `formatDisplayTime(utcDatetime, options)`
Formats UTC datetime for user display.

```typescript
// Basic date display
formatDisplayTime('2025-08-30T14:04:00.000Z')
// Returns: '8/30/2025' (in user's locale)

// With time
formatDisplayTime('2025-08-30T14:04:00.000Z', { includeTime: true })
// Returns: '8/30/2025 19:34:00' (converted to user's timezone)

// Custom timezone
formatDisplayTime('2025-08-30T14:04:00.000Z', { 
  includeTime: true, 
  timezone: -300 // EST
})
// Returns: '8/30/2025 10:04:00'
```

#### `formatTradeTime(openDate, entryTime, closeDate, exitTime, timezone)`
Formats trade entry/exit times with duration calculation.

```typescript
formatTradeTime('2025-08-30', '14:04:00', '2025-08-30', '14:15:00')
// Returns: {
//   entryDisplay: '8/30/2025 19:34:00',
//   exitDisplay: '8/30/2025 19:45:00', 
//   durationDisplay: '11m'
// }
```

## CSV Import Examples

### Tradovate Performance.csv (IST)
```csv
symbol,qty,buyPrice,sellPrice,pnl,boughtTimestamp,soldTimestamp
NQ,1,20000,20010,10,2025-08-30 19:34:00,2025-08-30 19:45:00
```

**Import Settings:**
- Timezone: India Standard Time (IST) - UTC+5:30
- Date Format: YYYY-MM-DD

**Result:** Timestamps converted to UTC and stored as `14:04:00` and `14:15:00`

### US Broker CSV (EST)
```csv
Trade #,Entry time,Exit time,Instrument,Profit/Loss
1,08/30/2025 09:30:00,08/30/2025 10:15:00,NQ,150
```

**Import Settings:**
- Timezone: Eastern Time (EST) - UTC-5
- Date Format: MM/DD/YYYY

**Result:** `09:30:00 EST` → `14:30:00 UTC`, `10:15:00 EST` → `15:15:00 UTC`

## Configuration

### User Preferences
Users can set their display timezone preference:

```typescript
import { setDisplayTimezone } from '@/utils/display-time'

// Set display timezone to EST
setDisplayTimezone(-300)
```

### Broker Configuration
Add new brokers in `getBrokerTimezoneDefault()`:

```typescript
const defaults: Record<string, number> = {
  'new_broker': -480, // PST (UTC-8)
  // ... existing brokers
}
```

## Migration Notes

### Existing Data
- Existing trades without timezone info are assumed to be in the user's local timezone
- No automatic migration is performed - users should re-import with proper timezone settings if needed

### Backward Compatibility
- All existing date/time fields continue to work
- New timezone-aware parsing is opt-in during CSV import
- Display components gracefully handle both old and new timestamp formats

## Best Practices

### For Users
1. **Always specify timezone during CSV import** - Don't rely on auto-detection
2. **Use consistent timezone per broker** - Each broker typically exports in one timezone
3. **Check broker documentation** - Verify what timezone your broker uses for exports
4. **Re-import if needed** - If you imported with wrong timezone, re-import with correct settings

### For Developers
1. **Always store in UTC** - Never store local times in the database
2. **Convert at display time** - Only convert to local timezone when showing to user
3. **Handle edge cases** - Invalid dates, extreme timezones, DST transitions
4. **Test thoroughly** - Verify conversions with multiple timezones and date formats

## Troubleshooting

### Common Issues

**Q: My trades show wrong times**
A: Check if you selected the correct timezone during CSV import. Re-import with the correct timezone.

**Q: Times are off by exactly X hours**
A: Timezone offset issue. Verify your broker's export timezone and re-import.

**Q: Dates changed after import**
A: Timezone conversion can shift dates. This is correct - your trade at 23:30 local might be 04:30 UTC the next day.

**Q: Duration calculations seem wrong**
A: Ensure both entry and exit times are in the same timezone before import.

### Debug Information
Enable debug logging to see timezone conversions:

```typescript
// In browser console
localStorage.setItem('debug:timezone', 'true')
```

This will log all timezone conversions to help diagnose issues.

## Technical Implementation

### Architecture
- **Storage Layer**: All timestamps in UTC
- **Import Layer**: Timezone conversion during parsing
- **Display Layer**: Automatic conversion to user's timezone
- **UI Layer**: Timezone selection in import modal

### Performance
- Timezone conversions are cached where possible
- Display formatting is memoized in React components
- Bulk operations use efficient date libraries

### Security
- No sensitive timezone data is stored
- User timezone preferences stored in localStorage only
- All conversions happen client-side

---

This implementation ensures your trading journal works correctly regardless of where you are in the world or which broker you use, while maintaining data consistency and accuracy.
