/**
 * Currency Conversion Service
 * Handles currency conversion and management
 */

export interface CurrencyInfo {
  code: string
  name: string
  symbol: string
  rate?: number
  flag?: string
}

export class CurrencyConversionService {
  private static subscribers: ((currency: CurrencyInfo) => void)[] = []
  private static currentCurrency: CurrencyInfo = {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$'
  }
  private static lastUpdateTime: Date = new Date()
  private static exchangeRates: Record<string, number> = {
    'USD': 1,
    'EUR': 0.85,
    'GBP': 0.73,
    'JPY': 110,
    'CAD': 1.25,
    'AUD': 1.35
  }

  static subscribe(callback: (currency: CurrencyInfo) => void): () => void {
    this.subscribers.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback)
      if (index > -1) {
        this.subscribers.splice(index, 1)
      }
    }
  }

  static getCurrentCurrency(): CurrencyInfo {
    return this.currentCurrency
  }

  static getSelectedCurrency(): CurrencyInfo {
    return this.currentCurrency
  }

  static setSelectedCurrency(currency: CurrencyInfo): void {
    this.currentCurrency = currency
    this.lastUpdateTime = new Date()
    this.notifySubscribers()
  }

  static setCurrency(currency: CurrencyInfo): void {
    this.currentCurrency = currency
    this.notifySubscribers()
  }

  static getLastUpdateTime(): Date {
    return this.lastUpdateTime
  }

  static getCurrencyInfo(code: string): CurrencyInfo | undefined {
    return this.getSupportedCurrencies().find(c => c.code === code)
  }

  static getExchangeRate(fromCurrency: string, toCurrency: string): number {
    const fromRate = this.exchangeRates[fromCurrency] || 1
    const toRate = this.exchangeRates[toCurrency] || 1
    return toRate / fromRate
  }

  static isRateStale(): boolean {
    const now = new Date()
    const timeDiff = now.getTime() - this.lastUpdateTime.getTime()
    const hoursDiff = timeDiff / (1000 * 60 * 60)
    return hoursDiff > 1 // Consider rates stale after 1 hour
  }

  static async refreshRates(): Promise<void> {
    // Mock refresh - in a real app, this would call an API
    this.lastUpdateTime = new Date()
    // Simulate slight rate changes
    Object.keys(this.exchangeRates).forEach(currency => {
      if (currency !== 'USD') {
        const currentRate = this.exchangeRates[currency]
        const variation = (Math.random() - 0.5) * 0.02 // ±1% variation
        this.exchangeRates[currency] = currentRate * (1 + variation)
      }
    })
  }

  private static notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.currentCurrency))
  }

  static async convertAmount(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    // Mock conversion - in a real app, this would call an API
    if (fromCurrency === toCurrency) {
      return amount
    }
    
    // Mock conversion rates
    const rates: Record<string, number> = {
      'USD': 1,
      'EUR': 0.85,
      'GBP': 0.73,
      'JPY': 110,
      'CAD': 1.25,
      'AUD': 1.35
    }

    const fromRate = rates[fromCurrency] || 1
    const toRate = rates[toCurrency] || 1
    
    return (amount / fromRate) * toRate
  }

  static getSupportedCurrencies(): CurrencyInfo[] {
    return [
      { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
      { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
      { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' }
    ]
  }

  static get SUPPORTED_CURRENCIES(): CurrencyInfo[] {
    return this.getSupportedCurrencies()
  }
}
