# Social Network for Computer Engineers Backend REST API

## Project Description

This project is a REST API backend application developed using NodeJS and ExpressJS. It is designed to provide data to clients through various API endpoints.

## File and Folder Structure

    │ 
    ├── config # Application configuration files
    ├── middleware # Middleware components
    ├── models # Data models
    ├── routes
    │ └── api # API routes
    ├── .gitignore # Files to be ignored by Git
    ├── Procfile # Process file for Heroku
    ├── package.json # Project dependencies and scripts
    ├── package.zip # Project archive file
    └── server.js # Application entry file


## Installation

### Requirements

- Node.js (v12 or higher)
- npm or yarn

### Steps

1. Clone this repository:
    ```bash
    git clone https://github.com/huseyin6/Social-Network-For-Computer-Engineers_Backend.git
    cd repository-name
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Create and configure necessary configuration files (e.g., `.env`).

4. Start the application:
    ```bash
    npm start
    ```

## Configuration

Project configurations are located in the `config` folder. Ensure that the correct configurations are loaded when the application is running.

## Routes

API routes are defined in the `routes/api` folder. Each route file handles HTTP requests related to a specific resource.

## Middleware

Middleware components are located in the `middleware` folder. These files are used to process incoming requests and handle tasks such as validation and error management.

## Data Models

Data models are defined in the `models` folder. These models facilitate interaction with the database and define the data structure.

## Running Commands

- To start the application:
    ```bash
    npm start
    ```

- To run tests:
    ```bash
    npm test
    ```

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.
