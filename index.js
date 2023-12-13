import stream from './stream.js';
import _ from 'lodash';
import dotenv from 'dotenv'
import lessonTranscripts from './collections/lessonTranscripts.js';

dotenv.config()

const env = (key, _default) => {
    key = `CONVEYOUR_${key.toUpperCase()}`
    const value = process.env[key]
    return value === undefined ? _default : value
}

// local development for ConveYour has self-signed cert which can be problematic
// process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

const option = (arg, def = null) => {
    return process.env[`npm_config_${arg}`] || def;
};

const parseFields = () => {
    return option('fields', '')
        .split(',')
        .map(field => field.trim())
        .filter(field => field);
}

const getFieldMapper = () => {
    const fields = parseFields();

    if(!fields.length){
        return (record, newRecord = {}) => record;
    }
    
    return (record, newRecord = {}) => {
        fields.forEach( field => {
            _.set(newRecord, field, _.get(record, field) );
        })
        return newRecord;
    };
}

const main = () => {
    const args = [ 'collection', 'start_time'];
    const errors = [];
    const params = {};
    args.forEach( arg => {
        const value = option(arg);
        if(!value){
            errors.push(`Missing --${arg} value`);
        }
        params[arg] = value;
    });

    if(errors.length){
        console.log( errors.join("\n") );
        return false;
    }
    
    params.end_time = option('end_time', 'now');

    const stringifyFlag = !!process.env.npm_config_pretty ? 4 : null;    
    const mapper = getFieldMapper();

    const config = {
        credentials: {
            domain: env('domain'),
            appkey : env('appkey'),
            token: env('token')
        },
        params,
        callback: async (record) => {
            const newRecord = mapper(record);
            const json = JSON.stringify(newRecord, null, stringifyFlag);
            console.log(json);
        },
        watch: !!option('watch', false) || !!option('interval'),
        interval: +option('interval', 60000),
        debug: !!option('debug', false),
    }

    if( params.collection === 'lesson_transcripts' ){
        return lessonTranscripts(config);
    }

    return stream(config);
}

main();