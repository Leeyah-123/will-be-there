# Will Be There Main Server

This repository contains the main server code for a will be there hackathon submission by:

1. Aaliyah Junaid
2. Abdulbasit Abdullahi
3. // TODO

## Breakdown

### Important Features

1. Only registered users can create an event.
2. Location should not be validated.
3. Only users that indicated attendance will be sent the event location via email.
4. Event organizers should be able to see the names of those who have RSVP’d, their possible plus-ones, and the total number of confirmed guests.

### Nice to Have Features

1. Attending guests can send a congratulatory message to the organizer when they RSVP.
2. Event organizers can choose which congratulatory messages to display or hide on their event page.
3. Event organizers can display or hide the guest list and total guest count.
4. Event organizers can include a list of items a guest can bring and guests can indicate what items they will be bringing. If a guest will be bringing items along, that info will be included in the email they receive.
5. Registered guests can see events they have RSVP’d to, and change the status of their RSVP.
   App users can register using Google or other social accounts.

### On the table

1. Include a list of ongoing or upcoming events on the event page for users to possibly RSVP to.
2. Event reminders to those who indicated attendance.
3. Attendees will be able to upload pictures taken at the event.

### Database

#### Users

- id
- username
- password

#### Event

- id
- userId
- name
- description
- date
- type (enum)
- visibility (public/private)
- time
- location
- items: Array of strings [“pepsi”, “coke”, “table”]
- eventImageUrl

#### RSVP

- id
- eventId
- congratulatoryMessage (Optional)
- items: Array of strings [“pepsi”, “coke”]
- uploads: Array of urls
- name
- email
- attending -> true or false
- guests: Array of strings

### Authentication Methods

- Email and password
- Google

### Integrations

- Cloudinary: Image uploads
- Gmail: Sending emails
- Google authentication

### Tech stack

- Frontend - ReactJS
- Backend - Django
- Database - Postgres

### Deployment

- Frontend - Vercel
- Backend - Render
- Database - Supabase

### Collaboration and Task Management

Jira
