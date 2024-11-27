import axios from 'axios';

import { RestrictedAreas } from '../models/enums/restrictedAreas';

// Geocode using the Nominatim API
export const reverseLocationDetails = async (latitude: number, longitude: number) =>{
  return await axios.get("https://nominatim.openstreetmap.org/reverse", {
    headers: {
      "User-Agent": "mapofpi/1.0 (mapofpi@gmail.com)"
    },
    params: {
      lat: latitude,
      lon: longitude,
      zoom: 6,
      format: "jsonv2",
      "accept-language": "en"
    }
  });
}

export const isRestrictedLocation = (locationName: string): boolean => {
  return Object.values(RestrictedAreas).some(area => locationName.includes(area));
};
