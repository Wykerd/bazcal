import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

import './client_micro';

/*
config = {
    DISCORD_KEY,
    COMMAND_NAME,
    API_ENDPOINT,
    API_KEY,
    CACHE_FP,
    RANGE
}
*/
function Config ({ onSet }) {
    const [ config, setConfig ] = useState({
        DISCORD_KEY: '',
        COMMAND_NAME: '',
        API_KEY: '',
    });

    function update (key, val) {
        const new_state = {...config};
        new_state[key] = val;
        setConfig(new_state);
    }

    function ignoreSubmit (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    return <>
        <h1>Configure</h1>
        <form onSubmit={ignoreSubmit}>
            { Object.keys(config).map(key => <input type="text" placeholder={key} key={key} onChange={e=>update(key, e.target.value)} value={config[key]} />) }
            <button onClick={() => onSet(config)}>Run</button>
        </form>
    </>
}

function App () {
    const [ config, setConfig ] = useState(undefined);
    const [ log, setLog ] = useState('');
   
    useEffect(() => {
        /** Add hooks to the console object */
        let last_log = '';
        function console_hook (type, ...str) {
            last_log += `[${type.toUpperCase()}] ${str.join(' ')}\n`;
            setLog(last_log);
        }
        const orig_err = console.error;
        const orig_log = console.log;
        const orig_warn = console.warn;
        console.error = function () {
            console_hook('error', ...arguments);
            orig_err(...arguments);
        }
        console.log = function () {
            console_hook('log', ...arguments);
            orig_log(...arguments);
        }
        console.warn = function () {
            console_hook('warn', ...arguments);
            orig_warn(...arguments);
        }
        /** Load the config */
        const local_config = JSON.parse(localStorage.getItem('bot_config'));
        setConfig(local_config);
        /** Find and load the script */
        (async () => {
            const path = location.pathname.split('/');
            if (!path.length === 3) return console.error('Invalid path! Cannot load script.');
            const SCRIPT_ID = path.pop();
            try {
                console.log('Fetching script ' + SCRIPT_ID + '...');
                const res = await fetch(BAZCAL_API_URL + '/custom/js/' + SCRIPT_ID);
                if (res.status !== 200) return console.error('Script not found!');
                const js = await res.text();
                console.log('Evaluating script...');
                eval(js);
                console.log('Script loaded!');
            } catch (error) {
                console.error('Failed to load script with id ' + SCRIPT_ID);
                console.error(error);
            }
        })();
    }, []);

    useEffect(() => {
        if (config) {
            window.config = {...config, API_ENDPOINT: 'https://api.hypixel.net/skyblock/bazaar'};
            localStorage.setItem('bot_config', JSON.stringify(config))
            window.start_client();
        }
    }, [config]);

    if (!config) return <Config onSet={setConfig} />

    return <>
        <section id="console">
            <pre>
                {log}
            </pre>
        </section>
    </>
}

const root = document.createElement('main');

document.body.appendChild(root);

ReactDOM.render(
    <App />,
    root
);