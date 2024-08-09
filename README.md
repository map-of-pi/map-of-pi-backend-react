<h1 align="center"">Map of Pi</h1>

<div align="center">

[![Hackathon](https://img.shields.io/badge/hackathon-PiCommerce-purple.svg)](https://github.com/pi-apps/PiOS/blob/main/pi-commerce.md)
![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-PIOS-blue.svg)

</div>

<div>
    <p align="justify"><b>Map of Pi</b> is a mobile application developed to help Pi community members easily locate local businesses that accept Pi as payment. This project was initiated as part of the Pi Commerce Hackathon with the goal of facilitating Pi transactions and connecting businesses with the Pi community.</p>
</div>

## Table of Contents

- [Brand Design](#brand-design)
- [Tech Stack](#tech-stack)
- [Backend Local Execution](#backend-local-execution)
- [Team](#team)
- [Contributions](#contributions)

## <a name='brand-design'></a>Brand Design

| App Logo  | App Icon |
| ------------- |:-------------:|
| <img src="https://i.ibb.co/GTRWzSb/map-of-pi-logo-revised-3.png" alt="map-of-pi-logo-revised-3" border="0">     | <img src="https://i.ibb.co/4FQqXTG/map-of-pi-app-icon-revised-3b-transparent.png" alt="map-of-pi-app-icon-revised-3b-transparent" border="0">

## <a name='tech-stack'></a>Tech Stack 📊

- **Frontend**: NextJS/ React, TypeScript, HTML, SCSS, CSS
- **Backend**: Express/ NodeJS, REST API
- **Database**: MongoDB
- **DevOps**: GitHub Actions, Netlify, Vercel

## <a name='backend-local-execution'></a>Backend Local Execution

The Map of Pi Back End is a [Node.js](https://nodejs.org/) project.

### Build the Project

- Run `npm run build` to build the project; compile Typescript into Javascript for production to the `.dist` folder.
    - The build artifacts are bundled for production mode.

### Execute the Development Server

- Create .env file from the .env.development template and replace placeholders with actual values.
- Execute `npm run dev` to connect to nodemon and MongoDB server.
- Navigate to http://localhost:8001/ in your browser.
- Execute **[Frontend Local Execution](https://github.com/map-of-pi/map-of-pi-frontend-react/blob/dev/README.md#frontend-local-execution)** for integration testing. Alternatively, utilize API tools like Insomnia or Postman to execute the API endpoints.
    - The application will automatically reload if you change any of the source files. 
    - For local debugging in VS Code, attach the runtime server to the appropriate Process ID.

### Execute Unit Tests

- Run `npm run test` to execute the unit tests via [Jest](https://jestjs.io/).

## <a name='team'></a>Team 🧑👩‍🦱🧔👨🏾‍🦱👨🏾 

### Project Manager
- Philip Jennings

### Marketing
- Bonnie Ford
- Joseph Ciccone 

### Solution Design / UX
- Femma Ashraf
- Oluwabukola Adesina
- Folorunsho Omotunde
- Henry Fasakin

### Technical Lead/ DevOps
- Danny Lee

### Technical Advisor
- Zoltan Magyar

### Application Developers
- Darin Hajou
- Rokundo Soleil
- Ayomikun Omotosho
- Yusuf Adisa
- Francis Mwaura
- Samuel Oluyomi

## <a name='contributions'></a>Contributions

<div>
    <p align="justify">We welcome contributions from the community to improve the Map of Pi project.</p>
</div>
