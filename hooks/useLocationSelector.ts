'use client'

import { useMemo } from 'react';
import { Country, State, City } from 'country-state-city';

export function useLocationSelector(countryCode?: string, stateCode?: string) {
    const countries = useMemo(() => Country.getAllCountries(), []);

    const states = useMemo(
        () => (countryCode ? State.getStatesOfCountry(countryCode) : []),
        [countryCode]
    );

    const cities = useMemo(
        () => (countryCode && stateCode ? City.getCitiesOfState(countryCode, stateCode) : []),
        [countryCode, stateCode]
    );

    return { countries, states, cities };
}