# schedule_interview_backend_webapp

### How to Run

    1. npm install
    2. npm start
    3. Import Postman Collections

### Objective

The goal is to create a simple web application with an admin user, who would be able to create interview slots

### Features

Interview creation

Admin can create interview by selecting participants, start time, end time

    i.) Backend will throw an error if participants are not available.
    ii.) Backend will also through error if there are less than 2 participants{ 1 candidate, 1 or more interviewers)

List interviews

    i.)  List page where admin should be able to see upcoming interviews
    ii.) Should also be able to edit the interviews.

Edit interviews

    i.) Backend will throw an error if participants are not available.
    ii.) Check if the new fields passed for the interview are valid and available(startime, endtime, interviewer availability)
    ii.) Backend will also through error if there are less than 2 participants{ 1 candidate, 1 or more interviewers)

Additional features:-

Send emails to participants after scheduling the interview
An option to upload resume
Web Page is a single page application
