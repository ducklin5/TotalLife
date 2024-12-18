import express, { IRouter } from 'express';
import { Database } from './db';
import crypto from 'crypto';
import cors from 'cors';

// TODO
// 1. Design a clinician, patient, and an appointments table.
//    - Try to select a few fields that might be useful in the context.
//    - Setup relevant relationships between the two resources.

// 2. Implement endpoints to create, read, update, and delete for all resources.
// 3. Use an SQLlite database to store the data.
// 4. Validate incoming request data.
// 5. Be sure to include an NPI number in the clinician table.
//      - An NPI number is a unique identification number for covered health care providers in the US.
//      - When a new clinician is added onto the system, we will want to validate the NPI number,
//      - and check the clinicians first and last name, as well as their state using the https://npiregistry.cms.hhs.gov/api-page API.


class AppController {
    db: Database;


    log_respond = (res: express.Response, message: string, data: object) => {
        console.log(message, data);
        res.send({ message, ...data });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validate_truthy = (res: express.Response, fields: Record<string, any>): boolean => {
        for (const [key, value] of Object.entries(fields)) {
            if (!value) {
                res.status(400);
                this.log_respond(res, `Input (${key}) must be defined`, {});
                throw new Error(`Input (${key}) must be defined`);
            }
        }
        return true;
    }

    create_user = (username: string, password: string): number => {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        return this.db.create_user.run(username, hash, salt).lastInsertRowid as number;
    }

    create_clinician = (req: express.Request, res: express.Response) => {
        console.log('Creating Clinician');

        const body = req.body;
        this.validate_truthy(res, { body });
        const { username, password, npi, first_name, last_name, state } = body;
        this.validate_truthy(res, {
            username, password, npi, first_name, last_name, state,
            validate_npi: npi >= 1000000000 && npi <= 9999999999
        });


        const user_id = this.create_user(username, password);

        const clinician_id = this.db.create_clinician.run(user_id, first_name, last_name, npi, state).lastInsertRowid;


        this.log_respond(res, 'Clinician Created', { user_id, clinician_id });
    }

    create_patient = (req: express.Request, res: express.Response) => {
        console.log('Creating Patient');

        const body = req.body;
        this.validate_truthy(res, { body });
        const { username, password } = body;
        this.validate_truthy(res, { username, password });


        const user_id = this.create_user(req.body.username, req.body.password);
        const patient_id = this.db.create_patient.run(user_id).lastInsertRowid;
        this.log_respond(res, 'Patient Created', { user_id, patient_id });
    }

    create_appointment = (req: express.Request, res: express.Response) => {
        console.log('Creating Appointment');

        const body = req.body;
        this.validate_truthy(res, { body });
        const { patient_id, clinician_id, timestamp } = req.body;
        this.validate_truthy(res, { patient_id, clinician_id, timestamp });

        const appointment_id = this.db.create_appointment.run(patient_id, clinician_id, timestamp).lastInsertRowid;
        this.log_respond(res, 'Appointment Created', { appointment_id });
    }

    get_user_by_username = (res: express.Response, username: string) => {
        console.log('Getting User');

        const user = this.db.get_user.get(username);

        if (!user) {
            this.log_respond(res.status(404), 'User Not Found', { username });
            return;
        }
        return user;
    }

    get_user_by_id = (res: express.Response, id: number) => {
        console.log('Getting User');
        const user = this.db.get_user.get(id);
        if (!user) {
            this.log_respond(res.status(404), 'User Not Found', { id });
            return;
        }
        return user;
    }

    get_user = (req: express.Request, res: express.Response) => {
        console.log('Getting User');
        const { name } = req.params;

        const user = this.get_user_by_username(res, name);

        this.log_respond(res, 'User Found', { user });
    }

    get_clinician = (req: express.Request, res: express.Response) => {
        console.log('Getting Clinician');
        const { id } = req.params;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const clinician = this.db.get_clinician.get(id) as any;

        if (!clinician) {
            this.log_respond(res.status(404), 'Clinician Not Found', { id });
            return;
        }
        const user = this.get_user_by_id(res, clinician.user_id);

        this.log_respond(res, 'Clinician Found', { clinician, user });
    }

    get_patient = (req: express.Request, res: express.Response) => {
        console.log('Getting Patient');
        const { id } = req.params;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const patient = this.db.get_patient.get(id) as any;
        if (!patient) {
            this.log_respond(res.status(404), 'Patient Not Found', { id });
            return;
        }
        const user = this.get_user_by_id(res, patient.user_id);
        this.log_respond(res, 'Patient Found', { patient, user });
    }

    get_appointment = (req: express.Request, res: express.Response) => {
        console.log('Getting Appointment');
        const { id } = req.params;
        const appointment = this.db.get_appointment.get(id);
        if (!appointment) {
            this.log_respond(res.status(404), 'Appointment Not Found', { id });
            return;
        }
        this.log_respond(res, 'Appointment Found', { appointment });
    }

    get_appointments_by_range = (req: express.Request, res: express.Response) => {
        console.log('Getting Appointments by Range');
        const { start, end } = req.params;
        const appointments = this.db.get_appointments_by_range.all(start, end);
        this.log_respond(res, 'Appointments Found', { appointments });
    }

    constructor(db: Database) {
        this.db = db;
    }
}

type RequestHandler = (req: express.Request, res: express.Response) => void;

type RouteDetails = {
    post?: RequestHandler;
    get?: RequestHandler;
    put?: RequestHandler;
    delete?: RequestHandler;
    children?: Record<string, RouteDetails>;
}

function configureRouter(router: IRouter, routes: RouteDetails) {
    if (routes.get) router.get('/', routes.get);
    if (routes.post) router.post('/', routes.post);
    if (routes.put) router.put('/', routes.put);
    if (routes.delete) router.delete('/', routes.delete);
    if (routes.children) {
        for (const [key, value] of Object.entries(routes.children)) {
            const child = express.Router({ mergeParams: true });
            configureRouter(child, value);
            router.use(`/${key}`, child)
        }
    }
}

function main() {
    const db = new Database("./data/db.sqlite");
    const apc = new AppController(db);
    const app = express();
    app.use(express.json());
    app.use(cors({ origin: true, credentials: true }));

    const routing: RouteDetails = {
        get: (_req, res) => res.send({ message: 'Total Life Api' }),
        children: {
            "users/": {
                children: {
                    ":name/": {
                        get: apc.get_user
                    }
                }
            },
            "clinicians": {
                post: apc.create_clinician,
                children: {
                    ":id/": {
                        get: apc.get_clinician,
                        put: (_req, res) => res.send({ message: 'Update Clinician' }),
                        delete: (_req, res) => res.send({ message: 'Delete Clinician' }),
                    },

                }
            },
            "patients": {
                post: apc.create_patient,
                children: {
                    ":id/": {
                        get: apc.get_patient,
                        put: (_req, res) => res.send({ message: 'Update Patient' }),
                        delete: (_req, res) => res.send({ message: 'Delete Patient' }),
                    },
                }
            },
            "appointments": {
                post: apc.create_appointment,
                children: {
                    ":id/": {
                        get: apc.get_appointment,
                        put: (_req, res) => res.send({ message: 'Update Patient' }),
                        delete: (_req, res) => res.send({ message: 'Delete Patient' }),
                    },
                    "range/:start/:end/": {
                        get: apc.get_appointments_by_range,
                    }
                }
            }
        }
    }
    configureRouter(app, routing);
    app.listen(3002);
}

main();
