import axios from 'axios';

const unix = () => {
    return Math.floor(new Date().getTime() / 1000);
}

const credentialKeys = [ 'domain', 'appkey', 'token' ];
const hasAllKeys = (obj, keys) => {
    const key = keys.pop();
    if(!key){
        return true;
    }

    if(!obj[key]){
        return false;
    }

    return hasAllKeys(obj, keys);
}

const stream = async ({
    credentials = {},
    params = {}, 
    callback = null, 
    watch = false,
    interval = 60000,
    debug = false,
    report = 'collectionStream',
    onComplete = () => {}
}) => {
    if( !credentials.validated && !hasAllKeys(credentials, credentialKeys.slice() ) ){
        console.error(`Missing one or more credentials{${credentialKeys.join(',')}}`);
        return false;
    }

    credentials.validated = true;

    const url = `https://${credentials.domain}/api/reports/${report}`;

    const headers = {
        'x-conveyour-appkey' : credentials.appkey,
        'x-conveyour-token' : credentials.token
    }
    
    const startTime = unix();
    params.data = 1;

    const { data } = await axios.get(url, {
        headers,
        params
    });


    const endTime = unix();
    
    if(debug){
        console.log({
            params,
            watch,
            interval,
            responseTime: endTime - startTime
        });
    }
    
    
    
    const reportData = data?.data?.data || {};
    const results = reportData.results || [];

    callback = callback || (record => {});

    for ( const result of results ){
        await callback(result)
    }

    const queryId = reportData.query_id;
    const nextCursor = reportData?.pagination?.next_cursor;

    if(!queryId) return;

    if(nextCursor) {
        return stream({
            credentials,
            params: {
                query_id : queryId,
                cursor: nextCursor
            },
            callback,
            debug,
            report
        })
    }

    

    if(!watch || !interval){
        onComplete();
        return false;
    }
    
    setTimeout(() => {
        //change the start_time to be from the start of the last request
        params.start_time = startTime;
        stream({
            credentials,
            params,
            callback,
            watch,
            interval,
            debug,
            report
        })
    }, interval);
}

export default stream;