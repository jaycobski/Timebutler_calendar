/**
 * State Model for German Bundesländer (Federal States)
 * Constitutional Requirement: 100% accurate data for all 16 German states
 *
 * This model represents the official administrative structure of Germany's
 * federal states with accurate population, religious demographics, and
 * administrative data needed for holiday calculations and bridge weekend
 * optimization.
 *
 * Data Sources:
 * - German Federal Statistical Office (Destatis)
 * - Official state government data
 * - Population census data (latest available)
 * - Religious demographic surveys
 */

export interface StateData {
  code: string;
  name_de: string;
  name_en: string;
  population: number;
  is_catholic_majority: boolean;
  capital: string;
  timezone: string;
}

export type Language = 'de' | 'en';
export type ReligiousMajority = 'catholic' | 'protestant' | 'secular' | 'mixed';
export type HolidayType = 'catholic' | 'protestant' | 'federal' | 'secular';

/**
 * State Model for German Bundesländer
 * Represents accurate administrative and demographic data for all 16 German states
 */
export class State {
  public readonly code: string;
  public readonly name_de: string;
  public readonly name_en: string;
  public readonly population: number;
  public readonly is_catholic_majority: boolean;
  public readonly capital: string;
  public readonly timezone: string;

  // Static data cache for performance
  private static _states: State[] | null = null;
  private static _stateMap: Map<string, State> | null = null;

  constructor(data: StateData) {
    // Validate all required fields
    this.validateRequiredFields(data);

    // Validate and assign properties
    this.code = this.validateStateCode(data.code);
    this.name_de = this.validateName(data.name_de, 'name_de');
    this.name_en = this.validateName(data.name_en, 'name_en');
    this.population = this.validatePopulation(data.population);
    this.is_catholic_majority = this.validateBoolean(data.is_catholic_majority, 'is_catholic_majority');
    this.capital = this.validateName(data.capital, 'capital');
    this.timezone = this.validateTimezone(data.timezone);
  }

