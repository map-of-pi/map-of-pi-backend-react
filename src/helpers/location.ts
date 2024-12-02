import axios from 'axios';

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
