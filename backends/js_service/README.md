# js_service



Install dependencies: npm install
Run the service: npm run dev

## Test with httpie:

- Install httpie: https://httpie.io/cli 
- create a clinician user:

http -j POST localhost:3002/clinicians username=userA password=password1 npi=2132003004 first_name="John" last_name="Doe" state="NY"

- create a patient user:

 http -j POST localhost:3002/patients username=userB password=password1

- create an appointment

http -j POST localhost:3002/appointments patient_id=1 clinician_id=1 timestamp=1734889620000

- List all appointments in date range 

http -j GET localhost:3002/appointments/range/1734889610000/1734889640000