  /**
   * Validate all required fields are present
   */
  private validateRequiredFields(data: Partial<StateData>): void {
    const requiredFields: (keyof StateData)[] = [
      'code', 'name_de', 'name_en', 'population',
      'is_catholic_majority', 'capital', 'timezone'
    ];

    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null) {
        throw new Error(`${field} is required`);
      }
    }
  }

  /**
   * Validate state code format and authenticity
   */
  private validateStateCode(code: string): string {
    if (!code || typeof code !== 'string') {
      throw new Error('Invalid state code: must be a non-empty string');
    }

    const validCode = code.toUpperCase();

    if (!/^[A-Z]{2}$/.test(validCode)) {
      throw new Error('Invalid state code: must be exactly 2 uppercase letters');
    }

    // Validate against official German state codes
    State.validateStateCode(validCode);

    return validCode;
  }

  /**
   * Validate name fields
   */
  private validateName(name: string, fieldName: string): string {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error(`${fieldName} is required and must be a non-empty string`);
    }
    return name.trim();
  }

  /**
   * Validate population as positive integer
   */
  private validatePopulation(population: number): number {
    if (!Number.isInteger(population) || population <= 0) {
      throw new Error('Invalid population: must be a positive integer');
    }
    return population;
  }

  /**
   * Validate boolean fields
   */
  private validateBoolean(value: boolean, fieldName: string): boolean {
    if (typeof value !== 'boolean') {
      throw new Error(`${fieldName} must be a boolean`);
    }
    return value;
  }

  /**
   * Validate timezone (Germany uses Europe/Berlin)
   */
  private validateTimezone(timezone: string): string {
    if (timezone !== 'Europe/Berlin') {
      throw new Error('Invalid timezone: Germany uses Europe/Berlin');
    }
    return timezone;
  }

  /**
   * Get localized name based on language
   */
  public getName(language: Language = 'de'): string {
    return language === 'en' ? this.name_en : this.name_de;
  }

  /**
   * Get religious majority classification
   */
  public getReligiousMajority(): ReligiousMajority {
    if (this.is_catholic_majority) {
      return 'catholic';
    }

    // Mixed/secular states (Berlin, Hesse)
    if (['BE', 'HE'].includes(this.code)) {
      return this.code === 'BE' ? 'secular' : 'mixed';
    }

    return 'protestant';
  }

  /**
   * Check if this is a city-state
   */
  public isCityState(): boolean {
    return ['BE', 'HB', 'HH'].includes(this.code);
  }

  /**
   * Check if state supports specific holiday type
   */
  public supportsHolidayType(type: HolidayType): boolean {
    switch (type) {
      case 'federal':
        return true; // All states support federal holidays
      case 'catholic':
        return this.is_catholic_majority;
      case 'protestant':
        return !this.is_catholic_majority && this.getReligiousMajority() === 'protestant';
      case 'secular':
        return this.getReligiousMajority() === 'secular' || this.getReligiousMajority() === 'mixed';
      default:
        return false;
    }
  }

  /**
   * Estimate holiday processing capacity based on population
   * Used for scaling infrastructure and traffic planning
   */
  public estimateHolidayCapacity(): number {
    // Base capacity calculation: 10% of population might use the service during peak
    const baseCapacity = Math.ceil(this.population * 0.1);

    // City-states and high-population states need additional capacity
    const multiplier = this.isCityState() || this.population > 10000000 ? 1.5 : 1.0;

    return Math.ceil(baseCapacity * multiplier);
  }

  /**
   * Static method to validate German state codes
   */
  public static validateStateCode(code: string): void {
    const validCodes = [
      'BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV',
      'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'
    ];

    if (!validCodes.includes(code)) {
      throw new Error(`Invalid German state code: ${code}. Valid codes are: ${validCodes.join(', ')}`);
    }
  }

  /**
   * Find state by code
   */
  public static findByCode(code: string): State {
    if (!code || typeof code !== 'string') {
      throw new Error('Invalid state code: must be a non-empty string');
    }

    const upperCode = code.toUpperCase();

    if (!/^[A-Z]{2}$/.test(upperCode)) {
      throw new Error('Invalid state code: must be exactly 2 uppercase letters');
    }

    const stateMap = this.getStateMap();
    const state = stateMap.get(upperCode);

    if (!state) {
      throw new Error(`State not found: ${code}`);
    }

    return state;
  }

  /**
   * Get all German states
   */
  public static getAllStates(): State[] {
    if (!this._states) {
      this._states = this.createAllStates();
    }
    return [...this._states]; // Return copy to prevent mutation
  }

  /**
   * Get states filtered by religious majority
   */
  public static getStatesByReligion(religion: 'catholic' | 'protestant'): State[] {
    return this.getAllStates().filter(state => {
      if (religion === 'catholic') {
        return state.is_catholic_majority;
      } else {
        return !state.is_catholic_majority;
      }
    });
  }

  /**
   * Get states filtered by population range
   */
  public static getStatesByPopulation(options: { min?: number; max?: number }): State[] {
    return this.getAllStates().filter(state => {
      if (options.min && state.population < options.min) return false;
      if (options.max && state.population > options.max) return false;
      return true;
    });
  }

  /**
   * Get internal state map for fast lookups
   */
  private static getStateMap(): Map<string, State> {
    if (!this._stateMap) {
      this._stateMap = new Map();
      this.getAllStates().forEach(state => {
        this._stateMap!.set(state.code, state);
      });
    }
    return this._stateMap;
  }

  /**
   * Create all 16 German states with accurate official data
   * Data sources: German Federal Statistical Office, official state records
   */
  private static createAllStates(): State[] {
    const stateData: StateData[] = [
      // Baden-Württemberg
      {
        code: 'BW',
        name_de: 'Baden-Württemberg',
        name_en: 'Baden-Württemberg',
        population: 11100000,
        is_catholic_majority: true,
        capital: 'Stuttgart',
        timezone: 'Europe/Berlin'
      },
      // Bayern (Bavaria)
      {
        code: 'BY',
        name_de: 'Bayern',
        name_en: 'Bavaria',
        population: 13124737,
        is_catholic_majority: true,
        capital: 'München',
        timezone: 'Europe/Berlin'
      },
      // Berlin
      {
        code: 'BE',
        name_de: 'Berlin',
        name_en: 'Berlin',
        population: 3677472,
        is_catholic_majority: false,
        capital: 'Berlin',
        timezone: 'Europe/Berlin'
      },
      // Brandenburg
      {
        code: 'BB',
        name_de: 'Brandenburg',
        name_en: 'Brandenburg',
        population: 2537868,
        is_catholic_majority: false,
        capital: 'Potsdam',
        timezone: 'Europe/Berlin'
      },
      // Bremen
      {
        code: 'HB',
        name_de: 'Bremen',
        name_en: 'Bremen',
        population: 680130,
        is_catholic_majority: false,
        capital: 'Bremen',
        timezone: 'Europe/Berlin'
      },
      // Hamburg
      {
        code: 'HH',
        name_de: 'Hamburg',
        name_en: 'Hamburg',
        population: 1906411,
        is_catholic_majority: false,
        capital: 'Hamburg',
        timezone: 'Europe/Berlin'
      },
      // Hessen (Hesse)
      {
        code: 'HE',
        name_de: 'Hessen',
        name_en: 'Hesse',
        population: 6295017,
        is_catholic_majority: false,
        capital: 'Wiesbaden',
        timezone: 'Europe/Berlin'
      },
      // Mecklenburg-Vorpommern
      {
        code: 'MV',
        name_de: 'Mecklenburg-Vorpommern',
        name_en: 'Mecklenburg-Western Pomerania',
        population: 1611160,
        is_catholic_majority: false,
        capital: 'Schwerin',
        timezone: 'Europe/Berlin'
      },
      // Niedersachsen (Lower Saxony)
      {
        code: 'NI',
        name_de: 'Niedersachsen',
        name_en: 'Lower Saxony',
        population: 8003421,
        is_catholic_majority: false,
        capital: 'Hannover',
        timezone: 'Europe/Berlin'
      },
      // Nordrhein-Westfalen (North Rhine-Westphalia)
      {
        code: 'NW',
        name_de: 'Nordrhein-Westfalen',
        name_en: 'North Rhine-Westphalia',
        population: 17925570,
        is_catholic_majority: true,
        capital: 'Düsseldorf',
        timezone: 'Europe/Berlin'
      },
      // Rheinland-Pfalz (Rhineland-Palatinate)
      {
        code: 'RP',
        name_de: 'Rheinland-Pfalz',
        name_en: 'Rhineland-Palatinate',
        population: 4106485,
        is_catholic_majority: true,
        capital: 'Mainz',
        timezone: 'Europe/Berlin'
      },
      // Saarland
      {
        code: 'SL',
        name_de: 'Saarland',
        name_en: 'Saarland',
        population: 986887,
        is_catholic_majority: true,
        capital: 'Saarbrücken',
        timezone: 'Europe/Berlin'
      },
      // Sachsen (Saxony)
      {
        code: 'SN',
        name_de: 'Sachsen',
        name_en: 'Saxony',
        population: 4071971,
        is_catholic_majority: false,
        capital: 'Dresden',
        timezone: 'Europe/Berlin'
      },
      // Sachsen-Anhalt (Saxony-Anhalt)
      {
        code: 'ST',
        name_de: 'Sachsen-Anhalt',
        name_en: 'Saxony-Anhalt',
        population: 2180684,
        is_catholic_majority: false,
        capital: 'Magdeburg',
        timezone: 'Europe/Berlin'
      },
      // Schleswig-Holstein
      {
        code: 'SH',
        name_de: 'Schleswig-Holstein',
        name_en: 'Schleswig-Holstein',
        population: 2910875,
        is_catholic_majority: false,
        capital: 'Kiel',
        timezone: 'Europe/Berlin'
      },
      // Thüringen (Thuringia)
      {
        code: 'TH',
        name_de: 'Thüringen',
        name_en: 'Thuringia',
        population: 2120237,
        is_catholic_majority: false,
        capital: 'Erfurt',
        timezone: 'Europe/Berlin'
      }
    ];

    return stateData.map(data => new State(data));
  }
}