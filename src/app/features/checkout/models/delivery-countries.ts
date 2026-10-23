export const deliveryCountries = [
  { value: 'United Kingdom', label: $localize`:@@countryUnitedKingdom:United Kingdom` },
  { value: 'Ireland', label: $localize`:@@countryIreland:Ireland` },
  { value: 'France', label: $localize`:@@countryFrance:France` },
  { value: 'Germany', label: $localize`:@@countryGermany:Germany` },
  { value: 'Spain', label: $localize`:@@countrySpain:Spain` },
] as const;

export function deliveryCountryLabel(value: string): string {
  return deliveryCountries.find((country) => country.value === value)?.label ?? value;
}
