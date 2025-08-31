# Real-Time Chat Application

A full-stack real-time chat web application built with React.js and Django REST Framework. It supports instant messaging using WebSockets and provides secure role-based access for different users.

## Features

* Real-time messaging with WebSockets (Django Channels).
* Role-based hierarchical conversations with permission control.
* Secure RESTful APIs for authentication, messaging, and file sharing.
* Intuitive and modern UI/UX design using React.js.
* Scalable backend for handling multiple concurrent users.

## Tech Stack

* Frontend: React.js, TailwindCSS, Axios
* Backend: Django, Django REST Framework, Django Channels (WebSockets), JWT Authentication
* Database: MySQL / SQLite
* Tools: Git, GitHub

## Installation

1. Clone the repository

   * `git clone https://github.com/ajayvairam/real-time-chat-app.git`
   * `cd real-time-chat-app`

2. Setup backend (Django)

   * `cd backend`
   * `pip install -r requirements.txt`
   * `python manage.py migrate`
   * `python manage.py runserver`

3. Setup frontend (React)

   * `cd frontend`
   * `npm install`
   * `npm start`

4. Open your browser at **[http://localhost:3000](http://localhost:3000)**

## Future Enhancements

* Group chats and channels
* Push notifications
* End-to-end encryption
* Docker deployment support

## Author

Ajay Vairam T
Madurai, Tamil Nadu, India
LinkedIn: [linkedin.com/in/ajayvairamt](https://linkedin.com/in/ajayvairamt)

