import {RestrictedAreas} from "../utils/restrictedAreas";
import axios from "axios";

const reverseLocationUrl = "https://nominatim.openstreetmap.org/reverse";
const userAgent = "mapofpi/1.0 (mapofpi@gmail.com)";

export const isInSanctionedRegion = (locationName: string) : boolean =>{
    const restrictedRegions = Object.values(RestrictedAreas);
    return restrictedRegions.some(area => area.includes(locationName));
}

export const reverseLocationDetails = async (latitude: number, longitude: number) =>{
    return await axios.get(reverseLocationUrl, {
        headers: {
            "User-Agent": userAgent
        },
        params: {
            lat: latitude,
            lon: longitude,
            zoom: 6,
            format: "jsonv2"
        }
    });
}
