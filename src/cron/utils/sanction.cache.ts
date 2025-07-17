let cache :any= null;
let expiry : number = 0;
const timeToLive = 60*60*1000;

export async function getCachedSanctionedBoundaries(fetchFn:any){
    const now = Date.now();
    if (cache && expiry && now < expiry) {
        return cache;
    }

    const result = await fetchFn();
    cache = result;
    expiry = now + timeToLive;

    return result;
}

function clearCache(){
    cache = null;
    expiry = 0;
}
