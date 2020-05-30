import express from "express";
import log from "morgan";
import cors, { CorsOptions } from "cors";
import routes from './routes';
const app = express();

const whitelist : string[] = [ "http://localhost:9100", process.env.PUBLIC_HOST || "http://localhost" ];

const corsOptions : CorsOptions = {
    origin: (origin, callback) => {
        if (!origin || whitelist.includes(origin)) {
            callback(null, true); // allow if origin is in whitelist
        } else callback(new Error('Not allowed by CORS'));
    },
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(log('dev'));

app.use('/api', routes);

app.listen(process.env.PORT || '9100', () => {
    console.log('Server has started');
});