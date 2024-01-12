import stream from '../stream.js';
import _ from 'lodash';

/**
 * Stream contacts and then for each contact start a stream for lesson transcripts 
 * results. 
 * @param {Object} config 
 */
const lessonTranscripts = async (config) => {

    const contactsConfig =  _.cloneDeep(config);
    contactsConfig.params.collection = 'contacts';

    config.report = 'contactsLessonTranscripts';

    const passedCallback = config.callback;

    if( config.onComplete ){
        delete config.onComplete;
    }

    contactsConfig.callback = async (contact) => {

        if(config.debug){
            console.log(`Getting transcripts for ${contact.d.last_name}@${contact._id}`);
        }
    
        config.params.con_id = contact._id;
        
        config.callback = (record) => {
            record.contact = contact;
            passedCallback(record);
        }

        await stream(config);
    }

    stream(contactsConfig)

    // config.report = 'contactsLessonTranscripts';
};

export default lessonTranscripts;