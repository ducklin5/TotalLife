import {StatementSync, DatabaseSync} from "node:sqlite";

export class Database {
    db: DatabaseSync;
    create_user: StatementSync;
    create_clinician: StatementSync;
    create_patient: StatementSync;
    create_appointment: StatementSync;
    get_user: StatementSync;
    get_clinician: StatementSync;
    get_patient: StatementSync;
    get_appointment: StatementSync;
    get_appointments_by_range: StatementSync;
    update_user: StatementSync;
    update_appointment: StatementSync;
    delete_user: StatementSync;
    delete_clinician: StatementSync;
    delete_patient: StatementSync;
    delete_appointment: StatementSync;

    constructor(path: string = "data.sqlite") {
        const db = new DatabaseSync(path);
        const init_db = `
            CREATE Table IF NOT EXISTS users (
                id integer PRIMARY KEY AUTOINCREMENT,
                username text NOT NULL UNIQUE,
                hash text NOT NULL,
                salt text NOT NULL
            );

            CREATE TABLE IF NOT EXISTS clinicians (
                id integer PRIMARY KEY AUTOINCREMENT,
                first_name text NOT NULL,
                last_name text NOT NULL,
                npi integer NOT NULL,
                state text NOT NULL,
                user_id integer NOT NULL,
                CONSTRAINT chk_npi CHECK (npi >= 1000000000 AND npi <= 9999999999)
            );
            
            CREATE TABLE IF NOT EXISTS patients (
                id integer PRIMARY KEY AUTOINCREMENT,
                user_id integer NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS appointments (
                id integer PRIMARY KEY AUTOINCREMENT,
                patient_id integer NOT NULL,
                clinician_id integer NOT NULL,
                timestamp integer NOT NULL
            );
        `;
        db.exec(init_db);
        this.db = db;
        this.create_user = db.prepare(`
            INSERT INTO users (username, hash, salt) 
            VALUES (?, ?, ?)
        `);
        this.create_clinician = db.prepare(`INSERT INTO clinicians (user_id, first_name, last_name, npi, state) VALUES (?, ?, ?, ?, ?)`);
        this.create_patient = db.prepare(`INSERT INTO patients (user_id) VALUES (?)`);
        this.create_appointment = db.prepare(`INSERT INTO appointments (patient_id, clinician_id, timestamp) VALUES (?, ?, ?)`);
        this.get_user = db.prepare(`
                SELECT *, c.id AS clinician_id, p.id AS patient_id FROM users u 
                    LEFT JOIN clinicians c ON u.id = c.user_id 
                    LEFT JOIN patients p ON u.id = p.user_id 
                    WHERE U.username = ?
        `);
        this.get_clinician = db.prepare(`SELECT * FROM clinicians WHERE id = ?`);
        this.get_patient = db.prepare(`SELECT * FROM patients WHERE id = ?`);
        this.get_appointment = db.prepare(`SELECT * FROM appointments WHERE id = ?`);
        this.get_appointments_by_range = db.prepare(`SELECT * FROM appointments WHERE timestamp >= ? AND timestamp <= ?`);
        this.update_user = db.prepare(`UPDATE users SET username = ?, hash = ? WHERE id = ?`);
        this.update_appointment = db.prepare(`UPDATE appointments SET patient_id = ?, clinician_id = ?, timestamp = ? WHERE id = ?`);
        this.delete_user = db.prepare(`DELETE FROM users WHERE id = ?`);
        this.delete_clinician = db.prepare(`DELETE FROM clinicians WHERE id = ?`);
        this.delete_patient = db.prepare(`DELETE FROM patients WHERE id = ?`);
        this.delete_appointment = db.prepare(`DELETE FROM appointments WHERE id = ?`);
    }
    


}

