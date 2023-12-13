# conveyour-collection-stream

## Description
conveyour-collection-stream is an node module/package that helps you stream collection updates from a ConveYour account to other systems. 

👉 [Check out this video](https://vimeo.com/823883732/44c3da8118)

**Collection Streams is a ConveYour add-on. Please reach out to support at conveyour.com for more info.** 

## Features
- 💪 Automatic pagination / cursor management! No need to worry about subsequent API calls to get the next page!
- Rawest format of ConveYour API data with minimal changes to data. 
- Fine-tuned export timeframes

## Use Cases
- export raw data about lessons, campaigns, events, lesson transcripts
- stream changes in almost real-time to other systems (advanced)

## Bad Use Cases
- Using this as a replacement for Webhooks. Yes, you can watch for changes but a ConveYour webhook might be a better solution. ConveYour has an option for global webhooks, special hooks for certain milestones (that you can customize), as well as an easy to implement segment.com integration.

- As a source for running reports! This will be incredibly slow! Instead, transfer data into a tool like Rockset, SnowFlake, etc and then query from there.

## Gotchas..

- Record deletions are not included in the stream. We would like to support this at some point. 

## Requirements / Installation
- node 18 (module support)
- clone this repo
- `npm install` to install depedencies
- create a .env files and add your full domain, appkey, and token

```
CONVEYOUR_DOMAIN=yourdomain.conveyour.com
CONVEYOUR_APPKEY=yourappkey
CONVEYOUR_TOKEN=yourtoken
```

## Using the CLI

Examples...

`npm run stream --collection=events --start_time='-1 minutes'  --fields='con_id,event'`
`npm run stream --collection=contacts --start_time='-1 minutes' --watch | ./sendAlert`
`npm run stream --collection=lesson_transcripts --start_time='-1 days'`

### Arguments

**--collection: required**

The ConveYour data collection (aka table) that you want to get results from..

Available Collections.. 

- campaigns: entire campaign configuration
- contacts: almost all data stored on each contact
- events: feed of campaign, custom events for a learner
- lessons: entire JSON configuration for each lesson
- message_reports: a report of send, delivery, bounce events for each outbound send
- tags: used for tagging messages 
- triggers: entire JSON configuration of each trigger (part of campaign)
- trigger_logs: log of which trigger ran on which contact
- lesson_transcripts: Pull detailed lesson transcripts per contact. 

**--start_time: required**

- Filters down record scope to records that have been created or updated >= start_time. 
- You can use any [strtotime](https://www.php.net/manual/en/function.strtotime.php) supported value such as `-15 minutes`
- NOTE: strototime will use the timezone of the user associated to your apitoken being used. To avoid issues with timezones. We suggest passing a unix timestamp like this --start_time=1683228479

**--end_time: optional**

- Works just like start_time. Allows you to cut off cursor to specific timeframe.
- Essentially maps to (created_at or updated_at < start_time)
- The collection query limit (for all pages) is a healthy 100K records! If you have more than 100K records then it's best if you use a combination of start_time and end_time arguments to grab records say a month at a time until you have retrieved a majority of your historical records. Then after that, you can use start_time by itself to "tail" updates within a recent timeframe.

**--fields: optional**

- Optionally print only certain JSON keys out of each records. 
- You can use JSON path syntax (using lodash/get here) to form a new JSON object 

Examples....

- `--collection=events --fields='con_id,campaign_id,d.points'`
- `--collection=contacts --fields='_id,first_name,last_name,d.employee_id'`

**--watch: optional**

Example: `... --collection events --watch`

Block script execution and watch for new records, checking once a minute for new records updated since right before the previous request!

How it works.. 

- first request is made
- if first request has a more pages, process all individual cursor pages
- once cursor is exhausted, timeout begins
- rinse & repeat!

Tip! Use watch combined with something like supervisor to keep your watcher running!

**--debug: optional**

Example: `... --collection events --debug`

Just a helper flag to help you debug your request params. 

**--pretty: optional**

By default, CLI printed records are printed on ONE line to make piping to other CLI/unix tools much easier. However, if you want to more easily inspect records, you can use pretty to format the JSON output on stdout.

Example: `... --collection events --pretty`

## Using stream.js directly

Here's an example of how you can use stream.js directly in your own node.js script.

**callback**

`callback` is a simple function that is passed into the stream() config. `callback` receives the next record. From there, you can do whatever you need to with the record!

myETLProcess.js
```
import stream from './stream.js';
const config = {
    credentials: {
        domain: process.env.CONVEYOUR_DOMAIN,
        appkey : process.env.CONVEYOUR_APPKEY,
        token: process.env.CONVEYOUR_TOKEN
    },
    params: {
        'collection': 'events',
        'start_time': '-15 minutes',
    }
    callback: (record) => {
        // fake function!
        transferRecordToCorporateDataBase(record)
    },
    watch: true //see cli arguments
}
stream(config);

```

## lesson_transcripts

Lesson transcripts is a "hybrid" collection stream. It's actually doing the following under the hood. 

```
- for each contact.. 
    - pull contact's transcripts
    - foreach contact transcript in transcript
        - callback()
```

You can stream lesson transcripts from the command line just like you do other collections.

`npm run stream --collection=lesson_transcripts --start_time='-1 days'`

Tip! You can access contact information in your fields selection like `contact.d.first_name`

`npm run stream --start_time='-1 year' --collection=lesson_transcripts --fields=trigger,contact.d.first_name,contact._id`

Note: `--start_time` on lesson_transcripts is when the CONTACT was last updated, not when there was a change in lesson_transcripts for any contact. This is a limitation we may address in the future. 

### collections/lessonTranscripts.js

Just like stream.js you can use lessonTranscripts.js directly within your node scripts.

```
import lessonTranscripts from './collections/lessonTranscripts.js';
lessonTranscripts({
    credentials: {
        domain: process.env.CONVEYOUR_DOMAIN,
        appkey : process.env.CONVEYOUR_APPKEY,
        token: process.env.CONVEYOUR_TOKEN
    },
    params: {
        'collection': 'lesson_transcripts',
        'start_time': '-15 minutes',
    }
    callback: (record) => {
        // fake function!
        transferRecordToCorporateDataBase(record)
    }
});
```