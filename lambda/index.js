const https = require('https');

const SLACK_API_TOKEN = process.env.SLACK_API_TOKEN;
const OPEN_AI_KEY = process.env.OPEN_AI_KEY;
const PROMPT = process.env.PROMPT;

async function chatWithOpenAI(message, threadContent) {
    threadContent.push({role: 'system', content: PROMPT});
    console.log(threadContent);
    const data = JSON.stringify({
        'model': 'gpt-3.5-turbo-16k',
        'messages': threadContent
    });

    const options = {
        hostname: 'api.openai.com',
        port: 443,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPEN_AI_KEY}`
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, res => {
            res.setEncoding('utf8');
            let responseBody = '';

            res.on('data', chunk => {
                responseBody += chunk;
            });

            res.on('end', () => {
                resolve(JSON.parse(responseBody));
            });
        });

        req.on('error', err => {
            reject(err);
        });

        req.write(data);
        req.end();
    });
}

async function postMessageToSlack(channel, thread_ts, message) {
    const data = JSON.stringify({
        'channel': channel,
        'thread_ts': thread_ts,
        'text': message
    });

    const options = {
        hostname: 'slack.com',
        port: 443,
        path: '/api/chat.postMessage',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': `Bearer ${SLACK_API_TOKEN}`
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, res => {
            res.setEncoding('utf8');
            let responseBody = '';

            res.on('data', chunk => {
                responseBody += chunk;
            });

            res.on('end', () => {
                resolve(JSON.parse(responseBody));
            });
        });

        req.on('error', err => {
            reject(err);
        });

        req.write(data);
        req.end();
    });
}

async function getSlackThread(channel, thread_ts) {
    const options = {
        hostname: 'slack.com',
        port: 443,
        path: `/api/conversations.replies?channel=${channel}&ts=${thread_ts}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${SLACK_API_TOKEN}`
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, res => {
            res.setEncoding('utf8');
            let responseBody = '';

            res.on('data', chunk => {
                responseBody += chunk;
            });

            res.on('end', () => {
                resolve(JSON.parse(responseBody));
            });
        });

        req.on('error', err => {
            reject(err);
        });

        req.end();
    });
}

exports.handler = async (event) => {
    console.log("event.headers['X-Slack-Retry-Num']=" + event.headers['X-Slack-Retry-Num']);
    if (event.headers['X-Slack-Retry-Num']) {
        return { statusCode: 200, body: JSON.stringify({ message: "No need to resend" }) };
    }

    const body = JSON.parse(event.body);

    if (body.event.bot_id) {
        console.log('Ignoring bot message');
        return {
            statusCode: 200,
            body: 'Ignoring bot message',
        };
    }
    else if (body.type === "url_verification") {
        return {
            statusCode: 200,
            body: body.challenge,
        };
    }
    console.log(body);

    const channel = body.event.channel;
    const thread_ts = body.event.thread_ts || body.event.ts;
    const userMessage = body.event.text;

    const threadInfo = await getSlackThread(channel, thread_ts);
    if (!threadInfo.messages) {
        throw new Error('Could not fetch the thread messages');
    }
    const threadMessages = threadInfo.messages;

    console.log(threadMessages);
    const threadContent = threadMessages.map((message) => {
        return {
            'role': message.bot_id ? 'assistant' : 'user',
            'content': message.text
        };
    });

    const openAIResponse = await chatWithOpenAI(userMessage, threadContent);
    const botMessage = openAIResponse['choices'][0]['message']['content'];
    console.log(openAIResponse['choices'][0])
    console.log(openAIResponse['choices'][0]['message'])

    const postMessageResponse = await postMessageToSlack(channel, thread_ts, botMessage);

    return {
        statusCode: 200,
        body: JSON.stringify(postMessageResponse),
    };
};
